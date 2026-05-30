"use client";

import React, { useMemo, useEffect, useState } from "react";
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
import { MapPin } from "lucide-react";
import Button_ from "@/components/atoms/Button";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MapLocationPicker from "@/components/atoms/MapLocationPicker";

const createSchema = (t) =>
    yup.object({
        name: yup.string().required(t("validation.required") || "Required"),
        address: yup.string().required(t("validation.required") || "Required"),
        latitude: yup.number().required(t("validation.required") || "Required"),
        longitude: yup.number().required(t("validation.required") || "Required"),
    });

export default function LocationModal() {
    const t = useTranslations("chats");
    const {
        showLocationModal,
        setShowLocationModal,
        handleSendMessage
    } = useConversation();

    const schema = useMemo(() => createSchema(t), [t]);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            address: "",
            latitude: 30.0444,
            longitude: 31.2357
        },
    });

    const lat = watch("latitude");
    const lng = watch("longitude");

    const onSubmit = (data) => {
        handleSendMessage({
            type: "location",
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
                name: data.name,
                address: data.address
            }
        });
        setShowLocationModal(false);
        reset();
    };

    const handleLocationSelect = async (newLat, newLng) => {
        setValue("latitude", newLat);
        setValue("longitude", newLng);

        // Auto-fill address using reverse geocoding
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&accept-language=ar`);
            const data = await res.json();
            // if (data.display_name) {
            setValue("address", data.display_name);
            setValue("name", data.name || data.display_name.split(',')[0]);
            // }
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    };

    return (
        <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
            <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-slate-900 shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <MapPin size={20} />
                        </div>
                        {t("sendLocation")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Form Section */}
                    <div className="w-1/3 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900 border-e">
                        <form id="location-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">{t("locationName")} <span className="text-red-500">*</span></Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} placeholder={t("locationName")} className={errors.name ? "border-red-500" : ""} />
                                    )}
                                />
                                {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">{t("locationAddress")} <span className="text-red-500">*</span></Label>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            rows={3}
                                            placeholder={t("locationAddress")}
                                            className={cn(
                                                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                                errors.address ? "border-red-500" : ""
                                            )}
                                        />
                                    )}
                                />
                                {errors.address && <p className="text-[10px] text-red-500">{errors.address.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("latitude")}</Label>
                                    <Input value={lat.toFixed(6)} readOnly className="h-8 text-xs bg-slate-50 dark:bg-slate-800" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("longitude")}</Label>
                                    <Input value={lng.toFixed(6)} readOnly className="h-8 text-xs bg-slate-50 dark:bg-slate-800" />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 min-h-[600px]">
                        <MapLocationPicker
                            initialLocation={{ lat, lng }}
                            onLocationSelect={handleLocationSelect}
                            height="100%"
                            width="100%"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white dark:bg-slate-900 shrink-0 gap-2">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setShowLocationModal(false);
                            reset();
                        }}
                        label={t("cancel")}
                    />
                    <Button_
                        type="submit"
                        form="location-form"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper to use cn in this file if needed or import it
import { cn } from "@/utils/cn";
