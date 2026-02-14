"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Settings, RefreshCw, Loader2, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import Button_ from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import api, { BASE_URL } from "@/utils/api";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import { getUser } from "@/hook/getUser";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const PROVIDERS = ["easyorder", "shopify", "woocommerce"];

const PROVIDER_META = {
	easyorder: {
		label: "EasyOrder",
		logo: "/integrate/easyorder.png",   // ← swap to your actual logo asset path
		website: "easy-orders.net",
		description: "ربط متجرك مع منصة EasyOrder واستفد من إدارة الطلبات والمزامنة التلقائية بسهولة.",
		bg: "background: #F3F0FF",
	},
	shopify: {
		label: "Shopify",
		logo: "/integrate/shopify.png",
		website: "shopify.com",
		description: "صل متجرك بـ Shopify وأدر منتجاتك وطلباتك من مكان واحد.",
		bg: "background: #F0FFF4",
	},
	woocommerce: {
		label: "WooCommerce",
		logo: "/integrate/woocommerce.png",
		website: "woocommerce.com",
		description: "اربط متجر WooCommerce الخاص بك وأدر كل شيء بطريقة سهلة والأمان أولًا.",
		bg: "background: #FFF0F5",
	},
};

// ─── SyncStatus badge ────────────────────────────────────────────────────────

function SyncBadge({ status, t }) {
	const map = {
		pending: { color: "text-[#F59E0B] bg-[#FFF9F0] dark:bg-[#1A1208] dark:text-[#FBBF24]", Icon: Clock },
		syncing: { color: "text-[#6366f1] bg-[#F3F0FF] dark:bg-[#1A1630] dark:text-[#A78BFA]", Icon: Loader2 },
		synced: { color: "text-[#22C55E] bg-[#F0FFF4] dark:bg-[#0E1A0C] dark:text-[#4ADE80]", Icon: CheckCircle2 },
		failed: { color: "text-[#EF4444] bg-[#FFF0F0] dark:bg-[#1A0C0C] dark:text-[#F87171]", Icon: AlertCircle },
	};

	const entry = map[status] || map.pending;
	const { Icon } = entry;

	return (
		<span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", entry.color)}>
			<Icon size={13} className={status === "syncing" ? "animate-spin" : ""} />
			{t(`syncStatus.${status}`)}
		</span>
	);
}

// ─── StoreCard ───────────────────────────────────────────────────────────────

function StoreCard({ provider, store, t, onConfigure, onSync, fetchStores, index }) {
	const meta = PROVIDER_META[provider];
	const hasStore = !!store;
	const isSyncing = store?.syncStatus === "syncing";
	const [togglingActive, setTogglingActive] = useState(false);

	const handleToggleActive = async () => {
		if (togglingActive) return;
		setTogglingActive(true);
		try {
			await api.patch(`/stores/${store.id}`, { isActive: !store.isActive });
			await fetchStores();
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setTogglingActive(false);
		}
	};


	return (
		<motion.div
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.07 }}
			className="relative rounded-2xl p-5 shadow-sm border border-border"
			style={{ background: meta.bg?.replace("background:", "") }}
		>
			{/* ── Header: title + website left, logo right ── */}
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-semibold text-base">{meta.label}</h3>
					<a
						href={`https://${meta.website}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-primary underline"
					>
						{meta.website}
					</a>
				</div>
				<img
					src={meta.logo}
					alt={meta.label}
					className="w-full max-w-[150px] h-[60px] object-contain"
				/>
			</div>

			{/* ── Description ── */}
			<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
				{meta.description}
			</p>

			{/* ── Sync badge + error row (only when store is connected) ── */}
			{/* {hasStore && (
				<div className="mt-3 flex flex-wrap items-center gap-2">
			
					{store.lastSyncError && (
						<div className="flex items-center gap-1.5 text-xs text-[#EF4444] dark:text-[#F87171] bg-red-50 dark:bg-red-950/40 rounded-lg px-2 py-1">
							<AlertCircle size={12} className="shrink-0" />
							<span className="truncate max-w-[180px]">{store.lastSyncError}</span>
						</div>
					)}
				</div>
			)} */}

			{/* ── Footer: settings btn left  |  switch + sync btn right ── */}
			<div className="mt-5 flex justify-between items-center">
				<button
					onClick={() => onConfigure(provider, store)}
					className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted transition"
				>
					<Settings size={16} />
					{hasStore ? t("card.editSettings") : t("card.configureSettings")}
				</button>

				<div className="flex items-center gap-2">
					{/* Sync button — only visible when store exists AND is active */}
					{hasStore && store.isActive && (
						<button
							onClick={() => onSync(store.id)}
							disabled={isSyncing}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
								isSyncing
									? "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed"
									: "border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800  hover:opacity-90 "
							)}
						>
							<RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
							{t("card.sync")}
						</button>
					)}

					{/* isActive toggle — only visible when store is connected */}
					{hasStore && (
						<div className="flex items-center gap-1.5">
							{togglingActive && <Loader2 size={14} className="animate-spin text-[rgb(var(--primary))]" />}
							<Switch
								checked={store.isActive}
								disabled={togglingActive}
								onCheckedChange={handleToggleActive}
							/>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

// ─── Instruction block (reusable inside dialogs) ────────────────────────────

function InstructionStep({ step, children }) {
	return (
		<div className="flex gap-2.5">
			<div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-[rgb(var(--primary))] flex items-center justify-center text-xs font-bold mt-0.5">
				{step}
			</div>
			<p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{children}</p>
		</div>
	);
}

function CopyableCode({ text }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="flex items-center gap-2 mt-1 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
			<code className="text-xs font-mono text-[rgb(var(--primary))] break-all flex-1">{text}</code>
			<button
				type="button"
				onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
				className="text-xs text-gray-400 hover:text-[rgb(var(--primary))] transition-colors shrink-0"
			>
				{copied ? "✓" : "📋"}
			</button>
		</div>
	);
}

// ─── EasyOrder Dialog ────────────────────────────────────────────────────────

const makeSchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t("validation.nameRequired")),
		code: yup.string().trim().required(t("validation.codeRequired")),
		storeUrl: yup.string().trim().required(t("validation.storeUrlRequired")),
		isActive: yup.boolean().default(true),
		autoSync: yup.boolean().default(true),

		// Secret Validation Logic
		// apiKey: isEdit
		// 	? yup.string().trim().nullable() // Optional on edit
		// 	: yup.string().trim().required(t("validation.apiKeyRequired")), // Required on create

		// webhookCreateSecret: isEdit
		// 	? yup.string().trim().nullable()
		// 	: yup.string().trim().required(t("validation.webhookCreateSecretRequired")),

		// webhookUpdateSecret: isEdit
		// 	? yup.string().trim().nullable()
		// 	: yup.string().trim().required(t("validation.webhookUpdateSecretRequired")),
	}).required();


function EasyOrderDialog({ open, onClose, existingStore, fetchStores, t }) {
	const isEdit = !!existingStore;
	const [fetchingStore, setFetchingStore] = useState(false);
	const user = getUser()
	// ── yup schema memoised on t ──
	const schema = useMemo(() => makeSchema(t), [t]);

	// ── react-hook-form ──
	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { name: "", code: "", storeUrl: "", isActive: true, autoSync: true },
		resolver: yupResolver(schema),
	});

	// ── secrets live in plain state (touched-gate logic, NOT part of RHF validation) ──
	const [apiKey, setApiKey] = useState("");
	const [webhookCreateSecret, setWebhookCreateSecret] = useState("");
	const [webhookUpdateSecret, setWebhookUpdateSecret] = useState("");
	const [touched, setTouched] = useState({ apiKey: false, webhookCreateSecret: false, webhookUpdateSecret: false });
	const [secretErrors, setSecretErrors] = useState({ apiKey: null, webhookCreateSecret: null, webhookUpdateSecret: null });
	const [masks, setMasks] = useState({ apiKey: "", webhookCreateSecret: "", webhookUpdateSecret: "" });

	// ── load / reset when dialog opens ──
	useEffect(() => {
		if (!open) return;

		if (isEdit) {
			(async () => {
				setFetchingStore(true);
				try {
					const res = await api.get(`/stores/${existingStore.id}`);
					const d = res.data;

					// populate RHF fields (base fields only)
					reset({
						name: d.name || "",
						code: d.code || "",
						storeUrl: d.storeUrl || "",
						isActive: d.isActive ?? true,
						autoSync: d.autoSync ?? true,

					});

					// store masked values as placeholders
					const integ = d.integrations || {};
					setMasks({
						apiKey: integ.apiKey || "",
						webhookCreateSecret: integ.webhookCreateOrderSecret || "",
						webhookUpdateSecret: integ.webhookUpdateStatusSecret || "",
					});
				} catch (e) {
					toast.error(normalizeAxiosError(e));
					onClose();
				} finally {
					setFetchingStore(false);
				}
			})();
		} else {
			reset({ name: "", code: "", storeUrl: "", isActive: true, autoSync: true });
			setMasks({ apiKey: "", webhookCreateSecret: "", webhookUpdateSecret: "" });
		}

		// always clear secret inputs + touched on open
		setApiKey(""); setWebhookCreateSecret(""); setWebhookUpdateSecret("");
		setTouched({ apiKey: false, webhookCreateSecret: false, webhookUpdateSecret: false });
	}, [open, isEdit, existingStore?.id]);

	const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

	// ── submit handler — receives already-validated base fields from RHF ──
	const onSubmit = async (data) => {
		// create-mode guard: all three secrets required
		if (!isEdit) {
			let hasError = false;
			if (!apiKey.trim()) {
				setSecretErrors((prev) => ({ ...prev, apiKey: t(`validation.apiKeyRequired`) }))
				hasError = true;
			}
			if (!webhookCreateSecret.trim()) {
				setSecretErrors((prev) => ({ ...prev, webhookCreateSecret: t(`validation.webhookCreateSecretRequired`) }))
				hasError = true;
			}
			if (!webhookUpdateSecret.trim()) {
				setSecretErrors((prev) => ({ ...prev, webhookUpdateSecret: t(`validation.webhookUpdateSecretRequired`) }))
				hasError = true;
			}
			if (hasError) return;
			setSecretErrors({ apiKey: null, webhookCreateSecret: null, webhookUpdateSecret: null })
		}

		try {
			if (isEdit) {
				// only include secret keys the user actually touched
				const integrations = {};
				if (touched.apiKey && apiKey.trim()) integrations.apiKey = apiKey.trim();
				if (touched.webhookCreateSecret && webhookCreateSecret.trim()) integrations.webhookCreateOrderSecret = webhookCreateSecret.trim();
				if (touched.webhookUpdateSecret && webhookUpdateSecret.trim()) integrations.webhookUpdateStatusSecret = webhookUpdateSecret.trim();

				const payload = {
					name: data.name.trim(),
					code: data.code.trim(),
					storeUrl: data.storeUrl.trim(),
					isActive: data.isActive,
					autoSync: data.autoSync,
				};
				if (Object.keys(integrations).length > 0) payload.integrations = integrations;

				const res = await api.patch(`/stores/${existingStore.id}`, payload);

				// ── reset secrets: clear inputs, drop touched, refresh masks from fresh response ──
				setApiKey(""); setWebhookCreateSecret(""); setWebhookUpdateSecret("");
				setTouched({ apiKey: false, webhookCreateSecret: false, webhookUpdateSecret: false });
				const freshInteg = res.data?.integrations || {};
				setMasks({
					apiKey: freshInteg.apiKey || "",
					webhookCreateSecret: freshInteg.webhookCreateOrderSecret || "",
					webhookUpdateSecret: freshInteg.webhookUpdateStatusSecret || "",
				});

				toast.success(t("form.updateSuccess"));
			} else {
				await api.post("/stores", {
					name: data.name.trim(),
					code: data.code.trim(),
					storeUrl: data.storeUrl.trim(),
					provider: "easyorder",
					isActive: data.isActive,
					autoSync: data.autoSync,
					integrations: {
						apiKey: apiKey.trim(),
						webhookCreateOrderSecret: webhookCreateSecret.trim(),
						webhookUpdateStatusSecret: webhookUpdateSecret.trim(),
					},
				});
				toast.success(t("form.createSuccess"));
			}
			onClose();
			await fetchStores()
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	console.log(errors)
	// ── shared input style ──
	const inputCls = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-[rgb(var(--primary))]/20";

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">

				{fetchingStore ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 size={28} className="animate-spin text-[rgb(var(--primary))]" />
					</div>
				) : (
					<>
						{/* header */}
						<div className="flex items-center gap-3 mb-1">
							<div className="w-10 h-10 rounded-xl bg-[#F3F0FF] dark:bg-[#1A1630] flex items-center justify-center text-lg">⚡</div>
							<div>
								<h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
									{isEdit ? t("dialog.editTitle", { provider: "EasyOrder" }) : t("dialog.createTitle", { provider: "EasyOrder" })}
								</h3>
								<p className="text-xs text-gray-500 dark:text-slate-400">{t("dialog.subtitle")}</p>
							</div>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
							{/* ── store info section ── */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.storeInfoSection")}</span>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeName")}</Label>
										<Input {...register("name")} placeholder={t("form.storeNamePlaceholder")} className={inputCls} />
										{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeCode")}</Label>
										<Input {...register("code")} placeholder={t("form.storeCodePlaceholder")} className={inputCls} />
										{errors?.code?.message && <div className="text-xs text-red-600">{errors.code.message}</div>}
									</div>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeUrl")}</Label>
									<Input {...register("storeUrl")} placeholder="https://your-store.com" className={inputCls} />
									{errors?.storeUrl?.message && <div className="text-xs text-red-600">{errors.storeUrl.message}</div>}
								</div>

								<div className="flex items-center gap-6 pt-1">
									<div className="flex items-center gap-2.5">
										{!isEdit && <> <Controller
											control={control}
											name="isActive"
											render={({ field }) => (
												<Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
											)}
										/>
											<Label htmlFor="isActive" className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.activeStore")}</Label></>}
									</div>
									<div className="flex items-center gap-2.5">
										<Controller
											control={control}
											name="autoSync"
											render={({ field }) => (
												<Switch checked={field.value} onCheckedChange={field.onChange} id="autoSync" />
											)}
										/>
										<Label htmlFor="autoSync" className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.autoSync")}</Label>
									</div>
								</div>
							</div>

							{/* ── API Key section ── */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.apiKeySection")}</span>
								</div>

								{/* instructions */}
								<div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-2">
									<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
										<Zap size={13} className="text-[rgb(var(--primary))]" />
										{t("instructions.apiKeyTitle")}
									</p>
									<InstructionStep step={1}>{t("instructions.apiKey1")}</InstructionStep>
									<InstructionStep step={2}>{t("instructions.apiKey2")}</InstructionStep>
									<InstructionStep step={3}>{t("instructions.apiKey3")}</InstructionStep>
									<InstructionStep step={4}>{t("instructions.apiKey4")}</InstructionStep>
									<InstructionStep step={5}>{t("instructions.apiKey5")}</InstructionStep>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.apiKey")}</Label>
									<Input
										value={apiKey}
										placeholder={isEdit ? (masks.apiKey || t("form.maskedPlaceholder")) : t("form.apiKeyPlaceholder")}
										onChange={(e) => { setApiKey(e.target.value); markTouched("apiKey"); }}
										className={inputCls}
									/>
									{secretErrors.apiKey && <div className="text-xs text-red-600">{secretErrors.apiKey}</div>}

								</div>
							</div>

							{/* ── Webhooks section ── */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.webhooksSection")}</span>
								</div>

								<div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-3">
									<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
										<Zap size={13} className="text-[rgb(var(--primary))]" />
										{t("instructions.webhooksTitle")}
									</p>
									<InstructionStep step={1}>{t("instructions.webhook1")}</InstructionStep>
									<InstructionStep step={2}>{t("instructions.webhook2")}</InstructionStep>
									<InstructionStep step={3}>{t("instructions.webhook3")}</InstructionStep>

									{/* create-order webhook URL */}
									<div className="space-y-0.5">
										<p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">{t("instructions.webhookCreateOrderLabel")}</p>
										<CopyableCode
											text={`https://binaural-taryn-unprecipitatively.ngrok-free.dev/webhooks/${String(user?.id).trim()}/easy-order/orders/create`}
										/>
									</div>
									<InstructionStep step={4}>{t("instructions.webhook4")}</InstructionStep>

									{/* update-status webhook URL */}
									<div className="space-y-0.5">
										<p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">{t("instructions.webhookUpdateStatusLabel")}</p>
										<CopyableCode
											text={`https://binaural-taryn-unprecipitatively.ngrok-free.dev/webhooks/${String(user?.id).trim()}/easy-order/orders/status`}
										/>
									</div>
									<InstructionStep step={5}>{t("instructions.webhook5")}</InstructionStep>
								</div>

								{/* secret inputs */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.webhookCreateOrderSecret")}</Label>
										<Input
											value={webhookCreateSecret}
											placeholder={isEdit ? (masks.webhookCreateSecret || t("form.maskedPlaceholder")) : t("form.secretPlaceholder")}
											onChange={(e) => { setWebhookCreateSecret(e.target.value); markTouched("webhookCreateSecret"); }}
											className={inputCls}
										/>
										{secretErrors.webhookCreateSecret && <div className="text-xs text-red-600">{secretErrors.webhookCreateSecret}</div>}
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.webhookUpdateStatusSecret")}</Label>
										<Input
											value={webhookUpdateSecret}
											placeholder={isEdit ? (masks.webhookUpdateSecret || t("form.maskedPlaceholder")) : t("form.secretPlaceholder")}
											onChange={(e) => { setWebhookUpdateSecret(e.target.value); markTouched("webhookUpdateSecret"); }}
											className={inputCls}
										/>
										{secretErrors.webhookUpdateSecret && <div className="text-xs text-red-600">{secretErrors.webhookUpdateSecret}</div>}
									</div>
								</div>
							</div>

							{/* ── footer buttons ── */}
							<div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
								<button type="button" onClick={onClose} disabled={isSubmitting}
									className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
									{t("form.cancel")}
								</button>
								<button type="submit" disabled={isSubmitting}
									className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
									{isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
									{isEdit ? t("form.saveChanges") : t("form.createStore")}
								</button>
							</div>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}


const makeShopifySchema = (t) =>
	yup.object({
		name: yup.string().trim().required(t("validation.nameRequired")),
		code: yup.string().trim().required(t("validation.codeRequired")),
		storeUrl: yup.string().trim().required(t("validation.storeUrlRequired")),
		isActive: yup.boolean().default(true),
		autoSync: yup.boolean().default(true),
	}).required();

function ShopifyDialog({ open, onClose, existingStore, fetchStores, t }) {
	const isEdit = !!existingStore;
	const [fetchingStore, setFetchingStore] = useState(false);
	const user = getUser();

	const schema = useMemo(() => makeShopifySchema(t), [t]);

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { name: "", code: "", storeUrl: "", isActive: true, autoSync: true },
		resolver: yupResolver(schema),
	});

	// ── secrets (clientKey, clientSecret) ──
	const [clientKey, setClientKey] = useState("");
	const [clientSecret, setClientSecret] = useState("");
	const [touched, setTouched] = useState({ clientKey: false, clientSecret: false });
	const [secretErrors, setSecretErrors] = useState({ clientKey: null, clientSecret: null });
	const [masks, setMasks] = useState({ clientKey: "", clientSecret: "" });

	useEffect(() => {
		if (!open) return;

		if (isEdit) {
			(async () => {
				setFetchingStore(true);
				try {
					const res = await api.get(`/stores/${existingStore.id}`);
					const d = res.data;

					reset({
						name: d.name || "",
						code: d.code || "",
						storeUrl: d.storeUrl || "",
						isActive: d.isActive ?? true,
						autoSync: d.autoSync ?? true,
					});

					const integ = d.integrations || {};
					setMasks({
						clientKey: integ.clientKey || "",
						clientSecret: integ.clientSecret || "",
					});
				} catch (e) {
					toast.error(normalizeAxiosError(e));
					onClose();
				} finally {
					setFetchingStore(false);
				}
			})();
		} else {
			reset({ name: "", code: "", storeUrl: "", isActive: true, autoSync: true });
			setMasks({ clientKey: "", clientSecret: "" });
		}

		setClientKey(""); setClientSecret("");
		setTouched({ clientKey: false, clientSecret: false });
	}, [open, isEdit, existingStore?.id]);

	const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

	const onSubmit = async (data) => {
		// create-mode guard: both secrets required
		if (!isEdit) {
			let hasError = false;
			if (!clientKey.trim()) {
				setSecretErrors((prev) => ({ ...prev, clientKey: t("validation.clientKeyRequired") }));
				hasError = true;
			}
			if (!clientSecret.trim()) {
				setSecretErrors((prev) => ({ ...prev, clientSecret: t("validation.clientSecretRequired") }));
				hasError = true;
			}
			if (hasError) return;
			setSecretErrors({ clientKey: null, clientSecret: null });
		}

		try {
			if (isEdit) {
				const integrations = {};
				if (touched.clientKey && clientKey.trim()) integrations.clientKey = clientKey.trim();
				if (touched.clientSecret && clientSecret.trim()) integrations.clientSecret = clientSecret.trim();

				const payload = {
					name: data.name.trim(),
					code: data.code.trim(),
					storeUrl: data.storeUrl.trim(),
					isActive: data.isActive,
					autoSync: data.autoSync,
				};
				if (Object.keys(integrations).length > 0) payload.integrations = integrations;

				const res = await api.patch(`/stores/${existingStore.id}`, payload);

				setClientKey(""); setClientSecret("");
				setTouched({ clientKey: false, clientSecret: false });
				const freshInteg = res.data?.integrations || {};
				setMasks({
					clientKey: freshInteg.clientKey || "",
					clientSecret: freshInteg.clientSecret || "",
				});

				toast.success(t("form.updateSuccess"));
			} else {
				await api.post("/stores", {
					name: data.name.trim(),
					code: data.code.trim(),
					storeUrl: data.storeUrl.trim(),
					provider: "shopify",
					isActive: data.isActive,
					autoSync: data.autoSync,
					integrations: {
						clientKey: clientKey.trim(),
						clientSecret: clientSecret.trim(),
					},
				});
				toast.success(t("form.createSuccess"));
			}
			onClose();
			await fetchStores();
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	const inputCls = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-[rgb(var(--primary))]/20";

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="!max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
				{fetchingStore ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 size={28} className="animate-spin text-[rgb(var(--primary))]" />
					</div>
				) : (
					<>
						<div className="flex items-center gap-3 mb-1">
							<div className="w-10 h-10 rounded-xl bg-[#F0FFF4] dark:bg-[#0E1A0C] flex items-center justify-center text-lg">🛍️</div>
							<div>
								<h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
									{isEdit ? t("dialog.editTitle", { provider: "Shopify" }) : t("dialog.createTitle", { provider: "Shopify" })}
								</h3>
								<p className="text-xs text-gray-500 dark:text-slate-400">{t("dialog.subtitle")}</p>
							</div>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
							{/* ── store info section ── */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.storeInfoSection")}</span>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeName")}</Label>
										<Input {...register("name")} placeholder={t("form.storeNamePlaceholder")} className={inputCls} />
										{errors?.name?.message && <div className="text-xs text-red-600">{errors.name.message}</div>}
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeCode")}</Label>
										<Input {...register("code")} placeholder={t("form.storeCodePlaceholder")} className={inputCls} />
										{errors?.code?.message && <div className="text-xs text-red-600">{errors.code.message}</div>}
									</div>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.storeUrl")}</Label>
									<Input {...register("storeUrl")} placeholder="https://your-store.myshopify.com" className={inputCls} />
									{errors?.storeUrl?.message && <div className="text-xs text-red-600">{errors.storeUrl.message}</div>}
								</div>

								<div className="flex items-center gap-6 pt-1">
									<div className="flex items-center gap-2.5">
										{!isEdit && (
											<>
												<Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive-shopify" />} />
												<Label htmlFor="isActive-shopify" className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.activeStore")}</Label>
											</>
										)}
									</div>
									<div className="flex items-center gap-2.5">
										<Controller control={control} name="autoSync" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="autoSync-shopify" />} />
										<Label htmlFor="autoSync-shopify" className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.autoSync")}</Label>
									</div>
								</div>
							</div>

							{/* ── Credentials section ── */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.shopifyCredentialsSection")}</span>
								</div>

								{/* instructions */}
								<div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-2">
									<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
										<Zap size={13} className="text-[rgb(var(--primary))]" />
										{t("instructions.shopifyTitle")}
									</p>
									<InstructionStep step={1}>{t("instructions.shopify1")}</InstructionStep>
									<InstructionStep step={2}>{t("instructions.shopify2")}</InstructionStep>
									<InstructionStep step={3}>{t("instructions.shopify3")}</InstructionStep>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.clientKey")}</Label>
										<Input
											value={clientKey}
											placeholder={isEdit ? (masks.clientKey || t("form.maskedPlaceholder")) : t("form.clientKeyPlaceholder")}
											onChange={(e) => { setClientKey(e.target.value); markTouched("clientKey"); }}
											className={inputCls}
										/>
										{secretErrors.clientKey && <div className="text-xs text-red-600">{secretErrors.clientKey}</div>}
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t("form.clientSecret")}</Label>
										<Input
											value={clientSecret}
											placeholder={isEdit ? (masks.clientSecret || t("form.maskedPlaceholder")) : t("form.clientSecretPlaceholder")}
											onChange={(e) => { setClientSecret(e.target.value); markTouched("clientSecret"); }}
											className={inputCls}
										/>
										{secretErrors.clientSecret && <div className="text-xs text-red-600">{secretErrors.clientSecret}</div>}
									</div>
								</div>
							</div>

							{/* ── Redirect URL section ── */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t("form.shopifyRedirectSection")}</span>
								</div>

								<div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-3">
									<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
										<AlertCircle size={13} className="text-[rgb(var(--primary))]" />
										{t("instructions.shopifyRedirectTitle")}
									</p>
									<p className="text-xs text-gray-600 dark:text-slate-300">{t("instructions.shopifyRedirect1")}</p>
									<CopyableCode text={`https://binaural-taryn-unprecipitatively.ngrok-free.dev/webhooks/${String(user?.id).trim()}/shopify/redirect`} />
								</div>
							</div>

							{/* ── footer buttons ── */}
							<div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
								<button type="button" onClick={onClose} disabled={isSubmitting}
									className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
									{t("form.cancel")}
								</button>
								<button type="submit" disabled={isSubmitting}
									className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
									{isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
									{isEdit ? t("form.saveChanges") : t("form.createStore")}
								</button>
							</div>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ─── Shopify / WooCommerce mock dialogs ──────────────────────────────────────

function MockProviderDialog({ open, onClose, provider, existingStore, fetchStores, t }) {
	const meta = PROVIDER_META[provider];
	const isEdit = !!existingStore;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
				<div className="flex items-center gap-3 mb-4">
					<div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg", meta.bg)}>{meta.icon}</div>
					<div>
						<h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
							{isEdit ? t("dialog.editTitle", { provider: meta.label }) : t("dialog.createTitle", { provider: meta.label })}
						</h3>
						<p className="text-xs text-gray-500 dark:text-slate-400">{t("dialog.subtitle")}</p>
					</div>
				</div>

				<div className="bg-amber-50 dark:bg-[#2A2310] border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-2.5">
					<AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t("mock.comingSoonTitle")}</p>
						<p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t("mock.comingSoonDesc", { provider: meta.label })}</p>
					</div>
				</div>

				<div className="mt-5 flex justify-end">
					<button type="button" onClick={onClose}
						className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
						{t("form.close")}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Delete confirmation ─────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, store, onConfirm, loading, t }) {
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="!max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
				<div className="space-y-2">
					<h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{t("delete.title")}</h3>
					<p className="text-sm text-gray-500 dark:text-slate-400">{t("delete.desc", { name: store?.name || "" })}</p>
				</div>
				<div className="mt-6 flex items-center justify-end gap-2">
					<button type="button" onClick={onClose} disabled={loading}
						className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
						{t("form.cancel")}
					</button>
					<button type="button" onClick={onConfirm} disabled={loading}
						className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60">
						{loading ? <Loader2 size={15} className="animate-spin" /> : null}
						{t("delete.confirm")}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StoresIntegrationPage() {
	const t = useTranslations("storeIntegration");
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const errorType = searchParams.get('error');
		const shop = searchParams.get('shop');

		if (errorType) {
			let messageKey;

			// Determine which localization key to use
			switch (errorType) {
				case 'shopify_invalid_session':
				case 'shopify_store_not_found':
				case 'shopify_security_verification_failed':
					messageKey = `errors.${errorType}`;
					break;
				default:
					// Fallback for any unknown error codes
					messageKey = 'errors.system_error';
					break;
			}

			// 1. Get and show localized message
			const message = t(messageKey, { shop: shop || '' });
			toast.error(message);
			// 2. Clear the URL parameters without reloading the page
			// This removes '?error=...&shop=...' from the address bar
			const params = new URLSearchParams(searchParams.toString());
			params.delete('error');
			params.delete('shop');

			const queryString = params.toString();
			const cleanUrl = queryString ? `${pathname}?${queryString}` : pathname;

			router.replace(cleanUrl, { scroll: false });
		}
	}, [searchParams, pathname, router, t]);

	// stores fetched from backend — keyed by provider
	const [storesByProvider, setStoresByProvider] = useState({});
	const [pageLoading, setPageLoading] = useState(true);

	// dialog state
	const [dialogProvider, setDialogProvider] = useState(null); // "easyorder" | "shopify" | "woocommerce" | null
	const [dialogStore, setDialogStore] = useState(null); // existing StoreEntity or null (create mode)

	// delete
	const [deleteStore, setDeleteStore] = useState(null);
	const [deleting, setDeleting] = useState(false);

	// ── fetch all stores and bucket by provider ──
	const fetchStores = useCallback(async () => {
		setPageLoading(true);
		try {
			const res = await api.get("/stores", { params: { limit: 50 } });
			const records = res.data?.records ?? res.data ?? [];
			const map = {};
			records.forEach((s) => { map[s.provider] = s; });
			setStoresByProvider(map);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setPageLoading(false);
		}
	}, []);

	useEffect(() => { fetchStores(); }, [fetchStores]);

	// ── open configure / edit dialog ──
	const handleConfigure = (provider, store) => {
		setDialogProvider(provider);
		setDialogStore(store || null);
	};

	const handleDialogClose = () => {
		setDialogProvider(null);
		setDialogStore(null);
	};

	// ── manual sync ──
	const handleSync = async (storeId) => {
		try {
			await api.post(`/stores/${storeId}/sync`);
			toast.success(t("sync.queued"));
			// small delay then refetch to reflect "syncing" status
			setTimeout(fetchStores, 800);
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};

	// ── delete ──
	const handleDeleteConfirm = async () => {
		if (!deleteStore) return;
		setDeleting(true);
		try {
			await api.delete(`/stores/${deleteStore.id}`);
			toast.success(t("delete.success"));
			setDeleteStore(null);
			fetchStores();
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setDeleting(false);
		}
	};

	// ── render ──
	return (
		<div className="min-h-screen p-6">
			{/* breadcrumb header */}
			<div className="bg-card flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<span className="text-gray-400">{t("breadcrumb.home")}</span>
						<ChevronLeft className="text-gray-400" size={18} />
						<span className="text-[rgb(var(--primary))]">{t("breadcrumb.integrations")}</span>
						<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-primary" />
					</div>

					<div className="flex items-center gap-4">
						<Button_
							size="sm"
							label={t("actions.howToUse")}
							tone="white"
							variant="solid"
							icon={
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M18.3848 5.7832C18.2851 5.41218 18.0898 5.07384 17.8184 4.80202C17.5469 4.53021 17.2088 4.33446 16.8379 4.23438C15.4727 3.86719 10 3.86719 10 3.86719C10 3.86719 4.52734 3.86719 3.16211 4.23242C2.79106 4.33219 2.45278 4.52782 2.18126 4.79969C1.90974 5.07155 1.71453 5.41007 1.61523 5.78125C1.25 7.14844 1.25 10 1.25 10C1.25 10 1.25 12.8516 1.61523 14.2168C1.81641 14.9707 2.41016 15.5645 3.16211 15.7656C4.52734 16.1328 10 16.1328 10 16.1328C10 16.1328 15.4727 16.1328 16.8379 15.7656C17.5918 15.5645 18.1836 14.9707 18.3848 14.2168C18.75 12.8516 18.75 10 18.75 10C18.75 10 18.75 7.14844 18.3848 5.7832ZM8.26172 12.6172V7.38281L12.793 9.98047L8.26172 12.6172Z"
										fill="#A7A7A7"
									/>
								</svg>
							}
						/>
					</div>
				</div>
			</div>

			{/* ── store cards grid ── */}
			{pageLoading ? (
				<div className="flex items-center justify-center py-24">
					<Loader2 size={32} className="animate-spin text-[rgb(var(--primary))]" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{PROVIDERS.map((provider, idx) => (
						<StoreCard
							key={provider}
							provider={provider}
							store={storesByProvider[provider] || null}
							t={t}
							index={idx}
							onConfigure={handleConfigure}
							onSync={handleSync}
							fetchStores={fetchStores}
						/>
					))}
				</div>
			)}

			{/* ── dialogs ── */}
			{/* EasyOrder */}
			<EasyOrderDialog
				open={dialogProvider === "easyorder"}
				onClose={handleDialogClose}
				existingStore={dialogStore}
				fetchStores={fetchStores}
				t={t}
			/>

			{/* Shopify */}
			<ShopifyDialog
				open={dialogProvider === "shopify"}
				onClose={handleDialogClose}
				existingStore={dialogStore}
				fetchStores={fetchStores}
				t={t}
			/>

			{/* WooCommerce (mock) */}
			<MockProviderDialog
				open={dialogProvider === "woocommerce"}
				onClose={handleDialogClose}
				provider="woocommerce"
				existingStore={dialogStore}
				fetchStores={fetchStores}
				t={t}
			/>

			{/* Delete confirmation */}
			<DeleteConfirmDialog
				open={!!deleteStore}
				onClose={() => setDeleteStore(null)}
				store={deleteStore}
				loading={deleting}
				onConfirm={handleDeleteConfirm}
				t={t}
			/>
		</div>
	);
}