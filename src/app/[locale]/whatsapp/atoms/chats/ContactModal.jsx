"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useConversation } from "./ConversationContext";
import { UserPlus, UserCircle } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createSchema = (t) =>
    yup.object({
        firstName: yup.string().required(t("validation.firstNameRequired")),
        lastName: yup.string().required(t("validation.lastNameRequired")),
        phoneNumber: yup.string().required(t("validation.phoneNumberRequired")),
        email: yup.string().email(t("validation.invalidEmail")).optional(),
        formattedName: yup.string().optional(),
        birthday: yup.string().optional(),
        street: yup.string().optional(),
        city: yup.string().optional(),
        state: yup.string().optional(),
        zip: yup.string().optional(),
        country: yup.string().optional(),
    });

export default function ContactModal() {
    const t = useTranslations("chats");
    const {
        showContactModal,
        setShowContactModal,
        handleSendMessage
    } = useConversation();

    const schema = React.useMemo(() => createSchema(t), [t]);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phoneNumber: "",
            email: "",
            formattedName: "",
            birthday: "",
            street: "",
            city: "",
            state: "",
            zip: "",
            country: ""
        },
    });

    const onSubmit = (data) => {
        handleSendMessage({
            type: "contact",
            contacts: [{
                addresses: (data.street || data.city || data.state || data.zip || data.country) ? [{
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    zip: data.zip,
                    country: data.country,
                    type: "HOME"
                }] : undefined,
                birthday: data.birthday || undefined,
                emails: data.email ? [{ email: data.email, type: "HOME" }] : undefined,
                name: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    formatted_name: data.formattedName || `${data.firstName} ${data.lastName}`
                },
                phones: [{ phone: data.phoneNumber, type: "MOBILE" }]
            }]
        });
        setShowContactModal(false);
        reset();
    };

    return (
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-muted/30">
                <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <UserPlus size={20} />
                        </div>
                        {t("addContact")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60">
                        {t("contactDescription")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-card">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Name Section */}
                        <div className="col-span-2 flex items-center gap-2 mb-2 border-b border-border pb-2">
                            <UserCircle size={18} className="text-primary" />
                            <h4 className="font-bold text-sm text-foreground">{t("contactInfo")}</h4>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("firstName")} <span className="text-red-500">*</span></Label>
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("firstName")} className={errors.firstName ? "border-red-500" : ""} />
                                )}
                            />
                            {errors.firstName && <p className="text-[10px] text-red-500">{errors.firstName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("lastName")} <span className="text-red-500">*</span></Label>
                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("lastName")} className={errors.lastName ? "border-red-500" : ""} />
                                )}
                            />
                            {errors.lastName && <p className="text-[10px] text-red-500">{errors.lastName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("formattedName")} <span className="text-red-500">*</span></Label>
                            <Controller
                                name="formattedName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("formattedName")} className={errors.formattedName ? "border-red-500" : ""} />
                                )}
                            />
                            {errors.formattedName && <p className="text-[10px] text-red-500">{errors.formattedName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("phoneNumber")} <span className="text-red-500">*</span></Label>
                            <Controller
                                name="phoneNumber"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("phoneNumber")} className={errors.phoneNumber ? "border-red-500" : ""} />
                                )}
                            />
                            {errors.phoneNumber && <p className="text-[10px] text-red-500">{errors.phoneNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("email")}</Label>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} type="email" placeholder={t("email")} className={errors.email ? "border-red-500" : ""} />
                                )}
                            />
                            {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("birthday")}</Label>
                            <Controller
                                name="birthday"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} type="date" placeholder={t("birthday")} />
                                )}
                            />
                        </div>

                        {/* Address Section */}
                        <div className="col-span-2 flex items-center gap-2 mt-4 mb-2 border-b border-border pb-2">
                            <h4 className="font-bold text-sm text-foreground">{t("address")}</h4>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("street")}</Label>
                            <Controller
                                name="street"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("street")} />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("city")}</Label>
                            <Controller
                                name="city"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("city")} />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("state")}</Label>
                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("state")} />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("zip")}</Label>
                            <Controller
                                name="zip"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("zip")} />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">{t("country")}</Label>
                            <Controller
                                name="country"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t("country")} />
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-8 gap-2 border-t border-border pt-6">
                        <Button_
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowContactModal(false);
                                reset();
                            }}
                            label={t("cancel")}
                        />
                        <Button_
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            label={t("sendMessage")}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
