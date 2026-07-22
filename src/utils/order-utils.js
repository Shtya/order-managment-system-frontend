

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
        requires: ["customerName", "phoneNumber", "firstLine", "cityId", "districtId"],
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



export const ShippingDaysRangeStatus = {
    BEFORE_MIN: "beforeMin",
    IN_RANGE: "inRange",
    NEAR_END: "nearEnd",
    AFTER_END: "afterEnd",
    UNKNOWN: "unknown",
  };
  
  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  export function calcShippingDaysElapsed(shippedAt, referenceDate) {
    if (!shippedAt) return null;
  
    const shipped = new Date(shippedAt);
    if (Number.isNaN(shipped.getTime())) return null;
  
    const shippedDay = startOfLocalDay(shipped);
    const today = startOfLocalDay(referenceDate ? new Date(referenceDate) : new Date());
    const diffDays = Math.floor((today.getTime() - shippedDay.getTime()) / (24 * 60 * 60 * 1000));
  
    return diffDays + 1;
  }
  
  export function getShippingDaysRangeStatus(days, minDays, maxDays) {
    if (days == null) return ShippingDaysRangeStatus.UNKNOWN;
  
    const min = minDays != null && minDays !== "" ? Number(minDays) : null;
    const max = maxDays != null && maxDays !== "" ? Number(maxDays) : null;
  
    if (max != null && days > max) {
      return ShippingDaysRangeStatus.AFTER_END;
    }
  
    if (min != null && days < min) {
      return ShippingDaysRangeStatus.BEFORE_MIN;
    }
  
    if (max != null && days >= max - 1 && days <= max) {
      return ShippingDaysRangeStatus.NEAR_END;
    }
  
    if (min != null && max != null && days >= min && days <= max) {
      return ShippingDaysRangeStatus.IN_RANGE;
    }
  
    if (min != null && max == null && days >= min) {
      return ShippingDaysRangeStatus.IN_RANGE;
    }
  
    if (max != null && min == null && days <= max) {
      return ShippingDaysRangeStatus.IN_RANGE;
    }
  
    return ShippingDaysRangeStatus.UNKNOWN;
  }
  
  export function getShippingDaysBadgeStyles(rangeStatus) {
    switch (rangeStatus) {
      case ShippingDaysRangeStatus.BEFORE_MIN:
        return {
          className:
            "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
        };
      case ShippingDaysRangeStatus.IN_RANGE:
        return {
          className:
            "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        };
      case ShippingDaysRangeStatus.NEAR_END:
        return {
          className:
            "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        };
      case ShippingDaysRangeStatus.AFTER_END:
        return {
          className:
            "bg-red-100 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        };
      default:
        return {
          className:
            "bg-muted text-muted-foreground border border-border",
        };
    }
  }
  
  export function getShippingDaysInfo(shippedAt, minDays, maxDays, referenceDate = new Date()) {
    const days = calcShippingDaysElapsed(shippedAt, referenceDate);
    const rangeStatus = getShippingDaysRangeStatus(days, minDays, maxDays);
    const styles = getShippingDaysBadgeStyles(rangeStatus);
  
    return { days, rangeStatus, styles };
  }
  