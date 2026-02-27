"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Settings, RefreshCw, Loader2, AlertCircle, CheckCircle2, Clock, Zap, Store, ExternalLink, Settings2, HelpCircle, Webhook, Copy, RotateCcw, ChevronRight, Info, ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { BASE_URL } from "@/utils/api";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import { getUser } from "@/hook/getUser";
import { useRouter } from "@/i18n/navigation";
import { ModalHeader, ModalShell } from "@/components/ui/modalShell";
import { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import { useSocket } from "@/context/SocketContext";
import { tenantId } from "@/utils/healpers";

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeAxiosError(err) {
	const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
	return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

const PROVIDERS = ["easyorder", "shopify", "woocommerce"];

// ─── Provider Configuration ──────────────────────────────────────────────────


const PROVIDER_CONFIG = {
	easyorder: {
		label: "EasyOrder",
		logo: "/integrate/easyorder.png",
		website: "easy-orders.net",
		description: "ربط متجرك مع منصة EasyOrder واستفد من إدارة الطلبات والمزامنة التلقائية بسهولة.",
		bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #F3F0FF 129.29%)",
		docsLink: "https://public-api-docs.easy-orders.net/docs/intro",
		guide: {
			showSteps: true,
			tabs: [
				{
					key: "api",
					label: { en: "Get API Key", ar: "الحصول على مفتاح API" },
					steps: [
						{
							title: {
								en: "Login to EasyOrder",
								ar: "تسجيل الدخول إلى EasyOrder"
							},
							desc: {
								en: "Login to your EasyOrder dashboard using your account credentials.",
								ar: "قم بتسجيل الدخول إلى لوحة تحكم EasyOrder باستخدام بيانات حسابك."
							},
							url: "https://app.easy-orders.net",
							image: "/guide/easyorder/step1.png",
						},
						{
							title: { en: "Open Settings → Public API", ar: "افتح الإعدادات ← Public API" },
							desc: {
								en: "Click the Settings button, then choose Public API from the menu.",
								ar: "اضغط على زر الإعدادات ثم اختر Public API من القائمة."
							},
							image: "/guide/easyorder/step2.png",
						},
						{
							title: { en: "Create New API Key", ar: "إنشاء مفتاح API جديد" },
							desc: {
								en: "Click the Create button to generate a new API key.",
								ar: "اضغط على زر Create لإنشاء مفتاح API جديد."
							},
							image: "/guide/easyorder/step3.png",
						},
						{
							title: { en: "Enable & Set Permissions", ar: "تفعيل وتحديد الصلاحيات" },
							desc: {
								en: "Enable the API key and check all required permissions, then click Save.",
								ar: "قم بتفعيل المفتاح وحدد جميع الصلاحيات ثم اضغط حفظ."
							},
							image: "/guide/easyorder/step4.png",
						},
						{
							title: { en: "Copy API Key", ar: "نسخ مفتاح API" },
							desc: {
								en: "Click the Copy button to copy the API key and paste it into our store configuration form.",
								ar: "اضغط على زر النسخ ثم قم بلصق المفتاح داخل نموذج إعدادات المتجر لدينا."
							},
							image: "/guide/easyorder/step5.png",
							tip: {
								en: "Make sure you save the key securely. Do not share it publicly.",
								ar: "تأكد من حفظ المفتاح بأمان ولا تقم بمشاركته علنًا."
							}
						}
					]
				},
				{
					key: "webhooks",
					label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
					steps: [
						{
							title: {
								en: "Login to EasyOrder",
								ar: "تسجيل الدخول إلى EasyOrder"
							},
							desc: {
								en: "Login to your EasyOrder dashboard using your account credentials.",
								ar: "قم بتسجيل الدخول إلى لوحة تحكم EasyOrder باستخدام بيانات حسابك."
							},
							url: "https://app.easy-orders.net",
							image: "/guide/easyorder/step1.png",
						},
						{
							title: {
								en: "Open Webhooks Settings",
								ar: "فتح إعدادات Webhooks"
							},
							desc: {
								en: "From the dashboard, go to Settings then click on Webhooks.",
								ar: "من لوحة التحكم، انتقل إلى الإعدادات ثم اضغط على Webhooks."
							},
							image: "/guide/easyorder/webhook-step2.png",
						},
						{
							title: {
								en: "Create Webhook for New Orders",
								ar: "إنشاء Webhook للطلبات الجديدة"
							},
							desc: {
								en: "Click 'Create'. Copy the webhook URL provided below and paste it into the URL field. Then select the type 'Orders' and click Save.",
								ar: "اضغط على 'إنشاء'. قم بنسخ رابط الـ Webhook الموضح بالأسفل وألصقه في حقل الرابط (URL)، ثم اختر النوع 'Orders' واضغط حفظ."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/easyorder/orders/create`,
							image: "/guide/easyorder/webhook-step3.png",
						},
						{
							title: {
								en: "Copy Orders Webhook Secret",
								ar: "نسخ Secret الخاص بطلبات Orders"
							},
							desc: {
								en: "After saving, copy the generated Secret and paste it into our system webhook secret input.",
								ar: "بعد الحفظ، قم بنسخ الـ Secret الذي تم إنشاؤه وألصقه في حقل Webhook Secret في نظامنا."
							},

							image: "/guide/easyorder/webhook-step4.png",
						},
						{
							title: {
								en: "Create Webhook for Order Status Update",
								ar: "إنشاء Webhook لتحديث حالة الطلب"
							},
							desc: {
								en: "Create another webhook. Copy the webhook URL provided below and paste it into the URL field. Then select the type 'Order Status Update' and click Save.",
								ar: "قم بإنشاء Webhook آخر. قم بنسخ رابط الـ Webhook الموضح بالأسفل وألصقه في حقل الرابط (URL)، ثم اختر النوع 'Order Status Update' واضغط حفظ."
							},
							url: `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/easyorder/orders/status`,
							image: "/guide/easyorder/webhook-step5.png",
						},
						{
							title: {
								en: "Copy Status Update Secret",
								ar: "نسخ Secret الخاص بتحديث الحالة"
							},
							desc: {
								en: "After saving, copy the generated Secret and paste it into our system webhook secret input.",
								ar: "بعد الحفظ، قم بنسخ الـ Secret الذي تم إنشاؤه وألصقه في حقل Webhook Secret في نظامنا."
							},
							image: "/guide/easyorder/webhook-step6.png",
						},
					]
				}
			], docsUrl: "https://public-api-docs.easy-orders.net/docs/authentication"
		},
		webhookDocsUrl: "https://public-api-docs.easy-orders.net/docs/webhooks",
		fields: {
			apiKey: { required: true, userProvides: true },
			webhookCreateOrderSecret: { required: true, userProvides: true },
			webhookUpdateStatusSecret: { required: true, userProvides: true },
		},
		webhookEndpoints: {
			create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/easyorder/orders/create`,
			update: (adminId) => `${BASE_URL}/stores/webhooks/easyorder/orders/status`,
		},
		instructions: {
			apiKey: [
				"انتقل إلى لوحة تحكم EasyOrder",
				"ابحث عن قسم API Keys",
				"أنشئ مفتاح API جديد",
				"انسخ المفتاح والصقه أدناه",
			],
			webhooks: [
				"في EasyOrder، انتقل إلى إعدادات Webhooks",
				"أضف webhook لإنشاء الطلبات باستخدام الرابط أدناه",
				"أدخل السر الخاص بك (أي نص عشوائي آمن)",
				"أضف webhook لتحديث الحالة باستخدام الرابط الثاني",
				"أدخل سر آخر لتحديث الحالة",
				"احفظ كلا السرين أدناه",
			],
		},
	},
	shopify: {
		label: "Shopify",
		logo: "/integrate/shopify.png",
		website: "shopify.com",
		description: "صل متجرك بـ Shopify وأدر منتجاتك وطلباتك من مكان واحد.",
		bg: "linear-gradient(300.09deg, #F0FFF4 74.95%, #F3F0FF 129.29%)",
		docsLink: "https://help.shopify.com/api",
		guide: {
			showSteps: true,
			docsUrl: "https://help.shopify.com/api",
			tabs: [
				{
					key: "create-app",
					label: { en: "Create Shopify App", ar: "إنشاء تطبيق Shopify" },
					steps: [
						{
							title: { en: "Open Develop Apps", ar: "فتح Develop Apps" },
							desc: {
								en: "From your Shopify store dashboard, click Apps → Develop apps.",
								ar: "من لوحة تحكم المتجر في Shopify، اضغط على Apps ثم Develop apps."
							},
							image: "/guide/shopify/step1.png",
						},
						{
							title: { en: "Build App", ar: "إنشاء تطبيق" },
							desc: {
								en: "Click 'Build app' inside the Developer Dashboard.",
								ar: "اضغط على 'Build apps' داخل لوحة التحكم."
							},
							image: "/guide/shopify/step2.png",
						},
						{
							title: { en: "Create App Name", ar: "إنشاء اسم التطبيق" },
							desc: {
								en: "In the 'Create app' form, write the app name as 'store-integrate', then click Create.",
								ar: "في نموذج إنشاء التطبيق، اكتب اسم التطبيق 'store-integrate' ثم اضغط Create."
							},
							image: "/guide/shopify/step3.png",
						},
						{
							title: { en: "Configure App URL & Scopes", ar: "إعداد رابط التطبيق والصلاحيات" },
							desc: {
								en: "Add the URL shown below into the App URL field. Uncheck 'Embedded app'. Then add the required scopes and click Save.",
								ar: "أضف الرابط المعروض أدناه في حقل App URL. قم بإلغاء تحديد 'Embedded app'. ثم أضف الصلاحيات المطلوبة واضغط حفظ."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/shopify/init`,
							image: "/guide/shopify/step4.png",
							tip: {
								en: "Click 'Add scopes' and include the required permissions (read_all_orders,write_locations,read_locations,read_orders,write_orders,read_products,write_products).",
								ar: "اضغط على 'Add scopes' وأضف الصلاحيات المطلوبة  read_all_orders,write_locations, read_locations,read_orders,write_orders,read_products,write_products."
							}
						},
						{
							title: { en: "Release App Version", ar: "إصدار نسخة التطبيق" },
							desc: {
								en: "Click 'Release'. A popup will appear asking for the version name. Enter a version number (for example: 1) and confirm to release the app.",
								ar: "اضغط على 'Release'. ستظهر نافذة منبثقة تطلب إدخال رقم الإصدار. اكتب رقم الإصدار (مثلاً: 1) ثم قم بالتأكيد لإصدار التطبيق."
							},
							image: "/guide/shopify/step5.png",
						},
						{
							title: { en: "Copy Client ID & Secret", ar: "نسخ Client ID و Secret" },
							desc: {
								en: "After releasing the app, copy the Client ID and Client Secret and paste them into our store configuration form.",
								ar: "بعد إصدار التطبيق، انسخ Client ID و Client Secret والصقهما في نموذج إعداد المتجر لدينا."
							},
							image: "/guide/shopify/step6.png",
							tip: {
								en: "Keep the Client Secret secure and do not share it publicly.",
								ar: "احفظ Client Secret بأمان ولا تشاركه علنًا."
							}
						}
					]
				},
				{
					key: "webhooks",
					label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
					steps: [
						{
							title: { en: "Go to Webhooks", ar: "اذهب إلى Webhooks" },
							desc: {
								en: "From your Shopify dashboard, go to Notifications → Webhooks. Copy the existing Webhook Secret into our system.",
								ar: "من لوحة تحكم Shopify، انتقل إلى Notifications → Webhooks. انسخ الـ Webhook Secret الموجود والصقه في نظامنا."
							},
							image: "/guide/shopify/webhook-step1.png",
						},
						{
							title: { en: "Create Webhook for Order Creation", ar: "إنشاء Webhook لإنشاء الطلبات" },
							desc: {
								en: "Click 'Create Webhook'. For Event select 'Order Creation', format JSON, then copy the URL shown below into the URL field in Shopify.",
								ar: "اضغط على 'Create Webhook'. اختر Event 'Order Creation'، الصيغة JSON، ثم انسخ الرابط المعروض أدناه وألصقه في حقل URL في Shopify."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/shopify/orders/create`,
							image: "/guide/shopify/webhook-step2.png",
						},

						{
							title: { en: "Create Webhook for Order Status Update", ar: "إنشاء Webhook لتحديث حالة الطلب" },
							desc: {
								en: "Click 'Create Webhook'. For Event select 'Order Update', format JSON, then copy the URL shown below into the URL field in Shopify.",
								ar: "اضغط على 'Create Webhook'. اختر Event 'Order Update'، الصيغة JSON، ثم انسخ الرابط المعروض أدناه وألصقه في حقل URL في Shopify."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/shopify/orders/status`,
							image: "/guide/shopify/webhook-step3.png",
						}
					]
				}
			]
		},
		webhookDocsUrl: "https://help.shopify.com/en/manual/apps/app-types/custom-apps/webhooks",
		fields: {
			apiKey: { required: true, userProvides: true },
			clientSecret: { required: true, userProvides: true },
			webhookSecret: { required: true, userProvides: true },
		},
		webhookEndpoints: {
			create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/shopify/orders/create`,
			update: (adminId) => `${BASE_URL}/stores/webhooks/shopify/orders/status`,
		},
		instructions: {
			apiKey: [
				"انتقل إلى Shopify Admin > Apps > Develop apps",
				"أنشئ تطبيق خاص جديد",
				"اذهب إلى API credentials",
				"انسخ API key و API secret key",
			],
			webhooks: [
				"في إعدادات التطبيق، اذهب إلى Webhooks",
				"أضف webhook subscription لـ orders/create",
				"استخدم الرابط أدناه كـ Webhook URL",
				"سيتم إنشاء Webhook secret تلقائيًا - انسخه",
			],
		},
	},
	woocommerce: {
		label: "WooCommerce",
		logo: "/integrate/woocommerce.png",
		website: "woocommerce.com",
		description: "اربط متجر WooCommerce الخاص بك وأدر كل شيء بطريقة سهلة والأمان أولًا.",
		bg: "linear-gradient(300.09deg, #FAFAFA 74.95%, #FFF0F5 129.29%)",
		docsLink: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
		guide: {
			showSteps: true,
			docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
			tabs: [
				{
					key: "api",
					label: { en: "Get API Key", ar: "الحصول على مفتاح API" },
					steps: [
						{
							title: {
								en: "Open WooCommerce Settings",
								ar: "فتح إعدادات WooCommerce"
							},
							desc: {
								en: "Go to your WordPress dashboard, click WooCommerce, then Settings.",
								ar: "اذهب إلى لوحة التحكم في WordPress، اضغط على WooCommerce ثم الإعدادات."
							},
							image: "/guide/woocommerce/step1.png",
						},
						{
							title: {
								en: "Go to Advanced Tab",
								ar: "اذهب إلى تبويب Advanced"
							},
							desc: {
								en: "Click the 'Advanced' tab to access REST API settings.",
								ar: "اضغط على تبويب 'Advanced' للوصول إلى إعدادات REST API."
							},
							image: "/guide/woocommerce/step2.png",
						},
						{
							title: {
								en: "Add REST API Key",
								ar: "إضافة مفتاح REST API"
							},
							desc: {
								en: "In the REST API section, click 'Add Key', fill in the details, select Read/Write permission, then save.",
								ar: "في قسم REST API، اضغط 'Add Key'، املأ البيانات، اختر صلاحيات Read/Write ثم اضغط حفظ."
							},
							image: "/guide/woocommerce/step3.png",
						},
						{
							title: {
								en: "Copy Key and Secret",
								ar: "نسخ المفتاح والسر"
							},
							desc: {
								en: "After saving, the Key and Secret will appear. Copy them and paste into our store configuration form.",
								ar: "بعد الحفظ، سيظهر المفتاح والسر. انسخهم والصقهم داخل نموذج إعدادات المتجر لدينا."
							},
							image: "/guide/woocommerce/step4.png",
							tip: {
								en: "Store the Key and Secret securely. Do not share publicly.",
								ar: "احفظ المفتاح والسر بأمان ولا تشاركهم علنًا."
							}
						}
					]
				},

				{
					key: "webhooks",
					label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
					steps: [
						{
							title: { en: "Open WooCommerce Settings", ar: "فتح إعدادات WooCommerce" },
							desc: {
								en: "Go to your WordPress dashboard, click WooCommerce, then Settings.",
								ar: "اذهب إلى لوحة التحكم في WordPress، اضغط على WooCommerce ثم الإعدادات."
							},
							image: "/guide/woocommerce/step1.png",
						},
						{
							title: { en: "Go to Webhooks Tab", ar: "اذهب إلى تبويب Webhooks" },
							desc: {
								en: "Click the 'Webhooks' tab to manage WooCommerce webhooks.",
								ar: "اضغط على تبويب 'Webhooks' لإدارة الـ Webhooks في WooCommerce."
							},
							image: "/guide/woocommerce/webhook-step2.png",
						},
						{
							title: { en: "Create Webhook for New Orders", ar: "إنشاء Webhook للطلبات الجديدة" },
							desc: {
								en: "Click 'Add Webhook', fill the details, select topic 'Order created', set status 'Active', then click Save. Copy the generated Secret into our system webhook secret input.",
								ar: "اضغط 'Add Webhook'، املأ البيانات، اختر الموضوع 'Order created'، اجعل الحالة 'Active' ثم اضغط حفظ. انسخ الـ Secret وضعه في حقل Webhook Secret في نظامنا."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/woocommerce/orders/create`,
							image: "/guide/woocommerce/webhook-step3.png",
							tip: {
								en: "After saving, check that the message 'Webhook updated successfully' appears.",
								ar: "بعد الحفظ، تحقق من ظهور الرسالة 'Webhook updated successfully'."
							}
						},
						{
							title: { en: "Create Webhook for Order Status Update", ar: "إنشاء Webhook لتحديث حالة الطلب" },
							desc: {
								en: "Create another webhook, fill details, select topic 'Order updated', set status 'Active', then click Save. Copy the generated Secret into our system webhook secret input.",
								ar: "قم بإنشاء Webhook آخر، املأ البيانات، اختر الموضوع 'Order updated'، اجعل الحالة 'Active' ثم اضغط حفظ. انسخ الـ Secret وضعه في حقل Webhook Secret في نظامنا."
							},
							url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/woocommerce/orders/status`,
							image: "/guide/woocommerce/webhook-step4.png",
							tip: {
								en: "After saving, check that the message 'Webhook updated successfully' appears.",
								ar: "بعد الحفظ، تحقق من ظهور الرسالة 'Webhook updated successfully'."
							}
						}
					]
				}
			],
		},
		webhookDocsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks",
		fields: {
			apiKey: { required: true, userProvides: true },
			clientSecret: { required: true, userProvides: true },
			// webhookSecret: { required: true, userProvides: true },
			webhookCreateOrderSecret: { required: true, systemProvides: true }, // System generates
			webhookUpdateStatusSecret: { required: true, systemProvides: true }, // System generates
		},
		webhookEndpoints: {
			create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/woocommerce/orders/create`,
			update: (adminId) => `${BASE_URL}/stores/webhooks/woocommerce/orders/status`,
		},
		instructions: {
			apiKey: [
				"انتقل إلى WooCommerce > Settings > Advanced > REST API",
				"أنشئ مفتاح API جديد",
				"اختر Read/Write permissions",
				"انسخ Consumer key و Consumer secret",
			],
			webhooks: [
				"في WooCommerce > Settings > Advanced > Webhooks",
				"أنشئ  لـ Order created",
				"استخدم الرابط أدناه",
				"انسخ السر الذي تم إنشاؤه والصقه في متجرك",
			],
		},
	},
};

// ─── StoreCard ───────────────────────────────────────────────────────────────

function StoreCard({
	provider,
	store,
	t,
	onOpenGuide,
	onConfigure,
	onSync,
	onOpenWebhook,
	fetchStores,
	index
}) {
	const config = PROVIDER_CONFIG[provider];
	const hasStore = !!store;
	const isSyncing = store?.syncStatus === "syncing";
	const isActive = store?.isActive ?? false;

	const [toggling, setToggling] = useState(false);

	async function handleToggle() {
		if (!hasStore) {
			onConfigure(provider, store)
			return;
		}

		setToggling(true);
		try {
			await api.patch(`/stores/${store.id}`, {
				isActive: !isActive
			});
			await fetchStores();
			toast.success(t("messages.statusUpdated"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setToggling(false);
		}
	}

	return (
		<motion.div
			whileHover={{ y: -3, boxShadow: "0 16px 40px 0 rgba(0,0,0,0.13)" }}
			transition={{ type: "spring", stiffness: 300, damping: 22 }}
			className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm flex flex-col"
			style={{ background: config.bg }}
		>
			{/* Body */}
			<div className="p-5 flex flex-col gap-3 flex-1">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/10 flex items-center justify-center shadow-sm overflow-hidden">
							<img
								src={config.logo}
								alt={config.label}
								className="w-9 h-9 object-contain"
								onError={(e) => (e.target.style.display = "none")}
							/>
						</div>

						<div>
							<h3 className="text-base font-bold text-gray-800 dark:text-white">
								{config.label}
							</h3>

							<a
								href={`https://${config.website}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors flex items-center gap-0.5 mt-0.5"
							>
								{config.website}
								<ExternalLink size={9} />
							</a>
						</div>
					</div>

					{/* Toggle */}

					<div className="flex flex-col items-end gap-1.5">
						<button
							onClick={handleToggle}
							disabled={toggling || isSyncing}
							className="relative w-11 h-6 rounded-full border transition-all duration-300"
							style={{
								background:
									isActive
										? `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`
										: "rgba(0,0,0,0.12)",
								borderColor: isActive ? "transparent" : "rgba(0,0,0,0.1)",
								opacity: toggling ? 0.7 : 1,
								cursor: toggling ? "not-allowed" : "pointer"
							}}
						>
							<span
								className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center"
								style={{
									transform: isActive
										? "translateX(20px)"
										: "translateX(0px)"
								}}
							>
								{toggling && (
									<svg
										className="animate-spin h-3 w-3 text-primary"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										/>
									</svg>
								)}
							</span>
						</button>

						<span
							className={`text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
								}`}
						>
							{toggling ? t("card.updating") : (isActive ? t("card.connected") : t("card.notConnected"))}
						</span>
					</div>
				</div>



				{/* Description */}
				<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
					{config.description}
				</p>

				{/* Status Badge */}
				{hasStore ? (
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

			{/* Footer */}
			<div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-t border-white/40 dark:border-white/10 px-4 py-3 flex items-center gap-2 flex-wrap">
				<button
					onClick={() => onConfigure(provider, store)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
				>
					<Settings2 size={12} />
					{hasStore ? t("card.settings") : t("card.configureSettings")}
				</button>

				{config?.guide?.showSteps ? (
					<button
						onClick={() => onOpenGuide(provider, store)}
						title={t("card.guideTitle")}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
					>
						<HelpCircle size={12} />
						{t("card.guide")}
					</button>
				) : config?.guide?.docsUrl ? (
					<a
						href={config.guide.docsUrl}
						target="_blank"
						rel="noopener noreferrer"
						title={t("card.guideTitle")}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
					>
						<HelpCircle size={12} />
						{t("card.guide")}
					</a>
				) : null}

				{hasStore && (
					<button
						onClick={() => onOpenWebhook(provider, store)}
						title="Webhook"
						className="font-en flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
					>
						<Webhook size={12} />
						Webhook
					</button>
				)}

				<button
					onClick={() => hasStore && onSync(store.id)}
					disabled={isSyncing || !hasStore || !isActive}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-white/50 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 transition-all shadow-sm"
				>
					<RefreshCw
						size={12}
						className={isSyncing ? "animate-spin" : ""}
					/>
					{t("card.sync")}
				</button>
			</div>
		</motion.div >
	);
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function InstructionStep({ step, children }) {
	return (
		<div className="flex gap-2.5">
			<div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
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
			<code className="text-xs font-mono text-primary break-all flex-1">{text}</code>
			<button
				type="button"
				onClick={() => {
					navigator.clipboard.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
				className="text-xs text-gray-400 hover:text-primary transition-colors shrink-0"
			>
				{copied ? "✓" : "📋"}
			</button>
		</div>
	);
}

// ─── Store Configuration Dialog ──────────────────────────────────────────────

function StoreConfigDialog({ open, onClose, provider, existingStore, fetchStores, t, onCreated }) {
	const config = PROVIDER_CONFIG[provider];
	const isEdit = !!existingStore;
	const [fetchingStore, setFetchingStore] = useState(false);
	const [regeneratingSecrets, setRegeneratingSecrets] = useState(false);
	const [error, setError] = useState(null);
	const user = getUser();

	// Form schema
	const schema = useMemo(
		() =>
			yup.object({
				name: yup.string().trim().required(t("validation.nameRequired")),
				storeUrl: yup.string().trim().url(t("validation.invalidUrl")).required(t("validation.storeUrlRequired")),
				isActive: yup.boolean().default(true),
			}),
		[t]
	);

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { name: "", storeUrl: "", isActive: true },
		resolver: yupResolver(schema),
	});

	// Field states
	const [fields, setFields] = useState({});
	const [touched, setTouched] = useState({});
	const [fieldErrors, setFieldErrors] = useState({});
	const [masks, setMasks] = useState({});
	const [systemSecrets, setSystemSecrets] = useState({}); // For WooCommerce system-generated secrets

	// Load store data
	useEffect(() => {
		if (!open) return;
		setError(null);

		if (isEdit) {
			(async () => {
				setFetchingStore(true);
				try {
					const res = await api.get(`/stores/${existingStore.id}`);
					const d = res.data;

					reset({
						name: d.name || "",
						storeUrl: d.storeUrl || "",
						isActive: d.isActive ?? true,
					});

					// Load masked secrets
					const integ = d.credentials || {};
					const newMasks = {};
					const newSystemSecrets = {};

					Object.keys(config.fields).forEach((fieldName) => {
						if (config.fields[fieldName].systemProvides) {
							newSystemSecrets[fieldName] = integ[fieldName] || "";
						} else {
							newMasks[fieldName] = integ[fieldName] || "";
						}
					});

					setMasks(newMasks);
					setSystemSecrets(newSystemSecrets);
				} catch (e) {
					toast.error(normalizeAxiosError(e));
					onClose();
				} finally {
					setFetchingStore(false);
				}
			})();
		} else {
			reset({ name: "", storeUrl: "", isActive: true });
			setMasks({});
			setSystemSecrets({});
		}

		// Clear all fields
		setFields({});
		setTouched({});
		setFieldErrors({});
	}, [open, isEdit, existingStore?.id, provider]);

	const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

	const isValid = () => {
		const fieldEntries = Object.entries(config.fields || {});
		const requiredUserFields = fieldEntries.filter(([, fc]) => fc.required && fc.userProvides);
		// 1. All required (user-provided) fields satisfied: either existing (mask) or new value
		const allRequiredSatisfied = requiredUserFields.every(([key]) => {
			const hasNewValue = (fields[key]?.trim() || "").length > 0;
			const hasExistingValue = !!(masks[key] || (config.fields[key].systemProvides && systemSecrets[key]));
			return hasExistingValue || hasNewValue;
		});
		if (!allRequiredSatisfied) return false;
		if (isEdit) {
			// 2. On edit: at least one new value in credentials (like shipping) so we don't enable Update with no changes
			const hasAtLeastOneNewValue = fieldEntries.some(([key]) => (fields[key]?.trim() || "").length > 0);
			return hasAtLeastOneNewValue;
		}
		// Create: all required must have value in fields
		return requiredUserFields.every(([key]) => (fields[key]?.trim() || "").length > 0);
	};

	// Regenerate WooCommerce secrets
	const handleRegenerateSecrets = async () => {
		if (!isEdit || provider !== "woocommerce") return;

		setRegeneratingSecrets(true);
		try {
			const res = await api.post(`/stores/${existingStore.id}/regenerate-secrets`);
			const { webhookCreateOrderSecret, webhookUpdateStatusSecret } = res.data;

			setSystemSecrets({
				webhookCreateOrderSecret,
				webhookUpdateStatusSecret,
			});

			toast.success(t("messages.secretsRegenerated"));
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		} finally {
			setRegeneratingSecrets(false);
		}
	};

	// Submit handler
	const onSubmit = async (data) => {
		setError(null);
		let createdStoreId = null;
		// Validate required user-provided fields on create
		if (!isEdit) {
			let hasError = false;
			Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
				if (fieldConfig.userProvides && fieldConfig.required && !fields[fieldName]?.trim()) {
					setFieldErrors((prev) => ({
						...prev,
						[fieldName]: t(`validation.${fieldName}Required`),
					}));
					hasError = true;
				}
			});
			if (hasError) return;
			setFieldErrors({});
		}

		try {
			const payload = {
				name: data.name.trim(),
				storeUrl: data.storeUrl.trim(),
				isActive: data.isActive,
			};

			if (isEdit) {
				// Only include touched user-provided fields
				const credentials = {};
				Object.keys(config.fields).forEach((fieldName) => {
					if (config.fields[fieldName].userProvides && touched[fieldName] && fields[fieldName]?.trim()) {
						credentials[fieldName] = fields[fieldName].trim();
					}
				});

				if (Object.keys(credentials).length > 0) {
					payload.credentials = credentials;
				}

				const res = await api.patch(`/stores/${existingStore.id}`, payload);

				// Update masks
				const freshInteg = res.data?.credentials || {};
				const newMasks = {};
				Object.keys(config.fields).forEach((fieldName) => {
					if (config.fields[fieldName].userProvides) {
						newMasks[fieldName] = freshInteg[fieldName] || "";
					}
				});
				setMasks(newMasks);

				toast.success(t("form.updateSuccess"));
			} else {
				// Create new store
				const credentials = {};
				Object.keys(config.fields).forEach((fieldName) => {
					if (config.fields[fieldName].userProvides) {
						credentials[fieldName] = fields[fieldName]?.trim() || "";
					}
				});

				const res = await api.post("/stores", {
					...payload,
					provider,
					credentials,
				});
				createdStoreId = res.data?.id;
				toast.success(t("form.createSuccess"));
			}

			// Clear fields and reset touched
			setFields({});
			setTouched({});
			await fetchStores();

			if (!isEdit) {
				onClose();
				if (provider === "woocommerce" && createdStoreId) {
					if (typeof onCreated === "function") {
						onCreated(provider, createdStoreId);
					}
				}
			} else {
				onClose();
			}
		} catch (e) {
			const msg = normalizeAxiosError(e);
			setError(msg);
			toast.error(msg);
		}
	};

	const inputCls = "rounded-xl h-[46px] bg-[#fafafa] dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20";

	if (!config) return null;

	return (
		<ModalShell open={open} onOpenChange={(v) => !v && onClose()} maxWidth="max-w-2xl">
			<ModalHeader icon={Settings2} title={t("dialog.title", { provider: config.label })} subtitle={t("dialog.subtitle")} onClose={onClose} />
			<div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto  p-3">
				{fetchingStore ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 size={28} className="animate-spin text-primary" />
					</div>
				) : (
					<>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
							{/* Store Info Section */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<div className="w-0.5 h-5 bg-primary rounded-full" />
									<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
										{t("form.storeInfoSection")}
									</span>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
										{t("form.storeName")}
									</Label>
									<Input {...register("name")} placeholder={t("form.storeNamePlaceholder")} className={inputCls} />
									{errors?.name && <div className="text-xs text-red-600">{errors.name.message}</div>}
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
										{t("form.storeUrl")}
									</Label>
									<Input {...register("storeUrl")} placeholder="https://your-store.com" className={inputCls} />
									{errors?.storeUrl && <div className="text-xs text-red-600">{errors.storeUrl.message}</div>}
								</div>

								{/* {!isEdit && (
									<div className="flex items-center gap-2.5 pt-1">
										<Controller
											control={control}
											name="isActive"
											render={({ field }) => (
												<Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
											)}
										/>
										<Label htmlFor="isActive" className="text-xs font-semibold text-gray-600 dark:text-slate-300">
											{t("form.activeStore")}
										</Label>
									</div>
								)} */}
							</div>

							{/* API Keys Section */}
							{(config.fields.apiKey || config.fields.clientSecret) && (
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<div className="w-0.5 h-5 bg-primary rounded-full" />
										<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
											{t("form.apiKeysSection")}
										</span>
									</div>

									{/* Instructions */}
									{/* <div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-2">
										<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
											<Zap size={13} className="text-primary" />
											{t("instructions.apiKeyTitle")}
										</p>
										{config.instructions.apiKey.map((instruction, idx) => (
											<InstructionStep key={idx} step={idx + 1}>
												{instruction}
											</InstructionStep>
										))}
									</div> */}

									{/* Field Inputs */}
									<div className="grid grid-cols-1 gap-3">
										{config.fields.apiKey && (
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
													{t("form.apiKey")}
												</Label>
												<Input
													value={fields.apiKey || ""}
													placeholder={isEdit ? masks.apiKey || t("form.maskedPlaceholder") : t("form.apiKeyPlaceholder")}
													onChange={(e) => {
														setFields((prev) => ({ ...prev, apiKey: e.target.value }));
														markTouched("apiKey");
													}}
													className={cn(inputCls, masks?.apiKey && "placeholder:text-gray-950 dark:placeholder:text-gray-100")}
												/>
												{fieldErrors.apiKey && <div className="text-xs text-red-600">{fieldErrors.apiKey}</div>}
											</div>
										)}

										{config.fields.clientSecret && (
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
													{t("form.clientSecret")}
												</Label>
												<Input
													value={fields.clientSecret || ""}
													placeholder={isEdit ? masks.clientSecret || t("form.maskedPlaceholder") : t("form.secretPlaceholder")}
													onChange={(e) => {
														setFields((prev) => ({ ...prev, clientSecret: e.target.value }));
														markTouched("clientSecret");
													}}
													className={cn(inputCls, masks?.clientSecret && "placeholder:text-gray-950 dark:placeholder:text-gray-100")}
												/>
												{fieldErrors.clientSecret && <div className="text-xs text-red-600">{fieldErrors.clientSecret}</div>}
											</div>
										)}
									</div>
								</div>
							)}

							{/* Webhooks Section - only on first-time create; when edit use Webhook modal */}
							{!isEdit && (
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<div className="w-0.5 h-5 bg-primary rounded-full" />
										<span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
											{t("form.webhooksSection")}
										</span>
									</div>

									<div className="bg-[#FAFBFF] dark:bg-[#1E1E2E] border border-[#E8E8F0] dark:border-[#3A3A4A] rounded-xl p-3.5 space-y-3">
										<p className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
											<Zap size={13} className="text-primary" />
											{t("instructions.webhooksTitle")}
										</p>

										{/* Webhook URLs (same style as webhook modal) */}
										<div className="space-y-3 pt-2">
											<div className="space-y-0.5">
												<p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
													{t("instructions.webhookCreateOrderLabel")}
												</p>
												<div className="flex gap-2">
													<input
														readOnly
														value={config.webhookEndpoints.create(user?.id)}
														className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
													/>
													<button
														type="button"
														onClick={() => navigator.clipboard.writeText(String(config.webhookEndpoints.create(user?.id) || ""))}
														className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
														title="Copy"
													>
														<Copy size={14} />
													</button>
												</div>
											</div>

											<div className="space-y-0.5">
												<p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
													{t("instructions.webhookUpdateStatusLabel")}
												</p>
												<div className="flex gap-2">
													<input
														readOnly
														value={config.webhookEndpoints.update(user?.id)}
														className="flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]"
													/>
													<button
														type="button"
														onClick={() => navigator.clipboard.writeText(String(config.webhookEndpoints.update(user?.id) || ""))}
														className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all"
														title="Copy"
													>
														<Copy size={14} />
													</button>
												</div>
											</div>

											<p className="text-[11px] text-[var(--muted-foreground)]">
												{t("webhook.urlHint")}
											</p>
										</div>
									</div>

									{/* User-provided webhook secrets */}
									{config.fields.webhookSecret && config.fields.webhookSecret.userProvides && (
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
												{t("form.webhookSecret")}
											</Label>
											<Input
												value={fields.webhookSecret || ""}
												placeholder={isEdit ? masks.webhookSecret || t("form.maskedPlaceholder") : t("form.secretPlaceholder")}
												onChange={(e) => {
													setFields((prev) => ({ ...prev, webhookSecret: e.target.value }));
													markTouched("webhookSecret");
												}}
												className={cn(inputCls, masks?.webhookSecret && "placeholder:text-gray-950 dark:placeholder:text-gray-100")}
											/>
											{fieldErrors.webhookSecret && <div className="text-xs text-red-600">{fieldErrors.webhookSecret}</div>}
										</div>
									)}

									{/* EasyOrder user-provided secrets */}
									{provider === "easyorder" && (
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
													{t("form.webhookCreateOrderSecret")}
												</Label>
												<Input
													value={fields.webhookCreateOrderSecret || ""}
													placeholder={isEdit ? masks.webhookCreateOrderSecret || t("form.maskedPlaceholder") : t("form.secretPlaceholder")}
													onChange={(e) => {
														setFields((prev) => ({ ...prev, webhookCreateOrderSecret: e.target.value }));
														markTouched("webhookCreateOrderSecret");
													}}
													className={cn(inputCls, masks?.webhookCreateOrderSecret && "placeholder:text-gray-950 dark:placeholder:text-gray-100")}
												/>
												{fieldErrors.webhookCreateOrderSecret && (
													<div className="text-xs text-red-600">{fieldErrors.webhookCreateOrderSecret}</div>
												)}
											</div>

											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
													{t("form.webhookUpdateStatusSecret")}
												</Label>
												<Input
													value={fields.webhookUpdateStatusSecret || ""}
													placeholder={isEdit ? masks.webhookUpdateStatusSecret || t("form.maskedPlaceholder") : t("form.secretPlaceholder")}
													onChange={(e) => {
														setFields((prev) => ({ ...prev, webhookUpdateStatusSecret: e.target.value }));
														markTouched("webhookUpdateStatusSecret");
													}}
													className={cn(inputCls, masks?.webhookUpdateStatusSecret && "placeholder:text-gray-950 dark:placeholder:text-gray-100")}
												/>
												{fieldErrors.webhookUpdateStatusSecret && (
													<div className="text-xs text-red-600">{fieldErrors.webhookUpdateStatusSecret}</div>
												)}
											</div>
										</div>
									)}

									{/* WooCommerce system-generated secrets */}
									{/* {provider === "woocommerce" && (
									<>
										{(systemSecrets.webhookCreateOrderSecret || systemSecrets.webhookUpdateStatusSecret) && (
											<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
												<p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
													<AlertCircle size={13} />
													{t("instructions.systemSecretsTitle")}
												</p>
												<p className="text-xs text-amber-700 dark:text-amber-400">
													{t("instructions.systemSecretsDescription")}
												</p>

												{systemSecrets.webhookCreateOrderSecret && (
													<div className="space-y-0.5">
														<p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
															{t("form.webhookCreateOrderSecret")}
														</p>
														<CopyableCode text={systemSecrets.webhookCreateOrderSecret} />
													</div>
												)}

												{systemSecrets.webhookUpdateStatusSecret && (
													<div className="space-y-0.5">
														<p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
															{t("form.webhookUpdateStatusSecret")}
														</p>
														<CopyableCode text={systemSecrets.webhookUpdateStatusSecret} />
													</div>
												)}

												{isEdit && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={handleRegenerateSecrets}
														disabled={regeneratingSecrets}
														className="mt-2"
													>
														{regeneratingSecrets && <Loader2 size={14} className="mr-2 animate-spin" />}
														{t("form.regenerateSecrets")}
													</Button>
												)}
											</div>
										)}
									</>
								)} */}
								</div>
							)}

							{/* Form-level error */}
							{error && (
								<div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
									<AlertCircle size={14} />
									{error}
								</div>
							)}

							{/* Submit Button */}
							<div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-800">
								<PrimaryBtn type="submit" disabled={!isValid() || isSubmitting} loading={isSubmitting} className="w-full">
									{isEdit ? t("form.update") : t("form.create")}
								</PrimaryBtn>
							</div>
						</form>
					</>
				)}
			</div >
		</ModalShell>
	);
}

// ─── Store Webhook Modal (shape/style as shipping WebhookModal) ─────────────────

function StoreWebhookModal({ provider, store, onClose, fetchStores, t }) {
	const config = PROVIDER_CONFIG[provider];
	const user = getUser();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [storeData, setStoreData] = useState(null);
	const [webhookFields, setWebhookFields] = useState({});
	const [rotating, setRotating] = useState(false);

	const copyToClipboard = async (text) => {
		try {
			await navigator.clipboard.writeText(String(text || ""));
			toast.success(t("form.copied") || "Copied");
		} catch (_) { }
	};

	useEffect(() => {
		if (!store?.id) return;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await api.get(`/stores/${store.id}`);
				setStoreData(res.data);
				const cred = res.data?.credentials || {};
				if (provider === "easyorder") {
					setWebhookFields({
						webhookCreateOrderSecret: cred.webhookCreateOrderSecret || "",
						webhookUpdateStatusSecret: cred.webhookUpdateStatusSecret || "",
					});
				} else if (provider === "shopify") {
					setWebhookFields({ webhookSecret: cred.webhookSecret || "" });
				}
			} catch (e) {
				setError(normalizeAxiosError(e));
			} finally {
				setLoading(false);
			}
		})();
	}, [store?.id, provider]);

	const saveSecrets = async () => {
		const credentials = {};
		if (provider === "easyorder") {
			if (webhookFields.webhookCreateOrderSecret?.trim()) credentials.webhookCreateOrderSecret = webhookFields.webhookCreateOrderSecret.trim();
			if (webhookFields.webhookUpdateStatusSecret?.trim()) credentials.webhookUpdateStatusSecret = webhookFields.webhookUpdateStatusSecret.trim();
		} else if (provider === "shopify") {
			if (webhookFields.webhookSecret?.trim()) credentials.webhookSecret = webhookFields.webhookSecret.trim();
		}
		if (Object.keys(credentials).length === 0) return;
		setSaving(true);
		setError(null);
		try {
			await api.patch(`/stores/${store.id}`, { credentials });
			toast.success(t("form.updateSuccess"));
			const res = await api.get(`/stores/${store.id}`);
			setStoreData(res.data);
			const cred = res.data?.credentials || {};
			if (provider === "easyorder") {
				setWebhookFields({
					webhookCreateOrderSecret: cred.webhookCreateOrderSecret || "",
					webhookUpdateStatusSecret: cred.webhookUpdateStatusSecret || "",
				});
			} else if (provider === "shopify") {
				setWebhookFields({ webhookSecret: cred.webhookSecret || "" });
			} else {
				setWebhookFields({});
			}
		} catch (e) {
			setError(normalizeAxiosError(e));
		} finally {
			setSaving(false);
		}
	};

	const rotateWooCommerce = async () => {
		setRotating(true);
		setError(null);
		try {
			const res = await api.post(`/stores/${store.id}/regenerate-secrets`);
			const res2 = await api.get(`/stores/${store.id}`);
			setStoreData(res2.data);
			toast.success(t("messages.secretsRegenerated"));
		} catch (e) {
			setError(normalizeAxiosError(e));
		} finally {
			setRotating(false);
		}
	};

	const cred = storeData?.credentials || {};
	const inputCls = "flex-1 rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)]";

	return (
		<ModalShell onClose={onClose} maxWidth="max-w-lg">
			<ModalHeader icon={Webhook} title={t("webhook.title")} subtitle={t("webhook.subtitle")} onClose={onClose} />

			<div className="p-6 space-y-5">
				<div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
					<p className="text-sm font-semibold text-[var(--card-foreground)] mb-1">{t("webhook.triggerTitle")}</p>
					<p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{t("webhook.triggerDescription")}</p>
				</div>

				{loading && (
					<div className="flex justify-center py-8 text-[var(--muted-foreground)]">
						<Loader2 size={22} className="animate-spin" />
					</div>
				)}

				{!loading && config && (
					<div className="space-y-4">
						{/* Webhook URLs - create */}
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-[var(--card-foreground)]">{t("instructions.webhookCreateOrderLabel")}</label>
							<div className="flex gap-2">
								<input readOnly value={config.webhookEndpoints.create(user?.id)} className={inputCls} />
								<button type="button" onClick={() => copyToClipboard(config.webhookEndpoints.create(user?.id))} className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all" title="Copy">
									<Copy size={14} />
								</button>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-[var(--card-foreground)]">{t("instructions.webhookUpdateStatusLabel")}</label>
							<div className="flex gap-2">
								<input readOnly value={config.webhookEndpoints.update(user?.id)} className={inputCls} />
								<button type="button" onClick={() => copyToClipboard(config.webhookEndpoints.update(user?.id))} className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all" title="Copy">
									<Copy size={14} />
								</button>
							</div>
						</div>
						<p className="text-[11px] text-[var(--muted-foreground)]">{t("webhook.urlHint")}</p>

						{/* EasyOrder / Shopify: user-provided secrets (input + save) */}
						{(provider === "easyorder" || provider === "shopify") && (
							<>
								{provider === "easyorder" && (
									<div className="grid grid-cols-1 gap-3">
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-[var(--card-foreground)]">{t("form.webhookCreateOrderSecret")}</label>
											<Input
												value={webhookFields.webhookCreateOrderSecret ?? ""}
												placeholder={cred.webhookCreateOrderSecret ? (t("form.maskedPlaceholder") || "••••••••") : t("form.secretPlaceholder")}
												onChange={(e) => setWebhookFields((p) => ({ ...p, webhookCreateOrderSecret: e.target.value }))}
												className={inputCls}
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-[var(--card-foreground)]">{t("form.webhookUpdateStatusSecret")}</label>
											<Input
												value={webhookFields.webhookUpdateStatusSecret ?? ""}
												placeholder={cred.webhookUpdateStatusSecret ? (t("form.maskedPlaceholder") || "••••••••") : t("form.secretPlaceholder")}
												onChange={(e) => setWebhookFields((p) => ({ ...p, webhookUpdateStatusSecret: e.target.value }))}
												className={inputCls}
											/>
										</div>
									</div>
								)}
								{provider === "shopify" && (
									<div className="space-y-1.5">
										<label className="text-sm font-medium text-[var(--card-foreground)]">{t("form.webhookSecret")}</label>
										<Input
											value={webhookFields.webhookSecret ?? ""}
											placeholder={cred.webhookSecret ? (t("form.maskedPlaceholder") || "••••••••") : t("form.secretPlaceholder")}
											onChange={(e) => setWebhookFields((p) => ({ ...p, webhookSecret: e.target.value }))}
											className={inputCls}
										/>
									</div>
								)}
								<PrimaryBtn onClick={saveSecrets} disabled={saving} loading={saving} className="w-full">
									{t("form.update")}
								</PrimaryBtn>
							</>
						)}

						{/* WooCommerce: system secrets (read-only + copy + regenerate) */}
						{provider === "woocommerce" && (
							<>
								<div className="grid gap-3 md:grid-cols-2 grid-cols-1">
									{cred.webhookCreateOrderSecret && (
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-[var(--card-foreground)]">{t("form.webhookCreateOrderSecret")}</label>
											<div className="flex gap-2">
												<input readOnly value={cred.webhookCreateOrderSecret} className={inputCls} />
												<button type="button" onClick={() => copyToClipboard(cred.webhookCreateOrderSecret)} className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all" title="Copy">
													<Copy size={14} />
												</button>
											</div>
										</div>
									)}
									{cred.webhookUpdateStatusSecret && (
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-[var(--card-foreground)]">{t("form.webhookUpdateStatusSecret")}</label>
											<div className="flex gap-2">
												<input readOnly value={cred.webhookUpdateStatusSecret} className={inputCls} />
												<button type="button" onClick={() => copyToClipboard(cred.webhookUpdateStatusSecret)} className="px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all" title="Copy">
													<Copy size={14} />
												</button>
											</div>
										</div>
									)}
								</div>
								<div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
									<p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{t("webhook.securityHint")}</p>
									<button type="button" onClick={rotateWooCommerce} disabled={rotating} className="flex items-center gap-2 text-nowrap px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all disabled:opacity-50">
										{rotating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
										<span className="text-xs font-semibold">{t("webhook.rotate")}</span>
									</button>
								</div>
							</>
						)}
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
					{config?.webhookDocsUrl && (
						<a href={config.webhookDocsUrl} target="_blank" rel="noopener noreferrer">
							<PrimaryBtn type="button">
								<ExternalLink size={14} /> {t("webhook.docs")}
							</PrimaryBtn>
						</a>
					)}
				</div>
			</div>
		</ModalShell>
	);
}

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
function pick(bilingualObj, locale) {
	if (!bilingualObj) return "";
	return locale?.startsWith("ar") ? bilingualObj.ar : bilingualObj.en;
}


export function StoreGuideModal({ provider, onClose }) {
	const t = useTranslations("storeIntegrations");
	const user = getUser();
	const locale = useLocale();
	const meta = PROVIDER_CONFIG[provider.code];

	const tabs = meta?.guide?.tabs || [];
	const [activeTab, setActiveTab] = useState(0);
	const [activeStep, setActiveStep] = useState(0);

	const currentSteps = tabs[activeTab]?.steps || [];
	const currentStep = currentSteps[activeStep] || {};
	const p = (obj) => pick(obj, locale);
	const [imgLoaded, setImgLoaded] = useState(false);
	return (
		<ModalShell onClose={onClose} maxWidth="max-w-xl">
			<ModalHeader
				icon={HelpCircle}
				title={t("guide.title", { name: meta?.label })}
				subtitle={t("guide.subtitle", { name: meta?.label })}
				onClose={onClose}
			/>

			{/* Tabs */}
			<div className="flex border-b border-[var(--border)] px-6 gap-1 pt-3 overflow-x-auto scrollbar-none">
				{tabs.map((tab, i) => (
					<button
						key={i}
						onClick={() => { setActiveTab(i); setActiveStep(0); }}
						className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${activeTab === i
							? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
							: "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
							}`}
					>
						{p(tab.label)}
					</button>
				))}
			</div>

			{/* Steps */}
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab + "-" + activeStep}
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
							<p className="text-sm font-semibold text-[var(--card-foreground)]">{p(currentStep?.title)}</p>
							<p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-1">{p(currentStep?.desc)}</p>
							{currentStep?.url && (
								<div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
									{(() => {
										// If URL is a function, call it with store/admin ID (replace with your param)
										const url =
											typeof currentStep.url === "function"
												? currentStep.url(user) // or any param needed
												: currentStep.url;

										return (
											<>
												<a
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-primary hover:underline break-all"
												>
													{url}
												</a>

												<button
													onClick={() => navigator.clipboard.writeText(url)}
													className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition"
												>
													<Copy size={12} className="text-primary" />
												</button>
											</>
										);
									})()}
								</div>
							)}
						</div>
					</div>


					{currentStep?.image && (
						<div
							className="rounded-xl  overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative"
							// reserve vertical space and cap maximum height to viewport
							style={{ minHeight: 160, maxHeight: "60vh" }}
						>
							{/* Skeleton / placeholder shown while image loads */}
							{!imgLoaded && (
								<div className="absolute inset-0 flex items-center justify-center p-4">
									<div className="w-full h-full rounded-md bg-[var(--muted)] animate-pulse" />
								</div>
							)}

							<img
								src={currentStep.image}
								alt={p(currentStep.title)}
								loading="lazy"
								// reserve intrinsic size to avoid layout jump (adjust if you know the image size)
								width={1200}
								height={700}
								onLoad={() => setImgLoaded(true)}
								onError={(e) => {
									e.currentTarget.style.display = "none";
									setImgLoaded(false);
									// show fallback (next sibling placeholder already present)
								}}
								className={`w-full h-full max-h-[350px] object-contain block transition-opacity duration-200 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
								style={{ display: "block" }}
							/>

							{/* fallback UI (keeps same shape) */}
							<div style={{ display: "none" }} className="h-44 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
								<ImageIcon size={28} className="opacity-30" />
								<p className="text-xs">{t("guide.imagePlaceholder")}</p>
							</div>
						</div>
					)}

					{currentStep?.tip && (
						<div className="flex gap-2.5 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
							<Info size={14} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
							<p className="text-xs text-[var(--foreground)] leading-relaxed">{p(currentStep.tip)}</p>
						</div>
					)}
				</motion.div>
			</AnimatePresence>

			{/* Step Navigation */}
			<div className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between gap-3">
				<GhostBtn onClick={() => setActiveStep((v) => Math.max(0, v - 1))} className={activeStep === 0 ? "opacity-30 pointer-events-none" : ""}>
					<ChevronLeft size={14} className={"rtl:-rotate-180 rtl:transition-transform  ltr:transition-transform"} /> {t("guide.prev")}
				</GhostBtn>

				<div className="flex items-center gap-1.5">
					{currentSteps.map((_, i) => (
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

				{activeStep < currentSteps.length - 1 ? (
					<PrimaryBtn onClick={() => setActiveStep((v) => Math.min(currentSteps.length - 1, v + 1))}>
						{t("guide.next")}<ChevronRight
							size={14}
							className={"rtl:rotate-180 rtl:transition-transform  ltr:transition-transform"}
						/>
					</PrimaryBtn>
				) : meta?.guide?.docsUrl ? (
					<a href={meta.guide.docsUrl} target="_blank" rel="noopener noreferrer">
						<PrimaryBtn>
							<ExternalLink size={13} /> {t("guide.docs")}
						</PrimaryBtn>
					</a>
				) : null}
			</div>
		</ModalShell>
	);
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function StoresIntegrationPage() {
	const t = useTranslations("storeIntegrations");
	const router = useRouter();

	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [currentProvider, setCurrentProvider] = useState(null);
	const [currentStore, setCurrentStore] = useState(null);
	const [modalStore, setModalStore] = useState(null);
	const [webhookModalProvider, setWebhookModalProvider] = useState(null);
	const [guideProvider, setGuideProvider] = useState(null);

	const { subscribe } = useSocket();
	useEffect(() => {
		const unsubscribe = subscribe("STORE_SYNC_PAGE", (action) => {
			console.log("Received socket event:", action);
			if (action.type === "STORE_SYNC_STATUS") {
				const { storeId, status } = action.payload;

				setStores((prev) =>
					prev.map((store) =>
						store.id === storeId
							? { ...store, syncStatus: status }
							: store
					)
				);
			}
		});

		return unsubscribe;
	}, [subscribe]);

	useEffect(() => {
		fetchStores();
	}, []);

	const fetchStores = async () => {
		try {
			setLoading(true);
			const res = await api.get("/stores");
			setStores(res.data?.records || []);
		} catch (e) {
			// toast.error(normalizeAxiosError(e));
		} finally {
			setLoading(false);
		}
	};

	const handleConfigure = (provider, store) => {
		setCurrentProvider(provider);
		setCurrentStore(store);
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setCurrentProvider(null);
		setCurrentStore(null);
	};

	const handleOpenWebhook = (provider, store) => {
		setWebhookModalProvider(provider);
		setModalStore(store);
	};

	const handleCloseWebhookModal = () => {
		setWebhookModalProvider(null);
		setModalStore(null);
	};

	const handleOpenGuide = (provider, store) => {
		setGuideProvider(provider);
		setModalStore(store);
	};

	const handleCloseGuide = () => {
		setGuideProvider(null);
		setModalStore(null);

	};

	const handleSync = async (storeId) => {
		try {
			await api.post(`/stores/${storeId}/sync`);
			toast.success(t("messages.syncStarted"));
			await fetchStores();
		} catch (e) {
			toast.error(normalizeAxiosError(e));
		}
	};


	return (
		<div className="min-h-screen p-6 bg-[#f3f6fa] dark:bg-[#19243950]">
			{/* Header */}
			<div className="bg-card  flex flex-col gap-2 mb-4">
				<div className="flex items-center gap-2 text-lg font-semibold">
					<span className="text-gray-400">{t("breadcrumb.home")}</span>
					<ChevronLeft className="text-gray-400" size={18} />
					<span className="text-[rgb(var(--primary))]">{t("breadcrumb.stores")}</span>
					<span className="ml-3 inline-flex w-3.5 h-3.5 rounded-full bg-[rgb(var(--primary))]" />
				</div>
			</div>

			{/* Store Cards Grid */}
			<AnimatePresence mode="wait">
				<motion.div
					key="stores"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
					className="bg-card"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{loading
							? PROVIDERS.map((provider, i) => (
								<SkeletonCard key={provider || i} />
							))
							: PROVIDERS.map((provider, index) => {
								const store = stores.find(
									(s) => s.provider === provider
								);

								return (
									<motion.div
										key={provider}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<StoreCard
											provider={provider}
											store={store}
											t={t}
											onConfigure={handleConfigure}
											onSync={handleSync}
											onOpenWebhook={handleOpenWebhook}
											onOpenGuide={handleOpenGuide}
											fetchStores={fetchStores}
											index={index}
										/>
									</motion.div>
								);
							})}
					</div>
				</motion.div>
			</AnimatePresence>
			{/* Configuration Dialog */}
			{dialogOpen && currentProvider && (
				<StoreConfigDialog
					open={dialogOpen}
					onClose={handleCloseDialog}
					provider={currentProvider}
					existingStore={currentStore}
					fetchStores={fetchStores}
					t={t}
					onCreated={(provider, id) => handleOpenWebhook(provider, { id, provider })}
				/>
			)}

			{/* Guide Modal */}
			{guideProvider && (
				<StoreGuideModal
					provider={{ code: guideProvider }}
					onClose={handleCloseGuide}
				/>
			)}


			{/* Webhook Modal */}
			{webhookModalProvider && modalStore && (
				<StoreWebhookModal
					provider={webhookModalProvider}
					store={modalStore}
					onClose={handleCloseWebhookModal}
					fetchStores={fetchStores}
					t={t}
				/>
			)}
		</div>
	);
}

