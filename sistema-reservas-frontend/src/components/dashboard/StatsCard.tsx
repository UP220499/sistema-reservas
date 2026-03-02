import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

type PaletteColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    color?: PaletteColor;
}

export default function StatsCard({ title, value, icon, color = 'primary' }: StatsCardProps) {
    const theme = useTheme();

    const paletteMap: Record<PaletteColor, string> = {
        primary:   theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        error:     theme.palette.error.main,
        warning:   theme.palette.warning.main,
        info:      theme.palette.info.main,
        success:   theme.palette.success.main,
    };
    const mainColor = paletteMap[color];

    return (
        <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{ display: 'block', lineHeight: 1.4, mb: 0.75 }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h4"
                            component="div"
                            fontWeight={700}
                            sx={{ lineHeight: 1, color: 'text.primary' }}
                        >
                            {value}
                        </Typography>
                    </Box>

                    {icon && (
                        <Box
                            sx={{
                                bgcolor: alpha(mainColor, 0.1),
                                color: mainColor,
                                borderRadius: 2.5,
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                '& svg': { fontSize: 24 },
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
