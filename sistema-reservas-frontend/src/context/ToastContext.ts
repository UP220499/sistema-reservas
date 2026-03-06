import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

export interface ToastCtx {
    showToast: (message: string, severity?: AlertColor) => void;
}

export const ToastContext = createContext<ToastCtx | null>(null);
