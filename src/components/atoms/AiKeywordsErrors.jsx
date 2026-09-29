"use client";

import * as React from "react";

function stripItemPrefix(message) {
  return String(message ?? "").replace(/^[A-Za-z0-9_]+\[\d+\]\s*/, "");
}

export const AiKeywordsErrors = React.memo(function AiKeywordsErrors({ errors, t, errorKey = "ai.keywordError" }) {
  const rows = React.useMemo(() => {
    if (!Array.isArray(errors)) return [];
    return errors
      .map((error, index) => ({
        index,
        message: error?.message ? stripItemPrefix(error.message) : "",
      }))
      .filter((row) => row.message);
  }, [errors]);

  if (!rows.length) return null;

  return (
    <>
      {rows.map((row) => (
        <div key={row.index} className="text-xs text-red-600">
          {t(errorKey, { index: row.index + 1 })}: {row.message}
        </div>
      ))}
    </>
  );
});
