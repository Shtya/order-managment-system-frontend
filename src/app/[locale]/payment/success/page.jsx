"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    CheckCircle2,
    Loader2,
    CreditCard,
    Calendar,
    User,
    Package,
    Wallet,
    ArrowRight,
    Home,
    Sparkles,
    Crown,
    Zap,
} from "lucide-react";
import api from "@/utils/api";

// Payment purpose enum
const PaymentPurpose = {
    WALLET_TOP_UP: "wallet_top_up",
    SUBSCRIPTION_PAYMENT: "subscription_payment",
    FEATURE_PURCHASE: "feature_purchase",
};

export default function PaymentSuccessPage() {
    const t = useTranslations("paymentSuccess");
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        } else {
            setError(t("errors.noSessionId"));
            setLoading(false);
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/payments/sessions/${sessionId}`);
            setSession(data);
        } catch (err) {
            console.error(err);
            setError(t("errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    const getRedirectPath = () => {
        if (session.user?.role?.name === 'admin' && session.user?.onboardingStatus !== 'completed') {
            return "/onboarding";
        }

        if (!session) return "/";

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return "/wallet";
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return "/plans?tab=plans";
            case PaymentPurpose.FEATURE_PURCHASE:
                return "/plans?tab=features";
            default:
                return "/";
        }
    };

    const getRedirectLabel = () => {
        // إذا كان يحتاج لإكمال الإعداد
        if (session.user?.role?.name === 'admin' && session.user?.onboardingStatus !== 'completed') {
            return t("actions.completeOnboarding");
        }

        if (!session) return t("actions.backToHome");

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return t("actions.goToWallet");
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return t("actions.goToSubscriptions");
            case PaymentPurpose.FEATURE_PURCHASE:
                return t("actions.goToFeatures");
            default:
                return t("actions.backToHome");
        }
    };

    const getPurposeIcon = () => {
        if (!session) return <Package size={32} className="text-primary" />;

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return <Wallet size={32} className="text-primary" />;
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return <Crown size={32} className="text-primary" />;
            case PaymentPurpose.FEATURE_PURCHASE:
                return <Zap size={32} className="text-primary" />;
            default:
                return <Package size={32} className="text-primary" />;
        }
    };

    const getPurposeLabel = () => {
        if (!session) return "";

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return t("purpose.walletTopUp");
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return t("purpose.subscriptionPayment");
            case PaymentPurpose.FEATURE_PURCHASE:
                return t("purpose.featurePurchase");
            default:
                return "";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center ">
                <div className="text-center">
                    <Loader2 size={64} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-foreground text-lg">{t("loading")}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center  p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full  rounded-2xl border border-border p-8 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} className="text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold  mb-4">{t("errors.title")}</h1>
                    <p className="text-foreground mb-8">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full px-6 py-3 bg-primary  rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    >
                        {t("actions.backToHome")}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center  p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                {/* Success Header */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-primary dark:bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                            <CheckCircle2 size={56} className="text-white" />
                        </div>
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-lg"
                        >
                            <Sparkles size={24} className="text-white dark:text-gray-900" />
                        </motion.div>
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black text-foreground mb-3"
                    >
                        {t("title")}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-foreground"
                    >
                        {t("subtitle")}
                    </motion.p>
                </motion.div>

                {/* Payment Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card rounded-2xl border border-primary/30 p-8 mb-6 shadow-lg shadow-primary/5"
                >
                    {/* Purpose Badge */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/30 dark:bg-primary/20 flex items-center justify-center">
                            {getPurposeIcon()}
                        </div>
                        <div>
                            <p className="text-sm text-foreground">{t("labels.paymentFor")}</p>
                            <p className="text-lg font-bold text-foreground">{getPurposeLabel()}</p>
                        </div>
                    </div>

                    <div className="h-px bg-linear-to-r from-transparent via-border to-transparent mb-6" />

                    {/* Payment Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="flex items-center gap-3 p-4  rounded-xl border border-border">
                            <div className="w-10 h-10 rounded-lg bg-primary/30 dark:bg-primary/20 flex items-center justify-center">
                                <CreditCard size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-foreground">{t("labels.amount")}</p>
                                <p className="text-xl font-bold text-primary">
                                    {session?.amount} {session?.currency || "EGP"}
                                </p>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-3 p-4  rounded-xl border border-border">
                            <div className="w-10 h-10 rounded-lg bg-primary/30 dark:bg-primary/20 flex items-center justify-center">
                                <Calendar size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-foreground">{t("labels.date")}</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {new Date(session?.createdAt).toLocaleDateString("ar-EG", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Customer Name */}
                        {session?.user && (
                            <div className="flex items-center gap-3 p-4  rounded-xl border border-border md:col-span-2">
                                <div className="w-10 h-10 rounded-lg bg-primary/30 dark:bg-primary/20 flex items-center justify-center">
                                    <User size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground">{t("labels.customer")}</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {session.user.fullName || session.user.email}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subscription/Feature Details */}
                    {session?.subscription && (
                        <div className="mt-6 p-4  rounded-xl border border-border">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/30 dark:bg-primary/20 flex items-center justify-center shrink-0">
                                    <Crown size={20} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-foreground mb-1">{t("labels.subscription")}</p>
                                    <p className="text-lg font-bold text-foreground mb-2">
                                        {session.subscription.plan?.name || t("common.subscription")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-foreground">{t("labels.duration")}:</span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {session.subscription.duration === "monthly"
                                                    ? t("duration.monthly")
                                                    : session.subscription.duration === "yearly"
                                                        ? t("duration.yearly")
                                                        : t("duration.lifetime")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-foreground">{t("labels.status")}:</span>{" "}
                                            <span className="font-semibold text-green-600 dark:text-green-500">
                                                {t("status.active")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {session?.userFeature && (
                        <div className="mt-6 p-4  rounded-xl border border-border">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/30 dark:bg-primary/20 flex items-center justify-center shrink-0">
                                    <Zap size={20} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-foreground mb-1">{t("labels.feature")}</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {session.userFeature.feature?.name || t("common.feature")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <button
                        onClick={() => router.push(getRedirectPath())}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                        {getRedirectLabel()}
                        <ArrowRight size={20} className="rtl:scale-[-1]" />
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-foreground border border-border hover:bg-gray-50 rounded-xl font-semibold  transition-colors"
                    >
                        <Home size={20} />
                        {t("actions.backToHome")}
                    </button>
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 text-center"
                >
                    <p className="text-sm text-foreground">{t("successMessage")}</p>
                </motion.div>
            </motion.div>
        </div>
    );
}