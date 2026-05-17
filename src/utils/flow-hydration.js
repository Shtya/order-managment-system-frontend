import api from "@/utils/api";

/**
 * Hydrates a node's configuration with fresh data from the backend.
 * Detects breaking changes (deleted entities) and non-breaking updates (name changes).
 * 
 * @param {string} type - The node type (e.g., 'ORDER_CREATED', 'SEND_WHATSAPP_TEMPLATE')
 * @param {object} config - The current configuration stored in the node
 * @returns {Promise<{ isValid: boolean, error?: string, changes: string[], newConfig: object }>}
 */
export async function hydrateNodeConfig(type, config) {
    const result = {
        isValid: true,
        error: null,
        changes: [],
        newConfig: { ...config }
    };

    try {
        switch (type) {
            case 'order_created':
                const storeId = config.storeId;
                if (!storeId) break;

                try {
                    const res = await api.get(`/stores/${storeId}`);
                    const freshStore = res.data;

                    if (!freshStore || !freshStore?.isActive || !freshStore?.isIntegrated) throw new Error("Store not found");

                    if (config.store === freshStore.name) return;

                    result.changes.push(`تم تحديث اسم المتجر من "${config.store}" إلى "${freshStore.name}"`);
                    result.newConfig.storeId = freshStore.id;
                    result.newConfig.store = freshStore.name;
                } catch (e) {
                    result.isValid = false;
                    result.error = "المتجر المحدد غير موجود أو غير مفعل حالياً. يرجى اختيار مخزن آخر.";
                }
                break;

            case 'order_updated':
            case 'quick_order_status':
            case 'update_order_status': {
                const statusId = config.statusId || config.newStatusId;
                if (!statusId) break;

                try {
                    const res = await api.get(`/orders/statuses/${statusId}`);
                    const freshStatus = res.data;

                    if (!freshStatus || !freshStatus?.isActive) throw new Error("Status not found");

                    const currentLabel = config.status || config.newStatus;
                    if (freshStatus.name !== currentLabel) {
                        result.changes.push(`تم تحديث اسم الحالة من "${currentLabel}" إلى "${freshStatus.name}"`);

                        if (config.statusId) result.newConfig.status = freshStatus.name;
                        if (config.newStatusId) result.newConfig.newStatus = freshStatus.name;
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = "حالة الطلب المحددة لم تعد موجودة. يرجى اختيار حالة جديدة.";
                }
                break;
            }

            case 'send_whatsapp_template': {
                if (!config.templateId) break;

                try {
                    const res = await api.get(`/whatsapp-template/${config.templateId}`);
                    const freshTemplate = res.data;

                    if (!freshTemplate || freshTemplate?.status !== 'approved') throw new Error("Template not found");

                    // 1. Check template name
                    if (freshTemplate.name !== config.templateName) {
                        result.changes.push(`تم تحديث اسم القالب من "${config.templateName}" إلى "${freshTemplate.name}"`);
                        result.newConfig.templateName = freshTemplate.name;
                    }

                    // 2. Check buttons/branches (Breaking Change)
                    const freshButtons = freshTemplate.config?.buttons || [];
                    const currentBranches = config.branches || [];

                    if (freshButtons.length !== currentBranches.length) {
                        result.isValid = false;
                        result.error = "تغير عدد الأزرار في القالب. يرجى إعادة ضبط المسارات المتفرعة.";
                    } else {
                        // Check if button text changed (Non-breaking but good to know)
                        freshButtons.forEach((btn, idx) => {
                            if (btn.text !== currentBranches[idx]?.label) {
                                result.changes.push(`تم تحديث نص الزر من "${currentBranches[idx]?.label}" إلى "${btn.text}"`);
                                result.newConfig.branches[idx].label = btn.text;
                            }
                        });
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = "قالب واتساب المحدد لم يعد موجوداً أو غير مقبول . يرجى اختيار قالب آخر.";
                }
                break;
            }

            case 'order_check': {
                // Check if shipping companies or stores in the checks still exist
                if (!config.checks || config.checks.length === 0) break;

                const updatedChecks = [...config.checks];
                let hasErrors = false;

                for (let i = 0; i < updatedChecks.length; i++) {
                    const check = updatedChecks[i];
                    if (check.field === 'shippingCompany') {
                        // Validation logic for shipping companies could go here
                        // For now, we assume if it was there, it's valid or will be caught by general error handling
                    }
                }

                if (hasErrors) {
                    result.isValid = false;
                    result.error = "بعض القيم في شروط التحقق لم تعد صالحة.";
                }
                break;
            }

            default:
                break;
        }
    } catch (error) {
        console.error("Hydration error:", error);
        // Don't mark as invalid for network errors, just log it
    }

    return result;
}
