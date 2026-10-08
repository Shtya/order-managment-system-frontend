"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { useTranslations } from "next-intl";

function listRecords(data) {
  if (Array.isArray(data)) return data;
  return data?.records || data?.data || [];
}

function axiosMessage(err, fallback) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    fallback;
  return Array.isArray(msg) ? msg[0] : String(msg);
}

function Field({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";

export default function HostedModelsCatalog() {
  const t = useTranslations("superAdminSettings");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("");
  const [integration, setIntegration] = useState(null);
  const [intLoading, setIntLoading] = useState(false);
  const [intResolved, setIntResolved] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savingInt, setSavingInt] = useState(false);
  const [testingInt, setTestingInt] = useState(false);

  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modelId, setModelId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isRecommended, setIsRecommended] = useState(false);
  const [saving, setSaving] = useState(false);

  const connected = !!(
    integration?.credentialsConfigured || integration?.credentials?.apiKey
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ai/hosted-models");
      setRows(Array.isArray(data) ? data : listRecords(data));
    } catch (err) {
      toast.error(axiosMessage(err, t("toast.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const loadProviders = useCallback(async () => {
    const { data } = await api.get("/ai/providers", { params: { scope: "all" } });
    const list = listRecords(data);
    setProviders(list);
    return list;
  }, []);

  const loadIntegration = useCallback(async (pid) => {
    if (!pid) {
      setIntegration(null);
      setIntResolved(false);
      return null;
    }
    setIntResolved(false);
    setIntLoading(true);
    try {
      const { data } = await api.get("/ai/integrations", {
        params: { providerId: pid, scope: "system" },
      });
      const list = listRecords(data);
      const row = list[0] || null;
      setIntegration(row);
      return row;
    } catch {
      setIntegration(null);
      return null;
    } finally {
      setIntLoading(false);
      setIntResolved(true);
    }
  }, []);

  const loadModels = useCallback(async (pid) => {
    if (!pid) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    try {
      const { data } = await api.get("/ai/models", {
        params: { providerId: pid, limit: 200, scope: "system", isActive: true },
      });
      const list = listRecords(data).filter(
        (m) => m.toolsCalling !== false && m.isActive !== false,
      );
      list.sort((a, b) =>
        (a.name || a.modelCode || "").localeCompare(b.name || b.modelCode || "", undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
      setModels(list);
    } catch (err) {
      toast.error(axiosMessage(err, t("aiHosted.catalog.loadModelsFailed")));
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, [t]);

  const openCreate = async () => {
    setEditing(null);
    setApiKey("");
    setIntResolved(false);
    setIntLoading(true);
    setModelId("");
    setName("");
    setDescription("");
    setDescriptionAr("");
    setIsActive(true);
    setIsRecommended(false);
    setOpen(true);
    try {
      const list = await loadProviders();
      const first = list[0]?.id || "";
      setProviderId(first);
      if (first) {
        const int = await loadIntegration(first);
        if (int?.credentialsConfigured || int?.credentials?.apiKey) {
          await loadModels(first);
        } else {
          setModels([]);
        }
      } else {
        setIntLoading(false);
        setIntResolved(true);
      }
    } catch (err) {
      setIntLoading(false);
      setIntResolved(true);
      toast.error(axiosMessage(err, t("toast.loadError")));
    }
  };

  const openEdit = async (row) => {
    setEditing(row);
    setApiKey("");
    setModelId(row.modelId || "");
    setName(row.name || "");
    setDescription(row.description || "");
    setDescriptionAr(row.descriptionAr || "");
    setIsActive(row.isActive !== false);
    setIsRecommended(!!row.isRecommended);
    setIntResolved(false);
    setIntLoading(true);
    setOpen(true);
    try {
      const list = await loadProviders();
      const pid = row.provider?.id || list[0]?.id || "";
      setProviderId(pid);
      if (pid) {
        const int = await loadIntegration(pid);
        if (int?.credentialsConfigured || int?.credentials?.apiKey) {
          await loadModels(pid);
        }
      } else {
        setIntLoading(false);
        setIntResolved(true);
      }
    } catch (err) {
      setIntLoading(false);
      setIntResolved(true);
      toast.error(axiosMessage(err, t("toast.loadError")));
    }
  };

  const onProviderChange = async (pid) => {
    setProviderId(pid);
    setModelId("");
    setApiKey("");
    const int = await loadIntegration(pid);
    if (int?.credentialsConfigured || int?.credentials?.apiKey) {
      await loadModels(pid);
    } else {
      setModels([]);
    }
  };

  const onModelChange = (id) => {
    setModelId(id);
    const model = models.find((m) => m.id === id);
    if (model && !editing) setName(model.name || model.modelCode || "");
  };

  const saveIntegration = async () => {
    if (!providerId) return;
    if (!apiKey.trim()) {
      toast.error(t("aiHosted.catalog.apiKeyRequired"));
      return;
    }
    setSavingInt(true);
    const tid = toast.loading(t("aiHosted.catalog.savingIntegration"));
    try {
      await api.post(`/ai/integrations/${providerId}/credentials`, {
        credentials: { apiKey: apiKey.trim() },
      });
      toast.success(t("aiHosted.catalog.integrationSaved"), { id: tid });
      setApiKey("");
      await loadIntegration(providerId);
      await loadModels(providerId);
    } catch (err) {
      toast.error(axiosMessage(err, t("aiHosted.catalog.integrationSaveFailed")), {
        id: tid,
      });
    } finally {
      setSavingInt(false);
    }
  };

  const testIntegration = async () => {
    if (!providerId) return;
    setTestingInt(true);
    const tid = toast.loading(t("aiHosted.catalog.testing"));
    try {
      await api.post(`/ai/integrations/${providerId}/test`);
      toast.success(t("aiHosted.catalog.testOk"), { id: tid });
      await loadIntegration(providerId);
    } catch (err) {
      toast.error(axiosMessage(err, t("aiHosted.catalog.testFailed")), { id: tid });
    } finally {
      setTestingInt(false);
    }
  };

  const syncModels = async () => {
    if (!providerId) return;
    setSyncing(true);
    const tid = toast.loading(t("aiHosted.catalog.syncing"));
    try {
      const { data } = await api.post(`/ai/providers/${providerId}/sync-models`);
      const created = data?.created ?? 0;
      toast.success(
        created > 0
          ? t("aiHosted.catalog.synced", { count: created })
          : t("aiHosted.catalog.syncNoNew"),
        { id: tid },
      );
      await loadModels(providerId);
    } catch (err) {
      toast.error(axiosMessage(err, t("aiHosted.catalog.syncFailed")), { id: tid });
    } finally {
      setSyncing(false);
    }
  };

  const saveSku = async (e) => {
    e.preventDefault();
    if (!connected) {
      toast.error(t("aiHosted.catalog.needIntegration"));
      return;
    }
    if (!modelId) {
      toast.error(t("aiHosted.catalog.modelRequired"));
      return;
    }
    setSaving(true);
    const tid = toast.loading(t("aiHosted.catalog.saving"));
    try {
      const payload = {
        modelId,
        integrationId: integration?.id || null,
        name: name.trim() || undefined,
        description: description.trim() || null,
        descriptionAr: descriptionAr.trim() || null,
        isActive,
        isRecommended,
      };
      if (editing) {
        await api.patch(`/ai/hosted-models/${editing.id}`, payload);
      } else {
        await api.post("/ai/hosted-models", payload);
      }
      toast.success(t("toast.saveSuccess"), { id: tid });
      setOpen(false);
      await loadRows();
    } catch (err) {
      toast.error(axiosMessage(err, t("toast.saveError")), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await api.delete(`/ai/hosted-models/${deleteRow.id}`);
      toast.success(t("aiHosted.catalog.deleted"));
      setDeleteRow(null);
      await loadRows();
    } catch (err) {
      toast.error(axiosMessage(err, t("toast.saveError")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 main-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-foreground">{t("aiHosted.catalog.title")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("aiHosted.catalog.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold bg-[var(--primary)] text-white"
        >
          <Plus size={14} />
          {t("aiHosted.catalog.add")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={22} />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
          {t("aiHosted.catalog.empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between gap-3 p-4 rounded-xl border border-border/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold">{row.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.provider?.name || "—"} → {row.modelCode || row.code}
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                      row.isActive
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {row.isActive ? t("aiHosted.catalog.active") : t("aiHosted.catalog.inactive")}
                  </span>
                  {row.isRecommended && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {t("aiHosted.catalog.recommended")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border" onClick={() => openEdit(row)}>
                  <Pencil size={14} />
                </button>
                <button type="button" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-destructive/40 text-destructive" onClick={() => setDeleteRow(row)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("aiHosted.catalog.editTitle") : t("aiHosted.catalog.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSku} className="space-y-4">
            <Field label={t("aiHosted.catalog.provider")} required>
              <select
                className={selectClass}
                value={providerId}
                onChange={(e) => onProviderChange(e.target.value)}
              >
                <option value="">{t("aiHosted.catalog.pickProvider")}</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            {intLoading || (providerId && !intResolved) ? (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                {t("aiHosted.catalog.checkingIntegration")}
              </p>
            ) : providerId && intResolved ? (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  {connected
                    ? t("aiHosted.catalog.integrationReady")
                    : t("aiHosted.catalog.noIntegration")}
                </p>
                <Field label={t("aiHosted.catalog.apiKey")} required>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    dir="ltr"
                    className="h-11"
                    placeholder={
                      connected && integration?.credentials?.apiKey
                        ? integration.credentials.apiKey
                        : undefined
                    }
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingInt}
                    onClick={saveIntegration}
                    className="h-10 px-3 rounded-xl text-xs font-bold bg-[var(--primary)] text-white disabled:opacity-50"
                  >
                    {savingInt && <Loader2 size={12} className="inline animate-spin me-1" />}
                    {t("aiHosted.catalog.saveIntegration")}
                  </button>
                  <button
                    type="button"
                    disabled={testingInt || !connected}
                    onClick={testIntegration}
                    className="h-10 px-3 rounded-xl text-xs font-bold border border-border disabled:opacity-50"
                  >
                    {t("aiHosted.catalog.test")}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Field label={t("aiHosted.catalog.model")} required>
                  <select
                    className={selectClass}
                    value={modelId}
                    disabled={!connected || modelsLoading}
                    onChange={(e) => onModelChange(e.target.value)}
                  >
                    <option value="">
                      {connected
                        ? t("aiHosted.catalog.pickModel")
                        : t("aiHosted.catalog.connectFirst")}
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.modelCode} — {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <button
                type="button"
                disabled={!connected || syncing}
                onClick={syncModels}
                className="h-11 px-3 rounded-xl border border-border text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                {t("aiHosted.catalog.refresh")}
              </button>
            </div>

            <Field label={t("aiHosted.catalog.displayName")}>
              <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t("aiHosted.catalog.descriptionEn")}>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label={t("aiHosted.catalog.descriptionAr")}>
                <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                {t("aiHosted.catalog.active")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isRecommended}
                  onChange={(e) => setIsRecommended(e.target.checked)}
                />
                {t("aiHosted.catalog.recommended")}
              </label>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-xl border border-border text-sm font-bold"
              >
                {t("aiHosted.catalog.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-4 rounded-xl text-sm font-bold bg-[var(--primary)] text-white disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="inline animate-spin me-1" />}
                {t("common.saveChanges")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(v) => !v && setDeleteRow(null)}
        title={t("aiHosted.catalog.deleteTitle")}
        description={deleteRow?.name}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
