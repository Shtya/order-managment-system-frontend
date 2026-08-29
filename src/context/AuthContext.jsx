"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api, { getLang } from "@/utils/api";
import {
    readAllTablePrefsFromLS,
    readAllStatisticsPrefsFromLS,
    writeAllTablePrefsToLS,
    writeAllStatisticsPrefsToLS,
} from "@/utils/userPreferencesStorage";

const AuthContext = createContext();

const USER_STORAGE_KEY = "user";

export function AuthProvider({ children }) {
    const [user, setUser] = useState();
    /** null = not loaded yet; object = loaded once for the session (not on User /users/me). */
    const [tablePreferences, setTablePreferences] = useState(() => {
        if (typeof window === "undefined") return null;
        if (!localStorage.getItem("accessToken")) return null;
        return readAllTablePrefsFromLS();
    });
    /** null = not loaded yet; object = loaded once for the session (not on User /users/me). */
    const [statisticsPreferences, setStatisticsPreferences] = useState(() => {
        if (typeof window === "undefined") return null;
        if (!localStorage.getItem("accessToken")) return null;
        return readAllStatisticsPrefsFromLS();
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
            writeAllTablePrefsToLS(prefs);
            return prefs;
        } catch (error) {
            console.error("Failed to load table preferences:", error);
            const fromLs = readAllTablePrefsFromLS();
            setTablePreferences(fromLs);
            return fromLs;
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
        writeAllTablePrefsToLS(prefs);
        return prefs;
    }, []);

    const fetchStatisticsPreferences = useCallback(async () => {
        if (!token) {
            setStatisticsPreferences(null);
            return null;
        }
        try {
            const res = await api.get("/users/me/statistics-preferences");
            const prefs =
                res.data?.statisticsPreferences &&
                typeof res.data.statisticsPreferences === "object"
                    ? res.data.statisticsPreferences
                    : {};
            setStatisticsPreferences(prefs);
            writeAllStatisticsPrefsToLS(prefs);
            return prefs;
        } catch (error) {
            console.error("Failed to load statistics preferences:", error);
            const fromLs = readAllStatisticsPrefsFromLS();
            setStatisticsPreferences(fromLs);
            return fromLs;
        }
    }, [token]);

    const updateStatisticsPreferences = useCallback(async (patch) => {
        const res = await api.patch("/users/me/statistics-preferences", {
            statisticsPreferences: patch,
        });
        const prefs =
            res.data?.statisticsPreferences &&
            typeof res.data.statisticsPreferences === "object"
                ? res.data.statisticsPreferences
                : {};
        setStatisticsPreferences(prefs);
        writeAllStatisticsPrefsToLS(prefs);
        return prefs;
    }, []);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            setTablePreferences(null);
            setStatisticsPreferences(null);
            return null;
        };
        try {
            setIsLoading(true);
            const res = await api.get("/users/me");
            setUser(res.data);
            await Promise.all([
                fetchTablePreferences(),
                fetchStatisticsPreferences(),
            ]);
            return res.data;
        } catch (error) {
            console.error("Auth initialization failed:", error);
            setTablePreferences(null);
            setStatisticsPreferences(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token, fetchTablePreferences, fetchStatisticsPreferences]);

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
            setStatisticsPreferences(null);
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

        try {
            const [prefsRes, statsPrefsRes] = await Promise.all([
                api.get("/users/me/table-preferences"),
                api.get("/users/me/statistics-preferences"),
            ]);
            const prefs =
                prefsRes.data?.tablePreferences && typeof prefsRes.data.tablePreferences === "object"
                    ? prefsRes.data.tablePreferences
                    : {};
            setTablePreferences(prefs);
            writeAllTablePrefsToLS(prefs);
            const statsPrefs =
                statsPrefsRes.data?.statisticsPreferences &&
                typeof statsPrefsRes.data.statisticsPreferences === "object"
                    ? statsPrefsRes.data.statisticsPreferences
                    : {};
            setStatisticsPreferences(statsPrefs);
            writeAllStatisticsPrefsToLS(statsPrefs);
        } catch {
            setTablePreferences(readAllTablePrefsFromLS());
            setStatisticsPreferences(readAllStatisticsPrefsFromLS());
        }

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
                console.error(
                    `[handleAuthSuccess] Session cookie API returned ${cookieRes.status}.` +
                    ' Client-side localStorage auth still works; navigation will proceed.'
                );
            }
        } catch (err) {
            console.error('[handleAuthSuccess] Failed to call session cookie API. Network or proxy error.', err);
        }

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
            setStatisticsPreferences(null);
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
                statisticsPreferences,
                setStatisticsPreferences,
                updateStatisticsPreferences,
                refreshStatisticsPreferences: fetchStatisticsPreferences,
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
