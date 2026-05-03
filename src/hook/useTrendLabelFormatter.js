import { useFormatter } from "next-intl";
import { useCallback } from "react";

export function useTrendLabelFormatter() {
  const formatIntl = useFormatter();

  const formatTrendLabel = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isCurrentYear = date.getFullYear() === now.getFullYear();
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log("str: ", dateStr,"date: ", date, "formated: ", formatIntl.dateTime(date, {
      day: "numeric",
      month: "short",
      year: isCurrentYear ? undefined : "numeric",
      timeZone: userTimeZone 
    }), "time zone: ", userTimeZone)
    return formatIntl.dateTime(date, {
      day: "numeric",
      month: "short",
      year: isCurrentYear ? undefined : "numeric",
      timeZone: userTimeZone 
    });
  }, [formatIntl]);

  return { formatTrendLabel };
}