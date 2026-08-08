// Builder layer for business messages. Kept OUT of businessMessageDefinitions
// so the registry stays data-only. Each builder is a pure transform:
//   (messageValues, businessConfig, ctx) => initialMessageValues
// ctx carries everything that needs React/locale access, resolved at the call
// site (a component) and passed in:
//   { locale, lang, t, formatDateWithFormat, getNaturalDayName }
import { DEFAULT_DATE_FORMATS } from "@/components/ui/dateConfig";

const POSTPONE_NS = "businessMessages.orderPostponeDateTexts";
const DISCOUNT_NS = "businessMessages.offerDiscountTexts";
const PAYMENT_NS = "businessMessages.paymentMethodTexts";

// Matches the backend's computeOffsetDate: offset N = the N-th working day
// after the base (weekends Fri/Sat don't count when excludeWeekends is on),
// so the skip carries over and every offset maps to a distinct date.
function computeWorkingDayDate(base, offset, excludeWeekends) {
    const date = new Date(base);
    if (offset <= 0) return date;
    let count = 0;
    while (count < offset) {
        date.setDate(date.getDate() + 1);
        if (!excludeWeekends || (date.getDay() !== 5 && date.getDay() !== 6)) {
            count += 1;
        }
    }
    return date;
}

function buildPostponeDateRows(businessConfig, ctx) {
    const { t } = ctx;
    const daysCount = Math.max(1, Math.min(30, Number(businessConfig.daysCount) || 10));
    const excludeWeekends = !!businessConfig.excludeWeekends;
    const startFromTomorrow = businessConfig.startFromTomorrow !== false;
    const dateFormat = businessConfig.dateFormat || DEFAULT_DATE_FORMATS[0];
    const deliveryAt = t(`${POSTPONE_NS}.deliveryAt`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = [];
    const start = startFromTomorrow ? 1 : 0;
    for (let offset = start; offset < start + daysCount; offset++) {
        const d = computeWorkingDayDate(today, offset, excludeWeekends);
        // use formate "DD-MM-YYYY" for id
        const Idtoken = `{{global.date.${offset}.${DEFAULT_DATE_FORMATS[0]}}}`;
        const token = `{{global.date.${offset}.${dateFormat}}}`;
        rows.push({
            id: `__date_${Idtoken}__`,
            title: token,
            description: `${deliveryAt} ${token}`,
        });
    }
    return rows;
}

function injectDiscountValue(str, value, isPercentage) {
    if (!str) return str;
    if (isPercentage) {
        return str.replace(/\{\{discountValue\}\}/g, String(value));
    }
    return str.replace(/\{\{discountValue\}\}\s*%/g, String(value));
}

export const businessMessageBuilders = {
    order_postpone_date: (messageValues, businessConfig, ctx) => {
        const { t } = ctx;
        const rows = buildPostponeDateRows(businessConfig, ctx);
        return {
            ...messageValues,
            headerType: messageValues.headerType || "TEXT",
            headerText: t(`${POSTPONE_NS}.headerText`),
            bodyText: t(`${POSTPONE_NS}.bodyText`, { orderNumber: "{{orderNumber}}" }),
            footerText: t(`${POSTPONE_NS}.footerText`),
            menuLabel: t(`${POSTPONE_NS}.menuLabel`),
            sections: [
                {
                    title: t("businessMessages.generatedRows"),
                    rows,
                },
            ],
        };
    },

    order_discount_offer: (messageValues, businessConfig, ctx) => {
        const { t } = ctx;
        const value = Number(businessConfig.discountValue);
        const isPercentage = businessConfig.discountType !== "fixed";
        const inject = (str) => injectDiscountValue(str, value, isPercentage);
        const buttonTexts = [t(`${DISCOUNT_NS}.buttonAccept`), t(`${DISCOUNT_NS}.buttonDecline`)];
        return {
            ...messageValues,
            headerType: messageValues.headerType || "TEXT",
            headerText: inject(t(`${DISCOUNT_NS}.headerText`)),
            bodyText: inject(t(`${DISCOUNT_NS}.bodyText`, { discountValue: "{{discountValue}}", orderNumber: "{{orderNumber}}" })),
            footerText: inject(t(`${DISCOUNT_NS}.footerText`)),
            buttons: (messageValues.buttons || []).map((btn, i) => ({
                ...btn,
                text: inject(buttonTexts[i] || btn.text),
            })),
        };
    },

    order_payment_method: (messageValues, businessConfig, ctx) => {
        const { t } = ctx;
        const buttonTexts = [
            t(`${PAYMENT_NS}.buttonCod`),
            t(`${PAYMENT_NS}.buttonWallet`),
            t(`${PAYMENT_NS}.buttonCard`),
        ];
        return {
            ...messageValues,
            headerType: messageValues.headerType || "TEXT",
            headerText: t(`${PAYMENT_NS}.headerText`),
            bodyText: t(`${PAYMENT_NS}.bodyText`),
            footerText: t(`${PAYMENT_NS}.footerText`),
            buttons: (messageValues.buttons || []).map((btn, i) => ({
                ...btn,
                text: buttonTexts[i] || btn.text,
            })),
        };
    },
};
