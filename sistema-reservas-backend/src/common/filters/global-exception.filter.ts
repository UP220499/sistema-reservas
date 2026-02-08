import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface NormalizedError {
  status: number;
  message: string;
  prismaCode?: string;
  postgresCode?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private static readonly prismaMappings: Record<string, NormalizedError> = {
    P2002: {
      status: HttpStatus.CONFLICT,
      message: 'Unique constraint violation',
    },
    P2025: {
      status: HttpStatus.NOT_FOUND,
      message: 'Record not found',
    },
  };

  private static readonly postgresMappings: Record<string, NormalizedError> = {
    '23P01': {
      status: HttpStatus.CONFLICT,
      message: 'Schedule conflict (overlap detected)',
    },
    '23514': {
      status: HttpStatus.BAD_REQUEST,
      message: 'Constraint violation',
    },
    '23503': {
      status: HttpStatus.CONFLICT,
      message: 'Foreign key constraint violation',
    },
    '23502': {
      status: HttpStatus.BAD_REQUEST,
      message: 'Missing required field',
    },
    '22P02': {
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid input syntax',
    },
  };

  private static readonly postgresCodeRegex = /^[0-9A-Z]{5}$/;
  private static readonly postgresCodeInText = /([0-9A-Z]{5})/;

  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly verboseLogs = process.env.ERROR_VERBOSE === 'true';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      this.logHttpException(exception, request);
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(body);
      return;
    }

    const normalized = this.normalizeException(exception);
    const { status, message, prismaCode, postgresCode } = normalized;
    const errorName = this.formatErrorName(status);

    this.logNormalizedException(
      status,
      message,
      request,
      prismaCode,
      postgresCode,
      exception,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
    });
  }

  private normalizeException(exception: unknown): NormalizedError {
    const prismaCode = this.extractPrismaCode(exception);
    const postgresCode = this.extractPostgresCode(exception);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (postgresCode) {
      const mapping = GlobalExceptionFilter.postgresMappings[postgresCode];
      if (mapping) {
        status = mapping.status;
        message = mapping.message;
      }
    }

    if (prismaCode) {
      const mapping = GlobalExceptionFilter.prismaMappings[prismaCode];
      if (mapping) {
        status = mapping.status;
        message = mapping.message;
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid input syntax';
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid request';
      }
    }

    return { status, message, prismaCode, postgresCode };
  }

  private extractPrismaCode(exception: unknown): string | undefined {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return exception.code;
    }
    return undefined;
  }

  private extractPostgresCode(exception: unknown): string | undefined {
    const queue: unknown[] = [exception];
    const visited = new Set<unknown>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || current === null) {
        continue;
      }

      if (typeof current === 'string') {
        const match = current.match(GlobalExceptionFilter.postgresCodeInText);
        if (match && GlobalExceptionFilter.postgresCodeRegex.test(match[1])) {
          return match[1];
        }
        continue;
      }

      if (typeof current !== 'object') {
        continue;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const candidate = (current as { code?: unknown }).code;
      if (typeof candidate === 'string') {
        if (GlobalExceptionFilter.postgresCodeRegex.test(candidate)) {
          return candidate;
        }
        const match = candidate.match(GlobalExceptionFilter.postgresCodeInText);
        if (match && GlobalExceptionFilter.postgresCodeRegex.test(match[1])) {
          return match[1];
        }
      }

      const meta = (current as { meta?: unknown }).meta;
      if (meta && typeof meta === 'object') {
        queue.push(meta);
      }

      const cause = (current as { cause?: unknown }).cause;
      if (cause) {
        queue.push(cause);
      }

      const previous = (current as { previous?: unknown }).previous;
      if (previous) {
        queue.push(previous);
      }

      const detail = (current as { detail?: unknown }).detail;
      if (detail) {
        queue.push(detail);
      }

      const hint = (current as { hint?: unknown }).hint;
      if (hint) {
        queue.push(hint);
      }

      const message = (current as { message?: unknown }).message;
      if (message) {
        queue.push(message);
      }
    }

    return undefined;
  }

  private formatErrorName(status: number): string {
    const statusText = HttpStatus[status];
    if (!statusText) {
      return 'Error';
    }

    return statusText
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private logHttpException(exception: HttpException, request: Request): void {
    const status = exception.getStatus();
    const responseBody = exception.getResponse();
    const message = this.extractMessage(responseBody, exception.message);

    const logParts = [
      `status=${status}`,
      `method=${request.method}`,
      `path=${request.url}`,
      `message=${message}`,
    ];

    const logMessage = logParts.join(' ');

    if (this.verboseLogs && exception instanceof Error) {
      this.logger.error(logMessage, exception.stack);
      return;
    }

    this.logger.error(logMessage);
  }

  private logNormalizedException(
    status: number,
    message: string,
    request: Request,
    prismaCode: string | undefined,
    postgresCode: string | undefined,
    exception: unknown,
  ): void {
    const logParts = [
      `status=${status}`,
      `method=${request.method}`,
      `path=${request.url}`,
      `message=${message}`,
    ];

    if (prismaCode) {
      logParts.push(`prisma_code=${prismaCode}`);
    }

    if (postgresCode) {
      logParts.push(`postgres_code=${postgresCode}`);
    }

    const logMessage = logParts.join(' ');

    if (this.verboseLogs && exception instanceof Error) {
      this.logger.error(logMessage, exception.stack);
      return;
    }

    this.logger.error(logMessage);
  }

  private extractMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }

    if (Array.isArray(payload)) {
      return payload
        .map((item) => this.extractMessage(item, ''))
        .filter((value) => value.length > 0)
        .join(', ');
    }

    if (payload && typeof payload === 'object') {
      const nested = (payload as { message?: unknown }).message;
      const extracted = this.extractMessage(nested, '');
      if (extracted.length > 0) {
        return extracted;
      }
    }

    if (typeof fallback === 'string' && fallback.length > 0) {
      return fallback;
    }

    return 'Error';
  }
}

/*
Manual testing scenarios:
- 23P01: Crear un bloqueo AIRBNB que traslape con otro ACTIVO para disparar el conflicto de agenda.
- P2002: Intentar registrar un external_uid duplicado para la misma ubicacion.
- P2025: Consultar o actualizar un registro inexistente con Prisma para confirmar el 404.
*/
