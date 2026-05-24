import { useState, useCallback } from "react";
import api from "@/utils/api";

export function useCurrencyRate() {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRate = useCallback(async (from = "USD", to = "EGP", amount = 1, provider = "CBE") => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/payments/currency/rate", {
        params: { from, to, amount, provider }
      });
      setRate(data.rate);
      return data.rate;
    } catch (err) {
      console.error("Error fetching currency rate:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { rate, loading, error, fetchRate };
}


export const convertUsdToEgp = (amount , usdToEgp) => {
  if (!amount || !usdToEgp) return null;

  const amt = parseFloat(amount);

  if (isNaN(amt)) return null;

  const result = Math.round(amt * usdToEgp * 100) / 100;

  return result;
};

export const convertEgpToUsd = (amount , usdToEgp) => {
  if (!amount || !usdToEgp) return null;

  const amt = parseFloat(amount);

  if (isNaN(amt)) return null;

  const result = Math.round((amt / usdToEgp) * 100) / 100;

  return result;
};