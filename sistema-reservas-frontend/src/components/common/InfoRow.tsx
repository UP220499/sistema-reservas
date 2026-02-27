import { Box, Typography } from '@mui/material';

/** Never shows "undefined", "null", or empty string — returns "—" instead. */
function displayValue(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    const s = String(v).trim();
    if (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '—';
    return s;
}

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
