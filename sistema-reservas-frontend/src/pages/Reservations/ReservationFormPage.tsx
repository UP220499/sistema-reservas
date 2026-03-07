import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import { reservationsApi } from '../../api/reservations';
import ReservationForm from '../../components/reservations/ReservationForm';

const TERMINAL_STATUSES = new Set(['CANCELADA', 'COMPLETADA', 'FINALIZADA', 'NO_SHOW']);

export default function ReservationFormPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    // Prefill params logic
    const fromBlock = searchParams.get('from') === 'bloqueo';
    const prefillUbicacion = searchParams.get('ubicacion_id') || '';
    const prefillCheckin = searchParams.get('checkin') || '';
    const prefillCheckout = searchParams.get('checkout') || '';
    const prefillOrigenBloqueoCode = searchParams.get('origen_bloqueo_code') || '';
    const prefillBlockId = searchParams.get('block_id') || '';

    const prefill = {
        fromBlock,
        origenBloqueoCode: prefillOrigenBloqueoCode,
        ubicacion_id: prefillUbicacion,
        checkin: prefillCheckin,
        checkout: prefillCheckout,
        blockId: prefillBlockId,
    };

    const { data: existing, isLoading } = useQuery({
        queryKey: qk.reservations.detail(id),
        queryFn: () => reservationsApi.findOne(id!),
        enabled: isEditing,
    });

    if (isEditing && isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isEditing && existing && TERMINAL_STATUSES.has(existing.estatus_reserva_code)) {
        return (
            <Box sx={{ p: 3, maxWidth: 600 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Esta reservación tiene estatus <strong>{existing.estatus_reserva_code}</strong> y no puede editarse.
                </Alert>
                <Button variant="outlined" onClick={() => navigate(`/reservaciones/${id}`)}>
                    Ver detalle
                </Button>
            </Box>
        );
    }

    return (
        <ReservationForm
            initialData={existing}
            reservationId={id}
            prefill={prefill}
            key={existing?.reserva_id || 'new'}
        />
    );
}
