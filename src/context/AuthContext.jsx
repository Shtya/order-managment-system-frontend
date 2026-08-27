"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api, { getLang } from "@/utils/api";

const AuthContext = createContext();

const USER_STORAGE_KEY = "user";
const ORDER_STATS_PREFS_LS_KEY = "orderStatisticsPreferences";

function readOrderStatsPrefsFromLs() {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(ORDER_STATS_PREFS_LS_KEY);
        if (!raw) return { hidden: [] };
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return { hidden: parsed.filter((k) => typeof k === "string") };
        }
        if (parsed && typeof parsed === "object") {
            return {
                hidden: Array.isArray(parsed.hidden)
                    ? parsed.hidden.filter((k) => typeof k === "string")
                    : [],
            };
        }
        return { hidden: [] };
    } catch {
        return { hidden: [] };
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState();
    /** null = not loaded yet; object = loaded once for the session (not on User /users/me). */
    const [tablePreferences, setTablePreferences] = useState(null);
    /**
     * null = logged out / no token.
     * Seeded from localStorage when a token exists so UI can apply prefs before the API returns.
     */
    const [orderStatisticsPreferences, setOrderStatisticsPreferences] = useState(() => {
        if (typeof window === "undefined") return null;
        if (!localStorage.getItem("accessToken")) return null;
        return readOrderStatsPrefsFromLs();
    });
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(() => typeof window !== 'undefined' ?  localStorage.getItem('accessToken') : null);

    const fetchTablePreferences = useCallback(async () => {
        if (!token) {
            setTablePreferences(null);
            return null;
        }
        try {
            const res = await api.get("/users/me/table-preferences");
            const prefs =
                res.data?.tablePreferences && typeof res.data.tablePreferences === "object"
                    ? res.data.tablePreferences
                    : {};
            setTablePreferences(prefs);
            return prefs;
        } catch (error) {
            console.error("Failed to load table preferences:", error);
            setTablePreferences({});
            return {};
        }
    }, [token]);

    const updateTablePreferences = useCallback(async (patch) => {
        const res = await api.patch("/users/me/table-preferences", {
            tablePreferences: patch,
        });
        const prefs =
            res.data?.tablePreferences && typeof res.data.tablePreferences === "object"
                ? res.data.tablePreferences
                : {};
        setTablePreferences(prefs);
        return prefs;
    }, []);

    const fetchOrderStatisticsPreferences = useCallback(async () => {
        if (!token) {
            setOrderStatisticsPreferences(null);
            return null;
        }
        try {
            const res = await api.get("/users/me/order-statistics-preferences");
            const prefs =
                res.data?.orderStatisticsPreferences &&
                typeof res.data.orderStatisticsPreferences === "object"
                    ? res.data.orderStatisticsPreferences
                    : { hidden: [] };
            setOrderStatisticsPreferences(prefs);
            try {
                localStorage.setItem(ORDER_STATS_PREFS_LS_KEY, JSON.stringify({
                    hidden: Array.isArray(prefs.hidden)
                        ? prefs.hidden.filter((k) => typeof k === "string")
                        : [],
                }));
            } catch {
                // Ignore storage failures
            }
            return prefs;
        } catch (error) {
            console.error("Failed to load order statistics preferences:", error);
            // Keep LS seed if API fails — don't wipe to empty
            setOrderStatisticsPreferences((prev) => prev ?? readOrderStatsPrefsFromLs() ?? { hidden: [] });
            return readOrderStatsPrefsFromLs() ?? { hidden: [] };
        }
    }, [token]);

    const updateOrderStatisticsPreferences = useCallback(async (patch) => {
        const res = await api.patch("/users/me/order-statistics-preferences", {
            orderStatisticsPreferences: patch,
        });
        const prefs =
            res.data?.orderStatisticsPreferences &&
            typeof res.data.orderStatisticsPreferences === "object"
                ? res.data.orderStatisticsPreferences
                : { hidden: [] };
        setOrderStatisticsPreferences(prefs);
        try {
            localStorage.setItem(ORDER_STATS_PREFS_LS_KEY, JSON.stringify({
                hidden: Array.isArray(prefs.hidden)
                    ? prefs.hidden.filter((k) => typeof k === "string")
                    : [],
            }));
        } catch {
            // Ignore storage failures
        }
        return prefs;
    }, []);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            setTablePreferences(null);
            setOrderStatisticsPreferences(null);
            return null;
        };
        try {
            setIsLoading(true);
            const res = await api.get("/users/me");
            setUser(res.data);
            // Load once with auth — Tables / OrderTab read from context, not per-mount GET
            await Promise.all([
                fetchTablePreferences(),
                fetchOrderStatisticsPreferences(),
            ]);
            return res.data;
        } catch (error) {
            console.error("Auth initialization failed:", error);
            setTablePreferences(null);
            setOrderStatisticsPreferences(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token, fetchTablePreferences, fetchOrderStatisticsPreferences]);

    const setAuthToken = useCallback(async (newToken) => {
        const sanitizedToken = newToken?.trim() || null;

        if (sanitizedToken) {
            localStorage.setItem('accessToken', sanitizedToken);
            setToken(sanitizedToken);
            await fetchUser(sanitizedToken);

        } else {

            localStorage.removeItem('accessToken');
            localStorage.removeItem(USER_STORAGE_KEY);
            setToken(null);
            setUser(null);
            setTablePreferences(null);
            setOrderStatisticsPreferences(null);
        }
    }, [fetchUser, setToken, setUser]);

    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = localStorage.getItem('accessToken')?.trim();

            if (savedToken) {
                localStorage.setItem('accessToken', savedToken);
                setToken(savedToken);
                await fetchUser();

                setIsLoading(false);
            };
        }
        initializeAuth();
    }, [fetchUser]);

    // Persist user data to localStorage on every change (login, refresh, logout)
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            if (user) {
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        } catch {
            // Ignore storage failures (private mode / quota).
        }
    }, [user]);


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

    const handleAuthSuccess = useCallback(async (data, route) => {
        if (data?.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            setToken(data.accessToken);
        }

        if (data?.user) {
            setUser(data.user);
        }

        // Prefs are select:false on User — load once after login (token already set above)
        try {
            const [prefsRes, statsPrefsRes] = await Promise.all([
                api.get("/users/me/table-preferences"),
                api.get("/users/me/order-statistics-preferences"),
            ]);
            const prefs =
                prefsRes.data?.tablePreferences && typeof prefsRes.data.tablePreferences === "object"
                    ? prefsRes.data.tablePreferences
                    : {};
            setTablePreferences(prefs);
            const statsPrefs =
                statsPrefsRes.data?.orderStatisticsPreferences &&
                typeof statsPrefsRes.data.orderStatisticsPreferences === "object"
                    ? statsPrefsRes.data.orderStatisticsPreferences
                    : { hidden: [] };
            setOrderStatisticsPreferences(statsPrefs);
            try {
                localStorage.setItem(ORDER_STATS_PREFS_LS_KEY, JSON.stringify({
                    hidden: Array.isArray(statsPrefs.hidden)
                        ? statsPrefs.hidden.filter((k) => typeof k === "string")
                        : [],
                }));
            } catch {
                // Ignore storage failures
            }
        } catch {
            setTablePreferences({});
            setOrderStatisticsPreferences(readOrderStatsPrefsFromLs() ?? { hidden: [] });
        }

        // Call local API for session management (cookie-based auth for middleware/SSR)
        // NOTE: This must NOT break the login flow if it fails. localStorage is sufficient
        // for client-side; the middleware cookie will be refreshed on subsequent requests
        // via the user fetched from /users/me.
        try {
            const cookieRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: data.accessToken,
                    user: data.user
                }),
            });

            if (!cookieRes.ok) {
                // Log but don't throw — the user already has a valid localStorage token.
                // In production, transient reverse-proxy errors (502) should not break UX.
                console.error(
                    `[handleAuthSuccess] Session cookie API returned ${cookieRes.status}.` +
                    ' Client-side localStorage auth still works; navigation will proceed.'
                );
            }
        } catch (err) {
            // Network errors or uncaught exceptions: log but never block login.
            console.error('[handleAuthSuccess] Failed to call session cookie API. Network or proxy error.', err);
        }

        // Navigation Logic
        const targetPath = getDashboardRoute(data.user);

        if (typeof window !== "undefined") {
            setTimeout(() => {
                window.location.href = route ? route : targetPath;
            }, 500);
        }
    }, [getDashboardRoute]);

    const login = useCallback(async (email, password) => {
        const lang = getLang();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-lang': lang },
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


    const logout = useCallback(async () => {
        try {
            ["accessToken", USER_STORAGE_KEY].forEach((k) => localStorage.removeItem(k));
            setToken(null);
            setUser(null);
            setTablePreferences(null);
            setOrderStatisticsPreferences(null);
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
        accessToken: token,
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                tablePreferences,
                setTablePreferences,
                updateTablePreferences,
                refreshTablePreferences: fetchTablePreferences,
                orderStatisticsPreferences,
                setOrderStatisticsPreferences,
                updateOrderStatisticsPreferences,
                refreshOrderStatisticsPreferences: fetchOrderStatisticsPreferences,
                isLoading,
                refreshUser: fetchUser,
                logout,
                login,
                handleGoogleLogin,
                handleAuthSuccess,
                getDashboardRoute,
                setAuthToken,
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
