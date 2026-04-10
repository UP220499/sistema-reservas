import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface AdminRouteProps {
    children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
