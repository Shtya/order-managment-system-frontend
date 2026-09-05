"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setDocumentTitle } from "@/utils/documentTitle";
import SegmentForm from "../atoms/SegmentForm";

export default function NewCustomerSegmentPage() {
  const t = useTranslations("customerSegments");

  useEffect(() => {
    setDocumentTitle(t("breadcrumb.new"));
  }, [t]);

  return <SegmentForm mode="create" />;
}
