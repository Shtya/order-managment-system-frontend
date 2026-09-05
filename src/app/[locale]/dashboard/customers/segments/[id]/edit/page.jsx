"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { setDocumentTitle } from "@/utils/documentTitle";
import SegmentForm from "@/app/[locale]/customers/segments/atoms/SegmentForm";

export default function EditSegmentTemplatePage() {
  const t = useTranslations("customerSegmentTemplates");
  const params = useParams();
  const segmentId = params?.id;

  useEffect(() => {
    setDocumentTitle(t("breadcrumb.edit"));
  }, [t]);

  return <SegmentForm mode="edit" segmentId={segmentId} variant="template" />;
}
