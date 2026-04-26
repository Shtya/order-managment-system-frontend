import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Layers, Package, Send, Truck, X, AlertCircle, Check, Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import api from "@/utils/api";
import { OrderStatus } from "../../orders/tabs/OrderTab";

// --- Carrier Configuration ---
const CARRIER_CONFIG = {
    BOSTA: {
        provider: "bosta",
        requires: ["customerName", "phoneNumber", "firstLine", "cityId", "districtId"],
        hasDistrict: true,
        hasZone: false,
    },
    TURBO: {
        provider: "turbo",
        requires: ["customerName", "phoneNumber", "cityId", "zoneId"],
        hasDistrict: false,
        hasZone: true,
    },
    NONE: { provider: "none", requires: [], hasDistrict: false, hasZone: false },
};

const EG_PHONE_REGEX = /^01[0125][0-9]{8}$/;

const getValidationSchema = (carrierCode, t) => {
    const config = CARRIER_CONFIG[carrierCode] || CARRIER_CONFIG.NONE;
    let shape = {
        customerName: yup.string().required(t("validation.customerNameRequired")),
        phoneNumber: yup.string().matches(EG_PHONE_REGEX, t("validation.invalidEgPhone")).required(t("validation.phoneNumberRequired")),
    };
    if (config.requires.includes("firstLine")) shape.firstLine = yup.string().required(t("validation.firstLineRequired")).min(5, t("validation.firstLineTooShort"));
    if (config.requires.includes("cityId")) shape.cityId = yup.string().required(t("validation.cityIdRequired"));
    if (config.requires.includes("districtId")) shape.districtId = yup.string().required(t("validation.districtIdRequired"));
    if (config.requires.includes("zoneId")) shape.zoneId = yup.string().required(t("validation.zoneIdRequired"));

    return yup.object().shape(shape);
};

export default function AssignCarrierDialog({ open, onClose, orders, selectedOrderCodes, onConfirm, refetchOrders }) {
    const t = useTranslations("warehouse.distribution");
    const { formatCurrency, shippingCompanies } = usePlatformSettings();

    // UI State
    const [carrier, setCarrier] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'fix', 'ineligible'
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Data State
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [localOrders, setLocalOrders] = useState([]); // Store local copy to update after fixes
    const [fixes, setFixes] = useState({}); // { orderId: { customerName, phoneNumber, cityId, zoneId, districtId, firstLine } }
    const [fixErrors, setFixErrors] = useState({}); // { orderId: { field: "error" } }
    const [apiErrors, setApiErrors] = useState({}); // { orderId: "Reason" }

    const geoCache = useRef({
        bosta: { cities: null, zones: {}, districts: {} },
        turbo: { cities: null, zones: {}, districts: {} },
    });


    const [cities, setCities] = useState([]);
    const [zonesMap, setZonesMap] = useState({}); // orderId -> zones[]
    const [districtsMap, setDistrictsMap] = useState({}); // orderId -> districts[]
    const [isCitiesLoading, setIsCitiesLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState({}); // { [orderId]: { zones: boolean, districts: boolean } }

    /** Ready orders the user chose to include in assign (subset of `readyOrders`). */
    const [selectedReadyIds, setSelectedReadyIds] = useState(() => new Set());

    // Setup Local Orders on mount
    useEffect(() => {
        if (!open) {
            setCarrier("");
            setActiveTab("all");
            setFixes({});
            setFixErrors({});
            setApiErrors({});
            return;
        }
        const initialOrders = orders.filter((o) => selectedOrderCodes.includes(o.orderNumber));
        setLocalOrders(initialOrders);
        setSelectedOrders(initialOrders.map((o) => o.orderNumber));

        if (initialOrders.length === 1 && initialOrders[0]?.shippingCompany?.code) {
            setCarrier(initialOrders[0].shippingCompany.code.toUpperCase());
        }
    }, [open, orders, selectedOrderCodes]);

    // --- Validation Logic ---


    const validateOrder = useCallback(async (orderId, carrierCode, orderData) => {
        const schema = getValidationSchema(carrierCode, t);
        try {

            await schema.validate(orderData, { abortEarly: false });

            setFixErrors(prev => ({
                ...prev,
                [orderId]: {}
            }));
            return true;
        } catch (err) {
            const orderErrors = {};

            if (err.inner) {
                err.inner.forEach(e => {
                    orderErrors[e.path] = e.message;
                });
            }

            setFixErrors(prev => ({
                ...prev,
                [orderId]: orderErrors
            }));
            return false;
        }
    }, []);

    const isOrderIneligible = useCallback((order) => {
        const status = order.status?.code;

        const allowedStatuses = [
            OrderStatus.CONFIRMED,
            OrderStatus.FAILED_DELIVERY,
        ];

        console.log("Checking ineligibility for order", order.orderNumber, "with status", status, allowedStatuses.includes(status));
        return !allowedStatuses.includes(status);
    }, []);

    const doesOrderNeedFix = useCallback((order, carrierCode) => {
        if (!carrierCode || carrierCode === "NONE" || isOrderIneligible(order)) return false;

        const config = CARRIER_CONFIG[carrierCode];
        if (!config) return false;

        // If provider changed, treat metadata as invalid
        const isSameProvider = order.shippingCompany?.code?.toLowerCase() === config.provider;
        const meta = isSameProvider && order.shippingMetadata ? order.shippingMetadata : {};

        // Check required fields
        const dataToCheck = {
            ...order,
            cityId: meta.cityId,
            zoneId: meta.zoneId,
            districtId: meta.districtId,
            firstLine: order.address
        };

        const isMissingField = config.requires.some(field => !dataToCheck[field]);
        if (isMissingField) return true;

        const schema = getValidationSchema(carrierCode, t);

        try {
            return !schema.isValidSync(dataToCheck);
        } catch (e) {
            return true;
        }

    }, [isOrderIneligible]);

    // --- Derived Order Lists ---
    const { activeOrders, ineligibleOrders, needsFixOrders, readyOrders } = useMemo(() => {
        const active = localOrders.filter(o =>
            selectedOrders.includes(o.orderNumber)
        );

        const ineligible = active.filter(isOrderIneligible);

        const needsFix = active.filter(o =>
            !isOrderIneligible(o) && doesOrderNeedFix(o, carrier)
        );

        const ready = active.filter(o =>
            !isOrderIneligible(o) && !doesOrderNeedFix(o, carrier)
        );

        return {
            activeOrders: active,
            ineligibleOrders: ineligible,
            needsFixOrders: needsFix,
            readyOrders: ready
        };
    }, [localOrders, selectedOrders, carrier, isOrderIneligible, doesOrderNeedFix]);

    const readyIdsKey = useMemo(() => readyOrders.map((o) => o.id).join(","), [readyOrders]);

    const selectedReadyOrders = useMemo(
        () => readyOrders.filter((o) => selectedReadyIds.has(o.id)),
        [readyOrders, selectedReadyIds],
    );

    const toggleReadySelection = useCallback((orderId) => {
        setSelectedReadyIds((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    }, []);

    // Default: all ready orders selected whenever the ready set changes (open, carrier, data).
    useEffect(() => {
        if (!open) {
            setSelectedReadyIds(new Set());
            return;
        }
        setSelectedReadyIds(new Set(readyOrders.map((o) => o.id)));
    }, [open, readyIdsKey]);

    // --- Geography Data Fetching ---
    const fetchCities = useCallback(async (provider) => {
        if (geoCache.current[provider].cities) {
            setCities(geoCache.current[provider].cities);
            return;
        }

        setIsCitiesLoading(true);
        try {
            const res = await api.get(`/shipping/cities/${provider}`);
            geoCache.current[provider].cities = res.data?.records || [];
            setCities(geoCache.current[provider].cities);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCitiesLoading(false);
        }
    }, [api]);

    const fetchZonesAndDistricts = useCallback(async (provider, cityId, orderId, fetchDistricts = false) => {
        if (!cityId) return;

        // Set loading for this specific order
        setGeoLoading(prev => ({
            ...prev,
            [orderId]: { zones: true, districts: fetchDistricts }
        }));

        const promises = [];

        if (!geoCache.current[provider].zones[cityId]) {
            promises.push(
                api.get(`/shipping/zones/${provider}/${cityId}`)
                    .then(res => {
                        geoCache.current[provider].zones[cityId] = res.data?.records || [];
                    })
            );
        }

        if (fetchDistricts && !geoCache.current[provider].districts[cityId]) {
            promises.push(
                api.get(`/shipping/districts/${provider}/${cityId}`)
                    .then(res => {
                        geoCache.current[provider].districts[cityId] = res.data?.records || [];
                    })
            );
        }

        try {
            if (promises.length > 0) await Promise.all(promises);
        } catch (e) {
            console.error("Geo Fetch Error:", e);
        } finally {
            // Clear loading for this order
            setGeoLoading(prev => ({
                ...prev,
                [orderId]: { zones: false, districts: false }
            }));

            // Update Maps
            setZonesMap(prev => ({
                ...prev,
                [orderId]: geoCache.current[provider].zones[cityId] || []
            }));

            if (fetchDistricts) {
                setDistrictsMap(prev => ({
                    ...prev,
                    [orderId]: geoCache.current[provider].districts[cityId] || []
                }));
            }
        }
    }, [api]);

    useEffect(() => {
        const initializeCities = async () => {
            if (!carrier || carrier === "NONE") return;

            const config = CARRIER_CONFIG[carrier];
            if (config) await fetchCities(config.provider);
        };

        initializeCities();
    }, [carrier]);
    // Effect: Pre-populate fix forms and load initial cities when carrier changes
    useEffect(() => {
        const initializeFixes = async () => {
            if (!carrier || carrier === "NONE") return;

            const config = CARRIER_CONFIG[carrier];

            const newFixes = {};
            for (const order of needsFixOrders) {
                const isSameProvider = order.shippingCompany?.code?.toLowerCase() === config.provider;
                const meta = isSameProvider && order.shippingMetadata ? order.shippingMetadata : {};

                newFixes[order.id] = {
                    customerName: order.customerName || "",
                    phoneNumber: order.phoneNumber || "",
                    firstLine: order.firstLine || order.address || "",
                    cityId: meta.cityId || "",
                    zoneId: meta.zoneId || "",
                    districtId: meta.districtId || "",
                };
            }

            setFixes(newFixes);


            if (needsFixOrders.length > 0) {
                const isValid = await validateFixes(newFixes);
                setActiveTab("fix");
            } else {
                setActiveTab("all");
            }
        };

        initializeFixes();
    }, [carrier, needsFixOrders.length]);

    // --- Interaction Handlers ---
    const handleFixChange = useCallback((orderId, field, value) => {
        setFixes(prev => {
            const updated = { ...prev[orderId], [field]: value };

            // Cascading resets
            if (field === 'cityId') {
                updated.zoneId = "";
                updated.districtId = "";
                const config = CARRIER_CONFIG[carrier];
                fetchZonesAndDistricts(config.provider, value, orderId, config.hasDistrict);
            }
            if (field === 'zoneId') {
                updated.districtId = ""; // Reset district when zone changes (if applicable)
            }
            return { ...prev, [orderId]: updated };
        });

        // Clear error on type
        if (fixErrors[orderId]?.[field]) {
            setFixErrors(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: null } }));
        }
    }, [carrier]);


    const validateFixes = useCallback(async (newFixes) => {
        const schema = getValidationSchema(carrier, t);
        let isValid = true;
        const newErrors = {};
        const finalFixes = newFixes || fixes;

        for (const order of needsFixOrders) {
            try {
                await schema.validate(finalFixes[order.id], { abortEarly: false });
            } catch (err) {
                isValid = false;
                newErrors[order.id] = {};
                if (err.inner) {
                    err.inner.forEach(e => {
                        newErrors[order.id][e.path] = e.message;
                    });
                }
            }
        }
        setFixErrors(newErrors);
        return isValid;
    }, [carrier, fixes, needsFixOrders]);


    const submitFixes = async () => {
        const isValid = await validateFixes();
        if (!isValid) return;

        setUpdating(true);
        setApiErrors({}); // Reset previous API errors

        try {
            // Map data to match BulkUpdateShippingFieldsDto (using "items" and "address")
            const provider = CARRIER_CONFIG[carrier]?.provider;
            const payload = {
                code: provider,
                items: needsFixOrders.map(order => ({
                    id: order.id,
                    customerName: fixes[order.id].customerName,
                    phoneNumber: fixes[order.id].phoneNumber,
                    address: fixes[order.id].firstLine, // Backend expects "address"
                    shippingMetadata: {
                        cityId: fixes[order.id].cityId,
                        zoneId: fixes[order.id].zoneId,
                        districtId: fixes[order.id].districtId,
                    }
                }))
            };

            await api.patch(`/orders/bulk-update-shipping-info`, payload);

            // --- SUCCESS CASE ---
            // Because the backend is a transaction, if we reach here, ALL orders were updated.

            const updatedLocalOrders = localOrders.map(order => {
                const fix = payload.items.find(p => p.id === order.id);
                if (fix) {
                    return {
                        ...order,
                        customerName: fix.customerName,
                        phoneNumber: fix.phoneNumber,
                        address: fix.address,
                        shippingMetadata: fix.shippingMetadata,
                        shippingCompany: {
                            ...order.shippingCompany,
                            code: provider
                        }
                    };
                }
                return order;
            });

            setLocalOrders(updatedLocalOrders);
            toast.success(t("assign.fixedSuccessfully", { count: payload.items.length }));

            // Return to the main tab since everything is fixed
            setActiveTab("all");
            await refetchOrders?.();

        } catch (error) {
            // --- ERROR CASE ---
            // Handle NestJS BadRequestException which contains the "errors" array
            const responseData = error.response?.data;

            if (responseData?.errors && Array.isArray(responseData.errors)) {
                const newApiErrors = {};
                responseData.errors.forEach(err => {
                    newApiErrors[err.id] = err.reason;
                });

                setApiErrors(newApiErrors);
                toast.error(responseData.message || t("assign.fixErrorsDetected"));
            } else {
                toast.error(error.message || t("common.error"));
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleAssign = async () => {
        if (!carrier || selectedReadyOrders.length === 0) return;
        setLoading(true);
        try {
            const provider = carrier.toLowerCase();
            const orderIds = selectedReadyOrders.map((o) => o.id);

            let res;
            if (orderIds.length === 1) {
                res = await api.post(`/shipping/providers/${provider}/orders/${orderIds[0]}/assign`, {});
            } else {
                res = await api.post(`/shipping/providers/${provider}/orders/bulk-assign`, {
                    items: orderIds.map(id => ({ orderId: Number(id) })),
                });
            }

            if (orderIds.length === 1) {
                toast.success(t("modal.assignSuccess"));
            } else {
                toast.success(t("modal.assigningInProgress"));
            }
            onClose();
            onConfirm?.(orderIds, res?.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t("modal.assignFailed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "!max-w-none w-[min(100vw-1rem,72rem)] sm:w-[min(calc(100vw-2rem),72rem)] max-h-[min(92dvh,92vh)] flex flex-col p-0 gap-0 rounded-2xl border-0 shadow-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden",
                )}
            >
                {/* Header & Stats Cards */}
                <div className="relative shrink-0 bg-[var(--primary)] px-3 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 rounded-t-2xl">
                    <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />

                    <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <Layers className="text-white" size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-white text-base sm:text-xl font-bold leading-tight">{t("modal.assignCarrierTitle")}</h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 shrink-0 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center"
                        >
                            <X size={16} className="text-white" />
                        </button>
                    </div>

                    {/* Metric Cards — glass on brand purple for contrast */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        <StatCard title={t("assign.totalSelected")} count={activeOrders.length} icon={<Layers size={14} className="text-white" />} tone="neutral" />
                        <StatCard
                            title={t("assign.ready")}
                            count={readyOrders.length}
                            tone="success"
                            icon={<CheckCircle2 size={14} className="text-emerald-100" />}
                        />
                        <StatCard title={t("assign.needsFix")} count={needsFixOrders.length} tone="warning" icon={<AlertCircle size={14} className="text-amber-100" />} />
                        <StatCard title={t("assign.ineligible")} count={ineligibleOrders.length} tone="danger" icon={<X size={14} className="text-rose-100" />} />
                    </div>
                </div>

                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    {/* Carrier Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {t("assign.requiredCarrier")} *
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {['NONE', ...shippingCompanies.map(c => c.provider?.toUpperCase())].map(providerCode => {
                                const isSelected = carrier === providerCode;
                                return (
                                    <button
                                        key={providerCode}
                                        onClick={() => setCarrier(providerCode)}
                                        className={cn(
                                            "py-2.5 rounded-xl border-2 text-xs font-bold transition-all",
                                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        {providerCode}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-px -mx-1 px-1">
                        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label={t("assign.tabAllOrders")} count={activeOrders.length} />
                        <TabButton active={activeTab === 'fix'} onClick={() => setActiveTab('fix')} label={t("assign.tabNeedsFix")} count={needsFixOrders.length} isWarning={needsFixOrders.length > 0} />
                        <TabButton active={activeTab === 'ineligible'} onClick={() => setActiveTab('ineligible')} label={t("assign.tabIneligible")} count={ineligibleOrders.length} />
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px] sm:min-h-[300px]">
                        {activeTab === 'all' && (
                            <div className="space-y-2 max-h-[min(400px,50dvh)] sm:max-h-[400px] overflow-y-auto overflow-x-hidden pr-0.5">
                                {activeOrders.map((order) => {
                                    const isReady = readyOrders.some((o) => o.id === order.id);
                                    const isChecked = selectedReadyIds.has(order.id);

                                    if (isReady) {
                                        return (
                                            <button
                                                key={order.id}
                                                type="button"
                                                onClick={() => toggleReadySelection(order.id)}
                                                className={cn(
                                                    "w-full text-left rounded-xl border-2 p-3 flex items-center gap-3 transition-all",
                                                    isChecked
                                                        ? "bg-white dark:bg-slate-900 border-[var(--primary)]/40 shadow-sm"
                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300",
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                        isChecked
                                                            ? "border-[var(--primary)] bg-[var(--primary)]"
                                                            : "border-slate-300 dark:border-slate-600",
                                                    )}
                                                >
                                                    {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-primary truncate">{order.orderNumber}</span>
                                                        <span className="text-xs text-slate-500 truncate">{order.customerName}</span>
                                                    </div>
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold shrink-0">
                                                        {t("assign.ready")}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }

                                    return (
                                        <div
                                            key={order.id}
                                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between bg-white dark:bg-slate-950"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-primary truncate">{order.orderNumber}</span>
                                                <span className="text-xs text-slate-500 truncate">{order.customerName}</span>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                                                {doesOrderNeedFix(order, carrier) && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">{t("assign.needsFix")}</span>
                                                )}
                                                {isOrderIneligible(order) && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] rounded-full font-bold">{t("assign.ineligible")}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'fix' && (
                            <div className="space-y-4">
                                {/* Header Action Bar */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                                    {needsFixOrders.length > 0 && (
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {t("assign.fixRequiredValues", { count: needsFixOrders.length })}
                                        </h3>
                                    )}

                                    {needsFixOrders.length > 0 && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={submitFixes}
                                            disabled={updating}
                                            type="button"
                                            className="h-10 px-5 flex items-center gap-2 text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                            style={{
                                                background: `linear-gradient(135deg, rgb(var(--primary-from, 103, 99, 175)), rgb(var(--primary-to, 80, 76, 144)))`,
                                                boxShadow: `0 4px 14px rgb(var(--primary-shadow, 103, 99, 175) / 0.4)`,
                                            }}
                                        >
                                            {updating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            {updating ? t("common.saving") : t("common.saveMissingData")}
                                        </motion.button>
                                    )}
                                </div>

                                {/* Table Container */}
                                {needsFixOrders.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        {t("assign.allSetNoFixes")}
                                    </div>
                                ) : (
                                    <div className="table-container border rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                            {t("fields.orderNumber")}
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                            {t("fields.customerName")}
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[140px]">
                                                            {t("fields.phoneNumber")}
                                                        </th>
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("firstLine") && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[200px]">
                                                                {t("fields.address")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("cityId") && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("fields.city")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.hasZone && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("fields.zone")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.hasDistrict && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("fields.district")}
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {needsFixOrders.map((order, idx) => {
                                                        const fix = fixes[order.id] || {};
                                                        const errs = fixErrors[order.id] || {};
                                                        const apiErr = apiErrors[order.id];
                                                        const config = CARRIER_CONFIG[carrier];

                                                        return (
                                                            <motion.tr
                                                                key={order.id}
                                                                initial={{ opacity: 0, y: 4 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.035 }}
                                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 align-top">
                                                                    <span className="font-bold text-primary block mt-2">{order.orderNumber}</span>
                                                                    {apiErr && <span className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded mt-1 inline-block">{apiErr}</span>}
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <TableInput
                                                                        value={fix.customerName}
                                                                        error={errs.customerName}
                                                                        onChange={(e) => handleFixChange(order.id, 'customerName', e.target.value)}
                                                                        placeholder={t("placeholders.customerName")}
                                                                    />
                                                                </td>

                                                                <td className="px-4 py-3 align-top">
                                                                    <TableInput
                                                                        value={fix.phoneNumber}
                                                                        error={errs.phoneNumber}
                                                                        onChange={(e) => handleFixChange(order.id, 'phoneNumber', e.target.value)}
                                                                        placeholder={t("placeholders.phoneNumber")}
                                                                        dir="ltr"
                                                                    />
                                                                </td>

                                                                {config?.requires.includes("firstLine") && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableInput
                                                                            value={fix.firstLine}
                                                                            error={errs.firstLine}
                                                                            onChange={(e) => handleFixChange(order.id, 'firstLine', e.target.value)}
                                                                            placeholder={t("placeholders.address")}
                                                                        />
                                                                    </td>
                                                                )}

                                                                {/* City Select */}
                                                                {config?.requires.includes("cityId") && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableSelect
                                                                            value={fix.cityId}
                                                                            isLoading={isCitiesLoading} // Global city loading
                                                                            loadingText={t("loading")}
                                                                            error={errs.cityId}
                                                                            options={cities}
                                                                            onChange={(val) => handleFixChange(order.id, 'cityId', val)}
                                                                            placeholder={t("placeholders.city")}
                                                                        />
                                                                    </td>
                                                                )}

                                                                {/* Zone Select */}
                                                                {config?.hasZone && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableSelect
                                                                            value={fix.zoneId}
                                                                            error={errs.zoneId}
                                                                            disabled={!fix.cityId}
                                                                            isLoading={geoLoading[order.id]?.zones} // Per-order zone loading
                                                                            loadingText={t("loading")}
                                                                            options={zonesMap[order.id] || []}
                                                                            onChange={(val) => handleFixChange(order.id, 'zoneId', val)}
                                                                            placeholder={t("placeholders.zone")}
                                                                        />
                                                                    </td>
                                                                )}

                                                                {/* District Select */}
                                                                {config?.hasDistrict && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableSelect
                                                                            value={fix.districtId}
                                                                            error={errs.districtId}
                                                                            disabled={!fix.cityId}
                                                                            isLoading={geoLoading[order.id]?.districts} // Per-order district loading
                                                                            loadingText={t("loading")}
                                                                            options={districtsMap[order.id] || []}
                                                                            onChange={(val) => handleFixChange(order.id, 'districtId', val)}
                                                                            placeholder={t("placeholders.district")}
                                                                        />
                                                                    </td>
                                                                )}
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ineligible' && (
                            <div className="space-y-2 max-h-[min(400px,50dvh)] sm:max-h-[400px] overflow-y-auto">
                                {ineligibleOrders.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        {t("assign.noIneligible")}
                                    </div>
                                ) : ineligibleOrders.map(order => (
                                    <div key={order.id} className="p-3 border border-red-100 bg-red-50/50 rounded-xl flex items-center justify-between">
                                        <span className="font-bold text-slate-700">{order.orderNumber}</span>
                                        <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                                            {order.trackingNumber ? t("assign.alreadyShipped") : t("assign.invalidStatus")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mb-2 sm:mb-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <Button variant="outline" onClick={onClose} disabled={loading || updating} className="w-full sm:w-auto">
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={loading || updating || !carrier || selectedReadyOrders.length === 0 || needsFixOrders.length > 0}
                            className="w-full sm:w-auto bg-primary"
                        >
                            {loading ? t("assign.assigning") : t("assign.assignOrdersCount", { count: selectedReadyOrders.length })}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Small UI Sub-components ---

function StatCard({ title, count, subtitle, icon, tone = "neutral" }) {
    const toneClass =
        tone === "success"
            ? "border-emerald-200/35 bg-emerald-500/20"
            : tone === "warning"
                ? "border-amber-200/35 bg-amber-500/20"
                : tone === "danger"
                    ? "border-rose-200/35 bg-red-500/20"
                    : "border-white/25 bg-white/10";

    return (
        <div
            className={cn(
                "rounded-xl border p-2.5 sm:p-3 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
                toneClass,
            )}
        >
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                {icon}
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/80 leading-tight">{title}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tabular-nums">{count}</p>
            {subtitle != null && subtitle !== "" && (
                <p className="text-[10px] font-semibold text-white/65 mt-0.5 tabular-nums">{subtitle}</p>
            )}
        </div>
    );
}

function TabButton({ active, onClick, label, count, isWarning }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "min-w-0 flex-1 sm:flex-none px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2",
                active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                isWarning && active ? "border-amber-500 text-amber-600 dark:text-amber-500" : "",
            )}
        >
            <span className="truncate">{label}</span>
            <span
                className={cn(
                    "shrink-0 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full tabular-nums",
                    active ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                )}
            >
                {count}
            </span>
        </button>
    );
}

function TableInput({ value, onChange, error, placeholder, dir }) {

    return (
        <div className="space-y-1">
            <Input
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder}
                dir={dir}
                className={cn("h-9 text-sm", error && "border-red-500 focus-visible:ring-red-500")}
            />
            {error && <p className="text-[10px] text-red-500 leading-tight">{error}</p>}
        </div>
    );
}

function TableSelect({
    value,
    options,
    onChange,
    error,
    disabled,
    placeholder,
    isLoading = false,
    loadingText = "Loading..."
}) {
    return (
        <div className="space-y-1">
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || isLoading}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus-visible:ring-red-500",
                    isLoading && "animate-pulse bg-slate-50 dark:bg-slate-900/50" // Adds a subtle visual pulse
                )}
            >
                {/* Dynamically switch the default option based on loading state */}
                <option value="" disabled>
                    {isLoading ? loadingText : placeholder}
                </option>

                {/* Only render options if we are not loading */}
                {!isLoading && options?.map(opt => (
                    <option key={opt.id} value={String(opt.id)}>
                        {opt.nameAr || opt.nameEn || opt.name || `#${opt.id}`}
                    </option>
                ))}
            </select>

            {/* Don't show validation errors while it's actively loading */}
            {error && !isLoading && (
                <p className="text-[10px] text-red-500 leading-tight">{error}</p>
            )}
        </div>
    );
}