"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileDown,
  Info,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  Activity,
  Eye,
  BarChart3,
  Clock,
  ShieldAlert,
  Settings
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Button_ from "@/components/atoms/Button";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WhatsAppTab } from "../../settings/page";
import { Settings2 } from "lucide-react";
// Mock Data
const MOCK_ACCOUNTS = [
  {
    id: "1",
    name: "Sales Department",
    number: "+201234567890",
    connectDate: "2024-05-01T10:00:00Z",
    status: "connected",
    isActive: true,
  },
  {
    id: "2",
    name: "Customer Support",
    number: "+201987654321",
    connectDate: "2024-04-15T08:30:00Z",
    status: "connected",
    isActive: true,
  },
  {
    id: "3",
    name: "Marketing Team",
    number: "+201112223334",
    connectDate: "2024-03-20T14:20:00Z",
    status: "disconnected",
    isActive: false,
  }
];

const MOCK_STATS = {
  deliveryRate: "98.5%",
  readRate: "85.2%",
  responseRate: "72.4%",
  conversionRate: "12.8%",
  avgResponseTime: "4m 20s",
  blockRate: "0.2%"
};

export default function WhatsAppAccountsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.accounts");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Stats Configuration
  const statsCards = useMemo(() => [
    { name: t("stats.deliveryRate"), value: MOCK_STATS.deliveryRate, icon: CheckCircle2, color: "#10b981" },
    { name: t("stats.readRate"), value: MOCK_STATS.readRate, icon: Eye, color: "#3b82f6" },
    { name: t("stats.responseRate"), value: MOCK_STATS.responseRate, icon: MessageSquare, color: "#8b5cf6" },
    { name: t("stats.conversionRate"), value: MOCK_STATS.conversionRate, icon: BarChart3, color: "#f59e0b" },
    { name: t("stats.avgResponseTime"), value: MOCK_STATS.avgResponseTime, icon: Clock, color: "#6366f1" },
  ], [t]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc =>
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.number.includes(search)
    );
  }, [accounts, search]);

  const handleToggleActive = (id) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
    ));
    toast.success(t("messages.updateSuccess"));
  };

  const confirmDelete = () => {
    setAccounts(prev => prev.filter(acc => acc.id !== deleteState.id));
    setDeleteState({ open: false, id: null });
    toast.success(t("messages.deleteSuccess"));
  };

  const onExport = () => {
    toast.success(t("messages.exportStarted"));
  };

  const columns = useMemo(() => [
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
      )
    },
    {
      header: t("table.number"),
      key: "number",
      cell: (row) => <span className="font-mono">{row.number}</span>
    },
    {
      header: t("table.connectDate"),
      key: "connectDate",
      cell: (row) => new Date(row.connectDate).toLocaleDateString()
    },

    {
      header: t("table.status"), // active or disabled
      key: "isActive",
      cell: (row) => (
        <div className={cn(
          "font-bold text-xs",
          row.isActive ? "text-emerald-600" : "text-slate-400"
        )}>
          {row.isActive ? t("table.active") : t("table.disabled")}
        </div>
      )
    },
    {
      header: t("table.actions"),
      key: "actions",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Power size={16} />,
              tooltip: row.isActive ? t("actions.disable") : t("actions.enable"),
              onClick: () => handleToggleActive(row.id),
              variant: row.isActive ? "orange" : "emerald",
            },
            {
              icon: <Trash2 size={16} />,
              tooltip: t("actions.delete"),
              onClick: () => setDeleteState({ open: true, id: row.id }),
              variant: "danger",
            }
          ]}
        />
      )
    }
  ], [t]);

  const authRef = useRef(null);
  const wabaRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      // Security check (IMPORTANT)
      if (event.origin !== "https://www.facebook.com") return;

      try {
        const data = JSON.parse(event.data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            console.log("Signup finished:", data.data);
            // Example:
            // const { phone_number_id, waba_id,code } = data.data;
            wabaRef.current = data.data;
            trySend();
          }

          if (data.event === "CANCEL") {
            console.log("Signup cancelled:", data.data);
          }
        }
      } catch (err) {
        console.log("Non-JSON message:", event.data);
      }
    };

    // Add listener
    window.addEventListener("message", handler);

    // Cleanup (VERY IMPORTANT in React)
    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  const fbLoginCallback = (response) => {

    console.log("response: ", response);
    if (response.authResponse?.code) {
      authRef.current = response.authResponse.code;
      trySend();
    }
  };

  const trySend = async () => {
    if (!authRef.current || !wabaRef.current) return;

    console.log("try geted: ", authRef.current, wabaRef.current.waba_id, wabaRef.current.phone_number_id)
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not initialized");
      return;
    }
    // Launch Facebook login
    window.FB.login(fbLoginCallback, {
      config_id: '3417877861712815', // configuration ID goes here
      response_type: 'code', // must be set to 'code' for System User access token
      override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
      extras: { "version": "v4", }
    });
  }

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.accounts") }
        ]}
        buttons={
          <>
            <Button_ size="sm" label={tCommon("howToUse")} tone="outline" variant="ghost" icon={<Info size={15} />} />
            <Button_
              size="sm"
              label="الإعدادات"
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              icon={<Settings size={18} />}
            />
            <Button_
              size="sm"
              label="إضافة حساب" // استبدال t("toolbar.addAccount") بالعربية بناءً على طلبك السابق
              variant="solid"
              icon={<Plus size={18} />}
              onClick={launchWhatsAppSignup}
            />
          </>
        }
        stats={statsCards}
      />

      <Table
        searchValue={search}
        onSearchChange={setSearch}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: tCommon("apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
          },
        ]}
        columns={columns}
        data={filteredAccounts}
        isLoading={loading}
        pagination={{
          total_records: filteredAccounts.length,
          current_page: 1,
          per_page: 10,
        }}
      />

      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("actions.delete")}
        description={t("actions.confirmDelete")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        onConfirm={confirmDelete}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl min-w-[1000px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="text-primary" />
              إعدادات  الواتساب
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <WhatsAppTab hideAccount={false} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
