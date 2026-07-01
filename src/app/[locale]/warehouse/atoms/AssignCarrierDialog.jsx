import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
//cityId - districtId - customerName - phoneNumber - address - packageType - size
// --- Carrier Configuration ---    
import { CARRIER_CONFIG } from "@/utils/order-utils";



const EG_PHONE_REGEX = /^01[0125][0-9]{8}$/;


export default function AssignCarrierDialog({ open, onClose, orders, selectedOrderCodes, onConfirm, refetchOrders }) {
    const t = useTranslations("warehouse.distribution");
    const getValidationSchema = (carrierCode, t) => {
        const config = CARRIER_CONFIG[carrierCode] || CARRIER_CONFIG.NONE;
        let shape = {
            customerName: yup.string().required(t("validation.customerNameRequired")),
            phoneNumber: yup.string().matches(EG_PHONE_REGEX, t("validation.invalidEgPhone")).required(t("validation.phoneNumberRequired")),
        };
        if (config.requires.includes("email")) shape.email = yup.string().email(t("validation.invalidEmail")).required(t("validation.emailRequired"));
        if (config.requires.includes("firstLine")) shape.firstLine = yup.string().required(t("validation.firstLineRequired")).min(5, t("validation.firstLineTooShort"));
        if (config.requires.includes("cityId")) shape.cityId = yup.string().required(t("validation.cityIdRequired"));
        if (config.requires.includes("districtId")) shape.districtId = yup.string().required(t("validation.districtIdRequired"));
        if (config.requires.includes("zoneId")) shape.zoneId = yup.string().required(t("validation.zoneIdRequired"));
        if (config.requires.includes("orderSize")) shape.orderSize = yup.string().optional();

        return yup.object().shape(shape);
    };
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
        unifiedCities: null,
        bosta: { zones: {}, districts: {} },
        turbo: { zones: {}, districts: {} },
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
        ];

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
            cityId: order.cityId, // Use top-level cityId
            zoneId: meta.zoneId,
            districtId: meta.districtId,
            orderSize: meta.orderSize,
            firstLine: order.address,
            email: order.email

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
        setIsCitiesLoading(true);
        try {
            if (!geoCache.current.unifiedCities) {
                const res = await api.get(`/cities`);
                geoCache.current.unifiedCities = res.data || [];
            }

            const mappedCities = geoCache.current.unifiedCities
                .map(city => {
                    const matched = city.providerLocations?.find(pl => pl.provider.toLowerCase() === provider.toLowerCase());
                    return {
                        ...city,
                        providerCityId: matched?.providerCityId,
                        dropOff: matched?.dropOff ?? false,
                        pickup: matched?.pickup ?? false,
                    };
                })
                .filter(city => city.dropOff); // Exclude cities where dropOff is false

            setCities(mappedCities);
            return mappedCities;
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            setIsCitiesLoading(false);
        }
    }, [api]);

    const fetchZonesAndDistricts = useCallback(async (provider, providerCityId, orderIds, fetchDistricts = false) => {
        if (!providerCityId || orderIds.length === 0) return;

        // Set loading for all orderIds
        setGeoLoading(prev => {
            const newGeoLoading = { ...prev };
            orderIds.forEach(orderId => {
                newGeoLoading[orderId] = { zones: true, districts: fetchDistricts };
            });
            return newGeoLoading;
        });

        const promises = [];

        if (!geoCache.current[provider].zones[providerCityId]) {
            promises.push(
                api.get(`/shipping/zones/${provider}/${providerCityId}`)
                    .then(res => {
                        geoCache.current[provider].zones[providerCityId] = res.data?.records || [];
                    })
            );
        }

        if (fetchDistricts && !geoCache.current[provider].districts[providerCityId]) {
            promises.push(
                api.get(`/shipping/districts/${provider}/${providerCityId}`)
                    .then(res => {
                        geoCache.current[provider].districts[providerCityId] = res.data?.records || [];
                    })
            );
        }

        try {
            if (promises.length > 0) await Promise.all(promises);
        } catch (e) {
            console.error("Geo Fetch Error:", e);
        } finally {
            // Clear loading for all orderIds
            setGeoLoading(prev => {
                const newGeoLoading = { ...prev };
                orderIds.forEach(orderId => {
                    newGeoLoading[orderId] = { zones: false, districts: false };
                });
                return newGeoLoading;
            });

            // Update Maps for all orderIds
            setZonesMap(prev => {
                const newZonesMap = { ...prev };
                const zonesData = geoCache.current[provider].zones[providerCityId] || [];
                orderIds.forEach(orderId => {
                    newZonesMap[orderId] = zonesData;
                });
                return newZonesMap;
            });

            if (fetchDistricts) {
                setDistrictsMap(prev => {
                    const newDistrictsMap = { ...prev };
                    const districtsData = geoCache.current[provider].districts[providerCityId] || [];
                    orderIds.forEach(orderId => {
                        newDistrictsMap[orderId] = districtsData;
                    });
                    return newDistrictsMap;
                });
            }
        }
    }, []);

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
            const latestCities = await fetchCities(config.provider);

            const newFixes = {};
            const cityIdToOrderIds = {};

            for (const order of needsFixOrders) {
                const isSameProvider = order.shippingCompany?.code?.toLowerCase() === config.provider;
                const meta = isSameProvider && order.shippingMetadata ? order.shippingMetadata : {};

                newFixes[order.id] = {
                    customerName: order.customerName || "",
                    phoneNumber: order.phoneNumber || "",
                    firstLine: order.firstLine || order.address || "",
                    email: order.email || "",
                    cityId: order.cityId || "",
                    zoneId: meta.zoneId || "",
                    districtId: meta.districtId || "",
                    orderSize: meta.orderSize || "MEDIUM",
                };

                // Group orders by city.providerCityId
                if (order.cityId) {
                    const city = latestCities.find(c => String(c.id) === String(order.cityId));
                    if (city?.providerCityId) {
                        if (!cityIdToOrderIds[city.providerCityId]) {
                            cityIdToOrderIds[city.providerCityId] = [];
                        }
                        cityIdToOrderIds[city.providerCityId].push(order.id);
                    }
                }
            }

            // Trigger fetch for each unique city.providerCityId with all orderIds
            for (const providerCityId of Object.keys(cityIdToOrderIds)) {
                fetchZonesAndDistricts(config.provider, providerCityId, cityIdToOrderIds[providerCityId], config.hasDistrict);
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
    const handleFixChange = useCallback(async (orderId, field, value) => {
        // 1. Calculate the new state for this specific order
        let updatedOrderData;

        setFixes(prev => {
            const currentOrder = prev[orderId] || {};
            updatedOrderData = { ...currentOrder, [field]: value };

            // Cascading resets
            if (field === 'cityId') {
                updatedOrderData.zoneId = "";
                updatedOrderData.districtId = "";
                const config = CARRIER_CONFIG[carrier];

                // Find city to get its provider-specific ID
                const city = cities.find(c => String(c.id) === String(value));
                
                if (city?.providerCityId) {
                    fetchZonesAndDistricts(config.provider, city.providerCityId, [orderId], config.hasDistrict);
                }
            }
            if (field === 'zoneId') {
                updatedOrderData.districtId = "";
            }

            return { ...prev, [orderId]: updatedOrderData };
        });

        // 2. Immediate Validation for this specific field
        const schema = getValidationSchema(carrier, t);

        try {
            // We validate the field against the NEWLY calculated order data
            await schema.validateAt(field, updatedOrderData);

            // If valid, clear the error for this field
            setFixErrors(prev => ({
                ...prev,
                [orderId]: { ...prev[orderId], [field]: null }
            }));
        } catch (err) {
            // If invalid, set the error message immediately
            setFixErrors(prev => ({
                ...prev,
                [orderId]: {
                    ...prev[orderId],
                    [field]: err.message // Validation message from Yup
                }
            }));
        }
    }, [carrier, cities,t]);


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
                    cityId: fixes[order.id].cityId,
                    // email: fixes[order.id].email || "",
                    shippingMetadata: {
                        zoneId: fixes[order.id].zoneId,
                        districtId: fixes[order.id].districtId,
                        orderSize: fixes[order.id].orderSize,
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
                    items: orderIds.map(id => ({ orderId: id })),
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
                {/* Header */}
                <div className="relative shrink-0 bg-[var(--primary)] px-3 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 rounded-t-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <Truck className="text-white" size={24} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-white text-lg sm:text-xl font-bold leading-tight">{t("modal.assignCarrierTitle")}</h2>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 shrink-0 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-3 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t("assign.totalSelected")}
                            count={activeOrders.length}
                            icon={<Layers size={20} />}
                            tone="neutral"
                        />
                        <StatCard
                            title={t("assign.ready")}
                            count={readyOrders.length}
                            tone="success"
                            icon={<CheckCircle2 size={20} />}
                        />
                        <StatCard
                            title={t("assign.needsFix")}
                            count={needsFixOrders.length}
                            tone="warning"
                            icon={<AlertCircle size={20} />}
                        />
                        <StatCard
                            title={t("assign.ineligible")}
                            count={ineligibleOrders.length}
                            tone="danger"
                            icon={<X size={20} />}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <TabButton
                            active={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                            label={t("assign.tabAllOrders")}
                            count={activeOrders.length}
                        />
                        <TabButton
                            active={activeTab === 'fix'}
                            onClick={() => setActiveTab('fix')}
                            label={t("assign.tabNeedsFix")}
                            count={needsFixOrders.length}
                            isWarning={needsFixOrders.length > 0}
                        />
                        <TabButton
                            active={activeTab === 'ineligible'}
                            onClick={() => setActiveTab('ineligible')}
                            label={t("assign.tabIneligible")}
                            count={ineligibleOrders.length}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px] sm:min-h-[300px]">
                        {activeTab === 'all' && (
                            <div className="space-y-4">

                                <div className="table-container border rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-[60px]"></th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                        {t("field.orderNumber")}
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                        {t("field.customerName")}
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                        {t("field.phoneNumber")}
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                        {t("field.address")}
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                        {t("status")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {activeOrders.map((order) => {
                                                    const isReady = readyOrders.some((o) => o.id === order.id);
                                                    const isChecked = selectedReadyIds.has(order.id);
                                                    let status = "ready";
                                                    let statusColor = "emerald";
                                                    let statusText = t("assign.ready");

                                                    if (isOrderIneligible(order)) {
                                                        status = "ineligible";
                                                        statusColor = "red";
                                                        statusText = t("assign.ineligible");
                                                    } else if (doesOrderNeedFix(order, carrier)) {
                                                        status = "needs-fix";
                                                        statusColor = "amber";
                                                        statusText = t("assign.needsFix");
                                                    }

                                                    const handleRowClick = () => {
                                                        if (isReady) toggleReadySelection(order.id);
                                                    };

                                                    return (
                                                        <motion.tr
                                                            key={order.id}
                                                            initial={{ opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={cn(
                                                                "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors",
                                                                isChecked && "bg-primary/5 dark:bg-primary/10"
                                                            )}
                                                        >
                                                            <td className="px-4 py-3">
                                                                {isReady ? (
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => toggleReadySelection(order.id)}
                                                                    />
                                                                ) : null}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="font-bold text-primary">{order.orderNumber}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-slate-700 dark:text-slate-200">{order.customerName}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-slate-600 dark:text-slate-300">{order.phoneNumber}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate block">
                                                                    {order.address}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={cn(
                                                                        "px-3 py-1 rounded-full text-xs font-bold",
                                                                        statusColor === "emerald"
                                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                            : statusColor === "amber"
                                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                    )}
                                                                >
                                                                    {statusText}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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


                                </div>

                                {/* Table Container */}
                                {needsFixOrders.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        {t("assign.allSetNoFixes")}
                                    </div>
                                ) : (
                                    <div className="table-container border rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                                        <div className="max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-sm text-left overflow-y-auto">
                                                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                            {t("field.orderNumber")}
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                                                            {t("status")}
                                                        </th>
                                                        <th className="text-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 min-w-[150px] bg-slate-100/50 dark:bg-slate-800/50">
                                                            {t("field.address")} ({t("common.original")})
                                                        </th>
                                                        <th className="text-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 min-w-[100px] bg-slate-100/50 dark:bg-slate-800/50">
                                                            {t("field.city")} ({t("common.original")})
                                                        </th>
                                                        <th className="text-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 min-w-[100px] bg-slate-100/50 dark:bg-slate-800/50">
                                                            {t("field.area")} ({t("common.original")})
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                            {t("field.customerName")}
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[140px]">
                                                            {t("field.phoneNumber")}
                                                        </th>
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("email") && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[200px]">
                                                                {t("field.email")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("firstLine") && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[200px]">
                                                                {t("field.address")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("cityId") && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("field.city")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.hasZone && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("field.zone")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.hasDistrict && (
                                                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                                {t("field.district")}
                                                            </th>
                                                        )}
                                                        {CARRIER_CONFIG[carrier]?.requires.includes("orderSize") && <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">
                                                            {t("field.orderSize")}
                                                        </th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 ">
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
                                                                    <span className="font-bold text-primary block mt-2 text-nowrap">{order.orderNumber}</span>
                                                                    {apiErr && <span className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded mt-1 inline-block">{apiErr}</span>}
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <span className="px-3 py-1 text-nowrap bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold">
                                                                        {t("assign.needsFix")}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 align-top bg-slate-50/30 dark:bg-slate-900/30">
                                                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 mt-1">
                                                                        {order.address || "-"}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top bg-slate-50/30 dark:bg-slate-900/30">
                                                                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                                                        {order.city || "-"}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top bg-slate-50/30 dark:bg-slate-900/30">
                                                                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                                                        {order.area || "-"}
                                                                    </div>
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
                                                                {config?.requires.includes("email") && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableInput
                                                                            value={fix.email}
                                                                            error={errs.email}
                                                                            onChange={(e) => handleFixChange(order.id, 'email', e.target.value)}
                                                                            placeholder={t("placeholders.email")}
                                                                        />
                                                                    </td>
                                                                )}
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

                                                                {/* Order Size Select */}
                                                                {config?.requires.includes("orderSize") && (
                                                                    <td className="px-4 py-3 align-top">
                                                                        <TableSelect
                                                                            value={fix.orderSize}
                                                                            options={[
                                                                                { id: "SMALL", name: t("orderSizes.SMALL") },
                                                                                { id: "MEDIUM", name: t("orderSizes.MEDIUM") },
                                                                                { id: "LARGE", name: t("orderSizes.LARGE") },
                                                                                { id: "Light Bulky", name: t("orderSizes.Light Bulky") },
                                                                                { id: "Heavy Bulky", name: t("orderSizes.Heavy Bulky") },
                                                                            ]}
                                                                            onChange={(val) => handleFixChange(order.id, 'orderSize', val)}
                                                                            placeholder={t("field.orderSize")}
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

                    {/* Footer: Carrier Selection + Actions */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {t("assign.requiredCarrier")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={carrier} onValueChange={setCarrier}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        <SelectValue placeholder={t("select") || "Select..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">NONE</SelectItem>
                                        {shippingCompanies.map(c => {
                                            const providerCode = c.provider?.toUpperCase();
                                            return (
                                                <SelectItem key={providerCode} value={providerCode}>
                                                    {providerCode}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading || updating}
                                    className="w-full sm:w-auto"
                                >
                                    {t("common.cancel")}
                                </Button>

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

                                <Button
                                    onClick={handleAssign}
                                    disabled={loading || updating || !carrier || selectedReadyOrders.length === 0 || needsFixOrders.length > 0}
                                    className="w-full sm:w-auto bg-primary"
                                >
                                    {loading ? t("assign.assigning") : t("assign.assignOrdersCount", { count: selectedReadyOrders.length })}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Small UI Sub-components ---

function StatCard({ title, count, subtitle, icon, tone = "neutral" }) {
    const toneClasses = {
        success: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
        warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
        danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        neutral: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    };

    const iconBgClasses = {
        success: "bg-emerald-500 text-white",
        warning: "bg-amber-500 text-white",
        danger: "bg-red-500 text-white",
        neutral: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
    };

    const textColorClasses = {
        success: "text-emerald-700 dark:text-emerald-400",
        warning: "text-amber-700 dark:text-amber-400",
        danger: "text-red-700 dark:text-red-400",
        neutral: "text-slate-700 dark:text-slate-300",
    };

    return (
        <div
            className={cn(
                "rounded-2xl border p-5 flex items-center gap-4",
                // toneClasses[tone],
            )}
        >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBgClasses[tone])}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{count}</p>
                {subtitle != null && subtitle !== "" && (
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tabular-nums">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, count, isWarning }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center justify-center gap-2",
                active 
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
        >
            <span>{label}</span>
            <span
                className={cn(
                    "shrink-0 text-xs px-2 py-0.5 rounded-full tabular-nums font-bold",
                    active 
                        ? "bg-primary text-white" 
                        : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200",
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
                className={cn("h-9 text-sm min-w-[150px]", error && "border-red-500 focus-visible:ring-red-500")}
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
                    "min-w-[150px] flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition-colors",
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