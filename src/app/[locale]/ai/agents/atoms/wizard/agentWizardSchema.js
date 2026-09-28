export const AGENT_WIZARD_STEPS = ["general", "knowledge", "capabilities", "review"];

/** User-toggleable capabilities (addressFix is automatic, never stored). */
export const AGENT_CAPABILITIES = [
  "createOrders",
  "campaignOrders",
  "orderLookup",
  "location",
  "reactions",
  "templates",
];

export const AGENT_PROVIDER_AUTO = "auto";
export const AGENT_LANGUAGES = ["auto", "arabic", "english"];
export const AGENT_GENDERS = ["male", "female"];

export const initialAgentWizardData = {
  name: "",
  language: "auto",
  gender: "male",
  responseProviderId: AGENT_PROVIDER_AUTO,
  customInstructions: "",
  isActive: true,
  knowledgeIds: [],
  capabilities: [...AGENT_CAPABILITIES],
};

export function validateStepGeneral(values) {
  const errs = {};
  if (!String(values?.name || "").trim()) {
    errs.name = "validation.nameRequired";
  } else if (String(values.name).trim().length > 255) {
    errs.name = "validation.nameTooLong";
  }
  if (!AGENT_LANGUAGES.includes(values?.language)) {
    errs.language = "validation.languageRequired";
  }
  if (!AGENT_GENDERS.includes(values?.gender)) {
    errs.gender = "validation.genderRequired";
  }
  if (values?.customInstructions && String(values.customInstructions).length > 4000) {
    errs.customInstructions = "validation.instructionsTooLong";
  }
  return errs;
}

export function buildAgentPayload(values) {
  return {
    name: String(values.name || "").trim(),
    language: values.language,
    gender: values.gender,
    customInstructions: String(values.customInstructions || "").trim() || null,
    responseProviderId:
      values.responseProviderId === AGENT_PROVIDER_AUTO
        ? null
        : values.responseProviderId,
    isActive: values.isActive ?? true,
    knowledgeIds: Array.isArray(values.knowledgeIds) ? values.knowledgeIds : [],
    capabilities: Array.isArray(values.capabilities)
      ? values.capabilities.filter((c) => AGENT_CAPABILITIES.includes(c))
      : [...AGENT_CAPABILITIES],
  };
}

export function mapAgentToForm(agent) {
  return {
    ...initialAgentWizardData,
    name: agent?.name || "",
    language: agent?.language || "auto",
    gender: agent?.gender || "male",
    responseProviderId: agent?.responseProviderId || AGENT_PROVIDER_AUTO,
    customInstructions: agent?.customInstructions || "",
    isActive: agent?.isActive ?? true,
    knowledgeIds: Array.isArray(agent?.knowledgeIds) ? agent.knowledgeIds : [],
    capabilities:
      Array.isArray(agent?.capabilities) && agent.capabilities.length
        ? agent.capabilities.filter((c) => AGENT_CAPABILITIES.includes(c))
        : [...AGENT_CAPABILITIES],
  };
}
