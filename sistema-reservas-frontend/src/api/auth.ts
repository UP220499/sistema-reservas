import api from './client';
import type {
    LoginRequest,
    TokenPair,
    UserProfile,
} from '../types';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<TokenPair> => {
        const { data } = await api.post<TokenPair>('/auth/login', credentials);
        return data;
    },

    refresh: async (refreshToken: string): Promise<TokenPair> => {
        const { data } = await api.post<TokenPair>('/auth/refresh', {
            refresh_token: refreshToken,
        });
        return data;
    },

    getProfile: async (): Promise<UserProfile> => {
        const { data } = await api.get<UserProfile>('/auth/profile');
        return data;
    },
};
