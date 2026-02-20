import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { clientsApi } from '../../api/clients';
import ClientForm from '../../components/clients/ClientForm';

export default function ClientFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: existingClient, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsApi.findOne(id!),
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
        <ClientForm
            initialData={existingClient}
            clientId={id}
            key={existingClient?.cliente_id || 'new'}
        />
    );
}
