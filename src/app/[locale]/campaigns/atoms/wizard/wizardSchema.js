"use client";

import * as yup from "yup";
import {
  inspectTemplateOrderLink,
  textHasOrderLinkVariable,
} from "../campaignOrderUrl";

export const CAMPAIGN_CATEGORIES = [
  "general_marketing",
  "promotional",
  "announcement",
  "follow_up",
  "reminder",
  "welcome",
  "win_back",
  "back_in_stock",
  "vip_exclusive",
  "event_invitation",
  "reorder_replenishment",
  "educational_nurture",
  "upsell",
  "customer_reactivation",
];

export const WIZARD_STEPS = ["general", "recipients", "message", "offer", "review"];

const detectedTimeZone =
  typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

export const initialWizardData = {
  // Step 1
  name: "",
  description: "",
  category: "general_marketing",
  workingHoursEnabled: false,
  workingHoursStart: "09:00",
  workingHoursEnd: "22:00",
  workingHoursTimezone: detectedTimeZone,
  delayMinSeconds: 30,
  delayMaxSeconds: 90,
  channel: "whatsapp",
  scheduleMode: "now",
  scheduledDate: "",
  scheduledTime: "",
  maxMessagesPerHour: "",
  // Step 2
  audienceType: "segment",
  audienceSegmentId: null,
  audienceFile: null,
  audienceFileMeta: null,
  manualRecipients: [],
  audienceFilter: null,
  // Step 3 (whatsapp snapshot parts)
  whatsappAccountId: null,
  whatsapp: null,
  enablePurchasePage: false,
  products: [],
  shippingPrice: 0,
  orderReplyFollowupEnabled: false,
  orderReplyFollowupText: "",
  orderReplyFollowupButtonIndex: null,
};

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export const stepGeneralSchema = yup.object({
  name: yup.string().trim().required("validation.nameRequired").max(255),
  description: yup.string().max(2000).nullable(),
  category: yup.string().oneOf(CAMPAIGN_CATEGORIES).required(),
  workingHoursEnabled: yup.boolean().default(false),
  workingHoursStart: yup.string().when("workingHoursEnabled", {
    is: true,
    then: (s) => s.required("validation.workingHoursRequired").matches(timeRe),
    otherwise: (s) => s.nullable(),
  }),
  workingHoursEnd: yup.string().when("workingHoursEnabled", {
    is: true,
    then: (s) => s.required("validation.workingHoursRequired").matches(timeRe),
    otherwise: (s) => s.nullable(),
  }),
  delayMinSeconds: yup.number().min(4).required(),
  delayMaxSeconds: yup
    .number()
    .min(4)
    .required()
    .test("max-gte-min", "validation.delayMax", function (v) {
      return v >= this.parent.delayMinSeconds;
    }),
  channel: yup.string().oneOf(["whatsapp"]).required(),
  scheduleMode: yup.string().oneOf(["now", "scheduled"]).required(),
  scheduledDate: yup.string().when("scheduleMode", {
    is: "scheduled",
    then: (s) => s.required("validation.scheduledAtRequired"),
    otherwise: (s) => s.nullable(),
  }),
  scheduledTime: yup.string().when("scheduleMode", {
    is: "scheduled",
    then: (s) =>
      s
        .required("validation.scheduledAtRequired")
        .matches(timeRe, "validation.scheduledAtRequired"),
    otherwise: (s) => s.nullable(),
  }),
  workingHoursTimezone: yup.string().nullable(),
  maxMessagesPerHour: yup
    .number()
    .transform((v, o) => (o === "" || Number.isNaN(v) ? null : v))
    .nullable()
    .min(1),
})
  .test(
    "scheduled-future",
    "validation.scheduledAtFuture",
    function (value) {
      if (value?.scheduleMode !== "scheduled") return true;

      const combined = combineScheduledAt(
        value?.scheduledDate,
        value?.scheduledTime
      );

      if (!combined) {
        return this.createError({
          path: "scheduledDate",
          message: "validation.scheduledAtRequired",
        });
      }

      if (new Date(combined).getTime() <= Date.now()) {
        return this.createError({
          path: "scheduledDate",
          message: "validation.scheduledAtFuture",
        });
      }

      return true;
    }
  );

export function combineScheduledAt(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const ymdMatch = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
  let y;
  let m;
  let d;
  if (ymdMatch) {
    y = Number(ymdMatch[1]);
    m = Number(ymdMatch[2]);
    d = Number(ymdMatch[3]);
  } else {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    y = parsed.getFullYear();
    m = parsed.getMonth() + 1;
    d = parsed.getDate();
  }
  const tm = String(timeValue).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!tm) return null;
  const combined = new Date(y, m - 1, d, Number(tm[1]), Number(tm[2]), 0);
  if (Number.isNaN(combined.getTime())) return null;
  return combined.toISOString();
}

export function validateStepGeneral(data) {
  try {
    stepGeneralSchema.validateSync(data, { abortEarly: false });
    return {};
  } catch (e) {
    const out = {};
    e.inner?.forEach((err) => {
      if (err.path && !out[err.path]) out[err.path] = err.message;
    });
    return out;
  }
}

export function validateStepRecipients(data) {
  const errors = {};
  if (data.audienceType === "segment" && !data.audienceSegmentId) {
    errors.audienceSegmentId = "validation.segmentRequired";
  }
  if (data.audienceType === "file") {
    if (!data.audienceFile && !data.audienceFileUrl) {
      errors.audienceFile = "validation.fileRequired";
    } else if ((data.audienceFileMeta?.invalid ?? 0) > 0) {
      errors.audienceFile = "validation.fileHasErrors";
    }
  }
  if (data.audienceType === "manual" && !(data.manualRecipients || []).length) {
    errors.manualRecipients = "validation.manualRequired";
  }
  if (data.audienceType === "customers" && !data.audienceFilter) {
    errors.audienceFilter = "validation.filterRequired";
  }
  return errors;
}

export function validateStepMessage(data) {
  const errors = {};
  if ((data.channel || "whatsapp") === "whatsapp") {
    if (!data.whatsapp?.templateId || !data.whatsappAccountId) {
      errors.whatsapp = "validation.templateRequired";
    } else {
      const w = data.whatsapp;
      const missing = [];
      ["headerVariables", "bodyVariables", "buttonVariables"].forEach((k) => {
        Object.entries(w[k] || {}).forEach(([key, v]) => {
          if (!String(v?.value ?? "").trim()) missing.push(`${k}.${key}`);
        });
      });
      if (w?.needsMedia && !w?.headerUrl) missing.push("headerUrl");
      if (w?.needsLocation && !(w?.locationData?.name && w?.locationData?.address)) {
        missing.push("locationData");
      }
      if (missing.length) errors.whatsapp = "validation.variablesRequired";
    }
  }
  return errors;
}

export function validateStepOffer(data) {
  const inspect = inspectTemplateOrderLink(data.whatsapp);
  const errors = {};
  if (!data.enablePurchasePage) return errors;
  if (!inspect.orderLinkAvailable) {
    errors.enablePurchasePage = "validation.orderLinkUnavailable";
    return errors;
  }
  const products = data.products || [];
  if (!products.length || products.some((p) => !p.variantId)) {
    errors.products = "validation.productsRequired";
  }
  const followupOn = inspect.qrOnly ? true : !!data.orderReplyFollowupEnabled;
  if (inspect.hasQuickReply && followupOn) {
    if (
      data.orderReplyFollowupButtonIndex === null ||
      data.orderReplyFollowupButtonIndex === undefined ||
      data.orderReplyFollowupButtonIndex === ""
    ) {
      errors.orderReplyFollowupButtonIndex = "validation.followupButtonRequired";
    }
    if (!textHasOrderLinkVariable(data.orderReplyFollowupText)) {
      errors.orderReplyFollowupText = "validation.followupUrlRequired";
    }
  }
  return errors;
}

export function buildCampaignPayload(data, opts = {}) {
  const payload = {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    category: data.category,
    channel: "whatsapp",
    audienceType: data.audienceType,
    scheduleMode: data.scheduleMode,
    delayMinSeconds: Number(data.delayMinSeconds),
    delayMaxSeconds: Number(data.delayMaxSeconds),
    enablePurchasePage: !!data.enablePurchasePage,
  };
  if (data.enablePurchasePage) {
    payload.shippingPrice = Number(data.shippingPrice || 0);
    payload.products = (data.products || []).map((p, index) => ({
      productId: p.productId || undefined,
      variantId: p.variantId,
      name: p.name,
      sku: p.sku || undefined,
      image: p.image || undefined,
      quantity: Number(p.quantity || 1),
      price: Number(p.price || 0),
      sortOrder: index,
    }));
    payload.orderReplyFollowupEnabled = inspectTemplateOrderLink(data.whatsapp).qrOnly
      ? true
      : !!data.orderReplyFollowupEnabled;
    payload.orderReplyFollowupText = data.orderReplyFollowupText || undefined;
    payload.orderReplyFollowupButtonIndex =
      data.orderReplyFollowupButtonIndex === "" || data.orderReplyFollowupButtonIndex == null
        ? undefined
        : Number(data.orderReplyFollowupButtonIndex);
  }
  if (data.maxMessagesPerHour) payload.maxMessagesPerHour = Number(data.maxMessagesPerHour);
  if (data.workingHoursEnabled) {
    payload.workingHoursStart = data.workingHoursStart;
    payload.workingHoursEnd = data.workingHoursEnd;
    payload.workingHoursTimezone =
      data.workingHoursTimezone ||
      (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null) ||
      undefined;
  }
  if (data.scheduleMode === "scheduled") {
    const combined = combineScheduledAt(data.scheduledDate, data.scheduledTime);
    if (combined) payload.scheduledAt = combined;
  }
  if (data.audienceType === "segment") payload.audienceSegmentId = data.audienceSegmentId;
  else payload.audienceSegmentId = null;
  if (data.audienceType === "manual") {
    payload.manualRecipients = (data.manualRecipients || []).map((r) => ({
      phoneNumber: r.phoneNumber,
      ...(r.name ? { name: r.name } : {}),
    }));
  }
  if (data.audienceType === "customers") payload.audienceFilter = data.audienceFilter;
  else payload.audienceFilter = null;
  // Duplicate flow: no fresh upload — ask the backend to copy the stored
  // file to a new path instead of reusing the URL.
  if (
    data.audienceType === "file" &&
    !data.audienceFile &&
    data.audienceFileUrl &&
    opts.copyStoredFile
  ) {
    payload.audienceFileUrl = data.audienceFileUrl;
    payload.duplicateAudienceFile = true;
  }
  if (data.whatsapp) {
    payload.whatsapp = {
      templateId: data.whatsapp.templateId,
      accountId: data.whatsappAccountId,
      templateData: data.whatsapp.templateData,
      ...(data.whatsapp.headerUrl ? { headerUrl: data.whatsapp.headerUrl } : {}),
      ...(data.whatsapp.headerVariables ? { headerVariables: data.whatsapp.headerVariables } : {}),
      ...(data.whatsapp.bodyVariables ? { bodyVariables: data.whatsapp.bodyVariables } : {}),
      ...(data.whatsapp.buttonVariables ? { buttonVariables: data.whatsapp.buttonVariables } : {}),
      ...(data.whatsapp.locationData ? { locationData: data.whatsapp.locationData } : {}),
    };
  }
  return payload;
}
