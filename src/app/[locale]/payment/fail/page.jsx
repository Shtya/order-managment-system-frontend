"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    XCircle,
    Loader2,
    CreditCard,
    Calendar,
    User,
    Package,
    Wallet,
    ArrowRight,
    Home,
    Crown,
    Zap,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";
import api from "@/utils/api";
import { cn } from "@/utils/cn";

// Payment purpose enum
const PaymentPurpose = {
    WALLET_TOP_UP: "wallet_top_up",
    SUBSCRIPTION_PAYMENT: "subscription_payment",
    FEATURE_PURCHASE: "feature_purchase",
};

export default function PaymentFailPage() {
    const t = useTranslations("paymentFail");
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

    const getRetryLabel = () => {
        if (!session) return t("actions.tryAgain");

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return t("actions.retryWallet");
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return t("actions.retrySubscription");
            case PaymentPurpose.FEATURE_PURCHASE:
                return t("actions.retryFeature");
            default:
                return t("actions.tryAgain");
        }
    };

    const getPurposeIcon = () => {
        if (!session) return <Package size={32} className="text-white" />;

        switch (session.purpose) {
            case PaymentPurpose.WALLET_TOP_UP:
                return <Wallet size={32} className="text-white" />;
            case PaymentPurpose.SUBSCRIPTION_PAYMENT:
                return <Crown size={32} className="text-white" />;
            case PaymentPurpose.FEATURE_PURCHASE:
                return <Zap size={32} className="text-white" />;
            default:
                return <Package size={32} className="text-white" />;
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

    const getStatusLabel = () => {
        if (!session) return t("status.failed");

        switch (session.status) {
            case "failed":
                return t("status.failed");
            case "cancelled":
                return t("status.cancelled");
            case "expired":
                return t("status.expired");
            default:
                return t("status.failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="text-center">
                    <Loader2 size={64} className="animate-spin text-red-600 dark:text-red-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{t("loading")}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-800 p-8 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
                        <XCircle size={48} className="text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t("errors.title")}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    >
                        {t("actions.backToHome")}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                {/* Failure Header */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/50">
                            <XCircle size={56} className="text-white" />
                        </div>
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg"
                        >
                            <AlertTriangle size={24} className="text-white" />
                        </motion.div>
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black text-gray-900 dark:text-white mb-3"
                    >
                        {t("title")}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-600 dark:text-gray-400"
                    >
                        {t("subtitle")}
                    </motion.p>
                </motion.div>

                {/* Payment Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-800 p-8 mb-6 shadow-xl"
                >
                    {/* Purpose Badge */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            {getPurposeIcon()}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("labels.paymentFor")}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{getPurposeLabel()}</p>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-red-300 dark:via-red-700 to-transparent mb-6" />

                    {/* Payment Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <CreditCard size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("labels.amount")}</p>
                                <p className="text-xl font-bold text-red-700 dark:text-red-400">
                                    {session?.amount} {session?.currency || "EGP"}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("labels.status")}</p>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{getStatusLabel()}</p>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("labels.date")}</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <User size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("labels.customer")}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {session.user.fullName || session.user.email}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subscription/Feature Details */}
                    {session?.subscription && (
                        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                    <Crown size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("labels.subscription")}</p>
                                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-2">
                                        {session.subscription.plan?.name || t("common.subscription")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">{t("labels.duration")}:</span>{" "}
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {session.subscription.duration === "monthly"
                                                    ? t("duration.monthly")
                                                    : session.subscription.duration === "yearly"
                                                        ? t("duration.yearly")
                                                        : t("duration.lifetime")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">{t("labels.paymentStatus")}:</span>{" "}
                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                {t("status.paymentFailed")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {session?.userFeature && (
                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    <Zap size={20} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("labels.feature")}</p>
                                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                        {session.userFeature.feature?.name || t("common.feature")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Failure Reasons */}
                    {/* <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                            {t("labels.possibleReasons")}
                        </h3>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
                                {t("reasons.insufficientFunds")}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
                                {t("reasons.cardDeclined")}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
                                {t("reasons.networkIssue")}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
                                {t("reasons.cancelledByUser")}
                            </li>
                        </ul>
                    </div> */}
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
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-red-500/30"
                    >
                        <RefreshCw size={20} />
                        {getRetryLabel()}
                    </button>
                    <button
                        onClick={() => router.push("/orders")}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Home size={20} />
                        {t("actions.backToHome")}
                    </button>
                </motion.div>

                {/* Help Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 text-center"
                >
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("helpMessage")}</p>
                </motion.div>
            </motion.div>
        </div>
    );
}