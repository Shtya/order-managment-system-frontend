"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import { Loader2, Server, TestTube2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PORT_OPTIONS = [587, 465, 2525];
const EMPTY = {
  connectionName: "",
  host: "",
  port: "587",
  security: "starttls",
  username: "",
  password: "",
  fromEmail: "",
  fromName: "",
};

const smtpSchema = (t, editing) =>
  yup.object({
    connectionName: yup.string().trim().required(t("validation.connectionNameRequired")),
    host: yup.string().trim().required(t("validation.hostRequired")),
    port: yup.string().required(t("validation.portRequired")),
    security: yup.string().required(t("validation.securityRequired")),
    username: yup.string().trim().required(t("validation.usernameRequired")),
    password: editing
      ? yup.string().nullable().notRequired()
      : yup.string().required(t("validation.passwordRequired")),
    fromEmail: yup.string().trim().required(t("validation.fromEmailRequired")).email(t("validation.fromEmailInvalid")),
    fromName: yup.string().trim().required(t("validation.fromNameRequired")),
  });

export default function SmtpConnectionDialog({ open, account, onOpenChange, onSaved }) {
  const t = useTranslations("emailBuilder.smtp");
  const editing = Boolean(account?.id);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const schema = useMemo(() => smtpSchema(t, editing), [t, editing]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;

    setTested(false);
    reset(
      account
        ? {
          connectionName: account.connectionName || "",
          host: account.smtp?.host || "",
          port: String(account.smtp?.port || 587),
          security: account.smtp?.security || "starttls",
          username: account.smtp?.username || "",
          password: "",
          fromEmail: account.email || "",
          fromName: account.senderName || "",
        }
        : EMPTY,
    );
  }, [open, account, reset]);

  const currentValues = watch();

  const buildPayload = (data = currentValues) => ({
    ...data,
    port: Number(data.port),
  });

  async function testConnection(data) {
    const payload = buildPayload(data);
    if (editing) payload.accountId = account.id;
    if (!payload.password) delete payload.password;
    setTesting(true);
    try {
      await api.post("/email/accounts/smtp/test", payload);
      setTested(true);
      toast.success(t("verified"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("verifyFailed"));
    } finally {
      setTesting(false);
    }
  }

  async function save(data) {
    setPending(true);
    try {
      const payload = buildPayload(data);
      if (editing && !payload.password) delete payload.password;

      const response = editing
        ? await api.patch(`/email/accounts/${account.id}/smtp`, payload)
        : await api.post("/email/accounts/smtp", payload);

      toast.success(editing ? t("updated") : t("connected"));
      await onSaved?.(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || t("saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! flex h-[90vh] w-full flex-col overflow-hidden bg-white p-0 dark:bg-slate-950 md:h-auto md:max-h-[90vh]">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Server size={20} />
            </span>

            <div className="flex flex-col gap-1 text-start">
              <DialogTitle className="text-lg font-bold">
                {editing ? t("editTitle") : t("createTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex-1 overflow-y-auto bg-card p-4 custom-scrollbar md:p-6" onSubmit={handleSubmit(save)}>
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("connectionName")} description={t("connectionNameHint")} error={errors.connectionName?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required
                  maxLength={100}
                  dir="auto"
                  placeholder={t("connectionNamePlaceholder")}
                  {...register("connectionName")}
                />
              </Field>

              <Field label={t("host")} description={t("hostHint")} error={errors.host?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required
                  dir="ltr"
                  placeholder="smtp.example.com"
                  {...register("host")}
                />
              </Field>

              <Field label={t("port")} description={t("portHint")} error={errors.port?.message}>
                <Controller
                  control={control}
                  name="port"
                  render={({ field }) => (
                    <Select value={field.value || "587"} onValueChange={field.onChange}>
                      <SelectTrigger className="h-[50px] w-full rounded-xl border border-input bg-background text-sm">
                        <SelectValue placeholder={t("port")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PORT_OPTIONS.map((port) => (
                          <SelectItem key={port} value={String(port)}>
                            {port}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label={t("encryption")} description={t("encryptionHint")} error={errors.security?.message}>
                <Controller
                  control={control}
                  name="security"
                  render={({ field }) => (
                    <Select value={field.value || "starttls"} onValueChange={field.onChange}>
                      <SelectTrigger className="h-[50px] w-full rounded-xl border border-input bg-background text-sm">
                        <SelectValue placeholder={t("encryption")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starttls">{t("starttls")}</SelectItem>
                        <SelectItem value="tls">{t("tls")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label={t("username")} description={t("usernameHint")} error={errors.username?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required
                  dir="ltr"
                  autoComplete="username"
                  placeholder="mailbox@example.com"
                  {...register("username")}
                />
              </Field>

              <Field label={editing ? t("passwordEdit") : t("password")} description={t("passwordHint")} error={errors.password?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required={!editing}
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
              </Field>
            </div>
          </section>

          <section className="mt-5 space-y-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("senderSection")}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("senderSectionHint")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fromEmail")} description={t("fromEmailHint")} error={errors.fromEmail?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required
                  type="email"
                  dir="ltr"
                  placeholder="sales@example.com"
                  {...register("fromEmail")}
                />
              </Field>

              <Field label={t("fromName")} description={t("fromNameHint")} error={errors.fromName?.message}>
                <Input
                  className="h-[50px] rounded-xl"
                  required
                  dir="auto"
                  placeholder="Company Sales"
                  {...register("fromName")}
                />
              </Field>
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="outline" disabled={pending || testing} onClick={handleSubmit(testConnection)}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 size={15} />}
              {testing ? t("pending") : tested ? t("verifiedButton") : t("test")}
            </Button>
            <Button type="submit" disabled={pending || testing}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? t("pending") : editing ? t("save") : t("connect")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, description, error, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold" description={description}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
