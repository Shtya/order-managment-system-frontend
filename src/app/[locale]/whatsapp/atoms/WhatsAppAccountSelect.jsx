
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import api from "@/utils/api";

export default function WhatsAppAccountSelect({
    label = "حساب الإرسال الافتراضي",
    value,
    onChange
}) {
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);


    const fetchAccounts = useCallback(async () => {
        setAccountsLoading(true);
        try {
            const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1 } });
            const values = Array.isArray(res.data?.records) ? res.data.records : []
            setAccounts(values);
            // Only set default if no value is currently selected
            if (values.length > 0 && !value) {
                onChange?.(values[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);



    return (
        <div className="space-y-2 w-full ">
            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger disabled={accountsLoading} className="h-[52px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                    <SelectValue placeholder="اختر رقم الهاتف" />
                </SelectTrigger>
                <SelectContent>
                    {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id} className="py-2">
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-sm">{acc.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Phone size={10} /> {acc.mobileNumber}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}