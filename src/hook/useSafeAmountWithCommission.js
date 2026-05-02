import { useEffect, useMemo } from "react";

export function useSafeAmountWithCommission({
    safeId,
    accounts = [],
    amount,
    direction = "OUT",
    onSetValue,
    onSetValues,
    amountField = "amount",
    shouldAutoCap = true,
    precision = 2,
}) {
    const selectedAccount = useMemo(
        () => accounts.find((account) => String(account.id) === String(safeId)),
        [accounts, safeId]
    );

    const commissionAmount = useMemo(() => {
        if (!selectedAccount || direction !== "OUT") return 0;
        const rate = Number(selectedAccount.commissionRate || 0);
        return Number(amount || 0) * (rate / 100);
    }, [selectedAccount, amount, direction]);

    const finalAmount = useMemo(
        () => Number(amount || 0) + Number(commissionAmount || 0),
        [amount, commissionAmount]
    );

    const maxAllowedAmount = useMemo(() => {
        if (!selectedAccount) return 0;
        const balance = Number(selectedAccount.currentBalance || 0);
        if (direction !== "OUT") return balance;
        const rate = Number(selectedAccount.commissionRate || 0);
        if (rate <= 0) return balance;
        return balance / (1 + rate / 100);
    }, [selectedAccount, direction]);

    useEffect(() => {
        if (!shouldAutoCap || direction !== "OUT" || !selectedAccount) return;

        const balance = Number(selectedAccount.currentBalance || 0);
        if (Number(finalAmount) <= balance) return;

        const setValueFn = onSetValue || onSetValues;
        if (typeof setValueFn !== "function") return;

        const factor = 10 ** precision;
        const safeAmount = Math.max(0, Math.floor(Number(maxAllowedAmount || 0) * factor) / factor);
        setValueFn(amountField, safeAmount, { shouldValidate: true });
    }, [
        shouldAutoCap,
        direction,
        selectedAccount,
        finalAmount,
        onSetValue,
        onSetValues,
        amountField,
        maxAllowedAmount,
        precision,
    ]);

    return { selectedAccount, commissionAmount, finalAmount, maxAllowedAmount };
}

