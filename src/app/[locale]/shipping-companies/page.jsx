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
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { normalizeAxiosError } from "@/utils/axios";

const PROVIDER_META = {
	bosta: {
		configFields: [
			{ key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true },
			// { key: "accountId", type: "text", labelKey: "settings.fields.accountId", required: false },
		],
		guide: {
			docsUrl: "https://docs.bosta.co",
			steps: [
				{
					image: "/guide/bosta/step1.png",
					tab: { en: "Login", ar: "تسجيل الدخول" },
					title: { en: "Log in to your Bosta dashboard", ar: "تسجيل الدخول إلى لوحة تحكم بوسطة" },
					desc: {
						en: "Go to app.bosta.co and sign in with your merchant account. Make sure your account is active and has API access enabled.",
						ar: "توجّه إلى app.bosta.co وسجّل دخولك بحساب التاجر. تأكد من أن الحساب مفعّل وأن صلاحيات API ممكّنة.",
					},
					tip: {
						en: "No account yet? You can register for free on the official website.",
						ar: "لا يوجد حساب؟ يمكنك التسجيل مجانًا من الموقع الرسمي.",
					},
				},
				{
					image: "/guide/bosta/step2.png",
					tab: { en: "Settings", ar: "الإعدادات" },
					title: { en: "Open API & Integrations settings", ar: "فتح إعدادات API والتكاملات" },
					desc: {
						en: "From the side menu, choose Settings → API & Integrations. You will find a dedicated section for managing access keys.",
						ar: "من القائمة الجانبية اختر «الإعدادات» ثم «API والتكاملات». ستجد قسمًا مخصصًا لإدارة مفاتيح الوصول.",
					},
					tip: {
						en: "The menu location may differ slightly depending on your dashboard version.",
						ar: "قد يختلف موضع هذا الخيار بحسب إصدار لوحة التحكم.",
					},
				},
				{
					image: "/guide/bosta/step3.png",
					tab: { en: "Generate", ar: "إنشاء المفتاح" },
					title: { en: "Generate a new API key", ar: "إنشاء مفتاح API جديد" },
					desc: {
						en: 'Click "Generate New API Key", then copy the key that appears. Save it somewhere safe — it will not be shown again.',
						ar: "انقر على «إنشاء مفتاح API جديد» وانسخ المفتاح الظاهر. احفظه في مكان آمن — لن يُعرض مرة أخرى.",
					},
					tip: {
						en: 'Give the key a meaningful name like "Store Manager" so you can identify it later.',
						ar: "يُوصى بتسمية المفتاح باسم دالّ مثل «نظام الإدارة» لتسهيل التعرف عليه لاحقًا.",
					},
				},
				{
					image: null,
					tab: { en: "Paste & Save", ar: "اللصق والحفظ" },
					title: { en: "Paste the key and save", ar: "لصق المفتاح وحفظ الإعدادات" },
					desc: {
						en: "Return to the Settings panel here, paste the API key into the field, then click Save. The card status will change to Configured.",
						ar: "عُد إلى نافذة الإعدادات هنا، والصق المفتاح في حقل «مفتاح API»، ثم اضغط «حفظ». ستتحول حالة البطاقة إلى «مضبوط».",
					},
					tip: null,
				},
			],
		},
	},

	jt: {
		configFields: [
			{ key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true },
			{ key: "customerId", type: "text", labelKey: "settings.fields.customerId", required: true },
		],
		guide: {
			docsUrl: "https://developer.jtexpress.com",
			steps: [
				{
					image: "/guide/jt/step1.png",
					tab: { en: "Login", ar: "تسجيل الدخول" },
					title: { en: "Log in to the J&T merchant portal", ar: "تسجيل الدخول إلى بوابة J&T للتجار" },
					desc: {
						en: "Visit the official J&T Express merchant portal and sign in. Make sure API permissions are enabled on your account.",
						ar: "توجّه إلى البوابة الرسمية لـ J&T Express وسجّل دخولك. تأكد من تفعيل صلاحيات API لحسابك.",
					},
					tip: null,
				},
				{
					image: "/guide/jt/step2.png",
					tab: { en: "Dev Settings", ar: "إعدادات المطور" },
					title: { en: "Go to Developer API settings", ar: "الانتقال إلى إعدادات المطور" },
					desc: {
						en: "From Account Settings, choose Developer API, then create a new application to get your API Key and Customer ID.",
						ar: "من إعدادات الحساب اختر «Developer API»، ثم أنشئ تطبيقًا جديدًا للحصول على مفتاح API ومعرّف العميل.",
					},
					tip: {
						en: "Make sure to select the correct permissions when creating the application.",
						ar: "تأكد من اختيار الصلاحيات المناسبة عند إنشاء التطبيق.",
					},
				},
				{
					image: null,
					tab: { en: "Copy Keys", ar: "نسخ البيانات" },
					title: { en: "Copy your API Key and Customer ID", ar: "نسخ مفتاح API ومعرّف العميل" },
					desc: {
						en: "After creating the app you will get an API Key and a Customer ID. Copy both and keep them in a safe place.",
						ar: "بعد إنشاء التطبيق ستحصل على «API Key» و«Customer ID». انسخهما واحفظهما بأمان.",
					},
					tip: null,
				},
				{
					image: null,
					tab: { en: "Paste & Save", ar: "الحفظ" },
					title: { en: "Enter credentials and save", ar: "إدخال البيانات وحفظها" },
					desc: {
						en: "Enter the API Key and Customer ID in the provided fields and click Save.",
						ar: "أدخل مفتاح API ومعرّف العميل في الحقول المخصصة واضغط حفظ.",
					},
					tip: null,
				},
			],
		},
	},

	turbo: {
		configFields: [
			{ key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true },
			{ key: "secretKey", type: "password", labelKey: "settings.fields.secretKey", required: true },
		],
		guide: {
			docsUrl: "https://turbo.com",
			steps: [
				{
					image: "/guide/turbo/step1.png",
					tab: { en: "Login", ar: "تسجيل الدخول" },
					title: { en: "Log in to the Turbo dashboard", ar: "تسجيل الدخول إلى Turbo" },
					desc: { en: "Sign in to your Turbo shipping dashboard.", ar: "سجّل دخولك إلى لوحة تحكم Turbo للشحن." },
					tip: null,
				},
				{
					image: null,
					tab: { en: "API Settings", ar: "إعدادات API" },
					title: { en: "Open Profile → API Settings", ar: "فتح إعدادات API" },
					desc: {
						en: "From your profile, choose API Settings. Here you can generate an API Key and a Secret Key.",
						ar: "من الملف الشخصي اختر «إعدادات API». هنا يمكنك إنشاء مفتاح API ومفتاح سري.",
					},
					tip: null,
				},
				{
					image: null,
					tab: { en: "Copy Keys", ar: "نسخ المفاتيح" },
					title: { en: "Copy API Key and Secret Key", ar: "نسخ مفتاح API والمفتاح السري" },
					desc: {
						en: "Copy both keys and store them securely. Never share your Secret Key with anyone.",
						ar: "انسخ كلا المفتاحين واحفظهما بأمان. لا تشارك مفتاحك السري مع أي شخص.",
					},
					tip: { en: "Treat the Secret Key like a password — never expose it publicly.", ar: "تعامل مع المفتاح السري كأنه كلمة مرور — لا تكشفه للعموم." },
				},
				{
					image: null,
					tab: { en: "Paste & Save", ar: "الحفظ" },
					title: { en: "Enter both keys and save", ar: "إدخال المفتاحين وحفظهما" },
					desc: {
						en: "Enter the API Key and Secret Key in the respective fields and click Save.",
						ar: "أدخل مفتاح API والمفتاح السري في الحقول المخصصة واضغط حفظ.",
					},
					tip: null,
				},
			],
		},
	},
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: pick en or ar string from a bilingual object
// ─────────────────────────────────────────────────────────────────────────────
function pick(bilingualObj, locale) {
	if (!bilingualObj) return "";
	return locale?.startsWith("ar") ? bilingualObj.ar : bilingualObj.en;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled, loading, className = "" }) {
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
			style={{
				background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
				boxShadow: disabled || loading ? "none" : `0 4px 16px rgb(var(--primary-shadow))`,
			}}
		>
			{loading && <Loader2 size={14} className="animate-spin" />}
			{children}
		</button>
	);
}

function GhostBtn({ children, onClick, className = "" }) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all ${className}`}
		>
			{children}
		</button>
	);
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
// Modal shell (PORTAL)  ✅ overlay full width/height + centered modal
// ─────────────────────────────────────────────────────────────────────────────
function ModalShell({ children, onClose, maxWidth = "max-w-md" }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	if (!mounted) return null;

	return createPortal(
		<>
			<motion.div
				className="fixed inset-0 z-50 bg-black/40 dark:bg-black/65 backdrop-blur-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
			/>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
				<motion.div
					initial={{ opacity: 0, scale: 0.94, y: 14 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.94, y: 14 }}
					transition={{ type: "spring", stiffness: 340, damping: 28 }}
					className={`relative w-full ${maxWidth} pointer-events-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden`}
					onClick={(e) => e.stopPropagation()}
				>
					{children}
				</motion.div>
			</div>
		</>,
		document.body
	);
}

function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
	return (
		<div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]">
			<div className="flex items-center gap-3">
				{Icon && (
					<span
						className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
						style={{
							background: `linear-gradient(135deg, rgb(var(--primary-from)/0.15), rgb(var(--primary-to)/0.15))`,
						}}
					>
						<Icon size={15} className="text-[var(--primary)]" />
					</span>
				)}
				<div>
					<p className="text-sm font-semibold text-[var(--card-foreground)] leading-tight">{title}</p>
					{subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
				</div>
			</div>
			<button
				onClick={onClose}
				className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--card-foreground)] hover:bg-[var(--border)] transition-all"
			>
				<X size={15} />
			</button>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Modal  — per-provider config fields
// ─────────────────────────────────────────────────────────────────────────────
function SettingsModal({ company, integrationStatus, onClose, onSaved }) {
	const t = useTranslations("shipping");
	const fields = PROVIDER_META[company.code]?.configFields || [{ key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true }];

	const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.key, ""])));
	const [showFields, setShow] = useState({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	// useEffect(() => {

	// 	const newValues = Object.fromEntries(
	// 		fields.map((f) => {
	// 			const existingValue = integrationStatus?.credentials?.[f.key];
	// 			return [f.key, existingValue || ""];
	// 		})
	// 	);

	// 	setValues(newValues);
	// }, [integrationStatus, company.code]);

	const setValue = (key, val) => {
		setValues((v) => ({ ...v, [key]: val }));
		setSuccess(false);
		setError(null);
	};
	const toggleShow = (key) => setShow((v) => ({ ...v, [key]: !v[key] }));
	const isAllMasked = () => fields.every((f) => values[f.key]?.startsWith("•"));
	const isValid = () =>
		!isAllMasked() && fields.filter((f) => f.required).every((f) => values[f.key]?.trim().length > 0 && !values[f.key].startsWith("•"));

	async function handleSave() {
		if (!isValid()) return;
		setSaving(true);
		setError(null);
		try {
			const credentials = {};
			fields.forEach((f) => {
				if (!values[f.key].startsWith("•")) credentials[f.key] = values[f.key];
			});
			await api.post(`/shipping/providers/${company.code}/credentials`, { credentials });
			setSuccess(true);
			onSaved?.();
			setTimeout(onClose, 1100);
		} catch (e) {
			console.log(e?.response?.data)
			setError(e?.response?.data?.message || t("settings.error"));
		} finally {
			setSaving(false);
		}
	}

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

				<div className="space-y-4">
					{fields.map((field) => {
						const currentSavedValue = integrationStatus?.credentials?.[field.key];
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
										// 🔥 Dynamic placeholder: shows masked value if saved, else fallback text
										placeholder={currentSavedValue || t(`settings.placeholders.${field.key}`, { fallback: `${t(field.labelKey)}…` })}
										// Added "placeholder:text-gray-900" (or similar) to make the placeholder darker/black
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
				</div>

				<p className="text-[11px] text-[var(--muted-foreground)]">{t("settings.securityNote")}</p>

				{error && (
					<div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
						<AlertCircle size={14} className="flex-shrink-0" />
						{error}
					</div>
				)}
				{success && (
					<div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
						<Check size={14} className="flex-shrink-0" />
						{t("settings.success")}
					</div>
				)}

				<PrimaryBtn onClick={handleSave} disabled={!isValid()} loading={saving} className="w-full">
					{!saving && <Check size={14} />}
					{saving ? t("settings.saving") : t("settings.save")}
				</PrimaryBtn>
			</div>
		</ModalShell>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Guide Modal
// ─────────────────────────────────────────────────────────────────────────────
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
									className="w-full h-auto object-cover block"
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
						<ChevronLeft size={14} /> {t("guide.prev")}
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
							{t("guide.next")} <ChevronRight size={14} />
						</PrimaryBtn>
					) : (
						<a href={meta?.guide?.docsUrl} target="_blank" rel="noopener noreferrer">
							<PrimaryBtn onClick={undefined}>
								<ExternalLink size={13} /> {t("guide.docs")}
							</PrimaryBtn>
						</a>
					)}
				</div>
			</div>
		</ModalShell>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage / Capabilities Modal
// ─────────────────────────────────────────────────────────────────────────────
function UsageModal({ company, onClose }) {
	const t = useTranslations("shipping");
	const [data, setData] = useState(null);
	const [loading, setLoad] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				const [capsRes, svcRes] = await Promise.all([
					api.get(`/shipping/providers/${company.code}/capabilities`),
					api.get(`/shipping/providers/${company.code}/services`),
				]);
				setData({ capabilities: capsRes.data?.capabilities, services: svcRes.data?.services || [] });
			} catch (e) {
				setError(e?.response?.data?.message || t("usage.error"));
			} finally {
				setLoad(false);
			}
		})();
	}, [company.code]);

	const caps = data?.capabilities;

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
				{data && (
					<>
						{data.services?.length > 0 && (
							<div className="space-y-2.5">
								<SectionLabel icon={Zap} label={t("usage.services")} />
								<div className="flex flex-wrap gap-2">
									{data.services.map((s) => (
										<span
											key={s}
											className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)]"
										>
											{s}
										</span>
									))}
								</div>
							</div>
						)}
						{caps && (
							<div className="space-y-2.5">
								<SectionLabel icon={Globe} label={t("usage.capabilities")} />
								<div className="grid grid-cols-2 gap-3">
									{[
										{ key: "coverage", label: t("usage.coverage"), icon: Globe },
										{ key: "pricing", label: t("usage.pricing"), icon: TrendingUp },
										{ key: "limits", label: t("usage.limits"), icon: Shield },
										{ key: "quote", label: t("usage.quote"), icon: Package },
									].map(({ key, label, icon: Icon }) => {
										const cap = caps[key];
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
						{caps?.services?.available && caps.services.data?.length > 0 && (
							<div className="space-y-2.5">
								<SectionLabel icon={Info} label={t("usage.operations")} />
								<div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 space-y-2">
									{caps.services.data.map((s) => (
										<div key={s} className="flex items-center gap-2 text-xs text-[var(--card-foreground)]">
											<Check size={11} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
											{s}
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</ModalShell>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loading card
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div className="rounded-2xl border border-[var(--border)] overflow-hidden animate-pulse bg-[var(--muted)]">
			<div className="p-5 space-y-4">
				<div className="flex items-start justify-between">
					<div className="w-14 h-14 rounded-2xl bg-[var(--border)]" />
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
				<div className="h-7 w-20 rounded-lg bg-[var(--border)]" />
				<div className="h-7 w-20 rounded-lg bg-[var(--border)]" />
				<div className="h-7 w-16 rounded-lg bg-[var(--border)] ml-auto" />
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// IntegratedCompanyCard
// ─────────────────────────────────────────────────────────────────────────────
function IntegratedCompanyCard({ company, integrationStatus, onRefreshStatus }) {
	const t = useTranslations("shipping");
	const [openModal, setOpenModal] = useState(null);
	const [toggling, setToggling] = useState(false);

	const isConfigured = integrationStatus?.credentialsConfigured ?? false;
	const isActive = integrationStatus?.isActive ?? false;

	async function handleToggle() {
		if (!isConfigured) {
			setOpenModal("settings");
			return;
		}
		setToggling(true);
		try {
			await api.post(`/shipping/providers/${company.code}/active`, { isActive: !isActive });
			onRefreshStatus?.();
		} catch (e) {
			toast.error(normalizeAxiosError(e));
			console.error(e);
		} finally {
			setToggling(false);
		}
	}

	return (
		<>
			<motion.div
				whileHover={{ y: -3, boxShadow: "0 16px 40px 0 rgba(0,0,0,0.13)" }}
				transition={{ type: "spring", stiffness: 300, damping: 22 }}
				className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col"
				style={{ background: company.bg }}
			>
				<div className="p-5 flex flex-col gap-3 flex-1">
					<div className="flex items-start justify-between">
						<div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/10 flex items-center justify-center shadow-sm overflow-hidden">
							<img src={company.logo} alt={company.name} className="w-9 h-9 object-contain" onError={(e) => (e.target.style.display = "none")} />
						</div>

						<div className="flex flex-col items-end gap-1.5">
							<button
								onClick={handleToggle}
								disabled={toggling || !isConfigured} // Disable if already toggling or not configured
								title={!isConfigured ? t("card.configureFirst") : isActive ? t("card.disable") : t("card.enable")}
								className="relative w-11 h-6 rounded-full border transition-all duration-300 focus:outline-none"
								style={{
									background:
										isActive && isConfigured
											? `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`
											: "rgba(0,0,0,0.12)",
									borderColor: isActive && isConfigured ? "transparent" : "rgba(0,0,0,0.1)",
									// Lower opacity slightly more when toggling for better visual feedback
									opacity: toggling ? 0.7 : 1,
									cursor: toggling ? "not-allowed" : "pointer"
								}}
							>
								<span
									className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center"
									style={{
										transform: isActive && isConfigured ? "translateX(20px)" : "translateX(0px)"
									}}
								>
									{/* Show a spinner inside the toggle handle when loading */}
									{toggling && (
										<svg className="animate-spin h-3 w-3 text-primary-from" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									)}
								</span>
							</button>
							<span
								className={`text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 ${isActive && isConfigured ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
									}`}
							>
								{toggling ? t("card.updating") : (isActive && isConfigured ? t("card.active") : t("card.inactive"))}
							</span>
						</div>
					</div>

					<div>
						<h3 className="text-base font-bold text-gray-800 dark:text-white">{company.name}</h3>
						<a
							href={`https://${company.website}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors flex items-center gap-0.5 mt-0.5"
						>
							{company.website}
							<ExternalLink size={9} className="ml-0.5" />
						</a>
					</div>

					<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{company.description}</p>

					{isConfigured ? (
						<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
							{t("card.configured")}
						</span>
					) : (
						<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
							{t("card.notConfigured")}
						</span>
					)}
				</div>

				<div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-t border-white/40 dark:border-white/10 px-4 py-3 flex items-center gap-2">
					<button
						onClick={() => setOpenModal("settings")}
						title={t("card.settingsTitle")}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
					>
						<Settings2 size={12} />
						{t("card.settings")}
					</button>

					<button
						onClick={() => setOpenModal("guide")}
						title={t("card.guideTitle")}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
					>
						<HelpCircle size={12} />
						{t("card.guide")}
					</button>

					<button
						onClick={() => isConfigured && setOpenModal("usage")}
						disabled={!isConfigured}
						title={isConfigured ? t("card.usageTitle") : t("card.configureFirst")}
						className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${isConfigured
							? "bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border-white/50 dark:border-white/10 text-gray-700 dark:text-gray-200"
							: "bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
							}`}
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
						integrationStatus={integrationStatus}
						onClose={() => setOpenModal(null)}
						onSaved={() => {
							setOpenModal(null);
							onRefreshStatus?.();
						}}
					/>
				)}
				{openModal === "guide" && <GuideModal key="guide" company={company} onClose={() => setOpenModal(null)} />}
				{openModal === "usage" && <UsageModal key="usage" company={company} onClose={() => setOpenModal(null)} />}
			</AnimatePresence>
		</>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
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
				description: t("integrated.description"),
			},
			{
				id: 2,
				code: "jt",
				name: "J&T Express",
				logo: "/integrate/5.png",
				website: "jtexpress.com",
				bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #B5CBE9 129.29%)",
				description: t("integrated.description"),
			},
			{
				id: 5,
				code: "turbo",
				name: "Turbo",
				logo: "/integrate/4.png",
				website: "turbo.com",
				bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #CCB5E9 129.29%)",
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
			console.log(map)
			setStatuses(map);
		} catch (_) {
			/* silent */
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchStatuses();
	}, []);

	return (
		<div className="min-h-screen bg-[var(--background)] p-6">
			<div className="bg-card !pb-0 flex flex-col gap-2 mb-4">
				<div className="flex items-center gap-2 text-lg font-semibold">
					<span className="text-gray-400">{t("breadcrumb.home")}</span>
					<ChevronLeft className="text-gray-400" size={18} />
					<span className="text-[rgb(var(--primary))]">{t("breadcrumb.shipping")}</span>
					<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
				</div>
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key="integrated"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
					className="bg-card"
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

