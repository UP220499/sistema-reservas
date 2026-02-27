import { Box, Typography } from '@mui/material';
import { displayValue } from '../../utils/display';

export default function InfoRow({
    label,
    value,
    valueColor,
}: {
    label: string;
    value?: string | number | null;
    valueColor?: string;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.75,
                '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={600}
                color={valueColor || 'text.primary'}
            >
                {displayValue(value)}
            </Typography>
        </Box>
    );
}
