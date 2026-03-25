"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    const fetchUser = useCallback(async () => {
        try {

            const res = await api.get("/users/me");
            setUser(res.data);
        } catch (error) {
            console.error("Auth initialization failed:", error);
        } finally {
            setIsLoading(false);
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