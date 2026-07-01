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
import MapLocationPicker from "@/components/atoms/MapLocationPicker";
import LocationFields from "./LocationFields";

const createSchema = (t) =>
    yup.object({
        name: yup.string().required(t("validation.required") || "Required"),
        address: yup.string().required(t("validation.required") || "Required"),
        latitude: yup.number().required(t("validation.required") || "Required"),
        longitude: yup.number().required(t("validation.required") || "Required"),
    });

export default function LocationModal({ open, onOpenChange }) {
    const t = useTranslations("chats");
    const {
        handleSendMessage
    } = useConversation();

    const schema = useMemo(() => createSchema(t), [t]);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
        defaultValues: {
            name: "",
            address: "",
            latitude: 30.0444,
            longitude: 31.2357
        },
    });
    
    const name = watch("name");
    const address = watch("address");
    const latitude = watch("latitude");
    const longitude = watch("longitude");

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
        onOpenChange(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
                <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <MapPin size={20} />
                        </div>
                        {t("sendLocation")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Form Section */}
                    <div className="w-full md:w-1/3 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card border-b md:border-b-0 md:border-e border-border order-2 md:order-1">
                        <form id="location-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <LocationFields 
                                values={{ name, address, latitude, longitude }}
                                onChange={(updates) => {
                                    Object.entries(updates).forEach(([key, val]) => setValue(key, val));
                                }}
                                errors={{
                                    name: errors.name?.message,
                                    address: errors.address?.message
                                }}
                            />
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="flex-1 relative bg-muted min-h-[300px] md:min-h-[600px] order-1 md:order-2">
                        <MapLocationPicker
                            initialLocation={{ lat: latitude, lng: longitude }}
                            onLocationSelect={handleLocationSelect}
                            height="100%"
                            width="100%"
                        />
                    </div>
                </div>

                <DialogFooter className="px-4 md:px-6 py-4 border-t border-border bg-card shrink-0 gap-2 flex flex-col-reverse sm:flex-row">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            reset();
                        }}
                        label={t("cancel")}
                        className="w-full sm:w-auto"
                    />
                    <Button_
                        type="submit"
                        form="location-form"
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground  w-full sm:w-auto"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper to use cn in this file if needed or import it
import { cn } from "@/utils/cn";
