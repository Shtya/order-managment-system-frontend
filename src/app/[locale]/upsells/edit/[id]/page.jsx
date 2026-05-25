"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import UpsellsAddPage from "../../add/page";

function normalizeAxiosError(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function UpsellEditPage() {
  const params = useParams();
  const upsellId = params?.id;
  const t = useTranslations("upsells");
  const [loading, setLoading] = useState(true);
  const [upsell, setUpsell] = useState(null);

  useEffect(() => {
    if (!upsellId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/upsells/${upsellId}`);
        setUpsell(res.data);
      } catch (e) {
        toast.error(normalizeAxiosError(e));
        setUpsell(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [upsellId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-slate-600 dark:text-slate-300">{t("messages.loading")}</p>
      </div>
    );
  }

  if (!upsell) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-lg text-slate-600 dark:text-slate-300">{t("messages.notFound")}</p>
      </div>
    );
  }

  return <UpsellsAddPage mode="edit" upsellId={String(upsellId)} initialUpsell={upsell} />;
}