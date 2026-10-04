export const AGENT_WIZARD_STEPS = ["general", "knowledge", "capabilities", "review"];

/** User-toggleable capabilities (addressFix is automatic, never stored). */
export const AGENT_CAPABILITIES = [
  "searchProducts",
  "getProductDetails",
  "searchBundles",
  "getBundleDetails",
  "listCategories",
  "createOrder",
  "campaignOrders",
  "getMyOrders",
  "getOrderDetails",
  "addOrderItems",
  "replaceOrderItems",
  "updateOrderItems",
  "updateOrderInfo",
  "cancelOrder",
  "postponeOrder",
  "confirmOrder",
  "addCustomerAddress",
  "updateCustomerAddress",
  "removeCustomerAddress",
  "setDefaultAddress",
  "getMyAddresses",
  "getCities",
  "getAreasByCity",
  "updateCustomer",
  "location",
  "reactions",
  "templates",
  "humanHandoff",
];

const CATALOG_READ = [
  "searchProducts",
  "getProductDetails",
  "searchBundles",
  "getBundleDetails",
];
const GEO_READ = ["getCities", "getAreasByCity"];
const ADDRESS_READ = ["getMyAddresses", ...GEO_READ];
const ORDER_READ = ["getMyOrders", "getOrderDetails"];

/** Direct deps; expandAgentCapabilities walks them transitively. */
export const AGENT_CAPABILITY_DEPENDENCIES = {
  getProductDetails: [],
  getBundleDetails: [],
  getAreasByCity: [],
  getOrderDetails: [],
  createOrder: [...CATALOG_READ, "listCategories", ...ADDRESS_READ],
  campaignOrders: [...ADDRESS_READ],
  addOrderItems: [...ORDER_READ, ...CATALOG_READ],
  replaceOrderItems: [...ORDER_READ, ...CATALOG_READ],
  updateOrderItems: [...ORDER_READ, ...CATALOG_READ],
  updateOrderInfo: [...ORDER_READ, ...ADDRESS_READ],
  cancelOrder: [...ORDER_READ],
  postponeOrder: [...ORDER_READ],
  confirmOrder: [...ORDER_READ],
  addCustomerAddress: [...ADDRESS_READ],
  updateCustomerAddress: [...ADDRESS_READ],
  removeCustomerAddress: ["getMyAddresses"],
  setDefaultAddress: ["getMyAddresses"],
  humanHandoff: ["getMyOrders", "getOrderDetails"],
};

export function capabilityClosure(list) {
  const valid = new Set(AGENT_CAPABILITIES);
  const out = new Set();
  const visit = (id) => {
    if (!valid.has(id) || out.has(id)) return;
    out.add(id);
    (AGENT_CAPABILITY_DEPENDENCIES[id] || []).forEach(visit);
  };
  (Array.isArray(list) ? list : []).forEach(visit);
  return AGENT_CAPABILITIES.filter((id) => out.has(id));
}

export function requiredByCapabilities(id, selected) {
  const requiredBy = (Array.isArray(selected) ? selected : []).filter(
    (other) => other !== id && capabilityClosure([other]).includes(id),
  );
  return requiredBy.filter(
    (parent) => !requiredBy.some((other) => other !== parent && capabilityClosure([other]).includes(parent)),
  );
}

const LEGACY_CAPABILITIES = {
  createOrders: [
    "searchProducts",
    "getProductDetails",
    "searchBundles",
    "getBundleDetails",
    "listCategories",
    "createOrder",
    "getMyAddresses",
    "getCities",
    "getAreasByCity",
  ],
  orderLookup: ["getMyOrders", "getOrderDetails"],
  editOrders: [
    "addOrderItems",
    "replaceOrderItems",
    "updateOrderItems",
    "updateOrderInfo",
    "cancelOrder",
    "postponeOrder",
    "confirmOrder",
    "addCustomerAddress",
    "updateCustomerAddress",
    "removeCustomerAddress",
    "setDefaultAddress",
    "updateCustomer",
    "getMyOrders",
    "getOrderDetails",
    "searchProducts",
    "getProductDetails",
    "searchBundles",
    "getBundleDetails",
    "getMyAddresses",
    "getCities",
    "getAreasByCity",
  ],
};

export function expandAgentCapabilities(list) {
  const out = new Set();
  for (const cap of Array.isArray(list) ? list : []) {
    const mapped = LEGACY_CAPABILITIES[cap];
    if (mapped) mapped.forEach((id) => out.add(id));
    else out.add(cap);
  }
  return capabilityClosure([...out]);
}

export const AGENT_MEDIA_INPUTS = ["acceptImage", "acceptVideo", "acceptDocument", "acceptAudio"];

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
  acceptImage: false,
  acceptVideo: false,
  acceptDocument: false,
  acceptAudio: false,
  handoffAssignedRoleId: "",
  handoffEmployeeIds: [],
  handoffEstimatedMinutes: "",
  handoffPriority: "medium",
  handoffStatusId: "",
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

export function validateStepCapabilities(values) {
  const errs = {};
  const caps = expandAgentCapabilities(values?.capabilities);
  if (caps.includes("humanHandoff") && !String(values?.handoffAssignedRoleId || "").trim()) {
    errs.handoffAssignedRoleId = "validation.handoffRoleRequired";
  }
  return errs;
}

export function buildAgentPayload(values) {
  const capabilities = expandAgentCapabilities(values.capabilities);
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
    capabilities,
    acceptImage: values.acceptImage === true,
    acceptVideo: values.acceptVideo === true,
    acceptDocument: values.acceptDocument === true,
    acceptAudio: values.acceptAudio === true,
    handoffAssignedRoleId: capabilities.includes("humanHandoff")
      ? values.handoffAssignedRoleId || null
      : null,
    handoffEmployeeIds: capabilities.includes("humanHandoff")
      ? (Array.isArray(values.handoffEmployeeIds) ? values.handoffEmployeeIds : [])
      : [],
    handoffEstimatedMinutes: capabilities.includes("humanHandoff")
      ? (values.handoffEstimatedMinutes ? Number(values.handoffEstimatedMinutes) : null)
      : null,
    handoffPriority: capabilities.includes("humanHandoff")
      ? values.handoffPriority || "medium"
      : "medium",
    handoffStatusId: capabilities.includes("humanHandoff")
      ? values.handoffStatusId || null
      : null,
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
        ? expandAgentCapabilities(agent.capabilities)
        : [...AGENT_CAPABILITIES],
    acceptImage: agent?.acceptImage === true,
    acceptVideo: agent?.acceptVideo === true,
    acceptDocument: agent?.acceptDocument === true,
    acceptAudio: agent?.acceptAudio === true,
    handoffAssignedRoleId: agent?.handoffAssignedRoleId || "",
    handoffEmployeeIds: Array.isArray(agent?.handoffEmployeeIds)
      ? agent.handoffEmployeeIds
      : [],
    handoffEstimatedMinutes: agent?.handoffEstimatedMinutes ?? "",
    handoffPriority: agent?.handoffPriority || "medium",
    handoffStatusId: agent?.handoffStatusId || "",
  };
}
