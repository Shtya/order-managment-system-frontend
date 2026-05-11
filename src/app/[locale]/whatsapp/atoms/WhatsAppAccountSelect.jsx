import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

export default function WhatsAppAccountSelect({
    label = "حساب الإرسال الافتراضي",
    value,
    onChange
}) {
    const accounts = [
        { id: "acc_1", name: "Marketing Team", number: "+201112223334" },
        { id: "acc_2", name: "Customer Support", number: "+201987654321" },
        { id: "acc_3", name: "Sales Department", number: "+201234567890" },
    ];

    return (
        <div className="space-y-2 w-full max-w-md">
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange} defaultValue="acc_1">
                <SelectTrigger className="h-[52px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="اختر رقم الهاتف" />
                </SelectTrigger>
                <SelectContent>
                    {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id} className="py-2">
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-sm">{acc.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Phone size={10} /> {acc.number}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}