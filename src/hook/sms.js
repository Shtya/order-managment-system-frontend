import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const SMS_PROVIDERS = [
    {
        key: 'smseg',
        code: 'smseg',
        label: { ar: 'SMSEG', en: 'SMSEG' },
        img: "/integrate/smseg.png",
        desc: { ar: 'بوابة إرسال الرسائل النصية', en: 'SMS gateway provider' },
        bg: "bg-[linear-gradient(300.09deg,#FAFAFA_74.95%,#B5CBE9_129.29%)]",
        accent: "#2563a8",
        accentBg: "#dbeafe",
        strip: "linear-gradient(90deg,#2563a8,#60a5fa)",
    },
];

export const PROVIDER_META = {
    smseg: {
        configFields: [
            { key: "username", type: "text", labelKey: "settings.fields.username", required: true, hide: false },
            { key: "password", type: "password", labelKey: "settings.fields.password", required: true, hide: true },
        ],
    },
};

export function useSmsIntegration(provider, integrationStatus, onRefreshStatus) {
    const [toggling, setToggling] = useState(false);
    const [openModal, setOpenModal] = useState(null);
    const meta = PROVIDER_META[provider?.code];
    // const isConfigured = integrationStatus?.credentialsConfigured ?? false;
    const isActive = integrationStatus?.isActive ?? false;
    const handleToggle = async () => {
        // const isConfigured = integrationStatus?.credentialsConfigured ?? false;
        // if (!isConfigured) {
        //     setOpenModal("settings");
        //     return;
        // }

        setToggling(true);
        try {
            const newStatus = !integrationStatus?.isActive;
            await api.post(`/sms/integrations/${provider.code}/toggle-active`, { isActive: newStatus });
            onRefreshStatus?.();
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setToggling(false);
        }
    };

    return {
        meta,
        isConfigured: !!integrationStatus,
        isActive,
        toggling,
        openModal,
        setOpenModal,
        handleToggle,
    };
}

export function useSmsSettings(providerCode, { onClose, onSaved } = {}) {
    const meta = PROVIDER_META[providerCode];
    const fields = meta?.configFields || [];
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showFields, setShowFields] = useState({});
    const [integrationData, setIntegrationData] = useState(null);

    const setValue = useCallback((key, val) => {
        setValues((prev) => ({ ...prev, [key]: val }));
        setError(null);
    }, []);

    const toggleShow = useCallback((key) => {
        setShowFields((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    useEffect(() => {
        if (!providerCode) return;
        let cancelled = false;
        setLoading(true);
        api.get(`/sms/integrations/${providerCode}`).then(({ data }) => {
            if (cancelled) return;
            setIntegrationData(data);
        }).catch(() => {
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [providerCode]);

    useEffect(() => {
        const entry = integrationData;
        console.log("entry?.credentials: ", entry?.credentials)
        if (entry?.credentials) {
            const newValues = {};
            fields.forEach((f) => {
                if (!f.hide && entry.credentials[f.key]) {
                    newValues[f.key] = entry.credentials[f.key];
                }
            });
            setValues(newValues);
        } else {
            setValues({});
        }

        setError(null);
        setSuccess(false);
    }, [providerCode, integrationData, fields]);
    console.log("values: ", values)
    const isFormValid = useCallback(() => {
        return fields.every((f) => !f.required || values[f.key]?.trim());
    }, [fields, values]);

    const handleSave = useCallback(async () => {
        if (!isFormValid()) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await api.post(`/sms/integrations`, {...values, providerCode});
            setSuccess(true);
            toast.success("saved successfully");
            onSaved?.();
            onClose?.();
        } catch (e) {
            const msg = normalizeAxiosError(e);
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }, [isFormValid, providerCode, values, onClose, onSaved]);

    return {
        fields,
        values,
        setValue,
        toggleShow,
        showFields,
        handleSave,
        isFormValid,
        loading,
        saving,
        error,
        success,
        integrationData,
        meta,
    };
}
