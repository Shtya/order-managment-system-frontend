"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  LayoutTemplate,
  MailPlus,
  Maximize2,
  Minimize2,
  Monitor,
  Redo2,
  Send,
  Server,
  Smartphone,
  Undo2,
} from "lucide-react";
import api from "@/utils/api";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DocumentHistory,
  upgradeDocument,
  flatten,
  updateNode,
  structural,
  section,
  node,
  richText,
  starter,
  sampleVariables,
  VARIABLES,
  tableDocument,
  imageIds,
  moveToColumn,
  columnLayout,
  layoutColumn,
  buildEmailPreviewPayload,
} from "./document";
import ReactCanvas from "./ReactCanvas";
import { Label } from "@/components/ui/label";
import EmailEnvelope, { GmailIcon, InboxPreview } from "./EmailEnvelope";
import SmtpConnectionDialog from "./SmtpConnectionDialog";
import EmailBlocksPanel from "./EmailBlocksPanel";
import EmailProperties from "./EmailProperties";
import {
  EmailClientFrame,
  Field,
  IconButton,
  SectionTitle,
  Segmented,
} from "./parts";
import { Button } from "../ui/button";
import Button_ from "@/components/atoms/Button";
import { getCampaignPlaceholderChips } from "@/app/[locale]/campaigns/atoms/campaignPlaceholders";
import { VariablePreviewText } from "@/components/ui/VariableChip";
import EmailSendingGuidelines from "./EmailSendingGuidelines";
import {
  beginEmailMediaUpload,
  endEmailMediaUpload,
  findIncompleteEmailMedia,
  hasPendingEmailMediaUploads,
} from "./media-state";
const tablesEnabled = process.env.NEXT_PUBLIC_EMAIL_TABLES_ENABLED === "true";
const TEMPLATES = ["blank", "announcement", "promotion", "product"];

function FullscreenPortal({ active, children }) {
  return active ? createPortal(children, document.body) : children;
}

export default function EmailBuilder({ watch, setValue, historyRef, errors, setError, clearErrors, onGlobalError }) {
  const tw = useTranslations("campaigns.wizard");
  const t = useTranslations("emailBuilder");
  const variableOptions = useMemo(() => getCampaignPlaceholderChips(tw), [tw]);
  const email = watch("email") || {};
  const initial = useMemo(() => upgradeDocument(email.document), []);
  const localHistory = useRef(null);
  const history = historyRef || localHistory;
  const initialized = useRef(false);
  if (!initialized.current) {
    if (
      !history.current ||
      JSON.stringify(history.current.value) !== JSON.stringify(initial)
    )
      history.current = new DocumentHistory(initial);
    initialized.current = true;
  }
  const [doc, setDoc] = useState(initial),
    [selected, select] = useState(null),
    [accounts, setAccounts] = useState([]),
    [status, setStatus] = useState(null),
    [assets, setAssets] = useState({}),
    [preview, setPreview] = useState(null),
    [dialog, setDialog] = useState(null),
    [senderDialog, setSenderDialog] = useState(null),
    [previewMobile, setPreviewMobile] = useState(false),
    [mobile, setMobile] = useState(false),
    [full, setFull] = useState(false),
    [busy, setBusy] = useState(false),
    [mediaUploads, setMediaUploads] = useState(0),
    [testTo, setTestTo] = useState(""),
    [testToError, setTestToError] = useState(""),
    [message, setMessage] = useState(""),
    [testPending, setTestPending] = useState(false),
    [testNeedsReconnect, setTestNeedsReconnect] = useState(false),
    [continuation, setContinuation] = useState(null),
    [focusRequest, setFocusRequest] = useState(null),
    [diagnostics, setDiagnostics] = useState([]),
    [samples, setSamples] = useState(sampleVariables);
  const root = useRef(null),
    statusPending = useRef({}),
    live = useRef(true),
    popupRef = useRef(null),
    oauthCompletionHandled = useRef(false),
    accountId = email.accountId;
  const currentAccount = useRef(accountId);
  currentAccount.current = accountId;
  const patchEmail = (patch) =>
    setValue(
      "email",
      { ...(watch("email") || {}), ...patch },
      { shouldDirty: true },
    );
  const commit = (next, group) => {
    setDiagnostics([]);
    const value = history.current.commit(next, group);
    setDoc(value);
    patchEmail({ document: value });
  };
  const applyHistory = (action) => {
    const value = history.current[action]();
    setDoc(value);
    patchEmail({ document: value });
  };
  useEffect(() => {
    live.current = true;
    patchEmail({ document: initial });
    return () => {
      history.current.flush();
      live.current = false;
    };
  }, []);
  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [full]);
  useEffect(() => {
    const showDiagnostics = (event) => {
      const next = event.detail || [];
      setDiagnostics(next);
      if (next[0]?.elementId) select(next[0].elementId);
    };
    window.addEventListener("email-builder-diagnostics", showDiagnostics);
    return () =>
      window.removeEventListener("email-builder-diagnostics", showDiagnostics);
  }, []);
  useEffect(() => {
    if (
      email.document &&
      JSON.stringify(email.document) !== JSON.stringify(history.current.value)
    ) {
      const next = upgradeDocument(email.document);
      history.current = new DocumentHistory(next);
      setDoc(next);
      select(null);
    }
  }, [email.document]);
  useEffect(() => {
    const own = accounts.find((a) => a.id === accountId)?.email;
    if (own && !testTo) setTestTo(own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, accountId]);
  useEffect(() => {
    const selectedAccount = accounts.find((item) => item.id === accountId);
    if (selectedAccount && email.accountStatus !== selectedAccount.status)
      patchEmail({ accountStatus: selectedAccount.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, accountId, email.accountStatus]);
  const loadAccounts = async () => {
    const { data } = await api.get("/email/accounts");
    if (live.current) {
      setAccounts(data);
      if (!currentAccount.current) {
        const firstConnected = data.find((item) => item.status === "connected");
        if (firstConnected)
          patchEmail({
            accountId: firstConnected.id,
            accountStatus: firstConnected.status,
          });
      }
    }
    return data;
  };
  const loadStatus = async () => {
    if (!accountId || document.hidden) return;
    if (statusPending.current[accountId])
      return statusPending.current[accountId];
    statusPending.current[accountId] = api
      .get(`/email/accounts/${accountId}/sending-status`)
      .then(({ data }) => {
        if (live.current && data.accountId === currentAccount.current)
          setStatus(data);
      })
      .catch((error) => {
        if (error.response?.status !== 429) setStatus(null);
      })
      .finally(() => {
        delete statusPending.current[accountId];
      });
    return statusPending.current[accountId];
  };
  useEffect(() => {
    loadAccounts().catch(() => toast.error(t("feedback.loadError")));
  }, []);
  useEffect(() => {
    setStatus(null);
    loadStatus();
    const timer = setInterval(loadStatus, 30000);
    const visible = () => {
      if (!document.hidden) loadStatus();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [accountId]);
  useEffect(() => {
    const handleCompletion = (data) => {
      if (data?.type !== "email-oauth-complete" || oauthCompletionHandled.current)
        return;
      oauthCompletionHandled.current = true;
      popupRef.current?.close();
      if (data.status === "connected") {
        loadAccounts()
          .then((rows) => {
            if (
              rows.some(
                (row) =>
                  row.id === data.accountId && row.status === "connected",
              )
            )
              patchEmail({ accountId: data.accountId });
            return loadStatus();
          })
          .catch(() => toast.error(t("feedback.loadError")));
      }
      popupRef.current = null;
    };
    const complete = (event) => {
      if (
        event.origin === window.location.origin &&
        event.source === popupRef.current
      )
        handleCompletion(event.data);
    };
    const storageComplete = (event) => {
      if (event.key !== "email-oauth-complete" || !event.newValue) return;
      try {
        handleCompletion(JSON.parse(event.newValue));
      } catch { }
    };
    const channel =
      typeof BroadcastChannel === "function"
        ? new BroadcastChannel("email-oauth-complete")
        : null;
    if (channel) channel.onmessage = (event) => handleCompletion(event.data);
    window.addEventListener("message", complete);
    window.addEventListener("storage", storageComplete);
    return () => {
      window.removeEventListener("message", complete);
      window.removeEventListener("storage", storageComplete);
      channel?.close();
    };
  }, [accountId]);
  useEffect(() => {
    const host = root.current;
    const custom = (e) => applyHistory(e.detail);
    const key = (e) => {
      if (
        e.target.closest?.("[data-email-history]") &&
        (e.ctrlKey || e.metaKey) &&
        !e.isComposing &&
        ["z", "y"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        applyHistory(
          e.shiftKey || e.key.toLowerCase() === "y" ? "redo" : "undo",
        );
      }
    };
    host.addEventListener("email-history", custom);
    host.addEventListener("keydown", key);
    return () => {
      host.removeEventListener("email-history", custom);
      host.removeEventListener("keydown", key);
    };
  }, []);
  const elements = flatten(doc),
    current = elements.find((n) => n.id === selected);
  const assetIds = imageIds(doc).sort().join(",");
  useEffect(() => {
    if (!assetIds) return;
    const renew = () => {
      if (!document.hidden)
        api
          .post("/email/assets/retain", { ids: assetIds.split(",") })
          .then(({ data }) => {
            if (live.current)
              setAssets((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  (data.assets || []).map((a) => [a.id, a]),
                ),
              }));
          })
          .catch(() => setMessage(t("feedback.loadError")));
    };
    renew();
    const timer = setInterval(renew, 3600000);
    return () => clearInterval(timer);
  }, [assetIds]);
  async function connect(reconnect = false) {
    oauthCompletionHandled.current = false;
    sessionStorage.setItem(
      "email-oauth-return",
      window.location.pathname + window.location.search,
    );
    const popupWidth = 620;
    const popupHeight = 760;
    const popupLeft = Math.max(
      0,
      (window.screenX ?? window.screenLeft ?? 0) +
      Math.round((window.outerWidth - popupWidth) / 2),
    );
    const popupTop = Math.max(
      0,
      (window.screenY ?? window.screenTop ?? 0) +
      Math.round((window.outerHeight - popupHeight) / 2),
    );
    popupRef.current = window.open(
      "about:blank",
      "email-google-connect",
      `popup,width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`,
    );
    popupRef.current?.focus();
    try {
      const { data } = await api.post(
        reconnect
          ? `/email/accounts/${accountId}/reconnect`
          : "/email/accounts/gmail/connect",
        {
          returnTo: "/integrations/gmail-complete.html",
          browserRedirect: true,
        },
      );
      const target = new URL(data.browserAuthorizationUrl),
        callback = new URL(data.callbackUrl);
      if (
        target.origin !== callback.origin ||
        !target.pathname.endsWith("/email/accounts/gmail/authorize")
      )
        throw new Error(t("feedback.loadError"));
      if (popupRef.current) popupRef.current.location = target.href;
      else setContinuation(target.href);
    } catch (error) {
      popupRef.current?.close();
      toast.error(error.response?.data?.message || t("feedback.loadError"));
    }
  }
  async function disconnectSender() {
    const id = senderDialog?.accountId;
    if (!id) return;
    setBusy(true);
    try {
      await api.delete(`/email/accounts/${id}`);
      if (accountId === id) patchEmail({ accountId: "", accountStatus: null });
      setSenderDialog(null);
      await loadAccounts();
      toast.success(t("smtp.disconnected"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("feedback.loadError"));
    } finally {
      setBusy(false);
    }
  }
  async function perform(action) {
    setBusy(true);
    history.current.flush();
    try {
      await action();
    } catch (error) {
      const nextDiagnostics = error.response?.data?.diagnostics || [];
      setDiagnostics(nextDiagnostics);
      const diagnostic = nextDiagnostics[0];
      if (diagnostic?.elementId) select(diagnostic.elementId);
      toast.error(
        error.response?.data?.message || error.message || t("feedback.loadError"),
      );
    } finally {
      if (live.current) setBusy(false);
    }
  }
  const content = () =>
    buildEmailPreviewPayload({
      email: {
        subject: email.subject || "",
        preheader: email.preheader || "",
        businessIdentity: email.businessIdentity || "",
        document: doc,
      },
      overrideVariables: { ...samples, "customer.email": testTo },
    });
  async function render() {
    const { data } = await api.post("/email/content/preview", content());
    setPreview(data);
    return data;
  }
  async function sendTest() {
    const selectedAccount = accounts.find((item) => item.id === accountId);
    clearErrors?.("email");
    onGlobalError?.("");
    if (mediaUploads > 0 || hasPendingEmailMediaUploads()) {
      toast.error(t("feedback.mediaUploadingBlocked"));
      return;
    }
    const incompleteMedia = findIncompleteEmailMedia(doc);
    if (incompleteMedia) {
      select(incompleteMedia.id);
      toast.error(t("feedback.mediaSourceRequired"));
      return;
    }
    let invalid = false;
    const requireField = (field, missing, message) => {
      if (!missing) return;
      invalid = true;
      setError?.(`email.${field}`, { type: "manual", message });
    };
    requireField(
      "accountId",
      selectedAccount?.status === "suspended",
      "validation.emailAccountSuspended",
    );
    requireField("accountId", !accountId, "validation.emailAccountRequired");
    requireField("subject", !email.subject?.trim(), "validation.emailSubjectRequired");
    requireField(
      "businessIdentity",
      !email.businessIdentity?.trim(),
      "validation.emailIdentityRequired",
    );
    if (!doc?.blocks?.length) {
      invalid = true;
      onGlobalError?.(tw("validation.emailContentRequired"));
    }
    if (invalid) {
      if (selectedAccount?.status === "suspended")
        toast.error(t("feedback.accountSuspended"));
      return;
    }
    const recipientInput = root.current.querySelector("[data-test-recipient]");
    if (!testTo || !recipientInput?.checkValidity()) {
      setTestToError(t("feedback.testRecipientRequired"));
      recipientInput?.reportValidity();
      return;
    }
    setTestNeedsReconnect(false);
    setTestPending(true);
    setMessage(t("feedback.pending"));
    try {
      const { data: result } = await api.post("/email/test-send", {
        ...content(),
        accountId,
        to: testTo,
      });
      if (!live.current) return;
      const needsReconnect = [
        "email.reconnect_required",
        "gmail_reconnect_required",
        "email.account_suspended",
        "gmail_account_blocked",
      ].some((reason) => result.reason?.includes(reason));
      setTestNeedsReconnect(needsReconnect);
      if (result.status === "accepted")
        setMessage(t("feedback.accepted"));
      else if (needsReconnect)
        setMessage(t("feedback.reconnectRequired"));
      else if (result.status === "unknown")
        setMessage(t("feedback.testUnknown"));
      else if (["queued", "sending"].includes(result.status))
        setMessage(t("feedback.pending"));
      else setMessage(t("feedback.testFailed"));
      await Promise.allSettled([loadAccounts(), loadStatus()]);
    } catch (error) {
      if (live.current) {
        const failure =
          error.response?.data?.message || t("feedback.testFailed");
        setMessage(failure);
        const reason = error.response?.data?.reason || "";
        setTestNeedsReconnect(
          [
            "email.reconnect_required",
            "gmail_reconnect_required",
            "email.account_suspended",
            "gmail_account_blocked",
          ].some(
            (value) =>
              reason.includes(value) || String(failure).includes(value),
          ),
        );
      }
      throw error;
    } finally {
      if (live.current) setTestPending(false);
    }
  }
  const change = (patch) =>
    commit(updateNode(history.current.value, selected, patch));
  const changeStyle = (key, value) =>
    change({ style: { ...(current?.style || {}), [key]: value } });
  const changeContainerStyle = (key, value) =>
    change({
      containerStyle: {
        ...(current?.containerStyle || {}),
        [key]: value,
      },
    });
  const add = (type) => {
    if (["image", "video", "document"].includes(type)) {
      const rows = flatten(history.current.value);
      const media = rows.filter((item) => ["image", "video", "document"].includes(item.type));
      const perType = { image: 8, video: 2, document: 5 };
      if (media.length >= 10 || media.filter((item) => item.type === type).length >= perType[type]) {
        toast.error(t("feedback.mediaLimit"));
        return;
      }
    }
    const next = JSON.parse(JSON.stringify(history.current.value));
    if (type === "section")
      next.blocks.push(section([node("text", { content: richText("") })]));
    else if (type === "wrapper")
      next.blocks.push(
        node("wrapper", {
          children: [section([node("text", { content: richText("") })])],
        }),
      );
    else {
      const leaf = node(
        type,
        type === "table"
          ? { content: tableDocument() }
          : type === "text"
            ? {
              content: richText(t("defaults.text")),
              style: { lineHeight: 1.7 },
            }
            : type === "button"
              ? {
                label: t("defaults.button"),
                url: "{{campaign.orderUrl}}",
                style: {
                  backgroundColor: "#176c51",
                  color: "#ffffff",
                  align: "center",
                  fontFamily: "Cairo",
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  padding: 12,
                  paddingTop: 12,
                  paddingRight: 24,
                  paddingBottom: 12,
                  paddingLeft: 24,
                  borderRadius: 8,
                  borderWidth: 0,
                  minHeight: 44,
                },
                containerStyle: { margin: 8 },
              }
              : type === "spacer"
                ? { height: 20 }
                : ["image", "video", "document"].includes(type)
                  ? {
                    sourceType: "upload",
                    assetId: "",
                    sourceUrl: "",
                    caption: "",
                    ...(type === "image" ? { alt: "", url: "" } : {}),
                    ...(type === "document" ? { title: t("defaults.document") } : {}),
                    style: {
                      width: 600,
                      align: "center",
                      borderRadius: 6,
                      ...(type === "document"
                        ? {
                          backgroundColor: "#f8fafc",
                          borderColor: "#d5dfd8",
                          borderWidth: 1,
                          fontSize: 16,
                          fontWeight: 700,
                          padding: 16,
                        }
                        : {}),
                    },
                  }
                : {},
      );
      const column =
        current?.type === "column"
          ? elements.find((n) => n.id === selected)
          : elements.find(
            (n) => n.id === current?.parent && n.type === "column",
          );
      if (column) {
        commit(
          updateNode(next, column.id, (n) => ({
            children: [...n.children, leaf],
          })),
        );
        select(leaf.id);
        if (type === "text" || type === "button")
          setFocusRequest({ id: leaf.id, token: Date.now() });
        return;
      }
      next.blocks.push(section([leaf]));
      select(leaf.id);
      if (type === "text" || type === "button")
        setFocusRequest({ id: leaf.id, token: Date.now() });
    }
    commit(next);
  };
  const addLayout = (count) => {
    const next = columnLayout(count, t("defaults.columnText"));
    commit({ ...doc, blocks: [...doc.blocks, next] });
    select(next.id);
  };
  const setColumns = (count) => {
    // if (count < current.children.length && !window.confirm(t("templates.replace"))) return;
    change({
      children: Array.from(
        { length: count },
        (_, i) =>
          current.children[i] ||
          layoutColumn(t("defaults.columnText")),
      ),
    });
  };
  const blockAction = (id, action) => {
    if (action === "hide") {
      const target = elements.find((n) => n.id === id);
      commit(updateNode(history.current.value, id, { hidden: !target?.hidden }));
      return;
    }
    const target = elements.find((item) => item.id === id);
    const next = structural(history.current.value, id, action);
    commit(next);
    if (action === "delete" && target?.assetId && !imageIds(next).includes(target.assetId))
      api.delete(`/email/assets/${target.assetId}`).catch(() => {});
    if (action === "delete") select(null);
  };
  async function upload(file, kind = current?.type) {
    if (!file) return;
    const targetId = current?.id;
    const oldId = current?.assetId;
    const typeLabel = t(`blockTypes.${kind}`);
    const toastId = toast.loading(
      t("feedback.uploadingMedia", { type: typeLabel }),
    );
    beginEmailMediaUpload();
    setMediaUploads((count) => count + 1);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    try {
      const { data } = await api.post("/email/assets", form);
      if (!flatten(history.current.value).some((item) => item.id === targetId)) {
        api.delete(`/email/assets/${data.id}`).catch(() => {});
        toast.dismiss(toastId);
        return;
      }
      setAssets((prev) => ({ ...prev, [data.id]: data }));
      commit(
        updateNode(history.current.value, targetId, (item) => ({
          sourceType: "upload",
          sourceUrl: "",
          assetId: data.id,
          alt: item.alt || "",
        })),
      );
      if (oldId && oldId !== data.id)
        api.delete(`/email/assets/${oldId}`).catch(() => {});
      toast.success(t("feedback.uploadMediaSuccess", { type: typeLabel }), {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          t("feedback.uploadMediaFailed", { type: typeLabel }),
        { id: toastId },
      );
    } finally {
      endEmailMediaUpload();
      if (live.current)
        setMediaUploads((count) => Math.max(0, count - 1));
    }
  }
  const openPreview = () =>
    perform(async () => {
      await render();
      setPreviewMobile(mobile);
      setDialog("preview");
    });
  const openSource = () =>
    perform(async () => {
      await render();
      setDialog("html");
    });
  const copyHtml = () =>
    navigator.clipboard
      .writeText(preview.html)
      .then(() => toast.success(t("preview.copied")));
  const downloadHtml = () => {
    const url = URL.createObjectURL(
      new Blob([preview.html], { type: "text/html" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "email.html";
    a.click();
    URL.revokeObjectURL(url);
  };
  const account = accounts.find((a) => a.id === accountId);
  const previewSamples = {
    ...samples,
    "customer.email": testTo,
  };
  const envelope = {
    subject: email.subject || "",
    senderName: account?.senderName || account?.email || "",
    senderEmail: account?.email || "",
    businessIdentity: email.businessIdentity || "",
  };
  const clipped = preview && preview.htmlBytes >= 90 * 1024;
  const messageTone =
    message === t("feedback.accepted")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : message === t("feedback.pending")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      ref={root}
      className="space-y-5"
    >
      {!full && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">{t("envelope.designTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("envelope.designHint")}</p>
          </div>
          <EmailSendingGuidelines />
        </div>
      )}

      {!full && (
        <EmailEnvelope
          email={email}
          patchEmail={patchEmail}
          accounts={accounts}
          status={status}
          samples={samples}
          continuation={continuation}
          onConnect={connect}
          onAddSender={() => setSenderDialog({ type: "choose" })}
          onEdit={(item) => setSenderDialog({ type: "smtp", accountId: item.id })}
          onDisconnect={(item) => setSenderDialog({ type: "disconnect", accountId: item.id })}
          errors={errors}
          onClearError={(field) => clearErrors?.(`email.${field}`)}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <InboxPreview email={email} accounts={accounts} samples={previewSamples} />
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-1">
            <div className="p-5">
              <div className="mb-3.5 flex items-center justify-between gap-2">
                <Label description={t("test.samplesHint")} classN="text-[13px] font-semibold text-foreground">
                  {t("test.samples")}
                </Label>
              </div>
              <div className="space-y-3.5">
                {["customer.name", "customer.number"].map((key) => (
                  <Field
                    key={key}
                    id={`email-sample-${key}`}
                    label={t.has(`variables.${key.replace(".", "_")}`)
                      ? t(`variables.${key.replace(".", "_")}`)
                      : key}
                    description={t("descriptions.sampleName")}
                  >
                    <Input
                      id={`email-sample-${key}`}
                      dir={key === "customer.email" ? "ltr" : undefined}
                      value={samples[key] || ""}
                      onChange={(e) => setSamples({ ...samples, [key]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="space-y-2 px-5">
              <Field
                id="email-test-to"
                label={t("test.yourEmail")}
                description={t("descriptions.testRecipient")}
                error={testToError}
              >
                <Input
                  id="email-test-to"
                  data-test-recipient
                  type="email"
                  required
                  dir="ltr"
                  aria-label={t("test.recipient")}
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(e) => {
                    setTestTo(e.target.value);
                    setTestToError("");
                  }}
                />
              </Field>
              <Button
                type="button"
                className="mt-3 w-full"
                disabled={busy || testPending || mediaUploads > 0}
                onClick={() => perform(sendTest)}
              >
                <Send size={15} />
                {t("test.test")}
              </Button>
              <div className="flex flex-wrap items-center gap-2 py-1">
                <p
                  role="status"
                  className={cn(
                    message &&
                    `rounded-full border px-3 py-1 text-xs font-medium ${messageTone}`,
                  )}
                >
                  {message}
                </p>
                {testNeedsReconnect && (
                  <Button_
                    type="button"
                    variant="outline"
                    size="sm"
                    label={t("envelope.reconnect")}
                    onClick={() =>
                      account?.provider === "smtp"
                        ? setSenderDialog({ type: "smtp", accountId: account.id })
                        : connect(true)
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <FullscreenPortal active={full}>
        <div
          data-email-builder-fullscreen={full || undefined}
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-card",
            full &&
            "fixed inset-0 flex h-screen w-screen flex-col rounded-none",
            full && (dialog ? "z-40" : "z-[9999]"),
          )}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
            <IconButton
              label={t("actions.undo")}
              icon={Undo2}
              onClick={() => applyHistory("undo")}
              disabled={!history.current.past.length}
            />
            <IconButton
              label={t("actions.redo")}
              icon={Redo2}
              onClick={() => applyHistory("redo")}
              disabled={!history.current.future.length}
            />
            <span className="mx-1 h-6 w-px bg-border" />
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <Segmented
                value={mobile ? "mobile" : "desktop"}
                onChange={(v) => setMobile(v === "mobile")}
                options={[
                  { value: "desktop", label: t("preview.desktop"), icon: Monitor },
                  { value: "mobile", label: t("preview.mobile"), icon: Smartphone },
                ]}
              />
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={busy}
                onClick={openSource}
              >
                <Code2 size={15} />
                {t("preview.html")}
              </button>
              <IconButton
                label={full ? t("preview.close") : t("preview.full")}
                icon={full ? Minimize2 : Maximize2}
                onClick={() => setFull(!full)}
              />
              <button
                type="button"
                className="btn btn-sm btn-solid"
                disabled={busy}
                onClick={openPreview}
              >
                <Eye size={15} />
                {t("preview.preview")}
              </button>
            </div>
          </div>

          <div
            data-email-history
            className={cn(
              "grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_320px]",
              full && "min-h-0 flex-1 overflow-auto",
            )}
          >
            <EmailBlocksPanel
              elements={elements}
              selected={selected}
              onSelect={select}
              onAdd={add}
              onAddLayout={addLayout}
              onDelete={(id) => blockAction(id, "delete")}
              onToggleHidden={(id) => blockAction(id, "hide")}
              tablesEnabled={tablesEnabled}
            />
            <div className="min-w-0 bg-muted/40">
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
                <span className="font-semibold">{t("preview.approximate")}</span>
              </div>
              <div className="overflow-auto p-4 lg:max-h-[740px]">
                <div
                  className="relative mx-auto transition-[max-width] duration-300"
                  style={{ maxWidth: mobile ? 420 : 900 }}
                >
                  <ReactCanvas
                    document={doc}
                    assets={assets}
                    variables={variableOptions}
                    variableValues={previewSamples}
                    envelope={envelope}
                    selected={selected}
                    invalidElementIds={diagnostics
                      .map((item) => item.elementId)
                      .filter(Boolean)}
                    onSelect={select}
                    onAction={blockAction}
                    onChange={(next) => commit(next)}
                  />
                </div>
                <p className="mx-auto mt-3 max-w-[680px] text-center text-[11px] text-muted-foreground">
                  {t("preview.approximate")}
                </p>
              </div>
            </div>
            <EmailProperties
              doc={doc}
              current={current}
              elements={elements}
              assets={assets}
              busy={busy || mediaUploads > 0}
              tablesEnabled={tablesEnabled}
              onDeselect={() => select(null)}
              onCommitDoc={(next) => commit(next)}
              onChange={change}
              onStyle={changeStyle}
              onContainerStyle={changeContainerStyle}
              onColumns={setColumns}
              onMoveToColumn={(column) =>
                commit(moveToColumn(doc, selected, column))
              }
              onUpload={upload}
              onRichChange={(content, typing) =>
                commit(
                  updateNode(history.current.value, selected, { content }),
                  typing ? `text:${selected}` : null,
                )
              }
              onTableChange={(content, typing) =>
                commit(
                  updateNode(history.current.value, selected, { content }),
                  typing ? `table:${selected}` : null,
                )
              }
              onAsset={(asset) =>
                setAssets((prev) => ({ ...prev, [asset.id]: asset }))
              }
              onError={(error) => toast.error(error)}
              focusRequest={focusRequest}
              onFocusHandled={() => setFocusRequest(null)}
            />
          </div>
        </div>
      </FullscreenPortal>

      <Dialog
        open={senderDialog?.type === "choose"}
        onOpenChange={(open) => !open && setSenderDialog(null)}
      >
        <DialogContent
          className="overflow-hidden bg-card p-0 sm:rounded-[24px]"
          style={{ width: "min(92vw, 600px)", maxWidth: "1100px" }}
        >
          <DialogHeader className="border-b border-border px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <MailPlus className="h-5 w-5" />
              </span>

              <div className="flex flex-col gap-1 text-start">
                <DialogTitle className="text-lg font-bold">
                  {t("smtp.addSender")}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {t("smtp.chooseMethod")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>


          <div className="space-y-5 p-4 pt-0! md:p-6">
            {/* <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{t("smtp.methodTitle")}</h3>
              <p className="text-xs leading-5 text-muted-foreground">{t("smtp.methodHint")}</p>
            </div> */}

            <div className="grid gap-5 sm:grid-cols-2">
              <button
                type="button"
                className="group flex min-h-[210px] w-full flex-col items-start justify-between rounded-2xl border-2 border-border bg-card p-5 text-start transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => {
                  setSenderDialog(null);
                  connect(false);
                }}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-background [&>svg]:scale-[1.8]">
                  <GmailIcon />
                </span>

                <span className="mt-4 block w-full">
                  <strong className="block text-base font-bold md:text-lg">{t("smtp.google")}</strong>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{t("smtp.googleHint")}</span>
                </span>
              </button>

              <button
                type="button"
                className="group flex min-h-[210px] w-full flex-col items-start justify-between rounded-2xl border-2 border-border bg-card p-5 text-start transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setSenderDialog({ type: "smtp" })}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Server className="h-8 w-8" />
                </span>

                <span className="mt-4 block w-full">
                  <strong className="block text-base font-bold md:text-lg">{t("smtp.custom")}</strong>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{t("smtp.customHint")}</span>
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SmtpConnectionDialog
        open={senderDialog?.type === "smtp"}
        account={accounts.find((item) => item.id === senderDialog?.accountId)}
        onOpenChange={(open) => !open && setSenderDialog(null)}
        onSaved={async (saved) => {
          await loadAccounts();
          patchEmail({ accountId: saved.id, accountStatus: saved.status });
        }}
      />

      <Dialog
        open={senderDialog?.type === "disconnect"}
        onOpenChange={(open) => !open && setSenderDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("smtp.disconnectTitle")}</DialogTitle>
            <DialogDescription>
              {t("smtp.disconnectHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSenderDialog(null)}>{t("smtp.cancel")}</Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={disconnectSender}>{t("smtp.disconnect")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "preview" && !!preview}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="flex h-[92vh] flex-col gap-0 p-0 sm:max-w-[1040px]">
          <DialogHeader className="flex-row flex-wrap items-center gap-3 border-b border-border px-5 py-3.5 pe-16">
            <div className="me-auto">
              <DialogTitle className="text-base">{t("review.previewTitle")}</DialogTitle>
              <DialogDescription className="text-xs">
                {t("review.previewHint")}
              </DialogDescription>
            </div>
            <Segmented
              value={previewMobile ? "mobile" : "desktop"}
              onChange={(v) => setPreviewMobile(v === "mobile")}
              options={[
                { value: "desktop", label: t("preview.desktop"), icon: Monitor },
                { value: "mobile", label: t("preview.mobile"), icon: Smartphone },
              ]}
            />
            {preview && (
              <>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                  {Math.round(preview.htmlBytes / 1024)} KB
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    clipped
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {clipped ? t("preview.clipping") : t("preview.noClipping")}
                </span>
              </>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/50 p-6">
            {preview && (
              <EmailClientFrame
                title={t("preview.preview")}
                subject={
                  <VariablePreviewText
                    text={email.subject || preview.subject}
                    variables={variableOptions}
                    values={previewSamples}
                  />
                }
                senderName={envelope.senderName}
                senderEmail={envelope.senderEmail}
                html={preview.html}
                mobile={previewMobile}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "html" && !!preview}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="flex h-[85vh] flex-col sm:max-w-[960px]">
          <DialogHeader>
            <DialogTitle>{t("preview.html")}</DialogTitle>
            <DialogDescription>{t("review.previewHint")}</DialogDescription>
          </DialogHeader>
          <textarea
            readOnly
            dir="ltr"
            aria-label={t("preview.html")}
            className="min-h-0 w-full flex-1 resize-none rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs"
            value={preview?.html || ""}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-md btn-outline" onClick={downloadHtml}>
              <Download size={15} />
              {t("preview.downloadHtml")}
            </button>
            <button type="button" className="btn btn-md btn-solid" onClick={copyHtml}>
              <Copy size={15} />
              {t("preview.copyHtml")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
