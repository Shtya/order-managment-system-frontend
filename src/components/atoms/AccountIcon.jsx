"use client";

import React from "react";
import { Wallet, Landmark, Smartphone, UserCog, HelpCircle } from "lucide-react";

/**
 * AccountIcon component
 * Maps account types to specific icons for consistent UI across the application.
 * 
 * Types:
 * CASH -> Wallet
 * BANK -> Landmark
 * WALLET -> Smartphone
 * EMPLOYEE_CUSTODY -> UserCog
 */
export default function AccountIcon({ type, size = 14, className = "" }) {
    switch (type) {
        case "CASH":
            return <Wallet size={size} className={className} />;
        case "BANK":
            return <Landmark size={size} className={className} />;
        case "WALLET":
            return <Smartphone size={size} className={className} />;
        case "EMPLOYEE_CUSTODY":
            return <UserCog size={size} className={className} />;
        default:
            return <HelpCircle size={size} className={className} />;
    }
}
