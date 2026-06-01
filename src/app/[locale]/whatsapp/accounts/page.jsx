"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Info,
  MessageSquare,
  Trash2,
  Power,
  Settings,
  CheckCircle2,
  Eye,
  BarChart3,
  Clock,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppTab } from "../../settings/page";
import { Settings2 } from "lucide-react";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import { useSocket } from "@/context/SocketContext";

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  params.set("sortBy", "createdAt");
  params.set("sortDir", "DESC");
  if (search?.trim()) params.set("search", search.trim());
  if (filters?.isActive && filters.isActive !== "all") params.set("isActive", filters.isActive);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  return params.toString();
}


// --- Integration Progress Modal ---
const IntegrationProgressModal = ({ isOpen, onClose, steps }) => {
  const t = useTranslations("whatsApp.accounts.signupProgress");

  // Sort steps for display
  const stepKeys = [
    'EXCHANGING_TOKEN',
    'FETCHING_PHONE_DATA',
    'SUBSCRIBING_APP',
    'REGISTERING_PHONE',
    'CREATING_ACCOUNT',
    'SYNCING_TEMPLATES'
  ];

  const isFailed = steps.FAILED?.status === 'failed';
  const isCompleted = steps.COMPLETED?.status === 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={!isCompleted && !isFailed ? undefined : onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className={cn("w-5 h-5 animate-spin text-primary", (isCompleted || isFailed) && "hidden")} />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {isFailed ? t("steps.FAILED") : isCompleted ? t("steps.COMPLETED") : t("status.in_progress")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {stepKeys.map((key) => {
            const step = steps[key] || { status: 'pending' };
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                    step.status === 'completed' && "bg-green-500 border-green-500 text-white",
                    step.status === 'in_progress' && "bg-primary/10 border-primary text-primary",
                    step.status === 'failed' && "bg-red-500 border-red-500 text-white",
                    step.status === 'warning' && "bg-amber-500 border-amber-500 text-white",
                    step.status === 'pending' && "bg-gray-50 border-gray-200 text-gray-400"
                  )}>
                    {step.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {step.status === 'in_progress' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {step.status === 'failed' && <X className="w-4 h-4" />}
                    {step.status === 'warning' && <AlertCircle className="w-4 h-4" />}
                    {step.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium truncate",
                    step.status === 'pending' && "text-gray-400",
                    step.status === 'failed' && "text-red-600"
                  )}>
                    {t(`steps.${key}`)}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  step.status === 'completed' && "bg-green-50 text-green-700 border-green-100",
                  step.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-100",
                  step.status === 'failed' && "bg-red-50 text-red-700 border-red-100",
                  step.status === 'warning' && "bg-amber-50 text-amber-700 border-amber-100",
                  step.status === 'pending' && "bg-gray-50 text-gray-400 border-gray-100"
                )}>
                  {t(`status.${step.status}`)}
                </span>
              </div>
            );
          })}

          {isFailed && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-800">{t("steps.FAILED")}</p>
                <p className="text-xs text-red-600 leading-relaxed">{steps.FAILED?.error || t("errors.general")}</p>
              </div>
            </div>
          )}

          {steps.SYNCING_TEMPLATES?.status === 'warning' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">{t("status.warning")}</p>
                <p className="text-xs text-amber-600 leading-relaxed">{steps.SYNCING_TEMPLATES?.error || t("errors.templates")}</p>
              </div>
            </div>
          )}
        </div>

        {(isCompleted || isFailed) && (
          <DialogFooter>
            <Button_ size="sm" label={t("close")} tone="primary" variant="solid" onClick={onClose} className="w-full" />

          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function WhatsAppAccountsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.accounts");

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    isActive: "all",
    startDate: "",
    endDate: "",
  });
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });

  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const { handleExport, exportLoading } = useExport();

  const [toggleState, setToggleState] = useState({ open: false, row: null });
  const [toggling, setToggling] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const MOCK_STATS = {
    deliveryRate: "98.5%",
    readRate: "85.2%",
    responseRate: "72.4%",
    conversionRate: "12.8%",
    avgResponseTime: "4m 20s",
    blockRate: "0.2%"
  };

  const statsCards = useMemo(() => [
    { name: t("stats.deliveryRate"), value: MOCK_STATS.deliveryRate, icon: CheckCircle2, color: "#10b981" },
    { name: t("stats.readRate"), value: MOCK_STATS.readRate, icon: Eye, color: "#3b82f6" },
    { name: t("stats.responseRate"), value: MOCK_STATS.responseRate, icon: MessageSquare, color: "#8b5cf6" },
    { name: t("stats.conversionRate"), value: MOCK_STATS.conversionRate, icon: BarChart3, color: "#f59e0b" },
    { name: t("stats.avgResponseTime"), value: MOCK_STATS.avgResponseTime, icon: Clock, color: "#6366f1" },
  ], [t]);

  const fetchAccounts = async ({ page = 1, per_page = 12 } = {}) => {
    setLoading(true);
    try {
      const qs = buildListQuery({ page, per_page, search: debouncedSearch, filters });
      const res = await api.get(`/whatsapp-accounts?${qs}`);
      setPager({
        total_records: res.data?.total_records ?? 0,
        current_page: res.data?.current_page ?? page,
        per_page: res.data?.per_page ?? per_page,
        records: res.data?.records ?? [],
      });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts({ page: 1, per_page: pager.per_page });
  }, [debouncedSearch]);

  const applyFilters = () => {
    fetchAccounts({ page: 1, per_page: pager.per_page });
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchAccounts({ page, per_page });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.isActive && filters.isActive !== "all") ||
      Boolean(filters.startDate?.trim()) ||
      Boolean(filters.endDate?.trim())
    );
  }, [filters]);

  const openToggleConfirm = useCallback((row) => {
    setToggleState({ open: true, row });
  }, []);

  const confirmToggle = async () => {
    if (!toggleState.row?.id) return;
    setToggling(true);
    try {
      await api.patch(`/whatsapp-accounts/${toggleState.row.id}/toggle-active`);
      setToggleState({ open: false, row: null });
      toast.success(t("messages.updateSuccess"));
      await fetchAccounts({ page: pager.current_page, per_page: pager.per_page });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setToggling(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/whatsapp-accounts/${deleteState.id}`);
      setDeleteState({ open: false, id: null });
      toast.success(t("messages.deleteSuccess"));
      await fetchAccounts({ page: pager.current_page, per_page: pager.per_page });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncTemplates = async (accountId) => {
    setShowProgress(true);
    setSignupSteps({
      EXCHANGING_TOKEN: { status: 'completed' },
      FETCHING_PHONE_DATA: { status: 'completed' },
      SUBSCRIBING_APP: { status: 'completed' },
      REGISTERING_PHONE: { status: 'completed' },
      CREATING_ACCOUNT: { status: 'completed' },
    });

    try {
      await api.post(`/whatsapp/accounts/${accountId}/sync-templates`);
    } catch (e) {
      console.error("Manual sync failed", e);
      // Errors are handled via socket
    }
  };

  const onExport = async () => {
    await handleExport({
      endpoint: "/whatsapp-accounts/export",
      params: { search: search.trim() || undefined, ...filters },
      filename: `whatsapp_accounts_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(
    () => [
      {
        header: t("table.name"),
        key: "name",
        className: "font-bold text-gray-700 dark:text-slate-200",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="font-bold">{row.name}</div>
            </div>
          </div>
        ),
      },
      {
        header: t("table.number"),
        key: "mobileNumber",
        cell: (row) => <span className="font-mono">{row.mobileNumber || "—"}</span>,
      },
      {
        header: t("table.connectDate"),
        key: "createdAt",
        cell: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
      },
      {
        header: t("table.status"),
        key: "isActive",
        cell: (row) => (
          <div
            className={cn(
              "font-bold text-xs",
              row.isActive ? "text-emerald-600" : "text-slate-400"
            )}
          >
            {row.isActive ? t("table.active") : t("table.disabled")}
          </div>
        ),
      },
      {
        header: t("table.actions"),
        key: "actions",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <RefreshCw size={16} />,
                tooltip: t("actions.syncTemplates"),
                onClick: () => handleSyncTemplates(row.id),
                variant: "primary",
                permission: "whatsapp.manage",
              },
              {
                icon: <Power size={16} />,
                tooltip: row.isActive ? t("actions.disable") : t("actions.enable"),
                onClick: () => openToggleConfirm(row),
                variant: row.isActive ? "orange" : "emerald",
                permission: "whatsapp.update_account",
              },
              // {
              //   icon: <Trash2 size={16} />,
              //   tooltip: t("actions.delete"),
              //   onClick: () => setDeleteState({ open: true, id: row.id }),
              //   variant: "red",
              // },
            ]}
          />
        ),
      },
    ],
    [t, openToggleConfirm]
  );

  const authRef = useRef(null);
  const wabaRef = useRef(null);

  useEffect(() => {

    const handler = (event) => {
      if (event.origin !== "https://www.facebook.com") return;

      try {

        const data = JSON.parse(event.data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            wabaRef.current = data.data;
            trySend();
          }
        }
      } catch (error) {
        console.log(error);
        // non-JSON postMessage
      }
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  const fbLoginCallback = (response) => {

    if (response.authResponse?.code) {
      authRef.current = response.authResponse.code;
      trySend();
    }
  };

  const { subscribe } = useSocket();

  // Integration Progress State
  const [showProgress, setShowProgress] = useState(false);
  const [signupSteps, setSignupSteps] = useState({});

  useEffect(() => {
    const unsubscribe = subscribe("WHATSAPP_SIGNUP_STATUS", (payload) => {
      if (!payload) return;
      setSignupSteps(prev => ({
        ...prev,
        [payload.step]: {
          status: payload.status,
          message: payload.message,
          error: payload.error
        }
      }));
    });

    return unsubscribe;
  }, [subscribe]);

  const trySend = async () => {
    if (!authRef.current || !wabaRef.current) return;

    setShowProgress(true);
    setSignupSteps({}); // Reset steps

    const signupPromise = api.post("/whatsapp/embedded-signup", {
      code: authRef.current,
      wabaId: wabaRef.current?.waba_id,
      phoneNumberId: wabaRef.current?.phone_number_id,
      businessId: wabaRef.current?.business_id
    });

    try {
      await signupPromise;
      authRef.current = null;
      wabaRef.current = null;
      setSearch("");
      await fetchAccounts({ page: 1, per_page: pager.per_page });
    } catch (err) {
      authRef.current = null;
      wabaRef.current = null;
      // Error is handled via socket status updates as well
      console.error("Signup failed", err);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      toast.error(t("messages.facebookSdkNotInitialized"));
      return;
    }
    window.FB.login(fbLoginCallback, {
      config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { version: process.env.NEXT_PUBLIC_FB_EMBEDDED_ACCOUNT_SIGNUP_VERSION },
    });
  };

  const toggleDialogTitle =
    toggleState.row?.isActive === true ? t("toggle.disableTitle") : t("toggle.enableTitle");
  const toggleDialogDescription =
    toggleState.row?.isActive === true ? t("toggle.disableDescription") : t("toggle.enableDescription");

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.accounts") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={tCommon("howToUse")}
              tone="outline"
              variant="ghost"
              icon={<Info size={15} />}
            />
            <Button_
              size="sm"
              label={t("actions.openSettings")}
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              icon={<Settings size={18} />}
            />
            <Button_
              size="sm"
              label={t("toolbar.addAccount")}
              variant="solid"
              icon={<Plus size={18} />}
              onClick={launchWhatsAppSignup}
            />
          </>
        }
      // stats={statsCards}
      />

      <Table
        isLoading={loading}
        data={pager.records}
        columns={columns}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "whatsapp.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        filters={
          <>
            <FilterField label={t("filters.isActive")}>
              <Select
                value={filters.isActive || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.isActivePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.isActiveAll")}</SelectItem>
                  <SelectItem value="true">{t("filters.isActiveActive")}</SelectItem>
                  <SelectItem value="false">{t("filters.isActiveInactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            {/* 
            <FilterField label={t("filters.startDate")}>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="h-10 rounded-xl text-sm"
              />
            </FilterField>

            <FilterField label={t("filters.endDate")}>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="h-10 rounded-xl text-sm"
              />
            </FilterField> */}
          </>
        }
      />

      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("delete.title")}
        description={t("delete.description")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={toggleState.open}
        onOpenChange={(open) => setToggleState((s) => ({ ...s, open, row: open ? s.row : null }))}
        title={toggleDialogTitle}
        description={toggleDialogDescription}
        confirmText={tCommon("confirm")}
        cancelText={tCommon("cancel")}
        loading={toggling}
        onConfirm={confirmToggle}
      />

      <IntegrationProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        steps={signupSteps}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl min-w-[1000px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="text-primary" />
              {t("settingsDialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <WhatsAppTab hideAccount={false} onSave={() => setSettingsOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

