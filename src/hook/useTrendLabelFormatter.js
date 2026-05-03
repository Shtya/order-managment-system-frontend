import { useFormatter } from "next-intl";
import { useCallback } from "react";

export function useTrendLabelFormatter() {
  const formatIntl = useFormatter();

  const formatTrendLabel = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isCurrentYear = date.getFullYear() === now.getFullYear();

    return formatIntl.dateTime(date, {
      day: "numeric",
      month: "short",
      year: isCurrentYear ? undefined : "numeric",
    });
  }, [formatIntl]);

  return { formatTrendLabel };
}