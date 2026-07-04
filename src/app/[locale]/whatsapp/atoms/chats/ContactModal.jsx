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
import { VariableInput } from "@/components/ui/VariableInput";

const createSchema = (t) =>
    yup.object({
        firstName: yup.string().required(t("validation.firstNameRequired")),
        lastName: yup.string().required(t("validation.lastNameRequired")),
        phoneNumber: yup.string().required(t("validation.phoneNumberRequired")),
        email: yup.string().email(t("validation.invalidEmail")).optional(),
        birthday: yup.string().optional(),
        street: yup.string().optional(),
        city: yup.string().optional(),
        state: yup.string().optional(),
        zip: yup.string().optional(),
        country: yup.string().optional(),
    });

export const ContactForm = React.forwardRef(({ variableProps = {} }, ref) => {
    const t = useTranslations("chats");

    const schema = React.useMemo(() => createSchema(t), [t]);
    const {
        control,
        handleSubmit,
        reset,
        getValues,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phoneNumber: "",
            email: "",
            birthday: "",
            street: "",
            city: "",
            state: "",
            zip: "",
            country: ""
        },
    });

    const preparePayload = (data) => ({
        type: "contacts",
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

    const restore = (payload) => {
        if (payload?.contacts?.[0]) {
            const contact = payload.contacts[0];
            if (contact.name?.first_name) setValue("firstName", contact.name.first_name);
            if (contact.name?.last_name) setValue("lastName", contact.name.last_name);
            if (contact.phones?.[0]?.phone) setValue("phoneNumber", contact.phones[0].phone);
            if (contact.emails?.[0]?.email) setValue("email", contact.emails[0].email);
            if (contact.birthday) setValue("birthday", contact.birthday);
            if (contact.addresses?.[0]) {
                const address = contact.addresses[0];
                if (address.street) setValue("street", address.street);
                if (address.city) setValue("city", address.city);
                if (address.state) setValue("state", address.state);
                if (address.zip) setValue("zip", address.zip);
                if (address.country) setValue("country", address.country);
            }
        }
    };

    React.useImperativeHandle(ref, () => ({
        reset,
        getValues,
        setValue,
        trigger,
        watch,
        form: { control, handleSubmit, reset, formState: { errors } },
        submit: async () => {
            const valid = await trigger();
            if (!valid) return null;
            return preparePayload(getValues());
        },
        restore,
    }));

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name Section */}
                    <div className="sm:col-span-2 flex items-center gap-2 mb-2 border-b border-border pb-2">
                        <UserCircle size={18} className="text-primary" />
                        <h4 className="font-bold text-sm text-foreground">{t("contactInfo")}</h4>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("firstName")} <span className="text-red-500">*</span></Label>
                        <Controller
                            name="firstName"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("firstName")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                        {errors.firstName && <p className="text-[10px] text-red-500">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("lastName")} <span className="text-red-500">*</span></Label>
                        <Controller
                            name="lastName"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("lastName")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                        {errors.lastName && <p className="text-[10px] text-red-500">{errors.lastName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("phoneNumber")} <span className="text-red-500">*</span></Label>
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("phoneNumber")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                        {errors.phoneNumber && <p className="text-[10px] text-red-500">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("email")}</Label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    type="email"
                                    placeholder={t("email")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                        {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("birthday")}</Label>
                        <Controller
                            name="birthday"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Input {...field} type="date" placeholder={t("birthday")} error={!!fieldState.error} />
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
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("street")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("city")}</Label>
                        <Controller
                            name="city"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("city")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("state")}</Label>
                        <Controller
                            name="state"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("state")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("zip")}</Label>
                        <Controller
                            name="zip"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("zip")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">{t("country")}</Label>
                        <Controller
                            name="country"
                            control={control}
                            render={({ field, fieldState }) => (
                                <VariableInput
                                    {...field}
                                    {...variableProps}
                                    placeholder={t("country")}
                                    error={!!fieldState.error}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
ContactForm.displayName = "ContactForm";

export default function ContactModal({ open, onOpenChange, variableProps = {} }) {
    const t = useTranslations("chats");
    const {
        handleSendMessage
    } = useConversation();
    const formRef = React.useRef(null);

    const handleSubmitClick = async () => {
        const payload = await formRef.current?.submit();
        
        if (payload) {
            handleSendMessage(payload);
             formRef.current?.reset?.();
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        formRef.current?.reset?.();
        onOpenChange(false);
    };

    const footerButtons = (
        <>
            <Button_
                type="button"
                variant="outline"
                onClick={handleCancel}
                label={t("cancel")}
                className="w-full sm:w-auto"
            />
            <Button_
                type="button"
                onClick={handleSubmitClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                label={t("sendMessage")}
            />
        </>
    );

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-2xl w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <UserPlus size={20} />
                        </div>
                        {t("addContact")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60 text-xs md:text-sm">
                        {t("contactDescription")}
                    </DialogDescription>
                </DialogHeader>

                <ContactForm
                    ref={formRef}
                    variableProps={variableProps}
                />
                <DialogFooter className="px-4 md:px-6 py-4 border-t border-border bg-card shrink-0 gap-2 flex flex-col-reverse sm:flex-row">
                    {footerButtons}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
