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
import LocationFields from "./LocationFields";

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
            <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-muted/30">
                <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <MapPin size={20} />
                        </div>
                        {t("sendLocation")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Form Section */}
                    <div className="w-1/3 overflow-y-auto p-6 custom-scrollbar bg-card border-e border-border">
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
                    <div className="flex-1 relative bg-muted min-h-[600px]">
                        <MapLocationPicker
                            initialLocation={{ lat: latitude, lng: longitude }}
                            onLocationSelect={handleLocationSelect}
                            height="100%"
                            width="100%"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-card shrink-0 gap-2">
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
                        disabled={!isValid || isSubmitting}
                        loading={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper to use cn in this file if needed or import it
import { cn } from "@/utils/cn";
