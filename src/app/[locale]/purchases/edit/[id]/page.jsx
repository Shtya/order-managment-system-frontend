"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { PurchaseInvoiceForm } from "../../new/page";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function EditPurchaseInvoicePage() {
    const params = useParams();
    const id = params.id;
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("purchaseInvoice");

    useEffect(() => {
        if (id) {
            api.get(`/purchases/${id}`)
                .then((res) => {
                    setPurchase(res.data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    toast.error(t("messages.fetchPurchaseFailed"));
                    setLoading(false);
                });
        }
    }, [id, t]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!purchase) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                {t("messages.loadDataFailed")}
            </div>
        );
    }

    return <PurchaseInvoiceForm editedPurchase={purchase} />;
}
