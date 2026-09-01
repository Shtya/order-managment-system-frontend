"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { useConversation } from "./ConversationContext";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { cn } from "@/utils/cn";

export default function ChatSidebar({ conversation, onClose }) {
  const t = useTranslations("chats");
  const { hasPermission } = useAuth();
  const { formatCurrency } = usePlatformSettings();
  const { setMobileView } = useConversation();
  const contact = conversation?.customer;
  const clientId = contact?.clientId || contact?.client?.id;

  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);

  useEffect(() => {
    if (!clientId || !hasPermission("customer.read")) {
      setClient(null);
      setStats(null);
      setLoadingClient(false);
      return;
    }

    let cancelled = false;
    setLoadingClient(true);
    setClient(null);
    setStats(null);

    Promise.all([
      api.get(`/clients/${clientId}`),
      api.get(`/clients/${clientId}/orders/stats`).catch(() => ({ data: {} })),
    ])
      .then(([clientRes, statsRes]) => {
        if (cancelled) return;
        setClient(clientRes.data || null);
        setStats(statsRes.data?.stats || statsRes.data || {});
      })
      .catch(() => {
        if (!cancelled) {
          setClient(null);
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingClient(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, conversation?.id]);

  const defaultAddress = useMemo(() => {
    const addresses = client?.addresses || [];
    return addresses.find((address) => address.isDefault) || addresses[0] || null;
  }, [client]);

  if (!conversation) return null;

  const handleClose = () => {
    onClose();
    if (window.innerWidth < 768) setMobileView("chat");
  };

  const copyValue = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copied"));
    }
  };

  const initials = (contact?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const addressLabel = defaultAddress
    ? [defaultAddress.area, defaultAddress.city, defaultAddress.address].filter(Boolean).join(" · ")
    : null;
  const primaryNumber = client?.primaryContact?.phoneNumber || client?.primaryNumber;
  const displayEmail = client?.email;
  const canReadClient = Boolean(clientId && hasPermission("customer.read"));

  const statCards = [
    { label: t("statOrders"), value: stats?.totalOrders ?? 0, tint: "color-mix(in srgb, #6763af 8%, transparent)" },
    { label: t("statConfirmed"), value: stats?.confirmedCount ?? 0, tint: "color-mix(in srgb, #6763af 8%, transparent)" },
    { label: t("statDelivered"), value: stats?.deliveredCount ?? 0, tint: "color-mix(in srgb, #16a34a 8%, transparent)" },
    { label: t("statSpent"), value: formatCurrency(stats?.totalSales ?? 0), tint: "color-mix(in srgb, var(--primary) 8%, transparent)" },
    //confirmed count
    //shipped count
    // { label: t("statShipped"), value: stats?.shippedCount ?? 0, tint: "color-mix(in srgb, #16a34a 8%, transparent)" },
    //returned count
    // { label: t("statReturned"), value: stats?.returnedCount ?? 0, tint: "color-mix(in srgb, #dc2626 8%, transparent)" },
  ];

  return (
    <div className="w-full md:w-[320px] border-s border-border bg-card flex flex-col h-full">
      <div className="px-5 py-4 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground">{t("customerDetails")}</h2>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="px-5 pb-5 flex flex-col items-center text-center border-b border-border/70">
          <div className="w-[72px] h-[72px] rounded-full bg-muted overflow-hidden flex items-center justify-center text-lg font-semibold text-muted-foreground">
            {contact?.profilePicture ? (
              <img src={avatarSrc(contact.profilePicture)} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground leading-tight">
            {contact?.name || t("contactName")}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <ActionIcon
              href={contact?.phoneNumber ? `tel:${contact.phoneNumber}` : undefined}
              disabled={!contact?.phoneNumber}
              label={t("phoneNumber")}
            >
              <Phone className="w-4 h-4" />
            </ActionIcon>
            <ActionIcon
              href={displayEmail ? `mailto:${displayEmail}` : undefined}
              disabled={!displayEmail}
              label={t("email")}
            >
              <Mail className="w-4 h-4" />
            </ActionIcon>
          </div>
        </section>

        <section className="px-5 py-4 border-b border-border/70">
          {canReadClient && loadingClient ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-border px-3 py-3 text-center"
                  style={{ background: card.tint }}
                >
                  <div className="text-[17px] font-semibold text-foreground leading-none tracking-tight">
                    {card.value}
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">{card.label}</div>
                </div>
              ))}
            </div>
          )}
          {clientId && (
            <Link
              href={`/customers/${clientId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-full border border-border text-sm text-foreground hover:bg-muted/60 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("viewFullProfile")}
            </Link>
          )}
        </section>

        <Section title={t("contactInformation")}>
          {displayEmail && (
            <CopyRow value={displayEmail} onCopy={() => copyValue(displayEmail)} />
          )}
          {contact?.phoneNumber && (
            <CopyRow value={contact.phoneNumber} onCopy={() => copyValue(contact.phoneNumber)} />
          )}
          {!displayEmail && !contact?.phoneNumber && (
            <EmptyLine text="—" />
          )}
        </Section>

        <Section title={t("clientSection")}>
          {!clientId ? (
            <EmptyLine text={t("noLinkedClient")} />
          ) : loadingClient ? (
            <ClientCardSkeleton />
          ) : client ? (
            <Link
              href={`/customers/${clientId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {client.profilePicture ? (
                  <img src={avatarSrc(client.profilePicture)} alt="" className="w-full h-full object-cover" />
                ) : (
                  (client.name || "?").charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1 text-start">
                <div className="text-sm font-semibold text-foreground truncate">
                  {client.name || t("clientSection")}
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  {primaryNumber || displayEmail || "—"}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ) : (
            <EmptyLine text={t("noLinkedClient")} />
          )}
        </Section>

        {addressLabel && (
          <Section title={t("primaryAddress")}>
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="leading-relaxed">{addressLabel}</span>
            </div>
          </Section>
        )}

        <Section title={t("contactNotes")}>
          {contact?.notes ? (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
          ) : (
            <EmptyLine text={t("noContactNotes")} />
          )}
        </Section>

        {clientId && (
          <Section title={t("clientNotes")}>
            {loadingClient ? (
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            ) : client?.notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{client.notes}</p>
            ) : (
              <EmptyLine text={t("noClientNotes")} />
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="px-5 py-4 border-b border-border/70 last:border-b-0">
      <div className="mb-3 text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">
        {title}
      </div>
      {children}
    </section>
  );
}

function ActionIcon({ href, external, disabled, label, children }) {
  const className = cn(
    "w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-colors",
    disabled ? "opacity-40 pointer-events-none" : "hover:bg-muted hover:text-foreground",
  );

  if (!href || disabled) {
    return (
      <span className={className} aria-label={label}>
        {children}
      </span>
    );
  }

  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} aria-label={label}>
      {children}
    </a>
  );
}

function CopyRow({ value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-foreground truncate">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function EmptyLine({ text }) {
  return <p className="text-sm text-muted-foreground italic">{text}</p>;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 animate-pulse">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-xl border border-border px-3 py-3">
          <div className="h-5 w-10 mx-auto rounded bg-muted" />
          <div className="h-3 w-12 mx-auto mt-2 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted/70" />
      </div>
    </div>
  );
}
