import { Card, CardContent, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    color?: string;
}

export default function StatsCard({ title, value, icon, color = 'primary.main' }: StatsCardProps) {
    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="overline">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {value}
                        </Typography>
                    </Box>
                    {icon && (
                        <Box sx={{ color, display: 'flex' }}>
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
