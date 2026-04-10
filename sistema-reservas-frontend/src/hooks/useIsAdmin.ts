import { useAuth } from './useAuth';

export function useIsAdmin(): boolean {
    const { user } = useAuth();
    return user?.rol_code === 'ADMIN';
}
