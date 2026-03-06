import { Box, Typography } from '@mui/material';
import type { ReactElement } from 'react';

interface EmptyStateProps {
    icon: ReactElement;
    title: string;
    subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 7,
                gap: 1.5,
            }}
        >
            <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 48 } }}>{icon}</Box>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}
