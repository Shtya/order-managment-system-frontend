"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Search, UserRoundSearch } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { avatarSrc } from "@/components/atoms/UserSelect";
import { useDebounce } from "@/hook/useDebounce";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;

function clientPhone(client) {
  return client?.primaryContact?.phoneNumber || "";
}

function clientInitials(client) {
  return (client?.name || "?").slice(0, 2).toUpperCase();
}

export default function ConnectOrderClientDialog({
  open,
  onOpenChange,
  order,
  onConnected,
}) {
  const t = useTranslations("orders.connectClient");
  const tMessages = useTranslations("orders.messages");
  const currentClient = order?.client || null;
  const isChange = !!currentClient?.id;

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search, delay: 300 });
  const [clients, setClients] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);

  const selectedClient =
    clients.find((client) => client.id === selectedId) ||
    (selectedId && currentClient?.id === selectedId ? currentClient : null);
  const canConnect = selectedId && selectedId !== currentClient?.id;

  const fetchClients = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      const requestId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = { limit: PAGE_SIZE };
        const query = String(debouncedSearch || "").trim();
        if (query) params.search = query;
        if (cursor) params.cursor = cursor;

        const res = await api.get("/clients/list", { params });
        if (requestId !== requestIdRef.current) return;

        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setClients((prev) => (append ? [...prev, ...data] : data));
        setNextCursor(res.data?.nextCursor || null);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        toast.error(normalizeAxiosError(error));
        if (!append) {
          setClients([]);
          setNextCursor(null);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedId(currentClient?.id || null);
    setClients([]);
    setNextCursor(null);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open, currentClient?.id]);

  useEffect(() => {
    if (!open) return;
    if (search !== debouncedSearch) return;
    fetchClients({ cursor: null, append: false });
  }, [open, search, debouncedSearch, fetchClients]);

  const handleConnect = async () => {
    if (!canConnect || !order?.id || !selectedClient?.id) return;
    setConnecting(true);
    try {
      await api.patch(`/orders/${order.id}`, { clientId: selectedClient.id });
      toast.success(
        isChange ? tMessages("clientChanged") : tMessages("clientLinked"),
      );
      onConnected?.(selectedClient);
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeAxiosError(error));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-[24px] gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRoundSearch size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle>
                {isChange ? t("changeTitle") : t("title")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isChange
                  ? t("changeDescription", { orderNumber: order?.orderNumber || "" })
                  : t("description", { orderNumber: order?.orderNumber || "" })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          {isChange && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={avatarSrc(currentClient.profilePicture)}
                  alt={currentClient.name}
                />
                <AvatarFallback className="text-xs">
                  {clientInitials(currentClient)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("current")}
                </div>
                <div className="truncate text-sm font-medium">{currentClient.name}</div>
              </div>
            </div>
          )}

          <div className="relative">
            {/* <Search
              size={16}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            /> */}
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 rounded-xl ps-9!"
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm font-medium">{t("empty")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {clients.map((client) => {
                const isCurrent = client.id === currentClient?.id;
                const isSelected = client.id === selectedId;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedId(client.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={avatarSrc(client.profilePicture)}
                        alt={client.name}
                      />
                      <AvatarFallback className="text-xs">
                        {clientInitials(client)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {client.name}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {t("current")}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[clientPhone(client), client.email].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={16} className="shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
              {nextCursor && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl"
                  disabled={loadingMore}
                  onClick={() => fetchClients({ cursor: nextCursor, append: true })}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("loadMore")
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border p-4 sm:justify-between">
          <p className="text-xs text-muted-foreground self-center">
            {!selectedId
              ? t("selectHint")
              : selectedId === currentClient?.id
                ? t("alreadyLinked")
                : selectedClient?.name}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={connecting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!canConnect || connecting}
              onClick={handleConnect}
            >
              {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
              {connecting
                ? t("connecting")
                : isChange
                  ? t("change")
                  : t("connect")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
