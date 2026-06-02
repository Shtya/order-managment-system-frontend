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
  UTILITY_DEFAULT: "order_details",
  UTILITY_CALL_PERMISSIONS: "call_permissions_request",
  AUTHENTICATION_OTP: "fraud_alert",
};


export function apiCategoryToUi(apiCat) {
  const m = {
    marketing: "MARKETING",
    utility: "UTILITY",
    authentication: "AUTHENTICATION",
  };
  return m[String(apiCat || "").toLowerCase()] || "UTILITY";
}

export function apiSubToUiSub(apiSub, apiCategory, templateConfig) {
  const cfg = templateConfig && typeof templateConfig === "object" ? templateConfig : {};
  if (cfg.uiSubcategory) return cfg.uiSubcategory;

  const sub = String(apiSub || "").toLowerCase();
  const cat = String(apiCategory || "").toLowerCase();
  if (sub === "call_permissions_request") {
    return cat === "utility" ? "UTILITY_CALL_PERMISSIONS" : "MARKETING_CALL_PERMISSIONS";
  }
  if (cat === "utility" && (sub === "order_status" || sub === "order_details")) {
    return "UTILITY_DEFAULT";
  }


  const map = {
    order_details: "MARKETING_DEFAULT",
    rich_order_status: "MARKETING_DEFAULT",
    order_status: "UTILITY_DEFAULT",
    fraud_alert: "AUTHENTICATION_OTP",
    booking_status: "UTILITY_DEFAULT",
    flight_delay_and_gate_change_alert: "UTILITY_DEFAULT",
  };
  return map[sub];
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
      // if type is VISIT_WEBSITE, url is required
      url: yup.string().when("type", {
        is: "VISIT_WEBSITE",
        then: (s) => s.required(t("validation.visitWebsiteUrlRequired")),
        otherwise: (s) => s.optional().nullable(),
      }).optional().nullable(),
      // if type is PHONE_NUMBER, countryCode and phoneNumber are required
      countryCode: yup.string().when("type", {
        is: "PHONE_NUMBER",
        then: (s) => s.required(t("validation.phoneNumberCountryCodeRequired")).max(10, t("validation.countryCodeMax")),
        otherwise: (s) => s.optional().nullable(),
      }).optional().nullable(),
      phoneNumber: yup.string().when("type", {
        is: "PHONE_NUMBER",
        then: (s) => s.required(t("validation.phoneNumberRequired")).max(20, t("validation.phoneNumberMax")),
        otherwise: (s) => s.optional().nullable(),
      }).optional().nullable(),
      urlType: yup.mixed().oneOf(["Static", "Dynamic", "STATIC", "DYNAMIC", undefined, null]).optional().nullable(),
      // if type is VISIT_WEBSITE and urlType is Dynamic, urlExample is required
      urlExample: yup.string()
        .when(["type", "urlType"], {
          is: (type, urlType) =>
            type === "VISIT_WEBSITE" && String(urlType || "").toLowerCase() === "dynamic",
          then: (s) => s.required(t("validation.urlExampleRequired")).url(t("validation.urlExampleInvalid")),
          otherwise: (s) => s.optional().nullable(),
        }).optional().nullable(),
      activeForDays: yup
        .number()
        .min(1, t("validation.activeForDaysMin"))
        .max(30, t("validation.activeForDaysMax"))
        .optional()
        .nullable(),
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
      const raw = val.activeForDays ?? val.activeDays;
      const d = raw != null && raw !== "" ? Number(raw) : NaN;
      return Number.isFinite(d) && d >= 1 && d <= 30;
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
        // const nm = getVariableMatches(val, "named").length;

        return n <= 1;
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
    validityPeriod: yup
      .string()
      .oneOf(
        ["30s", "1m", "2m", "3m", "5m", "10m", "15m", "30m", "1h", "3h", "6h", "12h"],
        t("validation.validityPeriodInvalid")
      )
      .optional(),
    otpCopyButtonText: yup
      .string()
      .max(25, t("validation.buttonTextMax"))
      .when("subcategory", {
        is: "AUTHENTICATION_OTP",
        then: (s) => s.optional().nullable(),
        otherwise: (s) => s.strip().optional().nullable(),
      }),
  };
}

/**
 * @param {(key: string, values?: Record<string, string | number>) => string} t
 * @param {"create" | "edit"} mode
 */
export function createTemplateFormSchema(t, mode = "create", superAdmin) {
  const shared = sharedTemplateFields(t);

  if (mode === "edit") {
    return yup.object({
      ...shared,
    });
  }

  return yup.object({
    ...(!superAdmin ? {
      accountId: yup.string().uuid(t("validation.accountIdInvalid")).required(t("validation.accountRequired")),
    } : {}),
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
  return (Array.isArray(buttons) ? buttons : []).map(({ id: _id, activeDays, ...rest }) => {
    const out = { ...rest };
    if (out.urlType === "STATIC") out.urlType = "Static";
    if (out.urlType === "DYNAMIC") out.urlType = "Dynamic";
    if (out.activeForDays == null && activeDays != null) {
      const n = Number(activeDays);
      if (Number.isFinite(n)) out.activeForDays = n;
    }
    return out;
  });
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
  console.log(data)
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
    bodyText: data.category?.toLowerCase() === "authentication" ? undefined : data.bodyText?.trim(),
    footerText: data.footerText?.trim() || undefined,
    examples: Object.keys(examples).length ? examples : undefined,
    buttons: stripButtonIds(data.buttons || []).filter((b) => b?.text),
    uiSubcategory: data.subcategory || undefined,
    useCustomValidity: !!data.useCustomValidity,
    validityPeriod: data.validityPeriod || "10m",
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
    cfg.bodyText = undefined;
    cfg.footerText = undefined;
    cfg.authMethod = data.authMethod || "COPY_CODE";
    const otpLabel = data.otpCopyButtonText?.trim();
    if (otpLabel) cfg.otpCopyButtonText = otpLabel;
    cfg.addSecurityRecommendation = !!data.addSecurityRecommendation;
    cfg.addExpirationTime = !!data.addExpirationTime;
    cfg.expirationMinutes =
      data.addExpirationTime ? Number(data.expirationMinutes) || 10 : undefined;
  } else {
    delete cfg.authMethod;
    delete cfg.otpCopyButtonText;
    delete cfg.addSecurityRecommendation;
    delete cfg.addExpirationTime;
    delete cfg.expirationMinutes;
  }

  Object.keys(cfg).forEach((k) => {
    if (cfg[k] === undefined || cfg[k] === "") delete cfg[k];
  });
  if (cfg.buttons && !cfg.buttons.length) delete cfg.buttons;
  if (cfg.headerExample === undefined) delete cfg.headerExample;

  return cfg;
}

export { MAX_BODY_LENGTH, MAX_HEADER_TEXT };
