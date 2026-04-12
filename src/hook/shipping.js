import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useTranslations, useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const SHIP_PROVIDERS = [
    {
        key: 'bosta',
        code: 'bosta',
        label: { ar: 'بوسطة', en: 'Bosta' },
        img: "/integrate/bosta.png",
        emoji: '📦',
        desc: { ar: 'أسرع شركات التوصيل في مصر', en: 'Fastest delivery companies in Egypt' },
    },
    // {
    //     key: 'jt',
    //     code: 'jt',
    //     label: { ar: 'J&T Express', en: 'J&T Express' },
    //     img: "/integrate/5.png",
    //     emoji: '🚚',
    //     desc: { ar: 'تغطية واسعة في المنطقة العربية', en: 'Wide coverage in the Arab region' },
    // },
    {
        key: 'turbo',
        code: 'turbo',
        label: { ar: 'تيربو', en: 'Turbo' },
        img: "/integrate/4.png",
        emoji: '⚡',
        desc: { ar: 'توصيل سريع داخل المدن', en: 'Fast delivery within cities' },
    },
];

export const PROVIDER_META = {
    bosta: {
        configFields: [
            { key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true, hide: true },
            // { key: "accountId", type: "text", labelKey: "settings.fields.accountId", required: false },
        ],
        webhookHiddenFields: [],
        guide: {
            docsUrl: "https://docs.bosta.co/docs/how-to/get-your-api-key",
            showSteps: false,
            steps: [
                {
                    image: "/guide/bosta/step-img-0.png",
                    tab: { en: "Signup", ar: "إنشاء حساب" },
                    title: { en: "Create a Bosta business account", ar: "إنشاء حساب بوسطة للأعمال" },
                    desc: {
                        en: "Go to https://business.bosta.co/signup then create your account and log in to the dashboard.",
                        ar: "اذهب إلى https://business.bosta.co/signup ثم أنشئ حسابك وسجّل الدخول للوحة التحكم.",
                    },
                    tip: null,
                },
                {
                    image: "/guide/bosta/step-img-settings.png",
                    tab: { en: "Settings", ar: "الإعدادات" },
                    title: { en: "Open Settings from the top bar", ar: "افتح الإعدادات من الأعلى" },
                    desc: {
                        en: "From the dashboard, click the settings icon at the top to open Settings.",
                        ar: "من لوحة التحكم اضغط على أيقونة الإعدادات بالأعلى لفتح صفحة الإعدادات.",
                    },
                    tip: null,
                },
                {
                    image: "/guide/bosta/step-img-1.png",
                    tab: { en: "Integrations", ar: "ربط التطبيقات" },
                    title: { en: "Open the Integrations tab", ar: "افتح تبويب ربط التطبيقات" },
                    desc: {
                        en: "In Settings, open the Integrations tab (ربط التطبيقات).",
                        ar: "داخل الإعدادات افتح تبويب «ربط التطبيقات».",
                    },
                    tip: null,
                },
                {
                    image: "/guide/bosta/step-img-otp.png",
                    tab: { en: "OTP", ar: "OTP" },
                    title: { en: "Request OTP", ar: "اطلب OTP" },
                    desc: {
                        en: "Click Request OTP then enter the code sent to your phone to enable API Integration options.",
                        ar: "اضغط «طلب OTP» ثم أدخل الرمز المرسل إلى هاتفك لتفعيل خيارات التكامل.",
                    },
                    tip: null,
                },
                {
                    image: "/guide/bosta/step-img-api-key.png",
                    tab: { en: "API Key", ar: "مفتاح API" },
                    title: { en: "Create an API key", ar: "إنشاء مفتاح API" },
                    desc: {
                        en: "Click Create API key, set a name and permissions, then copy the key (it will not be shown again).",
                        ar: "اضغط «إنشاء مفتاح API»، اختر اسمًا وصلاحيات، ثم انسخ المفتاح (لن يظهر مرة أخرى).",
                    },
                    tip: null,
                },
                {
                    image: "/guide/bosta/step-img-webhook.png",
                    tab: { en: "Webhook", ar: "Webhook" },
                    title: { en: "Add Webhook URL", ar: "إضافة رابط Webhook" },
                    desc: {
                        en: "Scroll to Webhook section, paste the Webhook URL from your system, and (optionally) set a custom header name + secret.",
                        ar: "انزل إلى قسم الـ Webhook، الصق رابط الـ Webhook من نظامك، ويمكنك إضافة اسم هيدر مخصص + Secret للأمان.",
                    },
                    tip: {
                        en: "Webhook triggers on status changes, not on order creation.",
                        ar: "الـ Webhook يعمل عند تغيّر حالة الشحنة، وليس عند الإنشاء.",
                    },
                },
                {
                    image: null,
                    tab: { en: "Paste & Save", ar: "اللصق والحفظ" },
                    title: { en: "Paste API key here and Save", ar: "الصق المفتاح هنا واضغط حفظ" },
                    desc: {
                        en: "Return to this page, paste API key into Settings, click Save. Then open Webhook modal to copy webhook URL/secret to Bosta.",
                        ar: "ارجع لهذه الصفحة، الصق مفتاح API واضغط حفظ. ثم افتح نافذة Webhook لنسخ الرابط/السر ووضعه في بوسطة.",
                    },
                    tip: null,
                },
            ],
        },
    },

    jt: {
        configFields: [
            { key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true, hide: true },
            { key: "customerId", type: "text", labelKey: "settings.fields.customerId", required: true, hide: false },
        ],
        webhookHiddenFields: [],
        guide: { docsUrl: "https://developer.jtexpress.com", showSteps: false, steps: [] },
    },

    turbo: {
        configFields: [
            { key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true, hide: true },
            { key: "accountId", type: "text", labelKey: "settings.fields.customerId", required: true, hide: false },
        ],
        webhookHiddenFields: ["headerName"],
        guide: {
            mainUrl: "https://turbo-eg.com",
            showSteps: true,
            steps: [
                {
                    image: "/guide/turbo/step1.png",
                    tab: { en: "Login", ar: "تسجيل الدخول" },
                    title: { en: "Login to your account", ar: "تسجيل الدخول إلى حسابك" },
                    desc: {
                        en: "Access your Turbo dashboard using your merchant credentials at https://business.turbo.info/login",
                        ar: "قم بالدخول إلى لوحة تحكم تيربو باستخدام بيانات التاجر الخاصة بك عبر الرابط: https://business.turbo.info/login",
                    },
                },
                {
                    image: "/guide/turbo/step2.png",
                    tab: { en: "Settings", ar: "الإعدادات" },
                    title: { en: "Navigate to Settings", ar: "الانتقال إلى تبويب الإعدادات" },
                    desc: {
                        en: "Go to the Settings tab to find your integration credentials.",
                        ar: "انتقل إلى تبويب الإعدادات (Settings) للعثور على بيانات الربط الخاصة بك.",
                    },
                },
                {
                    image: "/guide/turbo/step3.png",
                    tab: { en: "API Keys", ar: "بيانات الربط" },
                    title: { en: "Copy Credentials", ar: "نسخ كود العميل ومفتاح الربط" },
                    desc: {
                        en: "Locate 'كود العميل الخاص بك' and 'مفتاح الربط الخاص بك'. Copy and paste them into the Account ID and API Key fields here.",
                        ar: "ابحث عن «كود العميل الخاص بك» و «مفتاح الربط الخاص بك». قم بنسخهم ولصقهم في خانة كود العميل ومفتاح API هنا.",
                    },
                },
                {
                    image: "/guide/turbo/step4.png",
                    tab: { en: "Webhook", ar: "الويب هوك" },
                    title: { en: "Configure Webhook", ar: "إعداد الـ Webhook" },
                    desc: {
                        en: "Copy the Webhook URL and Secret from our system and paste them into the Webhook section in your Turbo settings.",
                        ar: "انسخ رابط الـ Webhook والـ Secret من نظامنا والقصقهم في قسم الويب هوك داخل إعدادات تيربو.",
                    },
                },
            ]
        },
    },
};

export function useShippingIntegration(company, integrationStatus, onRefreshStatus) {
    const [toggling, setToggling] = useState(false);
    const [openModal, setOpenModal] = useState(null);
    const meta = PROVIDER_META[company?.code];
    const isConfigured = integrationStatus?.credentialsConfigured ?? false;
    const isActive = integrationStatus?.isActive ?? false;

    const handleToggle = async () => {
        const isConfigured = integrationStatus?.credentialsConfigured ?? false;
        if (!isConfigured) {
            setOpenModal("settings");
            return;
        }

        setToggling(true);
        try {
            const newStatus = !integrationStatus?.isActive;
            await api.post(`/shipping/providers/${company.code}/active`, { isActive: newStatus });
            onRefreshStatus?.();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setToggling(false);
        }
    };

    return {
        meta,
        isActive,
        isConfigured,
        openModal,
        setOpenModal,
        handleToggle,
        toggling
    };
}

export function useShippingSettings(companyCode, callbacks = {}) {
    const { onSaved, onFirstSetup, onClose } = callbacks;
    const t = useTranslations("shipping");
    const locale = useLocale();

    const meta = PROVIDER_META[companyCode];
    const fields = meta?.configFields || [
        { key: "apiKey", type: "password", labelKey: "settings.fields.apiKey", required: true }
    ];
    const provider = SHIP_PROVIDERS.find(p => p.key === companyCode);

    const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, ""])));
    const [showFields, setShowFields] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [integrationData, setIntegrationData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [connected, setConnected] = useState({});
    const [integrations, setIntegrations] = useState({});

    useEffect(() => {
        const entry = integrations[companyCode];
        setIntegrationData(entry);
        if (entry?.credentials) {
            const newValues = {};
            fields.forEach((f) => {
                if (!f.hide && entry.credentials[f.key]) {
                    newValues[f.key] = entry.credentials[f.key];
                }
            });
            setValues(newValues);
        }

        // Also clear any previous UI states
        setError(null);
        setSuccess(false);
    }, [companyCode, integrations]);

    const fetchSetup = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/shipping/integrations/status");
            setIntegrations()
            const integrationsMap = {};
            const connectedMap = {};

            if (data?.integrations) {
                data.integrations.forEach((integration) => {
                    const providerKey = integration.provider;

                    // 1. Map the full object
                    integrationsMap[providerKey] = integration;

                    // 2. Map the connection status
                    if (integration.credentialsConfigured) {
                        connectedMap[providerKey] = true;
                    }
                });
            }

            // Update your states
            setIntegrations(integrationsMap);
            setConnected(connectedMap);

        } catch (e) {
            console.error(e?.response?.data?.message || t("settings.errorFetch"))
            // toast.error(e?.response?.data?.message || t("settings.errorFetch"));
        } finally {
            setLoading(false);
        }
    }, [companyCode]); // values dependency removed to prevent overwrite on re-fetch

    // 💡 Fetch immediately when the hook (and modal) mounts
    useEffect(() => {
        fetchSetup();
    }, []);

    const isEditMode = integrationData?.credentialsConfigured;
    const handleSave = async () => {
        // Check required fields
        const missingRequired = fields.filter(f => f.required && !values[f.key]?.trim());

        // For edit mode: allow save if at least one field has a new value
        const hasAtLeastOneValue = fields.some(f => values[f.key]?.trim());

        if (!isEditMode && missingRequired.length) {
            toast.error(t("settings.errorRequired"));
            return;
        }

        if (isEditMode && !hasAtLeastOneValue) {
            toast.error(t("settings.errorAtLeastOne"));
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const credentials = {};
            fields.forEach(f => {
                const val = values[f.key]?.trim();
                if (val) credentials[f.key] = val;
            });

            await api.post(`/shipping/providers/${companyCode}/credentials`, { credentials });
            setSuccess(true);
            onSaved?.(isEditMode);
            fetchSetup()
            const providerLabel = provider?.label[locale] || provider?.label.en;
            const successMsg = isEditMode
                ? t("settings.toastUpdateSuccess", { provider: providerLabel })
                : t("settings.toastConnectSuccess", { provider: providerLabel });
            toast.success(successMsg || `Successfully ${isEditMode ? 'updated' : 'connected'} ${providerLabel} ✓`);

            const nextStep = integrationData?.credentialsConfigured ? onClose : onFirstSetup;
            setTimeout(() => nextStep?.(), 900);
        } catch (e) {
            toast.error(e?.response?.data?.message || t("settings.error"));
        } finally {
            setSaving(false);
        }
    };

    const setValue = (key, val) => {
        setValues(v => ({ ...v, [key]: val }));
        setSuccess(false);
        setError(null);
    };

    const toggleShow = (key) => setShowFields(v => ({ ...v, [key]: !v[key] }));

    const isFormValid = () => {
        const allRequiredSatisfied = fields
            .filter(f => f.required)
            .every(f => values[f.key]?.trim().length > 0 || !!integrationData?.credentials?.[f.key]);
        const hasNewValue = fields.some(f => values[f.key]?.trim().length > 0);
        return allRequiredSatisfied && hasNewValue;
    };

    return {
        isEditMode,
        fetchSetup, integrations, connected,
        meta, fields, values, setValue,
        saving, loading, error, success,
        showFields, toggleShow,
        handleSave, isFormValid,
        integrationData
    };
}

export function useShippingUsage(companyCode) {
    const t = useTranslations("shipping");
    const [data, setData] = useState({ capabilities: null, services: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchUsageData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [capsRes, svcRes] = await Promise.all([
                    api.get(`/shipping/providers/${companyCode}/capabilities`),
                    api.get(`/shipping/providers/${companyCode}/services`),
                ]);

                if (isMounted) {
                    setData({
                        capabilities: capsRes.data?.capabilities,
                        services: svcRes.data?.services || []
                    });
                }
            } catch (e) {
                if (isMounted) {
                    toast.error(e?.response?.data?.message || t("usage.error"));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (companyCode) {
            fetchUsageData();
        }

        return () => { isMounted = false; };
    }, [companyCode]);

    return {

        capabilities: data.capabilities,
        services: data.services,
        loading,
        error
    };
}

export function useShippingWebhook(companyCode) {
    const t = useTranslations("shipping");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rotating, setRotating] = useState(false);

    // Filter logic based on PROVIDER_META
    const hiddenFields = PROVIDER_META[companyCode]?.webhookHiddenFields || [];
    const isFieldHidden = (key) => hiddenFields.includes(key);

    const fetchSetup = useCallback(async (newCode) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/shipping/providers/${newCode || companyCode}/webhook-setup`);
            setData(res.data);
        } catch (e) {
            toast.error(e?.response?.data?.message || t("webhook.errorFetch"));
        } finally {
            setLoading(false);
        }
    }, [companyCode]);

    useEffect(() => {
        if (companyCode) fetchSetup();
    }, [fetchSetup]);

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(String(text || ""));
            // 💡 Use the translation function
            toast.success(t("copy.success"));
        } catch (_) {
            toast.error(t("copy.error"));
        }
    };

    const handleRotateSecret = async () => {
        setRotating(true);
        setError(null);
        try {
            await api.post(`/shipping/providers/${companyCode}/webhook-setup/rotate-secret`, {});
            await fetchSetup();
            toast.success(t("webhook.rotateSuccess"));
        } catch (e) {
            toast.error(e?.response?.data?.message || t("webhook.errorRotate"));
        } finally {
            setRotating(false);
        }
    };

    return {
        data,
        loading,
        error,
        rotating,
        setData,
        isFieldHidden,
        handleCopy,
        handleRotateSecret,
        refresh: fetchSetup
    };
}