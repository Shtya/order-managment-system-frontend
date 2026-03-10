'use client'
import { useRouter } from "@/i18n/navigation";
import api from "@/utils/api";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useEffect } from "react";
import toast from "react-hot-toast";


export default function SuccessPage() {
    const t = useTranslations('auth');

    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectUrl = searchParams?.get('redirect') || '/';
    const accessTokenFromUrl = searchParams?.get('accessToken');
    // const refreshTokenFromUrl = searchParams?.get('refreshToken');
    // OAuth: if query has tokens, store them and fetch /auth/me
    useEffect(() => {
        const run = async () => {
            if (!accessTokenFromUrl) {
                router.push('/auth?mode=signin&error=google_failed');
            }
            try {
                localStorage.setItem('accessToken', accessTokenFromUrl);
                const res = await api.get('/auth/sign');
                const user = res.data?.user ?? res.data;
                localStorage.setItem('user', JSON.stringify(user));

                //set login data at cookie
                await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: accessTokenFromUrl, user }),
                });
                const isOnboarded = user?.onboardingStatus === 'completed' || user?.role !== 'admin';

                const redirect = user?.role === 'super_admin' ? '/dashboard/users' : !isOnboarded ? "/onboarding" : '/orders';
                router.push(redirect);
            } catch (e) {
                console.error('OAuth finalize failed', e);
                router.push('/auth?mode=signin&error=google_failed');
            }
        };
        run();
    }, [accessTokenFromUrl, router, redirectUrl]);

    return (
        <div>

        </div>
    );
}