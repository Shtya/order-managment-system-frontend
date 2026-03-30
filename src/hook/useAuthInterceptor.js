import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isPublicRoute } from '@/utils/route-utils';
import { usePathname } from '@/i18n/navigation';
import api from '@/utils/api';

export const useAuthInterceptor = () => {
    const { logout } = useAuth();
    const pathname = usePathname();
    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                const { response } = error;

                if (response && response.status === 401) {
                    if (typeof window !== 'undefined') {

                        localStorage.removeItem('user');

                        if (!isPublicRoute(pathname)) {
                            logout();

                        }
                    }
                }

                return Promise.reject(error);
            }
        );


        return () => {
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [logout]);
};