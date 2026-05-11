import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReservationsRepository } from './prisma/reservations.repository';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationTimesDto } from './dto/update-reservation-times.dto';
import { ChangeReservationStatusDto } from './dto/change-reservation-status.dto';
import { ReservationHistoryQueryDto } from './dto/reservation-history-query.dto';
import {
  ReservationDetail,
  ReservationSummary,
  toReservationDetail,
  toReservationSummary,
} from './mappers/reservation.mapper';
import {
  ReservationHistoryEntry,
  toReservationHistoryEntry,
} from './mappers/reservation-history.mapper';
import { HISTORY_ACTION } from './constants/history-actions';
import {
  DEFAULT_RESERVATION_STATUS,
  BLOCKED_PAYMENT_STATUSES,
} from '../../shared/reservation-statuses';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  async findHistory(
    reservationId: string,
    query: ReservationHistoryQueryDto,
  ): Promise<{
    items: ReservationHistoryEntry[];
    page: number;
    page_size: number;
    total: number;
  }> {
    const reservaId = this.parseId(reservationId, 'reservation_id');

    const exists =
      await this.reservationsRepository.reservationExists(reservaId);

    if (!exists) {
      throw new NotFoundException('Reservation not found');
    }

    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.reservationsRepository.findReservationHistory(
        reservaId,
        skip,
        pageSize,
      ),
      this.reservationsRepository.countReservationHistory(reservaId),
    ]);

    return {
      items: items.map((item) => toReservationHistoryEntry(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async findAll(query: ReservationQueryDto): Promise<{
    items: ReservationSummary[];
    page: number;
    page_size: number;
    total: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.reservationsRepository.findManyPaged(where, skip, pageSize),
      this.reservationsRepository.count(where),
    ]);

    return {
      items: items.map((item) => toReservationSummary(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async findOne(reservationId: string) {
    const id = this.parseId(reservationId, 'reservation_id');
    const reservation =
      await this.reservationsRepository.findReservationWithRelations(id);

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return toReservationDetail(reservation);
  }

  async create(
    dto: CreateReservationDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    const clienteId = this.parseId(dto.cliente_id, 'cliente_id');
    const ubicacionId = this.parseId(dto.ubicacion_id, 'ubicacion_id');

    const checkin = this.parseDate(dto.checkin_datetime, 'checkin_datetime');
    const checkout = this.parseDate(dto.checkout_datetime, 'checkout_datetime');

    if (checkout <= checkin) {
      throw new BadRequestException(
        'checkout_datetime must be greater than checkin_datetime',
      );
    }

    let totalReservaDecimal: Prisma.Decimal | null = null;
    if (dto.total_reserva != null) {
      totalReservaDecimal = this.parseDecimal(
        dto.total_reserva,
        'total_reserva',
      );

      if (totalReservaDecimal.lte(new Prisma.Decimal(0))) {
        throw new BadRequestException('total_reserva must be greater than 0');
      }
    }

    const prisma = this.reservationsRepository.prismaClient;

    const created = await prisma.$transaction(async (tx) => {
      const client = await this.reservationsRepository.findActiveClient(
        tx,
        clienteId,
      );

      if (!client || !client.activo) {
        throw new NotFoundException('Active client not found');
      }

      const location = await this.reservationsRepository.findActiveLocation(
        tx,
        ubicacionId,
      );

      if (!location || !location.activa) {
        throw new NotFoundException('Active location not found');
      }

      // Block-to-reservation conversion: deactivate source block first
      // so it no longer occupies the period in the exclusion constraint.
      let airbnbExternalUid: string | null = null;

      if (dto.source_block_id) {
        const blockId = this.parseId(dto.source_block_id, 'source_block_id');
        const block = await this.reservationsRepository.findBlock(tx, blockId);

        if (!block) {
          throw new NotFoundException('Source block not found');
        }
        if (block.origen_bloqueo_code !== 'AIRBNB') {
          throw new BadRequestException(
            'source_block_id must reference an AIRBNB block',
          );
        }
        if (block.estatus_bloqueo !== 'ACTIVO') {
          throw new BadRequestException('Source block is not active');
        }
        if (block.ubicacion_id !== ubicacionId) {
          throw new BadRequestException(
            'Source block location does not match ubicacion_id',
          );
        }

        await this.reservationsRepository.deactivateBlock(tx, blockId);
        airbnbExternalUid = block.external_uid ?? null;
      }

      const overlapping =
        await this.reservationsRepository.findOverlappingReservation(tx, {
          ubicacionId,
          checkin,
          checkout,
        });

      if (overlapping) {
        throw new BadRequestException(
          'The selected location is already booked for the given period',
        );
      }

      const reservation = await this.reservationsRepository.createReservation(
        tx,
        {
          cliente_id: clienteId,
          ubicacion_id: ubicacionId,
          checkin_datetime: checkin,
          checkout_datetime: checkout,
          estatus_reserva_code:
            dto.estatus_reserva_code ?? DEFAULT_RESERVATION_STATUS,
          origen_reserva_code: dto.origen_reserva_code,
          total_reserva: totalReservaDecimal,
          notas: dto.notas ?? null,
          airbnb_external_uid: airbnbExternalUid,
          created_by: auditUserId,
        },
      );

      await this.reservationsRepository.createReservationHistory(tx, {
        reserva: {
          connect: { reserva_id: reservation.reserva_id },
        },
        usuario: {
          connect: { usuario_id: auditUserId },
        },
        accion: HISTORY_ACTION.CREAR,
        campo: null,
        valor_anterior: null,
        valor_nuevo: null,
      });

      return reservation;
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(
        created.reserva_id,
      );

    if (!reservation) {
      throw new NotFoundException('Reservation not found after creation');
    }

    return toReservationDetail(reservation);
  }

  async update(
    reservationId: string,
    dto: UpdateReservationDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    const reservaId = this.parseId(reservationId, 'reservation_id');

    const prisma = this.reservationsRepository.prismaClient;

    await prisma.$transaction(async (tx) => {
      const existing = await this.reservationsRepository.findByIdForUpdate(
        tx,
        reservaId,
      );

      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      if (BLOCKED_PAYMENT_STATUSES.has(existing.estatus_reserva_code)) {
        throw new ConflictException(
          'Reservation cannot be edited in its current status',
        );
      }

      const providedCheckin = dto.checkin_datetime
        ? this.parseDate(dto.checkin_datetime, 'checkin_datetime')
        : undefined;
      const providedCheckout = dto.checkout_datetime
        ? this.parseDate(dto.checkout_datetime, 'checkout_datetime')
        : undefined;

      if (
        existing.estatus_reserva_code === 'EN_CURSO' &&
        (providedCheckin !== undefined || providedCheckout !== undefined)
      ) {
        throw new ConflictException(
          'Reservation dates cannot be edited in its current status',
        );
      }

      const nextCheckin = providedCheckin ?? existing.checkin_datetime;
      const nextCheckout = providedCheckout ?? existing.checkout_datetime;

      if (nextCheckout <= nextCheckin) {
        throw new BadRequestException(
          'checkout_datetime must be greater than checkin_datetime',
        );
      }

      const nextStatusCode =
        dto.estatus_reserva_code ?? existing.estatus_reserva_code;

      const statusRecord = await tx.cat_estatus_reserva.findUnique({
        where: { estatus_reserva_code: nextStatusCode },
        select: { bloquea_disponibilidad: true },
      });

      if (!statusRecord) {
        throw new BadRequestException('Invalid estatus_reserva_code');
      }

      const checkinChanged =
        providedCheckin !== undefined &&
        existing.checkin_datetime.getTime() !== nextCheckin.getTime();
      const checkoutChanged =
        providedCheckout !== undefined &&
        existing.checkout_datetime.getTime() !== nextCheckout.getTime();
      const statusChanged =
        dto.estatus_reserva_code !== undefined &&
        dto.estatus_reserva_code !== existing.estatus_reserva_code;

      if (
        statusRecord.bloquea_disponibilidad &&
        (checkinChanged || checkoutChanged || statusChanged)
      ) {
        const overlapping =
          await this.reservationsRepository.findOverlappingReservation(tx, {
            ubicacionId: existing.ubicacion_id,
            checkin: nextCheckin,
            checkout: nextCheckout,
            excludeReservationId: reservaId,
          });

        if (overlapping) {
          throw new BadRequestException(
            'The selected location is already booked for the given period',
          );
        }
      }

      const now = new Date();

      const data: Prisma.reservaUpdateInput = {
        updated_at: now,
        usuario_reserva_updated_byTousuario: {
          connect: { usuario_id: auditUserId },
        },
      };

      const historyEntries: Array<
        Omit<Prisma.historial_reserva_eventoCreateInput, 'accion'>
      > = [];

      if (checkinChanged) {
        data.checkin_datetime = nextCheckin;
        historyEntries.push({
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          campo: 'checkin_datetime',
          valor_anterior: existing.checkin_datetime.toISOString(),
          valor_nuevo: nextCheckin.toISOString(),
        });
      }

      if (checkoutChanged) {
        data.checkout_datetime = nextCheckout;
        historyEntries.push({
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          campo: 'checkout_datetime',
          valor_anterior: existing.checkout_datetime.toISOString(),
          valor_nuevo: nextCheckout.toISOString(),
        });
      }

      if (statusChanged && dto.estatus_reserva_code) {
        data.cat_estatus_reserva = {
          connect: { estatus_reserva_code: dto.estatus_reserva_code },
        };
        historyEntries.push({
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          campo: 'estatus_reserva_code',
          valor_anterior: existing.estatus_reserva_code,
          valor_nuevo: dto.estatus_reserva_code,
        });
      }

      if (
        dto.origen_reserva_code !== undefined &&
        dto.origen_reserva_code !== existing.origen_reserva_code
      ) {
        data.cat_origen_reserva = {
          connect: { origen_reserva_code: dto.origen_reserva_code },
        };
        historyEntries.push({
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          campo: 'origen_reserva_code',
          valor_anterior: existing.origen_reserva_code,
          valor_nuevo: dto.origen_reserva_code,
        });
      }

      if (dto.total_reserva !== undefined) {
        const nextTotal = this.parseDecimal(dto.total_reserva, 'total_reserva');

        if (nextTotal.lte(new Prisma.Decimal(0))) {
          throw new BadRequestException('total_reserva must be greater than 0');
        }

        // Compute total already paid (inside the transaction for consistent reads).
        const paidAgg = await tx.pago_movimiento.aggregate({
          where: { reserva_id: reservaId, monto: { gt: 0 } },
          _sum: { monto: true },
        });
        const totalPaid = paidAgg._sum.monto ?? new Prisma.Decimal(0);

        if (totalPaid.gt(nextTotal)) {
          throw new BadRequestException(
            'total_reserva cannot be less than total_paid',
          );
        }

        const previousTotalString = existing.total_reserva
          ? existing.total_reserva.toString()
          : null;
        const nextTotalString = nextTotal.toString();

        if (previousTotalString !== nextTotalString) {
          data.total_reserva = nextTotal;
          historyEntries.push({
            reserva: { connect: { reserva_id: reservaId } },
            usuario: { connect: { usuario_id: auditUserId } },
            campo: 'total_reserva',
            valor_anterior: previousTotalString,
            valor_nuevo: nextTotalString,
          });
        }
      }

      if (dto.notas !== undefined) {
        const previousNotas = existing.notas ?? null;
        const nextNotas = dto.notas ?? null;

        if (previousNotas !== nextNotas) {
          data.notas = dto.notas;
          historyEntries.push({
            reserva: { connect: { reserva_id: reservaId } },
            usuario: { connect: { usuario_id: auditUserId } },
            campo: 'notas',
            valor_anterior: previousNotas,
            valor_nuevo: nextNotas,
          });
        }
      }

      await this.reservationsRepository.updateReservation(tx, reservaId, data);

      if (historyEntries.length > 0) {
        const historyAction =
          checkinChanged || checkoutChanged
            ? HISTORY_ACTION.REAGENDAR
            : HISTORY_ACTION.EDITAR;

        for (const history of historyEntries) {
          await this.reservationsRepository.createReservationHistory(tx, {
            ...history,
            accion: historyAction,
          });
        }
      }
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(reservaId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found after update');
    }

    return toReservationDetail(reservation);
  }

  async changeStatus(
    reservationId: string,
    dto: ChangeReservationStatusDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    const reservaId = this.parseId(reservationId, 'reservation_id');

    const prisma = this.reservationsRepository.prismaClient;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.reserva.findUnique({
        where: { reserva_id: reservaId },
        select: {
          reserva_id: true,
          estatus_reserva_code: true,
          ubicacion_id: true,
          checkin_datetime: true,
          checkout_datetime: true,
          airbnb_external_uid: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      const statusRecord = await tx.cat_estatus_reserva.findUnique({
        where: { estatus_reserva_code: dto.estatus_reserva_code },
        select: { estatus_reserva_code: true, bloquea_disponibilidad: true },
      });

      if (!statusRecord) {
        throw new BadRequestException('Invalid estatus_reserva_code');
      }

      if (existing.estatus_reserva_code === dto.estatus_reserva_code) {
        return;
      }

      const now = new Date();

      // Before transitioning to a status that blocks availability, claim any
      // lingering AIRBNB block that overlaps this reservation's period.
      // This prevents the 23P01 exclusion-constraint violation on ocupacion_ubicacion.
      let capturedExternalUid: string | null | undefined = undefined;

      if (statusRecord.bloquea_disponibilidad) {
        if (existing.airbnb_external_uid) {
          // Idempotent: deactivate by UID — no-op if the block is already INACTIVO.
          await this.reservationsRepository.deactivateAirbnbBlockByUid(tx, {
            ubicacionId: existing.ubicacion_id,
            externalUid: existing.airbnb_external_uid,
          });
        } else {
          // No UID recorded yet: find and claim any overlapping AIRBNB block.
          const block =
            await this.reservationsRepository.findActiveAirbnbBlockOverlapping(
              tx,
              {
                ubicacionId: existing.ubicacion_id,
                checkin: existing.checkin_datetime,
                checkout: existing.checkout_datetime,
              },
            );

          if (block) {
            await this.reservationsRepository.deactivateBlock(
              tx,
              block.bloqueo_id,
            );
            capturedExternalUid = block.external_uid ?? null;
          }
        }
      }

      const updateData: Prisma.reservaUpdateInput = {
        cat_estatus_reserva: {
          connect: { estatus_reserva_code: dto.estatus_reserva_code },
        },
        updated_at: now,
        usuario_reserva_updated_byTousuario: {
          connect: { usuario_id: auditUserId },
        },
        ...(capturedExternalUid !== undefined
          ? { airbnb_external_uid: capturedExternalUid }
          : {}),
      };

      await tx.reserva.update({
        where: { reserva_id: reservaId },
        data: updateData,
      });

      const historyAction =
        dto.estatus_reserva_code === 'CANCELADA'
          ? HISTORY_ACTION.CANCELAR
          : HISTORY_ACTION.EDITAR;

      await this.reservationsRepository.createReservationHistory(tx, {
        reserva: { connect: { reserva_id: reservaId } },
        usuario: { connect: { usuario_id: auditUserId } },
        accion: historyAction,
        campo: 'estatus_reserva_code',
        valor_anterior: existing.estatus_reserva_code,
        valor_nuevo: dto.estatus_reserva_code,
      });
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(reservaId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found after status change');
    }

    return toReservationDetail(reservation);
  }

  async changeTimes(
    reservationId: string,
    dto: UpdateReservationTimesDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    const reservaId = this.parseId(reservationId, 'reservation_id');
    const checkin = this.parseDate(dto.checkin_datetime, 'checkin_datetime');
    const checkout = this.parseDate(dto.checkout_datetime, 'checkout_datetime');

    if (checkout <= checkin) {
      throw new BadRequestException(
        'checkout_datetime must be greater than checkin_datetime',
      );
    }

    const prisma = this.reservationsRepository.prismaClient;

    await prisma.$transaction(async (tx) => {
      const existing = await this.reservationsRepository.findByIdForUpdate(
        tx,
        reservaId,
      );

      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      if (
        existing.estatus_reserva_code !== 'PENDIENTE' &&
        existing.estatus_reserva_code !== 'CONFIRMADA'
      ) {
        throw new ConflictException(
          'Reservation status does not allow time changes',
        );
      }

      const checkinChanged =
        existing.checkin_datetime.getTime() !== checkin.getTime();
      const checkoutChanged =
        existing.checkout_datetime.getTime() !== checkout.getTime();

      if (!checkinChanged && !checkoutChanged) {
        return;
      }

      const overlapping =
        await this.reservationsRepository.findOverlappingReservation(tx, {
          ubicacionId: existing.ubicacion_id,
          checkin,
          checkout,
          excludeReservationId: reservaId,
        });

      if (overlapping) {
        throw new BadRequestException(
          'The selected location is already booked for the given period',
        );
      }

      const now = new Date();

      await this.reservationsRepository.updateReservation(tx, reservaId, {
        checkin_datetime: checkin,
        checkout_datetime: checkout,
        updated_at: now,
        usuario_reserva_updated_byTousuario: {
          connect: { usuario_id: auditUserId },
        },
      });

      if (checkinChanged) {
        await this.reservationsRepository.createReservationHistory(tx, {
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          accion: HISTORY_ACTION.REAGENDAR,
          campo: 'checkin_datetime',
          valor_anterior: existing.checkin_datetime.toISOString(),
          valor_nuevo: checkin.toISOString(),
        });
      }

      if (checkoutChanged) {
        await this.reservationsRepository.createReservationHistory(tx, {
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          accion: HISTORY_ACTION.REAGENDAR,
          campo: 'checkout_datetime',
          valor_anterior: existing.checkout_datetime.toISOString(),
          valor_nuevo: checkout.toISOString(),
        });
      }
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(reservaId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found after update');
    }

    return toReservationDetail(reservation);
  }

  private buildWhere(query: ReservationQueryDto): Prisma.reservaWhereInput {
    const where: Prisma.reservaWhereInput = {};
    const and: Prisma.reservaWhereInput[] = [];

    if (query.ubicacion_id) {
      where.ubicacion_id = this.parseId(query.ubicacion_id, 'ubicacion_id');
    }

    if (query.cliente_id) {
      where.cliente_id = this.parseId(query.cliente_id, 'cliente_id');
    }

    if (query.estatus_reserva_code) {
      where.estatus_reserva_code = query.estatus_reserva_code;
    }

    if (query.origen) {
      where.origen_reserva_code = query.origen;
    }

    const fromDate = query.from
      ? this.parseDate(query.from, 'from')
      : undefined;
    const toDate = query.to ? this.parseDate(query.to, 'to') : undefined;

    if (fromDate && toDate && fromDate >= toDate) {
      throw new BadRequestException('from must be earlier than to');
    }

    if (fromDate) {
      and.push({ checkout_datetime: { gt: fromDate } });
    }

    if (toDate) {
      and.push({ checkin_datetime: { lt: toDate } });
    }

    if (and.length) {
      where.AND = and;
    }

    return where;
  }

  private parseId(value: string, field: string): bigint {
    try {
      return BigInt(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid number`, {
        cause: normalizedError,
      });
    }
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }

    return date;
  }

  private parseDecimal(value: number, field: string): Prisma.Decimal {
    try {
      return new Prisma.Decimal(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid decimal value`, {
        cause: normalizedError,
      });
    }
  }
  async getPendingBalancesReminders(
    daysBeforeCheckin: number = 3,
  ): Promise<ReservationSummary[]> {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysBeforeCheckin);

    const reservations =
      await this.reservationsRepository.findAllWithRelations({
        estatus_reserva_code: 'CONFIRMADA',
        checkin_datetime: {
          gte: now,
          lte: targetDate,
        },
      });

    const summaries = reservations.map((res) => toReservationSummary(res));

    // Return only those that have pending balances
    return summaries.filter(
      (res) => res.estatus_pago === 'PENDIENTE' || res.estatus_pago === 'PARCIAL',
    );
  }

}

/*
Manual testing — total_reserva hardening
Header requerido en todos los casos: x-user-id: <usuario_válido>

── create() ─────────────────────────────────────────────────────────────────

Case 1 — FAIL: total_reserva omitido
  POST /reservations
  body: { "cliente_id":"1", "ubicacion_id":"1", "origen_reserva_code":"DIRECTO",
          "checkin_datetime":"2026-03-01T12:00:00Z", "checkout_datetime":"2026-03-03T12:00:00Z" }
  Expected → HTTP 400 (DTO): { "message": ["total_reserva must be a valid positive number"] }

Case 2 — FAIL: total_reserva = "" (string vacío)
  body: { ..., "total_reserva": "" }
  Expected → HTTP 400 (DTO): { "message": ["total_reserva must be a valid positive number"] }

Case 3 — FAIL: total_reserva = "   " (solo espacios)
  body: { ..., "total_reserva": "   " }
  Expected → HTTP 400 (DTO): misma que case 2

Case 4 — FAIL: total_reserva = 0
  body: { ..., "total_reserva": 0 }
  Expected → HTTP 400 (service): { "message": "total_reserva must be greater than 0" }

Case 5 — FAIL: total_reserva negativo
  body: { ..., "total_reserva": -500 }
  Expected → HTTP 400 (service): { "message": "total_reserva must be greater than 0" }

Case 6 — OK: total_reserva mínimo válido
  body: { ..., "total_reserva": 0.01 }
  Expected → HTTP 201 con reserva creada

Case 7 — OK: total_reserva normal
  body: { ..., "total_reserva": 1500 }
  Expected → HTTP 201 con reserva creada

── update() ─────────────────────────────────────────────────────────────────

Case 8 — FAIL: total_reserva = 0
  PUT /reservations/:id
  body: { "total_reserva": 0 }
  Expected → HTTP 400: { "message": "total_reserva must be greater than 0" }

Case 9 — FAIL: bajar total por debajo del total pagado
  Prerequisito: reserva con total_reserva=5000 y pagos registrados=3000.
  PUT /reservations/:id
  body: { "total_reserva": 2500 }
  Expected → HTTP 400: { "message": "total_reserva cannot be less than total_paid" }

Case 10 — OK: nuevo total exactamente igual al total pagado
  Prerequisito: reserva con total_reserva=5000 y pagos registrados=3000.
  PUT /reservations/:id
  body: { "total_reserva": 3000 }
  Expected → HTTP 200 con reserva actualizada (total_reserva="3000")
*/
