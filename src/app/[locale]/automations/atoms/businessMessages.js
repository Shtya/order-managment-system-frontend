import { CalendarDays, BadgePercent, Wallet, Ban } from "lucide-react";
import { DEFAULT_DATE_FORMATS } from "@/components/ui/dateConfig";

// Registry only (no React logic). Adding a future business message =
// adding one entry here. Each entry drives the grid card, the two-step
// form, the saved config and the business command.
//
// - disabledFields: blacklist. Only these fields are disabled in the
//   underlying message form. Everything NOT listed stays ENABLED.
// - messageValues: init payload given to the message form as initial
//   values for some of its fields.
// - messageData (saved): the full WhatsApp payload, built from the editable
//   message form values + generated/locked structure, same as custom messages.
export const businessMessageDefinitions = {
    order_postpone_date: {
        id: 'order_postpone_date',
        labelKey: 'businessMessages.orderPostponeDate',
        descriptionKey: 'businessMessages.descriptions.orderPostponeDate',
        icon: CalendarDays,
        color: 'text-indigo-500',
        messageType: 'list',
        // rows are generated from businessConfig; lock the row title (it is a
        // global.date variable) and block add/remove/reorder, but keep row
        // description and section title editable.
        disabledFields: ['editRowValue', 'removeRow', 'addRow', 'addSection', 'removeSection', 'reorder'],
        messageValues: {
            headerType: 'TEXT',
            // headerText: 'Postpone your order date',
            // bodyText: 'Please choose a new delivery date for your order {{orderId}}.',
            // footerText: '',
            menuLabel: 'Choose a date',
        },
        // placeholder rows used ONLY for form preview/validation (locked, not saved)
        previewRows: [
            { id: '__date_1__', title: '6 August', description: 'First available slot' },
            { id: '__date_2__', title: '7 August', description: '' },
        ],
        businessConfigFields: [
            { key: 'daysCount', type: 'number', labelKey: 'businessConfig.daysCount', defaultValue: 10, min: 1, max: 10 },
            { key: 'dateFormat', type: 'select', options: DEFAULT_DATE_FORMATS, labelKey: 'businessConfig.dateFormat', defaultValue: DEFAULT_DATE_FORMATS[0], dateFormat: true },
            { key: 'excludeWeekends', type: 'boolean', labelKey: 'businessConfig.excludeWeekends', defaultValue: false },
        ],
        businessCommand: 'order.set_postponed_date',
    },

    order_discount_offer: {
        id: 'order_discount_offer',
        labelKey: 'businessMessages.offerDiscount',
        descriptionKey: 'businessMessages.descriptions.offerDiscount',
        icon: BadgePercent,
        color: 'text-rose-500',
        messageType: 'interactive',
        // fixed button count + fixed actions -> only button texts are editable
        disabledFields: ['addButton', 'removeButton'],
        messageValues: {
            headerType: 'TEXT',
            headerText: 'Special Discount for You',
            bodyText: 'Get {{discountValue}}% off your order!',
            footerText: 'Offer valid today only.',
            buttons: [{ text: 'Accept Offer' }, { text: 'Not now' }],
        },
        businessConfigFields: [
            { key: 'discountValue', type: 'number', labelKey: 'businessConfig.discountValue', defaultValue: 10, min: 1, max: 100 },
            { key: 'discountType', type: 'select', options: ['percentage', 'fixed'], labelKey: 'businessConfig.discountType', defaultValue: 'percentage' },
        ],
        businessCommand: 'order.apply_discount',
    },

    order_payment_method: {
        id: 'order_payment_method',
        labelKey: 'businessMessages.paymentMethod',
        descriptionKey: 'businessMessages.descriptions.paymentMethod',
        icon: Wallet,
        color: 'text-emerald-500',
        messageType: 'interactive',
        // fixed 3 buttons; text/add/remove all disabled, texts come from
        // localization via the builder.
        disabledFields: ['buttons', 'addButton', 'removeButton'],
        messageValues: {
            headerType: 'TEXT',
            bodyText: 'How would you like to pay for your order?',
            buttons: [{ text: 'Cash on delivery' }, { text: 'E-Wallet' }, { text: 'Credit Card' }],
        },
        businessConfigFields: [],
        businessCommand: 'order.set_payment_method',
    },

    order_cancel_cause: {
        id: 'order_cancel_cause',
        labelKey: 'businessMessages.orderCancelCause',
        descriptionKey: 'businessMessages.descriptions.orderCancelCause',
        icon: Ban,
        color: 'text-orange-500',
        messageType: 'list',
        // rows are generated from selected cancel causes; lock option titles
        // and list structure, keep row descriptions + header/body editable.
        disabledFields: ['editRowValue', 'removeRow', 'addRow', 'addSection', 'removeSection', 'reorder'],
        messageValues: {
            headerType: 'TEXT',
            menuLabel: 'Choose a reason',
        },
        previewRows: [
            { id: '__cancel_cause_preview_1__', title: 'Too expensive', description: '' },
            { id: '__cancel_cause_preview_2__', title: 'Changed mind', description: '' },
        ],
        businessConfigFields: [
            {
                key: 'cancelCauses',
                type: 'cancelCauses',
                labelKey: 'businessConfig.cancelCauses',
                defaultValue: [],
                min: 1,
                max: 10,
            },
        ],
        businessCommand: 'order.set_cancel_cause',
    },
};

export const businessMessageTypes = Object.values(businessMessageDefinitions).map((def) => ({
    id: def.id,
    businessUseCase: def.id,
    messageType: def.messageType,
    icon: def.icon,
    labelKey: def.labelKey,
    descriptionKey: def.descriptionKey,
    color: def.color,
}));
