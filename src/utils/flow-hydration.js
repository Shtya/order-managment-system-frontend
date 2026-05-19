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
                    result.error = `المتجر المحدد (${config.store || config.storeId}) لم يعد موجوداً أو غير مفعل حالياً.`;
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
                    result.error = `حالة الطلب المحددة (${config.status || config.newStatus || statusId}) لم تعد موجودة.`;
                }
                break;
            }

            case 'send_whatsapp_template': {
                if (!config.templateId) break;

                try {
                    const res = await api.get(`/whatsapp-templates/${config.templateId}`);
                    const freshTemplate = res.data;


                    if (!freshTemplate || freshTemplate?.status !== 'approved') throw new Error("Template not found");

                    // 1. Check template name
                    if (freshTemplate.name !== config.templateName) {
                        result.changes.push(`تم تحديث اسم القالب من "${config.templateName}" إلى "${freshTemplate.name}"`);
                        result.newConfig.templateName = freshTemplate.name;
                    }

                    // 2. Check buttons/branches (Breaking Change)
                    const freshButtons = freshTemplate.templateConfig?.buttons?.filter(btn => btn.type === 'CUSTOM') || [];
                    const currentBranches = config.branches || [];


                    if (freshButtons.length !== currentBranches.length) {
                        result.isValid = false;
                        result.error = `تغير عدد الأزرار في القالب (${config.templateName}). يرجى إعادة ضبط المسارات المتفرعة.`;
                    } else {
                        freshButtons.forEach((btn, idx) => {
                            // لتفادي أي خطأ إذا تغير عدد الأزرار
                            const currentBranch = currentBranches[idx]?.sourceButton

                            if (!currentBranch) return;

                            // 1️⃣ التحقق من نوع الزر (تغيير كاسر - Breaking Change)
                            if (btn.type !== currentBranch.type) {
                                result.changes.push(`تم تغيير نوع الزر "${currentBranch.label || currentBranch.text}" إلى ${btn.type}`);
                                result.newConfig.branches[idx].type = btn.type;
                                currentBranch.type = btn.type;
                            }

                            // 2️⃣ التحقق من النص (تغيير مرئي - Visual Change)
                            if (btn.text !== currentBranch.text) {
                                result.changes.push(`تم تحديث نص الزر من "${currentBranch.text}" إلى "${btn.text}"`);
                                result.newConfig.branches[idx].text = btn.text;
                                currentBranch.text = btn.text;
                            }

                            // 3️⃣ التحقق من بيانات الرابط (إذا كان الزر من نوع رابط)
                            if (btn.type === 'VISIT_WEBSITE') {
                                if (btn.url !== currentBranch.url) {
                                    result.changes.push(`تم تحديث الرابط الخاص بالزر "${btn.text}"`);
                                    currentBranch.url = btn.url;
                                }
                                if (btn.urlType !== currentBranch.urlType) {
                                    currentBranch.urlType = btn.urlType;
                                }
                            }

                            // 4️⃣ التحقق من بيانات رقم الهاتف (إذا كان الزر من نوع اتصال)
                            if (btn.type === 'PHONE_NUMBER') {
                                if (btn.phoneNumber !== currentBranch.phoneNumber) {
                                    result.changes.push(`تم تحديث رقم الهاتف للزر "${btn.text}"`);
                                    currentBranch.phoneNumber = btn.phoneNumber;
                                    currentBranch.countryCode = btn.countryCode;
                                }
                            }
                        });
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = `قالب واتساب المحدد (${config.templateName || config.templateId}) لم يعد موجوداً أو غير مقبول.`;
                }
                break;
            }

            case 'order_check': {
                // Check if shipping companies or stores in the checks still exist
                if (!config.checks || config.checks.length === 0) break;

                const updatedChecks = [...config.checks];
                let hasErrors = false;
                let hasChanges = false;

                try {
                    // Fetch all required data for validation in parallel
                    const [statusesRes, integrationsRes] = await Promise.all([
                        // api.get("/lookups/stores", { params: { limit: 200, isActive: true } }),
                        api.get("/orders/statuses"),
                        api.get("/shipping/integrations/active")
                    ]);

                    // const stores = storesRes.data || [];
                    const statuses = Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.records || [];
                    const integrations = integrationsRes.data?.integrations || integrationsRes.data || [];

                    for (let i = 0; i < updatedChecks.length; i++) {
                        const check = updatedChecks[i];
                        let freshItem = null;
                        let fieldName = "";

                        if (check.field === 'shippingCompany') {
                            freshItem = integrations.find(c => String(c.providerId) === String(check.targetValue));
                            fieldName = "شركة الشحن";
                        }

                        if (check.field === 'status') {
                            freshItem = statuses.find(s => String(s.id) === String(check.targetValue));
                            fieldName = "حالة الطلب";
                        }

                        if (check.field === 'shippingCompany') {
                            if (!freshItem) {
                                hasErrors = true;

                                result.error = `شركة الشحن  (${check.targetLabel}) لم تعد موجودة أو غير مفعلة حالياً..`;
                                break;
                            }
                        }

                        if (check.field === 'status') {
                            if (!freshItem) {
                                hasErrors = true;
                                result.error = `حالة الطلب  (${check.targetLabel}) لم تعد موجودة..`;
                                break;
                            }
                        }
                        const isStatusCheck = check.field === 'status' || check.field === 'shippingCompany';
                        if (isStatusCheck && freshItem?.name !== check.targetLabel) {
                            hasChanges = true;
                            result.changes.push(`تم تحديث ${fieldName} من "${check.targetLabel}" إلى "${freshItem.name}"`);
                            updatedChecks[i] = { ...check, targetLabel: freshItem.name };
                        }
                    }

                    if (hasErrors) {
                        result.isValid = false;
                    } else if (hasChanges) {
                        result.newConfig.checks = updatedChecks;
                    }

                } catch (e) {
                    console.error("Order Check Hydration Error:", e);
                    result.isValid = false;
                    result.error = "فشل التحقق من صحة شروط الطلب. يرجى المحاولة مرة أخرى.";
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
