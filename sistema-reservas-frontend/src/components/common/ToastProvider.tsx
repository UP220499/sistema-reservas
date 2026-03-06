import { useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';
import type { ReactNode } from 'react';
import { ToastContext } from '../../context/ToastContext';

export default function ToastProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<AlertColor>('success');

    const showToast = useCallback((msg: string, sev: AlertColor = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={severity}
                    onClose={() => setOpen(false)}
                    variant="filled"
                    sx={{ minWidth: 280 }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
}
