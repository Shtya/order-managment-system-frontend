"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/FloatingSelect";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Trash2, GitBranch, Layout, Check, ExternalLink, RefreshCw, Loader2, DollarSign, CreditCard, CheckCircle, Truck, Store, Hash, Package, Tag, Activity, PackageOpen, HelpCircle, ChevronLeft, GripVertical, Info, X, Database, Link, MessageSquareQuote, LayoutDashboard, MapPin, LinkIcon, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import TemplatePreview from "../../whatsapp/atoms/TemplatePreview";
import { InternalTemplateDialog } from "../../whatsapp/atoms/InternalTemplateDialog";
import { OrderPropertySelector } from "./OrderPropertySelector";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useFlowStore } from "@/hook/useFlowStore";
import { extractVariableNames } from "@/utils/whatsapp-healper";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MapLocationPicker from "@/components/atoms/MapLocationPicker";
import UserSelect from "@/components/atoms/UserSelect";


function normalizeAxiosError(err) {
    const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

/**
 * Shared Form Group Wrapper
 */
function FormGroup({ label, description, children, error }) {
    return (
        <div className="space-y-2 mb-6">
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{label}</Label>
            {description && <p className="text-[11px] text-slate-400 mb-2">{description}</p>}
            {children}
            {error && <p className="text-[10px] text-rose-500 font-bold mt-1">{error}</p>}
        </div>
    );
}

/**
 * Trigger: Order Created
 */
export function OrderCreatedConfig({ value, onChange, errors, setDisabled, onClose }) {
    const t = useTranslations("whatsApp.automations.builder.config");
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isSuperAdmin } = useAuth();

    useEffect(() => {
        if (isSuperAdmin) {
            onClose({ ...value, store: "all", storeId: undefined });
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setLoading(true);
                const res = await api.get("/lookups/stores", { params: { limit: 200, isActive: true } });
                setStores(res.data || []);
            } catch (e) {
                toast.error(normalizeAxiosError(e));
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        // Prevent save until select store or all
        const isValid = !!value.store;
        setDisabled(!isValid);
    }, [value.store, setDisabled]);

    const handleStoreChange = (v) => {
        if (v === "all") {
            onChange({ ...value, store: "all", storeId: undefined });
        } else {
            const selectedStore = stores.find(s => s.id === v);
            onChange({ ...value, store: selectedStore?.name, storeId: v });
        }
    };

    return (
        <div className="space-y-4">
            <FormGroup label={t('store')} description={t('storeDesc')} error={errors.store}>
                <Select value={value.storeId || (value.store === "all" ? "all" : "")} onValueChange={handleStoreChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading && !isSuperAdmin ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('loading')}</span>
                            </div>
                        ) : (
                            <SelectValue placeholder={t('selectStore')} />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allStores')}</SelectItem>
                        {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Order Status Updated
 */
export function OrderStatusUpdatedConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const tOrders = useTranslations("orders");
    const tConfig = useTranslations("whatsApp.automations.builder.config");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a status is selected
        const isValid = !!value.statusId;
        setDisabled(!isValid);
    }, [value.statusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({ ...value, status: selectedStatus?.name, statusId: v });
    };

    return (
        <div className="space-y-4">
            <FormGroup label={tConfig('targetStatus')} description={tConfig('targetStatusDesc')} error={errors.status}>
                <Select value={value.statusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{tConfig('loading')}</span>
                            </div>
                        ) : (
                            <SelectValue placeholder={tConfig('selectStatus')} />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>  {status.system ? tOrders(`statuses.${status.code}`) : status.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Trigger: Whatsapp Incoming Message
 */
export function WhatsappIncomingConfig({ value, onChange, errors, setDisabled }) {
    const t = useTranslations("whatsApp.automations.builder.config");
    return (
        <div className="space-y-4">
            <FormGroup label={t('whatsappAccount')} description={t('whatsappAccountDesc')} error={errors.account}>
                <Select value={value.accountId || ""} onValueChange={(v) => onChange({ ...value, accountId: v })}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        <SelectValue placeholder={t('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="acc_1">{t('accounts.sales')}</SelectItem>
                        <SelectItem value="acc_2">{t('accounts.support')}</SelectItem>
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Action: Update Order Status
 */
export function UpdateOrderStatusConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const tOrders = useTranslations("orders");
    const tConfig = useTranslations("whatsApp.automations.builder.config");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a new status is selected
        const isValid = !!value.newStatusId;
        setDisabled(!isValid);
    }, [value.newStatusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({
            ...value,
            newStatus: selectedStatus?.name,
            newStatusId: v
        });
    };

    return (
        <div className="space-y-4">
            <FormGroup label={tConfig('newStatus')} description={tConfig('changeStatusToDesc')} error={errors.newStatus}>
                <Select value={value.newStatusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{tConfig('loading')}</span>
                            </div>
                        ) : (
                            <SelectValue placeholder={tConfig('selectNewStatus')} />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.system ? tOrders(`statuses.${status.code}`) : status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}

/**
 * Action: Assign Order to Employee
 */
export function AssignOrderToEmployeeConfig({ value, onChange, errors, setDisabled, onClose, mode }) {
  const tConfig = useTranslations("whatsApp.automations.builder.config");
  const tNodes = useTranslations("whatsApp.automations.builder.nodes");
  const tCommon = useTranslations("common");
  const [tempValue, setTempValue] = useState({
    employeeId: value?.employeeId || null,
    employeeName: value?.employeeName || null,
    employeeEmail: value?.employeeEmail || null,
    employeeAvatarUrl: value?.employeeAvatarUrl || null,
    branches: value?.branches || [
      { id: 'assigned', label: tNodes('branches.assigned'), condition: 'assigned' },
      { id: 'not_eligable', label: tNodes('branches.notEligible'), condition: 'not_eligable' }
    ]
  });

  useEffect(() => {
    setDisabled(false);
  }, [setDisabled]);

  const handleEmployeeChange = (user) => {
    const newBranches = [
      { id: 'assigned', label: tNodes('branches.assigned'), condition: 'assigned' },
      { id: 'not_eligable', label: tNodes('branches.notEligible'), condition: 'not_eligable' }
    ];
    
    if (!user?.id) {
      // Auto assign mode: add "no roles match" branch
      newBranches.splice(1, 0, { id: 'no_roles_match', label: tNodes('branches.noRolesMatch'), condition: 'no_roles_match' });
    }

    setTempValue({
      ...tempValue,
      employeeId: user?.id || null,
      employeeName: user?.name || null,
      employeeEmail: user?.email || null,
      employeeAvatarUrl: user?.avatarUrl || null,
      branches: newBranches
    });
  };

  const handleSave = () => {
    onChange(tempValue);
    onClose(tempValue);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose(null)}>
      <DialogContent className="sm:max-w-[550px] w-full flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-[20px] md:rounded-[30px] border-none shadow-2xl">
        <DialogHeader className="px-4 md:px-8 py-4 md:py-6 border-b bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <Users size={20} className="md:size-6" />
              </div>
              <div className="text-right">
                <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-slate-100">{tConfig('assignOrderToEmployee')}</h3>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">{tConfig('assignOrderToEmployeeDesc')}</p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="space-y-4">
            <FormGroup label={tConfig('selectEmployee')} description={tConfig('selectEmployeeDesc')} error={errors.employee}>
              <UserSelect
                value={tempValue.employeeId || "none"}
                onSelect={handleEmployeeChange}
                placeholder={tConfig('selectEmployeePlaceholder')}
                allowNone={true}
                noneLabel={tConfig('autoAssign')}
                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none"
                contentClassName="bg-card-select"
              />
            </FormGroup>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 md:px-8 py-4 md:py-6 border-t bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-col-reverse sm:flex-row w-full justify-between items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onClose(null)}
              className="w-full sm:w-auto px-8 h-10 md:h-12 rounded-xl md:rounded-2xl text-slate-600 dark:text-slate-300 text-xs md:text-sm font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto px-8 md:px-10 h-10 md:h-12 rounded-xl md:rounded-2xl bg-primary text-white text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              {mode === "create" ? tConfig('addStep') : tConfig('saveChanges')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Action: Send Whatsapp Template
 */
/**
 * Action: Send Whatsapp Template
 */
export function SendWhatsappTemplateConfig({ isOpen, value, onChange, errors, flowData, setDisabled, onClose, mode }) {
    const { isSuperAdmin } = useAuth();
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isOrderSelectorOpen, setIsOrderSelectorOpen] = useState(false);
    const [activeVar, setActiveVar] = useState(null); // { type: 'header' | 'body', num: string }
    const tChats = useTranslations("chats");
    const tConfig = useTranslations("whatsApp.automations.builder.config");
    const tCommon = useTranslations("common");
    const nodes = useFlowStore((s) => s.nodes);
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const isOrderTrigger = triggerNode?.data?.type?.startsWith('order_');

    const [tempValue, setTempValue] = useState(value || {});
    
    useEffect(() => {
        setTempValue(value || {});
    }, [value, isOpen]);

    // Check if all variables are filled to enable save
    const isAllFilled = useMemo(() => {
        if (!tempValue.templateId) return false;
        
        const config = tempValue.templateData || {};
        const headerVars = extractVariableNames(config.headerText || '', 'number');
        const bodyVars = extractVariableNames(config.bodyText || '', 'number');
        const dynamicButtonIndexes = config.buttons
            ?.map((btn, idx) => btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic' ? String(idx) : null)
            .filter(Boolean) || [];

        return [
            ...headerVars.map(n => tempValue.headerVariables?.[n]),
            ...bodyVars.map(n => tempValue.bodyVariables?.[n]),
            ...dynamicButtonIndexes.map(idx => tempValue.buttonVariables?.[idx])
        ].every(v => v?.value || v?.variablePath);
    }, [tempValue]);

    useEffect(() => {
        if (setDisabled) setDisabled(!isAllFilled);
    }, [isAllFilled, setDisabled]);

    const handleSelectTemplate = (template) => {
        const config = template.templateConfig || {};
        const headerVars = extractVariableNames(config.headerText || '', 'number');
        const bodyVars = extractVariableNames(config.bodyText || '', 'number');

        const headerVariables = {};
        headerVars.forEach(num => {
            headerVariables[num] = { type: 'direct', value: '', label: '', example: config.headerVariables?.[num] || '' };
        });

        const bodyVariables = {};
        bodyVars.forEach(num => {
            bodyVariables[num] = { type: 'direct', value: '', label: '', example: config.bodyVariables?.[num] || '' };
        });

        const buttonVariables = {};
        config.buttons?.forEach((btn, idx) => {
            if (btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic') {
                buttonVariables[String(idx)] = {
                    type: 'direct', value: '', label: btn.text || '', example: btn.url || '', url: btn.url
                };
            }
        });
        
        const locationData = config.headerType === 'LOCATION' ? {
            name: { type: 'direct', value: '', label: '', example: tConfig('locationName') },
            address: { type: 'direct', value: '', label: '', example: tConfig('locationAddress') },
            latitude: 30.0444,
            longitude: 31.2357
        } : null;

        setTempValue({
            ...tempValue,
            templateId: template.id,
            templateName: template.name,
            templateData: config,
            headerVariables,
            bodyVariables,
            buttonVariables,
            locationData,
            branches: config.buttons?.filter(btn => btn.type === 'CUSTOM')?.map((btn, i) => ({
                id: `btn_${i}`,
                label: btn.text,
                sourceButton: btn,
                condition: `button_click_${i}`
            })) || []
        });
        setIsTemplateDialogOpen(false);
    };

    const handleVariableChange = (type, num, updates) => {
        const key = type === 'header' ? 'headerVariables' : type === 'body' ? 'bodyVariables' : type === 'location' ? 'locationData' : 'buttonVariables';
        if (type === 'location') {
            setTempValue({
                ...tempValue,
                locationData: {
                    ...tempValue.locationData,
                    [num]: { ...tempValue.locationData?.[num], ...updates }
                }
            });
            return;
        }

        setTempValue({
            ...tempValue,
            [key]: {
                ...tempValue?.[key],
                [num]: { ...tempValue?.[key]?.[num], ...updates }
            }
        });
    };

    const handleLocationCoordChange = (lat, lng) => {
        setTempValue({
            ...tempValue,
            locationData: {
                ...tempValue.locationData,
                latitude: lat,
                longitude: lng
            }
        });
    };

    const openOrderSelector = (type, num) => {
        setActiveVar({ type, num });
        setIsOrderSelectorOpen(true);
    };

    const handleOrderPropSelect = (prop) => {
        if (activeVar) {
            handleVariableChange(activeVar.type, activeVar.num, {
                type: 'variable',
                variablePath: prop.id,
                label: prop.label,
                example: prop.example
            });
        }
        setIsOrderSelectorOpen(false);
        setActiveVar(null);
    };

    const handleSave = () => {
        onChange(tempValue);
        onClose(tempValue);
    };

    const renderVariableInput = (type, num, buttonLabel) => {
        const varData = (
            type === 'header' ? tempValue.headerVariables :
                type === 'body' ? tempValue.bodyVariables :
                    type === 'location' ? tempValue.locationData :
                        tempValue.buttonVariables
        )?.[num] || {};
        const isDynamic = varData.type === 'variable';
        
        const badgeLabel = type === 'header' ? tConfig('messageHeader') : type === 'body' ? tConfig('messageBody') : buttonLabel || `${tConfig('linkButtons')} ${num}`;
        const isButtonType = type === 'button';
        
        const placeholder = isButtonType ? tChats("enterValueFor", { example: varData.url }) : tConfig("enterValue");

        return (
            <div key={`${type}-${num}`} className="flex gap-2 md:gap-3 items-start group">
                <div className="w-12 md:w-[60px] h-9 md:h-10 text-center rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[10px] md:text-xs font-black text-slate-400 shrink-0 shadow-sm">
                    {isButtonType ? <LinkIcon size={12} className="md:size-[14px]" /> : `{{${num}}}`}
                </div>
                <div className="flex-1 min-w-0">
                     {isDynamic ? (
                            <div className="h-9 md:h-12 rounded-lg md:rounded-2xl bg-primary/5 border border-primary/20 px-3 md:px-4 flex items-center justify-between group/var">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest">{tConfig('dynamicVariable', { type: badgeLabel })}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{varData.label}</span>
                                </div>
                                <button
                                    onClick={() => handleVariableChange(type, num, { type: 'direct', value: '', label: '', variablePath: '' })}
                                    className="p-1 md:p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 opacity-0 group-hover/var:opacity-100 transition-all"
                                >
                                    <Trash2 size={12} className="md:size-[14px]" />
                                </button>
                            </div>
                        ) : (<Input
                        placeholder={placeholder}
                        value={varData.value || ""}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (isButtonType) {
                                val = val.replace(/\s/g, '_');
                            }
                            handleVariableChange(type, num, { value: val });
                        }}
                        className="h-9 md:h-10 rounded-lg md:rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-3 md:px-4 text-xs md:text-sm"
                    />)}
                    {isButtonType && (
                        <div className="space-y-1 mt-1 px-1">
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate">{`${badgeLabel} - ${varData.url}`}</p>
                        </div>
                    )}
                    
                </div>
                   {isOrderTrigger && (
                        <Button
                            variant="outline"
                            onClick={() => openOrderSelector(type, num)}
                            className={cn(
                                "h-9 md:h-12 w-9 md:w-12 rounded-lg md:rounded-2xl p-0 shrink-0 transition-all",
                                isDynamic ? "border-primary text-primary bg-primary/5" : "border-slate-200 text-slate-400 hover:text-primary hover:border-primary/50"
                            )}
                            title={tConfig('selectFromOrderData')}
                        >
                            <Database size={16} className="md:size-[18px]" />
                        </Button>
                    )}
                
            </div>
        );
    };

    const headerVars = useMemo(() => extractVariableNames(tempValue.templateData?.headerText || '', 'number'), [tempValue.templateData?.headerText]);
    const bodyVars = useMemo(() => extractVariableNames(tempValue.templateData?.bodyText || '', 'number'), [tempValue.templateData?.bodyText]);
    const buttonVarsIndices = useMemo(() => {
        return tempValue.templateData?.buttons
        ?.map((btn, idx) => btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic' ? String(idx) : null)
        .filter(Boolean) || [];
    }, [tempValue.templateData?.buttons]);
    
    
    return (
        <Dialog open={isOpen} onOpenChange={() => onClose(null)}>
            <DialogContent className="sm:max-w-[950px] w-full h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-[20px] md:rounded-[30px] border-none shadow-2xl">
                <DialogHeader className="px-4 md:px-8 py-4 md:py-6 border-b bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                <MessageSquareQuote size={20} className="md:size-6" />
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-slate-100">{tConfig('whatsappTemplateTitle')}</h3>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">{tConfig('whatsappTemplateDesc')}</p>
                            </div>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col lg:flex-row min-h-full">
                        {/* Main Content Side */}
                        <div className="flex-1 p-4 md:p-8 bg-white dark:bg-slate-900">
                            <div className="space-y-6 md:space-y-8">
                                {/* Recipient Number */}
                                <FormGroup label={tConfig('recipientNumber')} description={tConfig('recipientNumberDesc2')}>
                                    <Input
                                        placeholder={tConfig('recipientNumberPlaceholder')}
                                        value={tempValue.recipientNumber || ""}
                                        onChange={(e) => setTempValue({ ...tempValue, recipientNumber: e.target.value })}
                                        className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 text-xs md:text-sm"
                                    />
                                </FormGroup>

                                {/* Template Selection */}
                                <FormGroup label={tConfig('whatsappTemplate')} error={errors.templateId}>
                                    {!tempValue.templateId ? (
                                        <button
                                            onClick={() => setIsTemplateDialogOpen(true)}
                                            className="w-full h-32 md:h-40 rounded-2xl md:rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 md:gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                        >
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                                                <LayoutDashboard size={24} className="md:size-7" />
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">{tConfig('clickToSelectTemplate')}</p>
                                                <p className="text-[10px] md:text-[11px] text-slate-400 font-bold mt-1">{tConfig('metaTemplateRequired')}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-[24px] border border-primary/20 bg-primary/5 shadow-sm gap-4">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <Check size={20} className="md:size-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 truncate">{tempValue.templateName}</h4>
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{tConfig('templateSelectedSuccess')}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setIsTemplateDialogOpen(true)}
                                                    className="w-full sm:w-auto rounded-xl text-primary hover:bg-primary/10 font-black text-[10px] md:text-xs h-9 md:h-10 px-4 gap-2"
                                                >
                                                    <RefreshCw size={14} />
                                                    {tConfig('changeTemplate')}
                                                </Button>
                                            </div>

                                            {/* Variables Section */}
                                            {(headerVars.length > 0 || bodyVars.length > 0 || buttonVarsIndices.length > 0 || tempValue.templateData?.headerType === 'LOCATION') && (
                                                <div className="space-y-6 md:space-y-8 p-4 md:p-8 rounded-2xl md:rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <h4 className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">{tConfig('fillVariables')}</h4>
                                                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold">{tConfig('fillVariablesDesc')}</p>
                                                    </div>

                                                    {tempValue.templateData?.headerType === 'LOCATION' && (
                                                <div className="space-y-4">
                                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MapPin size={12} /> {tConfig('locationHeader')}
                                                    </p>
                                                    <div className="flex flex-col gap-4 md:gap-6">
                                                        <div className="w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900">
                                                            <MapLocationPicker
                                                                initialLocation={{
                                                                    lat: tempValue.locationData?.latitude || 30.0444,
                                                                    lng: tempValue.locationData?.longitude || 31.2357
                                                                }}
                                                                onLocationSelect={handleLocationCoordChange}
                                                                height="100%"
                                                                width="100%"
                                                            />
                                                        </div>
                                                        <div className="space-y-4">
                                                            {renderVariableInput('location', 'name', tConfig('locationName'))}
                                                            {renderVariableInput('location', 'address', tConfig('locationAddress'))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {headerVars.length > 0 && (
                                                        <div className="space-y-4">
                                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <Layout size={12} /> {tConfig('messageHeader')}
                                                            </p>
                                                            {headerVars.map(num => renderVariableInput('header', num))}
                                                        </div>
                                                    )}

                                                    {bodyVars.length > 0 && (
                                                        <div className="space-y-4">
                                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <MessageSquare size={12} /> {tConfig('messageBody')}
                                                            </p>
                                                            {bodyVars.map(num => renderVariableInput('body', num))}
                                                        </div>
                                                    )}

                                                    {buttonVarsIndices.length > 0 && (
                                                        <div className="space-y-4">
                                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <Link size={12} /> {tConfig('linkButtons')}
                                                            </p>
                                                            {buttonVarsIndices.map(idx => renderVariableInput('button', idx, tempValue.templateData.buttons[idx]?.text))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </FormGroup>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="w-full lg:w-[340px] bg-slate-50 dark:bg-slate-950 flex flex-col p-6 md:p-8 shrink-0 border-t lg:border-t-0 lg:border-s dark:border-slate-800">
                            <div className="w-full flex flex-col items-center">
                                <h4 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-8 flex items-center gap-2 w-full">
                                    <ExternalLink size={12} />
                                    {tConfig('livePreview')}
                                </h4>
                                
                                {tempValue.templateData ? (
                                    <div className="scale-90 md:scale-95 lg:scale-100 origin-top transform-gpu w-full max-w-[350px] lg:max-w-none">
                                        <TemplatePreview
                                            template={{
                                                ...tempValue.templateData,
                                                preview: {
                                                    ...tempValue.templateData,
                                                    examples: {
                                                        ...Object.keys(tempValue.headerVariables || {}).reduce((acc, k) => ({ ...acc, [k]: tempValue.headerVariables[k].value || (tempValue.headerVariables[k].type === 'variable' ? `[${tempValue.headerVariables[k].label}]` : '') }), {}),
                                                        ...Object.keys(tempValue.bodyVariables || {}).reduce((acc, k) => ({ ...acc, [k]: tempValue.bodyVariables[k].value || (tempValue.bodyVariables[k].type === 'variable' ? `[${tempValue.bodyVariables[k].label}]` : '') }), {}),
                                                    }
                                                }
                                            }}
                                            flat
                                            forceShowExamples={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-[3/4] max-w-[300px] rounded-2xl md:rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 md:p-8 text-center gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                            <Info size={20} className="md:size-6" />
                                        </div>
                                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">{tConfig('previewUnavailable')}</p>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold">{tConfig('chooseTemplateToPreview')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-4 md:px-8 py-4 md:py-6 border-t bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex flex-col-reverse sm:flex-row w-full justify-between items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onClose(null)}
                            className="w-full sm:w-auto px-8 h-10 md:h-12 rounded-xl md:rounded-2xl text-slate-600 dark:text-slate-300 text-xs md:text-sm font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            disabled={!isAllFilled}
                            onClick={handleSave}
                            className="w-full sm:w-auto px-8 md:px-10 h-10 md:h-12 rounded-xl md:rounded-2xl bg-primary text-white text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {mode === "create" ? tConfig('addStep') : tConfig('saveChanges')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            <InternalTemplateDialog
                library={isSuperAdmin}
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
                onSelectTemplate={handleSelectTemplate}
            />

            <OrderPropertySelector
                open={isOrderSelectorOpen}
                onOpenChange={setIsOrderSelectorOpen}
                onSelect={handleOrderPropSelect}
            />
        </Dialog>
    );
}

/**
 * Action: Send Upsell
 */
export function SendUpsellConfig({ value, onChange, onClose }) {
    const t = useTranslations("whatsApp.automations.builder.config.upsell");
    useEffect(() => {
        const branches = [
            {
                id: "skipped",
                label: t("none"),
                condition: "skipped"
            },
            {
                id: "reject",
                label: t("system_reject"),
                condition: "reject"
            },
            {
                id: "accept",
                label: t("accept"),
                condition: "accept"
            },
            {
                id: "client_reject",
                label: t("client_reject"),
                condition: "client_reject"
            },
        ];

        // We only update if branches are not already set correctly to avoid infinite loops
        const currentBranchLabels = value.branches?.map(b => b.label).join(',');
        const targetBranchLabels = branches.map(b => b.label).join(',');

        if (currentBranchLabels !== targetBranchLabels) {
            onClose({
                ...value,
                branches
            });
        }
    }, [value, onClose, t]);

    return null; // This component doesn't render any UI, it just sets the branches
}

/**
 * Condition: Order Check
 * onClose(config to set and save or null to just close)
 */
export function OrderCheckConfig({ isOpen, value, onChange, errors, setDisabled, onClose, context }) {
    const { shippingCompanies } = usePlatformSettings();
     const tCommon = useTranslations("common");
    const [stores, setStores] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);
    const [search, setSearch] = useState('');
    const tOrders = useTranslations("orders");
    const tConfig = useTranslations("whatsApp.automations.builder.config");
    const tBuilder = useTranslations("whatsApp.automations.builder");
    const [checks, setChecks] = useState(Array.isArray(value?.checks) ? value.checks : []);
    const { mode } = context || {};

    // Sync from parent if needed
    useEffect(() => {
        if (isOpen) {
            setChecks(Array.isArray(value?.checks) ? value.checks : []);
        }
    }, [value?.checks, isOpen]);

    // Validation logic
    useEffect(() => {
        const hasChecks = checks.length > 0;
        const allValid = checks.every(c => c?.field && c?.operator && (c?.targetValue !== "" && c?.targetValue !== undefined && c?.targetValue !== null));
        if (setDisabled) setDisabled(!hasChecks || !allValid || activeIndex !== null);
    }, [checks, setDisabled, activeIndex]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [storesRes, statusesRes] = await Promise.all([
                    api.get("/lookups/stores", { params: { limit: 200, isActive: true } }),
                    api.get("/orders/statuses")
                ]);
                setStores(storesRes.data || []);
                setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.records || []);
            } catch (error) {
                console.error("Failed to fetch order check data:", error);
            } finally {
                setLoading(false);
            }
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    const fields = [
        { id: "orderNumber", label: tBuilder('orderProperties.orderNumber'), type: "string", icon: Hash, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "shippingCompany", label: tBuilder('orderProperties.shippingCompany'), type: "select", icon: Truck, color: "text-orange-500", bg: "bg-orange-50", options: shippingCompanies.map(c => ({ id: c.providerId, label: c.name })) },
        {
            id: "paymentStatus", label: tBuilder('orderProperties.paymentStatus'), type: "select", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50", options: [
                { id: "pending", label: tOrders("paymentStatuses.pending") },
                { id: "paid", label: tOrders("paymentStatuses.paid") },
                { id: "partial", label: tOrders("paymentStatuses.partial") },
                { id: "refunded", label: tOrders("paymentStatuses.refunded") },
                { id: "partially_refunded", label: tOrders("paymentStatuses.partially_refunded") },
            ]
        },
        { id: "productsTotal", label: tBuilder('orderProperties.productsTotal'), type: "number", icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
        { id: "items_count", label: tBuilder('orderProperties.items'), type: "number", icon: Package, color: "text-amber-500", bg: "bg-amber-50" },
        {
            id: "paymentMethod", label: tBuilder('orderProperties.paymentMethod'), type: "select", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50", options: [
                { id: "cash", label: tOrders("paymentMethods.cash") },
                { id: "card", label: tOrders("paymentMethods.card") },
                { id: "bank_transfer", label: tOrders("paymentMethods.bank_transfer") },
                { id: "cod", label: tOrders("paymentMethods.cod") },
                { id: "wallet", label: tOrders("paymentMethods.wallet") },
                { id: "other", label: tOrders("other") },
                { id: "unknown", label: tOrders("unknown") },
            ]
        },
        { id: "city", label: tBuilder('orderProperties.city'), type: "string", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
        { id: "discount", label: tBuilder('orderProperties.discount'), type: "string", icon: Tag, color: "text-pink-500", bg: "bg-pink-50" },
        { id: "status", label: tBuilder('orderProperties.status'), type: "select", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50", options: statuses.map(s => ({ id: s.id, label: s.system ? tOrders(`statuses.${s.code}`) : s.name })) },
        { id: "allowOpenPackage", label: tBuilder('orderProperties.allowOpenPackage'), type: "boolean", icon: PackageOpen, color: "text-slate-500", bg: "bg-slate-50" },
        { id: "deposit", label: tBuilder('orderProperties.deposit'), type: "number", icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-50" },
    ];

    const operatorsByType = {
        number: [
            { id: "==", label: tBuilder("operators.equal") },
            { id: "!=", label: tBuilder("operators.notEqual") },
            { id: ">", label: tBuilder("operators.greaterThan") },
            { id: "<", label: tBuilder("operators.lessThan") },
            { id: ">=", label: tBuilder("operators.greaterThanOrEqual") },
            { id: "<=", label: tBuilder("operators.lessThanOrEqual") },
        ],
        string: [
            { id: "==", label: tBuilder("operators.equal") },
            { id: "!=", label: tBuilder("operators.notEqual") },
            { id: "contains", label: tBuilder("operators.contains") },
            { id: "not_contains", label: tBuilder("operators.notContains") },
            { id: "starts_with", label: tBuilder("operators.startsWith") },
        ],
        boolean: [
            { id: "==", label: tBuilder("operators.equal") },
            { id: "!=", label: tBuilder("operators.notEqual") },
        ],
        select: [
            { id: "==", label: tBuilder("operators.equal") },
            { id: "!=", label: tBuilder("operators.notEqual") },
        ],
    };

    const handleAddCheck = () => {
        if (checks.length < 20) {
            const initialField = "orderNumber";
            const fieldDef = fields.find(f => f.id === initialField);
            const newChecks = [...checks, {
                field: initialField,
                fieldLabel: fieldDef?.label || initialField,
                operator: "==",
                targetValue: ""
            }];
            setChecks(newChecks);
            setActiveIndex(newChecks.length - 1);
        } else {
            toast.error(tConfig("maxConditionsError"));
        }
    };

    const handleConfirm = () => {
        const currentCheck = activeIndex !== null ? checks[activeIndex] : null;
        if (!currentCheck?.targetValue) return;
        // Don't call onChange here, just update local state and close editor
        setActiveIndex(null);
    };

    const handleSaveAll = () => {
        onChange({ ...value, checks });
        onClose({ ...value, checks });
    };

    const handleUpdateCheck = (index, updates) => {
        const newChecks = [...checks];
        const currentCheck = { ...newChecks[index], ...updates };
        
        if (updates.field) {
            const fieldDef = fields.find(f => f.id === updates.field);
            currentCheck.fieldLabel = fieldDef?.label;
            currentCheck.operator = operatorsByType[fieldDef?.type][0].id;
            currentCheck.targetLabel = fieldDef?.type === "boolean" ? tConfig("yes") : "";
        }

        newChecks[index] = currentCheck;
        setChecks(newChecks);
    };

    const handleRemoveCheck = (index) => {
        const newChecks = checks.filter((_, i) => i !== index);
        setChecks(newChecks);
        if (newChecks.length === 0) {
            setActiveIndex(null);
        } else if (activeIndex >= newChecks.length) {
            setActiveIndex(newChecks.length - 1);
        }
    };

    const currentCheck = activeIndex !== null ? checks[activeIndex] : null;
    const fieldDef = useMemo(() => {
        if (!currentCheck) return null;
        return fields.find(f => f?.id === currentCheck?.field) || fields[0];
    }, [currentCheck, fields]);

    const operators = fieldDef ? operatorsByType[fieldDef?.type] : [];

    const filteredChecks = useMemo(() => {
        if (!search) return checks;
        return checks.filter(c =>
            c.fieldLabel.toLowerCase().includes(search.toLowerCase()) ||
            (c.targetLabel || c.targetValue || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [checks, search]);

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose(null)}>
            <DialogContent className="sm:max-w-[900px] w-full h-[95vh] md:h-[85vh] p-0 overflow-hidden rounded-[20px] md:rounded-[30px] border-none shadow-2xl bg-[#f8f9fc] dark:bg-slate-950">
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 md:pe-[60px]">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            {activeIndex !== null ? (
                                <div className="flex flex-col sm:flex-row justify-between flex-1 gap-4 w-full">
                                    <div className="md:px-6 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                                        <div className="flex items-center gap-2 md:gap-3 min-w-max">
                                            <span className="text-[11px] md:text-[13px] font-black text-slate-900 dark:text-slate-100">{tConfig("preview")}</span>
                                            <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-primary/10 text-primary text-[10px] md:text-[12px] font-black border border-primary/20 shadow-sm">
                                                {fieldDef?.label}
                                            </div>
                                            <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] md:text-[12px] font-black border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {operators.find(o => o.id === currentCheck?.operator)?.label || "..."}
                                            </div>
                                            <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] md:text-[12px] font-black border border-slate-200 dark:border-slate-700 shadow-sm">
                                                {currentCheck?.targetLabel || currentCheck?.targetValue || "..."}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveIndex(null)}
                                        className="px-4 h-9 md:h-10 flex items-center justify-center gap-2 rounded-lg md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all shrink-0 w-full sm:w-auto"
                                    >
                                        <X size={18} />
                                        <span className="text-[11px] md:text-[12px] font-black">{tConfig("backToMain")}</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-right flex-1 md:px-4">
                                        <h2 className="text-[15px] md:text-[17px] font-black text-slate-900 dark:text-slate-100">{tConfig("orderCheckTitle")}</h2>
                                        <p className="text-[10px] md:text-[11px] text-slate-400 font-bold mt-0.5">{tConfig("orderCheckDesc")}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-center">
                                            {tConfig("conditionsCount", { count: checks.length })}
                                        </div>
                                        <button
                                            onClick={handleAddCheck}
                                            className="text-xs md:text-sm px-4 py-2 md:py-2.5 flex items-center justify-center gap-2 rounded-lg md:rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 w-full sm:w-auto"
                                        >
                                            <Plus size={18} className="md:size-5" />
                                            <span className="text-[11px] md:text-[12px] font-black">{tConfig("addNewCondition")}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-0 mb-4 md:mb-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-3">
                                <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary" />
                                <p className="text-xs md:text-sm text-slate-400 font-bold">{tConfig("loadingData")}</p>
                            </div>
                        ) : (
                            <>
                                {activeIndex === null ? (
                                    <div className="space-y-4 h-full">
                                        {checks.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                                {checks.map((check, i) => {
                                                    const f = fields.find(fd => fd.id === check.field) || fields[0];
                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => setActiveIndex(i)}
                                                            className="group relative p-4 md:p-5 rounded-xl md:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer"
                                                        >
                                                            <div className="flex items-center justify-between mb-3 md:mb-4">
                                                                <div className="flex items-center gap-2 md:gap-3">
                                                                    <div className={cn("w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm", f.bg, f.color)}>
                                                                        <f.icon size={16} className="md:size-5" />
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100">{check.fieldLabel || f.label}</p>
                                                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">{f.type}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCheck(i); }}
                                                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg md:rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={14} className="md:size-4" />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 p-2.5 md:p-3 rounded-lg md:rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                                                                <div className="flex-1 text-right">
                                                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">{tConfig("condition")}</p>
                                                                    <p className="text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-200">
                                                                        {operatorsByType[f.type]?.find(o => o.id === check.operator)?.label} {check.targetLabel || check.targetValue || '—'}
                                                                    </p>
                                                                </div>
                                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
                                                                    <GitBranch size={12} className="md:size-[14px]" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center py-10 md:py-20 bg-white dark:bg-slate-900 rounded-2xl md:rounded-[30px] border-2 border-dashed border-slate-100 dark:border-slate-800 px-4 text-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-4 md:mb-6">
                                                    <GitBranch size={32} className="md:size-10" />
                                                </div>
                                                <h3 className="text-base md:text-lg font-black text-slate-700 dark:text-slate-200">{tBuilder("nodes.noConditions")}</h3>
                                                <p className="text-xs md:text-sm text-slate-400 font-bold mt-2">{tConfig("noConditionsDesc")}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
                                        {/* Step 1: Field Selection */}
                                        <div className="flex gap-4 md:gap-6">
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-primary text-white flex items-center justify-center text-xs md:text-sm font-black shadow-lg shadow-primary/20">1</div>
                                                <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 pb-6 md:pb-8">
                                                <h4 className="text-sm md:text-[15px] font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4">{tConfig("chooseField")}</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                                                    {fields.map(f => {
                                                        const isSelected = currentCheck?.field === f?.id;
                                                        return (
                                                            <button
                                                                key={f.id}
                                                                onClick={() => handleUpdateCheck(activeIndex, { field: f.id })}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all relative group h-20 md:h-24",
                                                                    isSelected
                                                                        ? "bg-white dark:bg-slate-900 border-primary ring-4 ring-primary/5 shadow-md"
                                                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                                                )}
                                                            >
                                                                <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", f.bg, f.color)}>
                                                                    <f.icon size={16} className="md:size-5" />
                                                                </div>
                                                                <p className="text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-200 text-center leading-tight truncate w-full px-1">{f.label}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2: Operator Selection */}
                                        <div className="flex gap-4 md:gap-6">
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-primary text-white flex items-center justify-center text-xs md:text-sm font-black shadow-lg shadow-primary/20">2</div>
                                                <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 pb-6 md:pb-8">
                                                <h4 className="text-sm md:text-[15px] font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4">{tConfig("chooseOperator")}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {operators.map(o => {
                                                        const isSelected = currentCheck?.operator === o.id;
                                                        return (
                                                            <button
                                                                key={o.id}
                                                                onClick={() => handleUpdateCheck(activeIndex, { operator: o.id })}
                                                                className={cn(
                                                                    "px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl border text-xs md:text-[13px] font-black transition-all",
                                                                    isSelected
                                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                                                )}
                                                            >
                                                                {o.label} {o.id}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3: Value Entry */}
                                        <div className="flex gap-4 md:gap-6">
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-primary text-white flex items-center justify-center text-xs md:text-sm font-black shadow-lg shadow-primary/20">3</div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm md:text-[15px] font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4">{tConfig("enterValue")}</h4>
                                                <div className="max-w-xl">
                                                    {fieldDef?.type === "select" || fieldDef?.type === "boolean" ? (
                                                        <Select
                                                            value={String(currentCheck?.targetValue)}
                                                            onValueChange={(v) => {
                                                                const options = fieldDef?.type === "boolean" ? [
                                                                    { id: "true", label: tConfig("yes") },
                                                                    { id: "false", label: tConfig("no") }
                                                                ] : fieldDef?.options;
                                                                const label = options.find(o => String(o.id) === v)?.label;
                                                                handleUpdateCheck(activeIndex, { targetValue: v, targetLabel: label });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs md:text-sm px-4 md:px-6 shadow-sm">
                                                                <SelectValue placeholder={tConfig("selectValue")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(fieldDef?.type === "boolean" ? [
                                                                    { id: "true", label: tConfig("yes") },
                                                                    { id: "false", label: tConfig("no") }
                                                                ] : fieldDef?.options).map(opt => (
                                                                    <SelectItem key={opt.id} value={String(opt.id)}>{opt.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type={fieldDef?.type === "number" ? "number" : "text"}
                                                            className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs md:text-sm px-4 md:px-6 shadow-sm rtl"
                                                            value={currentCheck?.targetValue || ""}
                                                            maxLength={300}
                                                            onChange={(e) => handleUpdateCheck(activeIndex, { targetValue: e.target.value, targetLabel: e.target.value })}
                                                            placeholder={tConfig("enterValuePlaceholder")}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer - Using DialogFooter structure */}
                    <DialogFooter className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shrink-0">
                        <div className="flex flex-col-reverse sm:flex-row w-full justify-between items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => activeIndex !== null ? setActiveIndex(null) : onClose(null)}
                                className="w-full sm:w-auto px-6 md:px-8 h-10 md:h-12 rounded-lg md:rounded-2xl text-slate-600 dark:text-slate-300 text-xs md:text-sm font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {tCommon("cancel")}
                            </Button>
                            {activeIndex !== null ? (
                                <Button
                                    disabled={!currentCheck?.targetValue}
                                    onClick={handleConfirm}
                                    className="w-full sm:w-auto px-6 md:px-8 h-10 md:h-12 rounded-lg md:rounded-2xl bg-primary text-white text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {tConfig("addCondition")}
                                </Button>
                            ) : (
                                <Button
                                    disabled={checks.length === 0}
                                    onClick={handleSaveAll}
                                    className="w-full sm:w-auto px-6 md:px-8 h-10 md:h-12 rounded-lg md:rounded-2xl bg-primary text-white text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {mode === "create" ? tConfig("addStep") : tConfig("saveChanges")}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Condition: Quick Order Status
 */
export function QuickOrderStatusConfig({ value, onChange, errors, setDisabled }) {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const tOrders = useTranslations("orders");
    const tConfig = useTranslations("whatsApp.automations.builder.config");

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/orders/statuses");
                setStatuses(Array.isArray(data) ? data : data.records || []);
            } catch (error) {
                console.error("Failed to fetch statuses:", error);
                toast.error(normalizeAxiosError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Prevent save until a status is selected
        const isValid = !!value.statusId;
        setDisabled(!isValid);
    }, [value.statusId, setDisabled]);

    const handleStatusChange = (v) => {
        const selectedStatus = statuses.find(s => s.id.toString() === v);
        onChange({
            ...value,
            status: selectedStatus?.name,
            statusId: v
        });
    };

    return (
        <div className="space-y-4">
            <FormGroup label={tConfig("quickCheckTitle")} description={tConfig("quickCheckDesc")} error={errors.status}>
                <Select value={value.statusId?.toString() || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{tConfig("loading")}</span>
                            </div>
                        ) : (
                            <SelectValue placeholder={tConfig("selectStatus")} />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                                {status.system ? tOrders(`statuses.${status.code}`) : status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );
}
