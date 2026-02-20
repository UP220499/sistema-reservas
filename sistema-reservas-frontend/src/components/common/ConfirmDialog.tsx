import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
    cancelColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
    onClose: () => void;
    onConfirm: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    content,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'primary',
    cancelColor = 'inherit',
    onClose,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{content}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color={cancelColor}>
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} color={confirmColor} autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
