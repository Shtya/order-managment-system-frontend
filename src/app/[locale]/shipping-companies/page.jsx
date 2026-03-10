// --- File: page.jsx ---
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Settings2,
	HelpCircle,
	BarChart3,
	X,
	Check,
	AlertCircle,
	ExternalLink,
	Eye,
	EyeOff,
	Loader2,
	Zap,
	Shield,
	Globe,
	Package,
	TrendingUp,
	Info,
	KeyRound,
	ImageIcon,
	Webhook,
	Copy,
	RotateCcw,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { normalizeAxiosError } from "@/utils/axios";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import PageHeader from "@/components/atoms/Pageheader";
import { PROVIDER_META, useShippingIntegration, useShippingSettings, useShippingUsage, useShippingWebhook } from "@/hook/shipping";


function pick(bilingualObj, locale) {
	if (!bilingualObj) return "";
	return locale?.startsWith("ar") ? bilingualObj.ar : bilingualObj.en;
}

function CapBadge({ available, label }) {
	return (
		<span
			className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${available
				? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400"
				: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]"
				}`}
		>
			{available ? <Check size={9} /> : <X size={9} />}
			{label}
		</span>
	);
}

function SectionLabel({ icon: Icon, label }) {
	return (
		<p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-1.5">
			{Icon && <Icon size={11} />}
			{label}
		</p>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Modal  — per-provider config fields
// ─────────────────────────────────────────────────────────────────────────────
function SettingsModal({ company, onClose, onFirstSetup, onSaved }) {
	const t = useTranslations("shipping");
	const {
		fields, values, setValue, handleSave, isFormValid,
		loading, saving, error, success,
		showFields, toggleShow, integrationData, meta
	} = useShippingSettings(company?.code, { onClose, onFirstSetup, onSaved });

	return (
		<ModalShell onClose={onClose}>
			<ModalHeader icon={Settings2} title={t("settings.title", { name: company.name })} subtitle={t("settings.subtitle")} onClose={onClose} />

			<div className="p-6 space-y-5">
				<div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border border-[var(--border)] flex-shrink-0"
						style={{ background: company.bg }}
					>
						<img src={company.logo} alt={company.name} className="w-6 h-6 object-contain" onError={(e) => (e.target.style.display = "none")} />
					</div>
					<div>
						<p className="text-sm font-semibold text-[var(--card-foreground)]">{company.name}</p>
						<p className="text-xs text-[var(--muted-foreground)]">{company.website}</p>
					</div>
				</div>

				{loading && (
					<div className="flex items-center justify-center py-8 text-[var(--muted-foreground)]">
						<Loader2 size={22} className="animate-spin" />
					</div>
				)}

				{integrationData && (<div className="space-y-4">
					{fields.map((field) => {
						const currentSavedValue = field?.hide ? integrationData?.credentials?.[field.key] : null;
						return (
							<div key={field.key} className="space-y-1.5">
								<label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-1.5">
									<KeyRound size={12} className="text-[var(--muted-foreground)]" />
									{t(field.labelKey)}
									{field.required && <span className="text-[var(--primary)] text-xs">*</span>}
								</label>
								<div className="relative">
									<input
										type={field.type === "password" ? (showFields[field.key] ? "text" : "password") : "text"}
										value={values[field.key]}
										onChange={(e) => setValue(field.key, e.target.value)}
										placeholder={currentSavedValue || t(`settings.placeholders.${field.key}`, { fallback: `${t(field.labelKey)}…` })}
										className={`w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] ${currentSavedValue && "placeholder:text-gray-950"} dark:placeholder:text-gray-100 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all`}
										style={{ paddingRight: field.type === "password" ? "2.5rem" : undefined }}
									/>
									{field.type === "password" && (
										<button
											type="button"
											onClick={() => toggleShow(field.key)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
										>
											{showFields[field.key] ? <EyeOff size={15} /> : <Eye size={15} />}
										</button>
									)}
								</div>
							</div>
						)
					})}
				</div>)}

				{error && (
					<div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
						<AlertCircle size={14} />
						{error}
					</div>
				)}
				<p className="text-[11px] text-[var(--muted-foreground)]">{t("settings.securityNote")}</p>
				{/* {success && (
					<div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
						<Check size={14} className="flex-shrink-0" />
						{t("settings.success")}
					</div>
				)} */}

				<PrimaryBtn onClick={handleSave} disabled={!isFormValid()} loading={saving} className="w-full">
					{!saving && <Check size={14} />}
					{saving ? t("settings.saving") : t("settings.save")}
				</PrimaryBtn>
			</div>
		</ModalShell>
	);
}

// -----------------------
// Guide Modal
// -----------------------
function GuideModal({ company, onClose }) {
	const t = useTranslations("shipping");
	const locale = useLocale();

	const meta = PROVIDER_META[company.code];
	const steps = meta?.guide?.steps || [];
	const [activeStep, setActiveStep] = useState(0);
	const current = steps[activeStep];
	const p = (obj) => pick(obj, locale);

	return (
		<ModalShell onClose={onClose} maxWidth="max-w-xl">
			<ModalHeader icon={HelpCircle} title={t("guide.title")} subtitle={t("guide.subtitle", { name: company.name })} onClose={onClose} />

			<div className="flex flex-col">
				<div className="flex border-b border-[var(--border)] px-6 gap-1 pt-3 overflow-x-auto scrollbar-none">
					{steps.map((step, i) => (
						<button
							key={i}
							onClick={() => setActiveStep(i)}
							className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${activeStep === i
								? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
								: "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
								}`}
						>
							<span
								className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
								style={{
									background: activeStep === i ? `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))` : "var(--muted)",
									color: activeStep === i ? "white" : "var(--muted-foreground)",
								}}
							>
								{i + 1}
							</span>
							{p(step.tab)}
						</button>
					))}
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={activeStep}
						initial={{ opacity: 0, x: locale?.startsWith("ar") ? -12 : 12 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: locale?.startsWith("ar") ? 12 : -12 }}
						transition={{ duration: 0.2 }}
						className="p-6 space-y-4"
					>
						<div className="flex items-start gap-3">
							<span
								className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5"
								style={{ background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))` }}
							>
								{activeStep + 1}
							</span>
							<div>
								<p className="text-sm font-semibold text-[var(--card-foreground)]">{p(current?.title)}</p>
								<p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-1">{p(current?.desc)}</p>
							</div>
						</div>

						{current?.image && (
							<div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative">
								<img
									src={current.image}
									alt={p(current.title)}
									className="w-full h-auto object-cover block max-h-[270px]"
									onError={(e) => {
										e.currentTarget.style.display = "none";
										e.currentTarget.nextElementSibling?.style.setProperty("display", "flex");
									}}
								/>
								<div style={{ display: "none" }} className="h-44 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
									<ImageIcon size={28} className="opacity-30" />
									<p className="text-xs">{t("guide.imagePlaceholder")}</p>
								</div>
							</div>
						)}

						{current?.tip && p(current.tip) && (
							<div className="flex gap-2.5 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
								<Info size={14} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
								<p className="text-xs text-[var(--foreground)] leading-relaxed">{p(current.tip)}</p>
							</div>
						)}
					</motion.div>
				</AnimatePresence>

				<div className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between gap-3">
					<GhostBtn onClick={() => setActiveStep((v) => Math.max(0, v - 1))} className={activeStep === 0 ? "opacity-30 pointer-events-none" : ""}>
						<ChevronLeft size={14} className={"rtl:-rotate-180 rtl:transition-transform  ltr:transition-transform"} /> {t("guide.prev")}
					</GhostBtn>

					<div className="flex items-center gap-1.5">
						{steps.map((_, i) => (
							<button
								key={i}
								onClick={() => setActiveStep(i)}
								className="rounded-full transition-all duration-200"
								style={{
									width: i === activeStep ? "16px" : "6px",
									height: "6px",
									background: i === activeStep ? `rgb(var(--primary-from))` : "var(--border)",
								}}
							/>
						))}
					</div>

					{activeStep < steps.length - 1 ? (
						<PrimaryBtn onClick={() => setActiveStep((v) => Math.min(steps.length - 1, v + 1))}>
							{t("guide.next")}<ChevronRight
								size={14}
								className={"rtl:rotate-180 rtl:transition-transform  ltr:transition-transform"}
							/>
						</PrimaryBtn>
					) : meta?.guide?.docsUrl ? (
						<a href={meta?.guide?.docsUrl} target="_blank" rel="noopener noreferrer">
							<PrimaryBtn onClick={undefined}>
								<ExternalLink size={13} /> {t("guide.docs")}
							</PrimaryBtn>
						</a>
					) : meta?.guide?.mainUrl ? (
						<a href={meta?.guide?.mainUrl} target="_blank" rel="noopener noreferrer">
							<PrimaryBtn onClick={undefined}>
								<ExternalLink size={13} /> {t("guide.site")}
							</PrimaryBtn>
						</a>
					) : null}
				</div>
			</div>
		</ModalShell>
	);
}

// -----------------------
// Usage Modal (unchanged)
// -----------------------
function UsageModal({ company, onClose }) {
	const t = useTranslations("shipping");
	const { capabilities, services, loading, error } = useShippingUsage(company.code);

	return (
		<ModalShell onClose={onClose} maxWidth="max-w-lg">
			<ModalHeader icon={BarChart3} title={t("usage.title", { name: company.name })} subtitle={t("usage.subtitle")} onClose={onClose} />
			<div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
				{loading && (
					<div className="flex items-center justify-center py-10 text-[var(--muted-foreground)]">
						<Loader2 size={22} className="animate-spin" />
					</div>
				)}
				{error && (
					<div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
						<AlertCircle size={14} />
						{error}
					</div>
				)}

				{services?.length > 0 && (
					<div className="space-y-2.5">
						<SectionLabel icon={Zap} label={t("usage.services")} />
						<div className="flex flex-wrap gap-2">
							{services.map((s) => (
								<span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)]">
									{s}
								</span>
							))}
						</div>
					</div>
				)}

				{capabilities && (
					<div className="space-y-2.5">
						<SectionLabel icon={Globe} label={t("usage.capabilities")} />
						<div className="grid grid-cols-2 gap-3">
							{[
								{ key: "coverage", label: t("usage.coverage"), icon: Globe },
								{ key: "pricing", label: t("usage.pricing"), icon: TrendingUp },
								{ key: "limits", label: t("usage.limits"), icon: Shield },
								{ key: "quote", label: t("usage.quote"), icon: Package },
							].map(({ key, label, icon: Icon }) => {
								const cap = capabilities[key];
								return (
									<div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 space-y-2">
										<div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
											<Icon size={11} />
											{label}
										</div>
										<CapBadge available={cap?.available} label={cap?.available ? t("usage.available") : t("usage.unavailable")} />
										{!cap?.available && cap?.reason && (
											<p className="text-[10px] text-[var(--muted-foreground)] opacity-70 leading-snug">{cap.reason}</p>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{capabilities?.services?.available && capabilities.services.data?.length > 0 && (
					<div className="space-y-2.5">
						<SectionLabel icon={Info} label={t("usage.operations")} />
						<div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 space-y-2">
							{capabilities.services.data.map((s) => (
								<div key={s} className="flex items-center gap-2 text-xs text-[var(--card-foreground)]">
									<Check size={11} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
									{s}
								</div>
							))}
						</div>
					</div>
				)}

			</div>
		</ModalShell>
	);
}

// -----------------------
// Webhook Setup Modal
// -----------------------
function WebhookModal({ company, onClose }) {
	const t = useTranslations("shipping");
	const {
		data,
		loading,
		error,
		rotating,
		isFieldHidden,
		handleCopy,
		handleRotateSecret
	} = useShippingWebhook(company.code);

	return (
		<ModalShell onClose={onClose} maxWidth="max-w-lg">
			<ModalHeader
				icon={Webhook}
				title={t("webhook.title")}
				subtitle={t("webhook.subtitle")}
				onClose={onClose}
			/>

			<div className="p-6 space-y-5">
				<div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
					<p className="text-sm font-semibold text-[var(--card-foreground)] mb-1">
						{t("webhook.triggerTitle")}
					</p>
					<p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
						{t("webhook.triggerDescription")}
					</p>
				</div>

				{loading && (
					<div className="flex items-center justify-center py-8 text-[var(--muted-foreground)]">
						<Loader2 size={22} className="animate-spin" />
					</div>
				)}

				{data && (
					<div className="space-y-4">
						{!isFieldHidden("webhookUrl") && (<div className="space-y-1.5">
							<label className="text-sm font-medium text-[var(--card-foreground)]">{t("webhook.urlLabel")}</label>
							<div className="flex gap-2">
								<input
									readOnly
									value={data.webhookUrl || ""}
									className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
								/>
								<button
									onClick={() => handleCopy(data.webhookUrl)}
									className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
									title="Copy"
								>
									<Copy size={14} />
								</button>
							</div>
							<p className="text-[11px] text-[var(--muted-foreground)]">
								{t("webhook.urlHint")}
							</p>
						</div>)}

						<div className={`grid gap-3 ${isFieldHidden("headerName") || isFieldHidden("headerValue") ? "grid-cols-1" : "md:grid-cols-2 grid-cols-1"}`}>
							{!isFieldHidden("headerName") && (<div className="space-y-1.5">
								<label className="text-sm font-medium text-[var(--card-foreground)]">{t("webhook.headerName")}</label>
								<div className="flex gap-2">
									<input
										readOnly
										value={data.headerName || ""}
										className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
									/>
									<button
										onClick={() => handleCopy(data.headerName)}
										className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
										title="Copy"
									>
										<Copy size={14} />
									</button>
								</div>
							</div>)}

							{!isFieldHidden("headerValue") && (<div className="space-y-1.5">
								<label className="text-sm font-medium text-[var(--card-foreground)]">{t("webhook.headerValue")}</label>
								<div className="flex gap-2">
									<input
										readOnly
										value={data.headerValue || ""}
										className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
									/>
									<button
										onClick={() => handleCopy(data.headerValue)}
										className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
										title="Copy"
									>
										<Copy size={14} />
									</button>
								</div>
							</div>)}
						</div>

						<div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
							<p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
								{t("webhook.securityHint")}
							</p>
							<button
								onClick={handleRotateSecret}
								disabled={rotating}
								className="flex items-center gap-2 text-nowrap px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all disabled:opacity-50"
							>
								{rotating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
								<span className="text-xs font-semibold">{t("webhook.rotate")}</span>
							</button>
						</div>
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
						<AlertCircle size={14} />
						{error}
					</div>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<GhostBtn onClick={onClose}>{t("webhook.close")}</GhostBtn>
					<a href="https://docs.bosta.co/docs/how-to/get-delivery-status-via-webhook/" target="_blank" rel="noopener noreferrer">
						<PrimaryBtn>
							<ExternalLink size={14} /> {t("webhook.docs")}
						</PrimaryBtn>
					</a>
				</div>
			</div>
		</ModalShell>
	);
}

// -----------------------
// Skeleton card
// -----------------------
function SkeletonCard() {
	return (
		<div className="rounded-xl border border-[var(--border)] overflow-hidden animate-pulse bg-[var(--muted)]">
			<div className="p-5 space-y-4">
				<div className="flex items-start justify-between">
					<div className="w-14 h-14 rounded-xl bg-[var(--border)]" />
					<div className="w-11 h-6 rounded-full bg-[var(--border)]" />
				</div>
				<div className="space-y-1.5">
					<div className="h-4 w-28 rounded bg-[var(--border)]" />
					<div className="h-2.5 w-20 rounded bg-[var(--border)]" />
				</div>
				<div className="space-y-1.5">
					<div className="h-2 w-full rounded bg-[var(--border)]" />
					<div className="h-2 w-4/5 rounded bg-[var(--border)]" />
				</div>
			</div>
			<div className="border-t border-[var(--border)] px-4 py-3 flex gap-2">
				<div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
				<div className="h-7 w-20 rounded-xl bg-[var(--border)]" />
				<div className="h-7 w-16 rounded-xl bg-[var(--border)] ml-auto" />
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// IntegratedCompanyCard
// ★ ONLY the JSX returned here was changed.
//   handleToggle and all other logic are 100% identical to the original.
// ─────────────────────────────────────────────────────────────────────────────
function IntegratedCompanyCard({ company, integrationStatus, onRefreshStatus }) {
	const t = useTranslations("shipping");
	const {
		meta,
		isActive,
		isConfigured,
		toggling,
		openModal,
		setOpenModal,
		handleToggle
	} = useShippingIntegration(company, integrationStatus, onRefreshStatus);
	// accent shortcuts from the three new company tokens
	const accent = company.accent;
	const accentBg = company.accentBg;

	// shared footer ghost-button; hover tints border+text to accent
	const fbCls = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 text-gray-600 dark:text-gray-300 shadow-sm";
	const onEnter = (e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; };
	const onLeave = (e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; };

	return (
		<>
			<motion.div
				whileHover={{ y: -3, boxShadow: "0 20px 48px 0 rgba(0,0,0,0.11)" }}
				transition={{ type: "spring", stiffness: 300, damping: 22 }}
				className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col"
				style={{ background: company.bg }}
			>
				{/* per-provider accent strip at top */}
				<span
					className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
					style={{ height: 3, background: company.strip, borderRadius: "16px 16px 0 0" }}
				/>

				{/* Body */}
				<div className="pt-6 px-5 pb-4 flex flex-col gap-3 flex-1">

					{/* Header */}
					<div className="flex items-start justify-between gap-2">

						{/* Logo + identity */}
						<div className="flex items-center gap-3">
							<div
								className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
								style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
							>
								<img
									src={company.logo}
									alt={company.name}
									className="w-7 h-7 object-contain"
									onError={(e) => (e.target.style.display = "none")}
								/>
							</div>

							<div>
								<h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
									{company.name}
								</h3>
								<a
									href={`https://${company.website}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-0.5 mt-0.5 transition-opacity hover:opacity-60"
									style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", textDecoration: "none" }}
								>
									{company.website}
									<ExternalLink size={8} />
								</a>
							</div>
						</div>

						{/* Toggle */}
						<div className="flex flex-col items-end gap-1 flex-shrink-0">
							<button
								onClick={isConfigured ? () => handleToggle() : () => setOpenModal("settings")}
								disabled={toggling}
								title={!isConfigured ? t("card.configureFirst") : isActive ? t("card.disable") : t("card.enable")}
								className="relative rounded-full transition-all duration-300 focus:outline-none"
								style={{
									width: 40, height: 22,
									background: isActive && isConfigured ? accent : "rgba(0,0,0,0.13)",
									border: "none",
									opacity: toggling ? 0.7 : 1,
									cursor: toggling ? "not-allowed" : "pointer",
								}}
							>
								<span
									className="absolute rounded-full bg-white transition-all duration-300 flex items-center justify-center"
									style={{
										top: 3, width: 16, height: 16,
										left: isActive && isConfigured ? "calc(100% - 19px)" : 3,
										boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
									}}
								>
									{toggling && (
										<svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" style={{ color: accent }}>
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
									)}
								</span>
							</button>
							<span
								className="font-semibold uppercase tracking-wide transition-colors duration-300"
								style={{ fontSize: 9, color: isActive && isConfigured ? accent : "rgba(0,0,0,0.3)" }}
							>
								{toggling ? t("card.updating") : (isActive && isConfigured ? t("card.active") : t("card.inactive"))}
							</span>
						</div>
					</div>

					{/* Description */}
					<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
						{company.description}
					</p>

					{/* Status badge — configured keeps emerald; not-configured uses provider accent */}
					{isConfigured ? (
						<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
							{t("card.configured")}
						</span>
					) : (
						<span
							className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
							style={{ color: accent, background: accentBg, border: `1px solid ${accent}30` }}
						>
							<span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
							{t("card.notConfigured")}
						</span>
					)}
				</div>

				{/* Footer */}
				<div
					className="px-4 py-3 flex items-center gap-1.5 flex-wrap"
					style={{
						background: "rgba(255,255,255,0.55)",
						backdropFilter: "blur(6px)",
						borderTop: "1px solid rgba(255,255,255,0.5)",
					}}
				>
					{/* Settings */}
					<button
						onClick={() => setOpenModal("settings")}
						title={t("card.settingsTitle")}
						className={fbCls}
						onMouseEnter={onEnter}
						onMouseLeave={onLeave}
					>
						<Settings2 size={12} />
						{t("card.settings")}
					</button>

					{/* Guide — internal steps or external docs */}
					{meta?.guide?.showSteps ? (
						<button
							onClick={() => isConfigured && setOpenModal("guide")}
							title={t("card.guideTitle")}
							className={`cursor-pointer ${fbCls}`}
							onMouseEnter={onEnter}
							onMouseLeave={onLeave}
						>
							<HelpCircle size={12} />
							{t("card.guide")}
						</button>
					) : (
						<a
							href={meta.guide.docsUrl}
							target="_blank"
							rel="noopener noreferrer"
							title={t("card.guideTitle")}
							className={fbCls}
							style={{ textDecoration: "none" }}
							onMouseEnter={onEnter}
							onMouseLeave={onLeave}
						>
							<HelpCircle size={12} />
							{t("card.guide")}
						</a>
					)}

					{/* Webhook */}
					<button
						onClick={() => isConfigured && setOpenModal("webhook")}
						disabled={!isConfigured}
						title={isConfigured ? "Webhook" : t("card.configureFirst")}
						className={`font-en ${fbCls}`}
						style={{ opacity: !isConfigured ? 0.35 : 1, cursor: !isConfigured ? "not-allowed" : "pointer" }}
						onMouseEnter={(e) => { if (isConfigured) onEnter(e); }}
						onMouseLeave={(e) => { if (isConfigured) onLeave(e); }}
					>
						<Webhook size={12} />
						Webhook
					</button>

					{/* Usage — pushed to end */}
					<button
						onClick={() => isConfigured && setOpenModal("usage")}
						disabled={!isConfigured}
						title={isConfigured ? t("card.usageTitle") : t("card.configureFirst")}
						className={`${fbCls} ml-auto`}
						style={{ opacity: !isConfigured ? 0.35 : 1, cursor: !isConfigured ? "not-allowed" : "pointer" }}
						onMouseEnter={(e) => { if (isConfigured) onEnter(e); }}
						onMouseLeave={(e) => { if (isConfigured) onLeave(e); }}
					>
						<BarChart3 size={12} />
						{t("card.usage")}
					</button>
				</div>
			</motion.div>

			<AnimatePresence>
				{openModal === "settings" && (
					<SettingsModal
						key="settings"
						company={company}
						onClose={() => setOpenModal(null)}
						onFirstSetup={() => setOpenModal("webhook")}
						onSaved={() => {
							onRefreshStatus?.();
						}}
					/>
				)}
				{openModal === "guide" && <GuideModal key="guide" company={company} onClose={() => setOpenModal(null)} />}
				{openModal === "usage" && <UsageModal key="usage" company={company} onClose={() => setOpenModal(null)} />}
				{openModal === "webhook" && <WebhookModal key="webhook" company={company} onClose={() => setOpenModal(null)} />}
			</AnimatePresence>
		</>
	);
}

// -----------------------
// Main Page
// ★ Three new fields added per company: accent, accentBg, strip
//   Everything else is identical to the original.
// -----------------------
export default function ShippingCompaniesPage() {
	const t = useTranslations("shipping");

	const companies = useMemo(
		() => [
			{
				id: 1,
				code: "bosta",
				name: "Bosta",
				logo: "/integrate/bosta.png",
				website: "bosta.co",
				bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #B5CBE9 129.29%)",
				accent: "#2563a8",
				accentBg: "#dbeafe",
				strip: "linear-gradient(90deg,#2563a8,#60a5fa)",
				description: t("integrated.description"),
			},
			{
				id: 2,
				code: "jt",
				name: "J&T Express",
				logo: "/integrate/5.png",
				website: "jtexpress.com",
				bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #B5CBE9 129.29%)",
				accent: "#c8290a",
				accentBg: "#fee2dc",
				strip: "linear-gradient(90deg,#c8290a,#f87060)",
				description: t("integrated.description"),
			},
			{
				id: 5,
				code: "turbo",
				name: "Turbo",
				logo: "/integrate/4.png",
				website: "turbo.com",
				bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #CCB5E9 129.29%)",
				accent: "#5c3d8f",
				accentBg: "#e0d4f5",
				strip: "linear-gradient(90deg,#5c3d8f,#8b6abf)",
				description: t("integrated.description"),
			},
		],
		[t]
	);

	const [integrationStatuses, setStatuses] = useState({});
	const [statusLoading, setLoading] = useState(true);

	async function fetchStatuses() {
		try {
			const { data } = await api.get("/shipping/integrations/status");
			const map = {};
			(data?.integrations || []).forEach((item) => (map[item.provider] = item));

			setStatuses(map);
		} catch (_) {
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchStatuses();
	}, []);

	return (
		<div className="min-h-screen bg-[var(--background)] p-6">

			<PageHeader
				breadcrumbs={[
					{ name: t("breadcrumb.home"), href: "/" },
					{ name: t("breadcrumb.shipping") },
				]}
			/>

			<AnimatePresence mode="wait">
				<motion.div
					key="integrated"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
					className="bg-card min-h-[600px] "
				>
					<div className="grid grid-cols-1 md:grid-colls-2 lg:grid-cols-3 gap-6">
						{statusLoading
							? companies.map((c) => <SkeletonCard key={c.id} />)
							: companies.map((company, index) => (
								<motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
									<IntegratedCompanyCard company={company} integrationStatus={integrationStatuses[company.code]} onRefreshStatus={fetchStatuses} />
								</motion.div>
							))}
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}