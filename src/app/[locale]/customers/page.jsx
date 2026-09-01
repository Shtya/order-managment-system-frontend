
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Edit,
  Eye,
  FileDown,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import PageHeader from "@/components/atoms/Pageheader";
import Table from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { useExport } from "@/hook/useExport";
import { Link, useRouter } from "@/i18n/navigation";
import { formatMessagePreview } from "@/utils/whatsapp-healper";
import api from "@/utils/api";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import ClientModal from "./atoms/ClientModal";

const STAT_CARDS = [
  { key: "totalClients", icon: Users, sortOrder: 0 },
  { key: "clientsWithOrders", icon: Phone, sortOrder: 1 },
  { key: "clientsWithDeliveredOrders", icon: Truck, sortOrder: 2 },
  { key: "clientsWithOrdersLast30Days", icon: UserCheck, sortOrder: 3 },
];

function getContacts(client) {
  return Array.isArray(client?.contacts) ? client.contacts : [];
}

function getPrimaryContact(client) {
  return client?.primaryContact || getContacts(client)[0] || null;
}

function latestContactMessageDate(client) {
  return getContacts(client)
    .map((contact) => contact.conversation?.lastMessageAt || contact.conversation?.lastMessage?.created_at || contact.lastMessageAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
}

export default function CustomersPage() {
  const tChats = useTranslations("chats");
  const t = useTranslations("customers");
  const format = useFormatter();
  const router = useRouter();
  const { handleExport } = useExport();

  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ sortBy: "createdAt", sortDir: "DESC" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [contactPickerClient, setContactPickerClient] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/clients/stats");
      setStats(res.data || {});
    } catch (error) {
      console.error("Failed to fetch customer stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(
    async ({ page: p = page, limit: l = limit } = {}) => {
      setLoading(true);
      try {
        const res = await api.get("/clients", {
          params: {
            search: debouncedSearch || undefined,
            sortBy: filters.sortBy || "createdAt",
            sortDir: filters.sortDir || "DESC",
            page: p,
            limit: l,
          },
        });
        setCustomers(res.data?.records || []);
        setTotalRecords(Number(res.data?.total_records || 0));
        setPage(Number(res.data?.current_page || p));
        setLimit(Number(res.data?.per_page || l));
      } catch (error) {
        const message = error.response?.data?.message || t("toast.fetchFailed");
        toast.error(Array.isArray(message) ? message[0] : message);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, filters, limit, page, t],
  );

  const refresh = useCallback(
    ({ page: p = page, limit: l = limit } = {}) => {
      fetchCustomers({ page: p, limit: l });
      fetchStats();
    },
    [fetchCustomers, fetchStats, limit, page],
  );

  useEffect(() => {
    refresh({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const statsCards = useMemo(
    () =>
      STAT_CARDS.map(({ key, icon, sortOrder }) => ({
        key,
        name: t(`stats.${key}`),
        value: stats?.[key] ?? 0,
        icon,
        sortOrder,
      })),
    [stats, t],
  );

  const pagination = useMemo(
    () => ({
      total_records: totalRecords,
      current_page: page,
      per_page: limit,
    }),
    [totalRecords, page, limit],
  );

  const hasActiveFilters = useMemo(
    // () => filters.sortBy !== "createdAt" || filters.sortDir !== "DESC",
    () => false,
    [filters],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handlePageChange = ({ page: p, per_page: l }) => {
    setPage(p);
    setLimit(l);
    fetchCustomers({ page: p, limit: l });
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const openDelete = (customer) => {
    setDeletingCustomer(customer);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/clients/${deletingCustomer.id}`);
      toast.success(t("toast.deleted"));
      setDeleteOpen(false);
      setDeletingCustomer(null);
      refresh({ page, limit });
    } catch (error) {
      const message = error.response?.data?.message || t("toast.deleteFailed");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChat = async (client) => {
    const contacts = getContacts(client);
    if (contacts.length === 1) {
      router.push("/whatsapp/chats?customerId=" + contacts[0].id);
      return;
    }
    if (contacts.length > 1) {
      setContactPickerClient(client);
    }
  };

  const exportParams = {
    search: debouncedSearch || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
  };

  const lastMessage = (row) =>
    getContacts(row)
      .map((contact) => contact.conversation?.lastMessage)
      .filter(Boolean)
      .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))[0];

  const columns = [
    {
      key: "customer",
      header: t("columns.customer"),
      className: "min-w-[260px]",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage
              src={avatarSrc(row.profilePicture || getPrimaryContact(row)?.profilePicture)}
              alt={row.name || ""}
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {(row.name || getPrimaryContact(row)?.phoneNumber || "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span
              className="block text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {row.name || getPrimaryContact(row)?.phoneNumber || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "primaryContactPhoneNumber",
      header: t("columns.primaryContactPhoneNumber"),
      cell: (row) => (
        <span className="text-sm text-foreground">{getPrimaryContact(row)?.phoneNumber || "—"}</span>
      ),
    },
    {
      key: "contacts",
      header: t("columns.contacts"),
      cell: (row) => {
        const contacts = getContacts(row);
    
        return (
          <div className="flex max-w-72 flex-wrap gap-1.5">
            {contacts.length ? (
              contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/whatsapp/chats?customerId=${contact.id}`}
                  title={contact.phoneNumber}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <MessageCircle className="h-2.5 w-2.5" />
                  </span>
    
                  <span dir="ltr" className="truncate">
                    {contact.phoneNumber}
                  </span>
                </Link>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
    
            {contacts.length > 4 ? (
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                +{contacts.length - 4}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "email",
      header: t("columns.email"),
      cell: (row) =>
        row.email ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail size={13} />
            {row.email}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "ordersCount",
      header: t("columns.ordersCount"),
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground">
          {Number(row.ordersCount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "lastMessage",
      header: t("columns.lastMessageAt"),
      cell: (row) => (
        <div className="text-xs text-muted-foreground truncate flex-1 whitespace-pre-wrap max-w-70">
          {formatMessagePreview(lastMessage(row), tChats) || "—"}
        </div>
      ),
    },
    {
      key: "lastMessageDate",
      header: t("columns.lastMessageDate"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(latestContactMessageDate(row))}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: t("columns.createdAt"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      className: "md:sticky md:z-20",
      cell: (row) => (
        <ActionButtons
          row={row}
          actions={[
            {
              icon: <Eye />,
              tooltip: t("actions.view"),
              variant: "primary",
              onClick: (r) => router.push(`/customers/${r.id}`),
            },
            {
              icon: <Edit />,
              tooltip: t("actions.edit"),
              variant: "blue",
              onClick: () => openEdit(row),
            },
            {
              icon: <Trash2 />,
              tooltip: t("actions.delete"),
              variant: "red",
              onClick: () => openDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen p-5">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.customers") },
        ]}
        stats={statsCards}
        statsLoading={statsLoading}
        buttons={
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-sm btn-solid gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("actions.new")}
          </button>
        }
      />

      <Table
        tableKey="customers"
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => {
          setPage(1);
          setDebouncedSearch(search);
        }}
        actions={[
          {
            key: "exportCustomers",
            label: t("toolbar.exportCustomers"),
            icon: <FileDown size={14} />,
            color: "primary",
            onClick: () =>
              handleExport({
                endpoint: "/clients/export",
                params: exportParams,
                filename: "Clients.xlsx",
              }),
          },
        ]}
        // filters={<CustomerFilters filters={filters} onChange={setFilters} />}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={() => {
          setPage(1);
          fetchCustomers({ page: 1, limit });
        }}
        labels={{
          searchPlaceholder: t("table.searchPlaceholder"),
          filter: t("table.filter"),
          apply: t("table.apply"),
          emptyTitle: t("table.emptyTitle"),
          emptySubtitle: t("table.emptySubtitle"),
        }}
        columns={columns}
        data={customers}
        isLoading={loading}
        rowKey={(row) => row.id}
        pagination={pagination}
        onPageChange={handlePageChange}
        compact
        striped
      />

      <ClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={editingCustomer}
        onSave={() => refresh({ page: editingCustomer ? page : 1, limit })}
      />

      <Dialog
        open={!!contactPickerClient}
        onOpenChange={(open) => !open && setContactPickerClient(null)}
      >
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{t("client.chooseContact")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {getContacts(contactPickerClient).map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => router.push(`/whatsapp/chats?customerId=${contact.id}`)}
                className="w-full rounded-xl border border-border bg-background p-3 text-start hover:border-primary/60 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc(contact.profilePicture)} alt={contact.name || ""} />
                    <AvatarFallback>{(contact.name || contact.phoneNumber || "?").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {contact.name || contact.phoneNumber}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {contact.phoneNumber} · {formatDate(contact.conversation?.lastMessageAt)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => setDeleteOpen(open)}
        title={t("delete.title")}
        description={t("delete.desc", {
          name: deletingCustomer?.name || getPrimaryContact(deletingCustomer)?.phoneNumber || "—",
        })}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
