"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { WhatsAppTemplateFormPage } from "../../add/page";

function normalizeAxiosError(err) {
	const msg =
		err?.response?.data?.message ??
		err?.response?.data?.error ??
		err?.message ??
		"Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export default function EditWhatsAppTemplatePage() {
	const params = useParams();
	const templateId = params?.id;
	const t = useTranslations("whatsApp.templates");
	const [loading, setLoading] = useState(true);
	const [template, setTemplate] = useState(null);

	useEffect(() => {
		if (!templateId) return;
		(async () => {
			setLoading(true);
			try {
				const res = await api.get(`/whatsapp-templates/${templateId}`);
				setTemplate(res.data);
			} catch (e) {
				toast.error(normalizeAxiosError(e));
				setTemplate(null);
			} finally {
				setLoading(false);
			}
		})();
	}, [templateId]);

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-6">
				<Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
				<p className="text-slate-600 dark:text-slate-300">{t("messages.loadingTemplate")}</p>
			</div>
		);
	}

	if (!template) {
		return (
			<div className="min-h-screen flex items-center justify-center p-6">
				<p className="text-lg text-slate-600 dark:text-slate-300">{t("messages.templateNotFound")}</p>
			</div>
		);
	}

	return <WhatsAppTemplateFormPage mode="edit" templateId={String(templateId)} initialTemplate={template} />;
}
