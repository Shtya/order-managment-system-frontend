"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Camera, Loader2, Plus, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { avatarSrc } from "@/components/atoms/UserSelect";
import api from "@/utils/api";

function getContacts(client) {
  return Array.isArray(client?.contacts) ? client.contacts : [];
}

const createClientSchema = (t) =>
  yup.object({
    name: yup.string().trim().required(t("client.validation.nameRequired")),
    email: yup
      .string()
      .email(t("client.validation.invalidEmail"))
      .nullable()
      .transform((curr, orig) => (orig === "" ? null : curr))
      .optional(),
    notes: yup.string().nullable().optional(),
    phones: yup
      .array()
      .of(
        yup.object({
          phoneNumber: yup.string().trim().required(t("client.validation.phoneRequired")),
        }),
      )
      .min(1, t("client.validation.phoneRequired")),
  });

export default function ClientModal({ open, onOpenChange, client, onSave }) {
  const t = useTranslations("customers");
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const schema = useMemo(() => createClientSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
      phones: [{ phoneNumber: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phones",
  });

  useEffect(() => {
    if (!open) return;
    const contacts = getContacts(client)
      .map((contact) => ({ phoneNumber: contact.phoneNumber || "" }))
      .filter((contact) => contact.phoneNumber);
    reset({
      name: client?.name || "",
      email: client?.email || "",
      notes: client?.notes || "",
      phones: contacts.length ? contacts : [{ phoneNumber: "" }],
    });
    setPreviewImage(client?.profilePicture || null);
    setProfileFile(null);
  }, [client, open, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const phones = (data.phones || [])
        .map((item) => String(item.phoneNumber || "").trim())
        .filter(Boolean);
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.notes) formData.append("notes", data.notes);
      if (profileFile) formData.append("profilePicture", profileFile);
      formData.append(
        "contacts",
        JSON.stringify(phones.map((phoneNumber, index) => ({ phoneNumber, isPrimary: index === 0 }))),
      );

      const res = client?.id
        ? await api.patch(`/clients/${client.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/clients", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
      await onSave?.(res.data);
      onOpenChange(false);
    } catch (error) {
      const message = error.response?.data?.message || error.message || t("toast.saveFailed");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle>{client ? t("actions.edit") : t("actions.new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                <AvatarImage src={avatarSrc(previewImage)} alt="Preview" />
                <AvatarFallback className="bg-muted text-muted-foreground/60">
                  <User size={48} strokeWidth={1.5} />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-primary-foreground shadow-md border-2 border-card cursor-pointer hover:bg-primary/90 transition-colors focus:outline-none"
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">{t("client.fields.name")}</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="client-name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">{t("client.fields.email")}</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="client-email"
                    type="email"
                    value={field.value || ""}
                    className={errors.email ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t("client.fields.phones")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => append({ phoneNumber: "" })}
              >
                <Plus className="h-4 w-4" />
                {t("client.fields.addPhone")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("client.fields.phonesHint")}</p>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Controller
                      name={`phones.${index}.phoneNumber`}
                      control={control}
                      render={({ field: phoneField }) => (
                        <Input
                          {...phoneField}
                          placeholder={t("columns.phoneNumber")}
                          className={errors.phones?.[index]?.phoneNumber ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.phones?.[index]?.phoneNumber && (
                      <p className="text-xs text-red-500">
                        {errors.phones[index].phoneNumber.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (fields.length === 1) {
                        remove(0);
                        append({ phoneNumber: "" });
                        return;
                      }
                      remove(index);
                    }}
                    aria-label={t("actions.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t("client.fields.notes")}</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea {...field} id="client-notes" rows={4} value={field.value || ""} />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
