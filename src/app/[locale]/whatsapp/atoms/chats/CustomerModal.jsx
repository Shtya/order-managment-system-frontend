"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CustomerModal({ open, onOpenChange, customer, onSave }) {
    const t = useTranslations("chats");
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState(customer || {
        name: "",
        phoneNumber: "",
        email: "",
        profilePicture: ""
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create a local preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePicture: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-center">{customer ? t("editClient") : t("addCustomer")}</DialogTitle>
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
                        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={formData.profilePicture} alt={formData.name} />
                            <AvatarFallback className="bg-slate-100 text-slate-400">
                                <User size={48} strokeWidth={1.5} />
                            </AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-1.5 bg-green-600 rounded-full text-white shadow-md border-2 border-white cursor-pointer hover:bg-green-700 transition-colors focus:outline-none"
                        >
                            <Camera size={14} />
                        </button>
                    </div>
                    {formData.name && (
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-slate-900">{formData.name}</h3>
                            <p className="text-xs text-slate-500">{formData.phoneNumber}</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("customerName")}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">{t("phoneNumber")}</Label>
                        <Input
                            id="phone"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("cancel")}
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            {t("save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
