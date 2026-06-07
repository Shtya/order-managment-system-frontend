

export const GEO_CONFIG = {
    bosta: {
        needsGeo: true,
        showDistrict: true,
        showLocation: false,
        fields: ["cityId", "zoneId", "districtId"],
        tPrefix: "bosta", // Namespace for translations
    },
    turbo: {
        needsGeo: true,
        showDistrict: false,
        showLocation: false,
        fields: ["cityId", "zoneId"],
        tPrefix: "turbo",
    },
    // Default/Normal mode uses text inputs instead of dropdowns
    default: {
        needsGeo: false,
        showDistrict: false,
        showLocation: false,
        fields: [],
        tPrefix: "fields",
    }
};

export const CARRIER_CONFIG = {
    BOSTA: {
        provider: "bosta",
        requires: ["customerName", "phoneNumber", "firstLine", "cityId", "districtId", "orderSize"],
        hasDistrict: true,
        hasZone: false,
    },
    TURBO: {
        provider: "turbo",
        requires: ["customerName", "phoneNumber", "cityId", "zoneId"],
        hasDistrict: false,
        hasZone: true,
    },
    NONE: { provider: "none", requires: [], hasDistrict: false, hasZone: false },
};