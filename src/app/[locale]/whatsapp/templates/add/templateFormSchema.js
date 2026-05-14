import * as yup from "yup";
import {
  getVariableMatches,
  extractVariableNames,
  isCorrectVariableFormat,
} from "@/utils/whatsapp-healper";

const MAX_BODY_LENGTH = 1024;
const MAX_HEADER_TEXT = 60;
const MAX_FOOTER = 60;
const MAX_NAME = 512;

export const UI_CATEGORY_TO_API = {
  MARKETING: "marketing",
  UTILITY: "utility",
  AUTHENTICATION: "authentication",
};

export const UI_SUB_TO_API = {
  MARKETING_DEFAULT: "order_details",
  MARKETING_CALL_PERMISSIONS: "call_permissions_request",
  UTILITY_DEFAULT: "order_status",
  UTILITY_CALL_PERMISSIONS: "call_permissions_request",
  AUTHENTICATION_OTP: "fraud_alert",
};

export function apiCategoryToUi(apiCat) {
  const m = {
    marketing: "MARKETING",
    utility: "UTILITY",
    authentication: "AUTHENTICATION",
  };
  return m[String(apiCat || "").toLowerCase()] || "MARKETING";
}

export function apiSubToUiSub(apiSub, apiCategory) {
  const sub = String(apiSub || "").toLowerCase();
  const cat = String(apiCategory || "").toLowerCase();
  if (sub === "call_permissions_request") {
    return cat === "utility" ? "UTILITY_CALL_PERMISSIONS" : "MARKETING_CALL_PERMISSIONS";
  }
  const map = {
    order_details: "MARKETING_DEFAULT",
    rich_order_status: "MARKETING_DEFAULT",
    order_status: "UTILITY_DEFAULT",
    fraud_alert: "AUTHENTICATION_OTP",
    booking_status: "MARKETING_DEFAULT",
    flight_delay_and_gate_change_alert: "UTILITY_DEFAULT",
  };
  return map[sub] || "MARKETING_DEFAULT";
}

export function mapUiCategoryToApi(ui) {
  return UI_CATEGORY_TO_API[ui] || "marketing";
}

export function mapUiSubToApi(uiSub) {
  return UI_SUB_TO_API[uiSub] || "order_details";
}

export function hasInvalidVariablePlacement(text = "") {
  const trimmed = String(text).trim();
  return trimmed.startsWith("{{") || trimmed.endsWith("}}");
}

export function hasTooManyVariablesForText(text = "") {
  const varCount = getVariableMatches(text)?.length || 0;
  const words = String(text)
    .trim()
    .split(/\s+/)
    .filter((w) => !isCorrectVariableFormat(w, "number")).length;
  return words < 3 * varCount + 1;
}

function buttonSchema(t) {
  return yup
    .object({
      type: yup
        .string()
        .oneOf(
          ["CUSTOM", "PHONE_NUMBER", "VISIT_WEBSITE", "WHATSAPP_CALL"],
          t("validation.buttonTypeInvalid")
        )
        .required(),
      text: yup
        .string()
        .required(t("validation.buttonTextRequired"))
        .max(25, t("validation.buttonTextMax")),
      url: yup
        .string()
        .transform((v) => (v === "" || v == null ? undefined : v))
        .optional()
        .url(t("validation.buttonUrlInvalid")),
      urlType: yup.mixed().oneOf(["Static", "Dynamic", undefined, null]).optional().nullable(),
      urlExample: yup.string().optional().nullable(),
      activeForDays: yup
        .number()
        .min(1, t("validation.activeForDaysMin"))
        .max(30, t("validation.activeForDaysMax"))
        .optional()
        .nullable(),
      countryCode: yup.string().max(10).optional().nullable(),
      phoneNumber: yup.string().max(20).optional().nullable(),
    })
    .test("btn-url", t("validation.visitWebsiteUrlRequired"), (val) => {
      if (!val || val.type !== "VISIT_WEBSITE") return true;
      return Boolean(val.url && String(val.url).trim());
    })
    .test("btn-phone", t("validation.phoneButtonNumberRequired"), (val) => {
      if (!val || val.type !== "PHONE_NUMBER") return true;
      return Boolean(val.phoneNumber && String(val.phoneNumber).trim());
    })
    .test("btn-call-days", t("validation.whatsappCallDaysRequired"), (val) => {
      if (!val || val.type !== "WHATSAPP_CALL") return true;
      const d = val.activeForDays;
      return d != null && d >= 1 && d <= 30;
    });
}

function sharedTemplateFields(t) {
  return {
    headerType: yup.string().optional().nullable(),
    headerText: yup
      .string()
      .max(MAX_HEADER_TEXT, t("validation.headerTextMax"))
      .test("header-var-count", t("validation.headerVarMax"), (val) => {
        if (!val) return true;
        const n = getVariableMatches(val, "number").length;
        const nm = getVariableMatches(val, "named").length;
        return n + nm <= 1;
      })
      .optional()
      .nullable(),
    headerUrl: yup.string().optional().nullable(),
    bodyText: yup.string().when("subcategory", {
      is: "AUTHENTICATION_OTP",
      then: (s) => s.optional().nullable(),
      otherwise: (s) =>
        s
          .required(t("validation.bodyRequired"))
          .max(MAX_BODY_LENGTH, t("validation.bodyMax", { max: MAX_BODY_LENGTH }))
          .test("no-start-end-var", t("validation.bodyVarEdges"), (val) => !hasInvalidVariablePlacement(val))
          .test("min-words", t("validation.bodyVarDensity"), (val) => !hasTooManyVariablesForText(val)),
    }),
    footerText: yup.string().max(MAX_FOOTER, t("validation.footerMax")).optional().nullable(),
    buttons: yup.array().of(buttonSchema(t)).max(10, t("validation.buttonsMax")).optional().default([]),
    subcategory: yup.string().optional(),
    authMethod: yup.string().optional(),
    addSecurityRecommendation: yup.boolean().optional(),
    addExpirationTime: yup.boolean().optional(),
    expirationMinutes: yup.number().optional(),
    useCustomValidity: yup.boolean().optional(),
    validityPeriod: yup.string().optional(),
  };
}

/**
 * @param {(key: string, values?: Record<string, string | number>) => string} t
 * @param {"create" | "edit"} mode
 */
export function createTemplateFormSchema(t, mode = "create") {
  const shared = sharedTemplateFields(t);

  if (mode === "edit") {
    return yup.object({
      ...shared,
    });
  }

  return yup.object({
    accountId: yup.string().uuid(t("validation.accountIdInvalid")).required(t("validation.accountRequired")),
    name: yup
      .string()
      .required(t("validation.nameRequired"))
      .max(MAX_NAME, t("validation.nameMax", { max: MAX_NAME })),
    language: yup.mixed().oneOf(["ar", "en"], t("validation.languageInvalid")).required(),
    category: yup.string().required(t("validation.categoryRequired")),
    subcategory: yup.string().required(t("validation.subcategoryRequired")),
    ...shared,
  });
}

export function stripButtonIds(buttons = []) {
  return (Array.isArray(buttons) ? buttons : []).map(({ id: _id, ...rest }) => rest);
}

export function buildExamplesMap(variableSamples) {
  const out = {};
  const body = variableSamples?.body || {};
  const header = variableSamples?.header || {};
  Object.keys(body).forEach((k) => {
    if (body[k] != null && String(body[k]).trim() !== "") out[k] = String(body[k]).trim();
  });
  Object.keys(header).forEach((k) => {
    if (header[k] != null && String(header[k]).trim() !== "") out[k] = String(header[k]).trim();
  });
  return out;
}

/**
 * @param {string} [forcedHeaderUrl] — server path after upload
 */
export function buildTemplateConfigPayload(data, variableSamples, forcedHeaderUrl) {
  const examples = buildExamplesMap(variableSamples);
  const headerType =
    data.headerType === "NONE" || !data.headerType ? undefined : data.headerType;

  let headerUrl =
    forcedHeaderUrl != null && forcedHeaderUrl !== ""
      ? forcedHeaderUrl
      : data.headerUrl && !String(data.headerUrl).startsWith("blob:")
        ? data.headerUrl
        : undefined;

  const cfg = {
    headerType,
    headerText:
      headerType === "TEXT" && data.headerText?.trim()
        ? data.headerText.trim()
        : undefined,
    headerUrl:
      headerType && ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) ? headerUrl : undefined,
    bodyText: data.subcategory === "AUTHENTICATION_OTP" ? undefined : data.bodyText?.trim(),
    footerText: data.footerText?.trim() || undefined,
    examples: Object.keys(examples).length ? examples : undefined,
    buttons: stripButtonIds(data.buttons || []).filter((b) => b?.text),
  };

  if (headerType === "TEXT" && data.headerText) {
    const nums = extractVariableNames(data.headerText, "number");
    const named = extractVariableNames(data.headerText, "named");
    if (nums.length && examples[nums[0]]) {
      cfg.headerExample = examples[nums[0]];
    } else if (named.length && examples[named[0]]) {
      cfg.headerExample = examples[named[0]];
    }
  }

  if (data.subcategory === "AUTHENTICATION_OTP") {
    let body = "{{1}} هو رمز التحقق الخاص بك.";
    if (data.addSecurityRecommendation) body += " لحمايتك، لا تشارك هذا الرمز.";
    cfg.bodyText = body;
    if (data.addExpirationTime) {
      cfg.footerText = `تنتهي صلاحية الرمز خلال ${data.expirationMinutes} دقائق.`;
    }
  }

  Object.keys(cfg).forEach((k) => {
    if (cfg[k] === undefined || cfg[k] === "") delete cfg[k];
  });
  if (cfg.buttons && !cfg.buttons.length) delete cfg.buttons;
  if (cfg.headerExample === undefined) delete cfg.headerExample;

  return cfg;
}

export { MAX_BODY_LENGTH, MAX_HEADER_TEXT };
