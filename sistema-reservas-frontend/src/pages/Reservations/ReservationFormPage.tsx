import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { reservationsApi } from '../../api/reservations';
import ReservationForm from '../../components/reservations/ReservationForm';

export default function ReservationFormPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id;

    // Prefill params logic
    const fromBlock = searchParams.get('from') === 'bloqueo';
    const prefillUbicacion = searchParams.get('ubicacion_id') || '';
    const prefillCheckin = searchParams.get('checkin') || '';
    const prefillCheckout = searchParams.get('checkout') || '';

    const prefill = {
        fromBlock,
        ubicacion_id: prefillUbicacion,
        checkin: prefillCheckin,
        checkout: prefillCheckout,
    };

    const { data: existing, isLoading } = useQuery({
        queryKey: ['reservation', id],
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

    return (
        <ReservationForm
            initialData={existing}
            reservationId={id}
            prefill={prefill}
            key={existing?.reserva_id || 'new'}
        />
    );
}
