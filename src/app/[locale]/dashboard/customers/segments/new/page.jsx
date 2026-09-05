"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setDocumentTitle } from "@/utils/documentTitle";
import SegmentForm from "@/app/[locale]/customers/segments/atoms/SegmentForm";

export default function NewSegmentTemplatePage() {
  const t = useTranslations("customerSegmentTemplates");

  useEffect(() => {
    setDocumentTitle(t("breadcrumb.new"));
  }, [t]);

  return <SegmentForm mode="create" variant="template" />;
}
