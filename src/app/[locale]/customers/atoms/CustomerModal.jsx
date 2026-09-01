"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Button_ from "@/components/atoms/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Camera, UserPlus, UserCog, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarSrc } from "@/components/atoms/UserSelect";
import api from "@/utils/api";

const createSchema = (t) =>
  yup.object({
    name: yup.string().required(t("validation.customerNameRequired")),
    phoneNumber: yup.string().required(t("validation.phoneNumberRequired")),
    notes: yup.string().nullable().optional(),
  });

export default function CustomerModal({
  open,
  onOpenChange,
  customer,
  onSave,
  createEndpoint = "/conversation",
}) {
  const t = useTranslations("chats");
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const schema = useMemo(() => createSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        reset({
          name: customer.name || "",
          phoneNumber: customer.phoneNumber || "",
          notes: customer.notes || "",
        });
        setPreviewImage(customer.profilePicture || null);
      } else {
        reset({
          name: "",
          phoneNumber: "",
          notes: "",
        });
        setPreviewImage(null);
      }
      setSelectedFile(null);
    }
  }, [open, customer, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const appendIfPresent = (formData, key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phoneNumber", data.phoneNumber);
      appendIfPresent(formData, "notes", data.notes);
      if (selectedFile) {
        formData.append("profilePicture", selectedFile);
      }

      let response;
      if (customer) {
        response = await api.patch(`/customer/${customer.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(t("contactUpdated"));
      } else {
        response = await api.post(createEndpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(t("contactAdded"));
      }

      if (onSave) onSave(response.data);
      onOpenChange(false);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to save customer";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden bg-card">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {customer ? <UserCog size={20} /> : <UserPlus size={20} />}
            </div>
            {customer ? t("editContact") : t("addContactPerson")}
          </DialogTitle>
        </DialogHeader>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("contactName")}</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder={t("contactName")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("phoneNumber")}</Label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="phoneNumber"
                    placeholder={t("phoneNumber")}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("contactNotes")}</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="notes"
                  placeholder={t("contactNotes")}
                  className={errors.notes ? "border-red-500 min-h-25" : "min-h-25"}
                />
              )}
            />
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-6 border-t border-border mt-6">
            <Button_
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              label={t("cancel")}
              disabled={isSaving}
            />
            <Button_
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-20"
              disabled={isSaving}
              label={
                isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t("save")}
                  </div>
                ) : (
                  t("save")
                )
              }
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
