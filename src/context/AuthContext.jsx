"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return null;
        try {
            const res = await api.get("/users/me");
            setUser(res.data);
            return res.data;
        } catch (error) {
            console.error("Auth initialization failed:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getDashboardRoute = useCallback((userData) => {
        const targetUser = userData || user;
        if (!targetUser) return '/auth?mode=signin';

        const role = String(targetUser?.role?.name || '');
        const isOnboarded = targetUser?.onboardingStatus === 'completed' || role !== 'admin';

        if (role === 'super_admin') {
            return '/dashboard/users';
        } else if (!isOnboarded) {
            return '/onboarding';
        } else if (role === 'admin') {
            return '/orders';
        } else {
            return '/orders/employee-orders';
        }
    }, [user]);

    const handleAuthSuccess = useCallback(async (data) => {
        if (data?.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
        }
        if (data?.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        }

        // Call local API for session management
        await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessToken: data.accessToken,
                user: data.user
            }),
        });

        // Navigation Logic
        const targetPath = getDashboardRoute(data.user);

        if (typeof window !== "undefined") {
            setTimeout(() => {
                window.location.href = targetPath;
            }, 500);
        }
    }, [getDashboardRoute]);

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw data;

        await handleAuthSuccess(data);
        return data;
    }, [handleAuthSuccess]);

    const handleGoogleLogin = useCallback(async (redirectUrl = null) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const targetUrl = new URL("auth/google", baseUrl);

        if (redirectUrl) {
            targetUrl.searchParams.append('redirect', redirectUrl);
        }

        try {
            const res = await fetch(targetUrl.toString());
            const data = await res.json();
            if (!res.ok) throw data;

            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                throw new Error("No redirect URL returned");
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const logout = useCallback(async () => {
        try {
            ["accessToken", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
            setUser(null);
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
        } catch {
            // Ignore API failures and continue with local logout.
        }

        if (typeof window !== "undefined") {
            window.location.href = "/auth?mode=signin";
        }
    }, []);

    const permissionHelpers = useMemo(() => {
        const permsArray = user?.role?.permissionNames || [];
        const permsSet = new Set(permsArray);

        const hasAllAccess = permsSet.has('*') || user?.role?.name === "super_admin";

        const hasPermission = (permission) => {
            if (hasAllAccess) return true;

            if (Array.isArray(permission)) {
                return permission.some(p => permsSet.has(p));
            }

            return permsSet.has(permission);
        };

        return { hasPermission, permsSet, hasAllAccess };
    }, [user]);

    const activeSubscription = user?.subscriptions?.[0]
    const helpers = {
        isAuthenticated: !!user,
        isAdmin: user?.role?.name === "admin",
        isSuperAdmin: user?.role?.name === "super_admin",
        activeSubscription,
        hasActiveSubscription: !!activeSubscription,
        hasPermission: permissionHelpers.hasPermission,
        permissions: user?.role?.permissionNames,
        roleName: user?.role?.name || "user",
        planName: activeSubscription?.plan?.name || "No Plan",
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                refreshUser: fetchUser,
                logout,
                login,
                handleGoogleLogin,
                handleAuthSuccess,
                getDashboardRoute,
                ...helpers
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};