import api from "@/utils/api";

function aiProviderConnected(provider) {
    const integration = provider?.integration;
    return !!(
        provider?.isActive !== false &&
        integration &&
        (integration.encryptedCredentials || integration.credentials)
    );
}

function activeProviderModels(provider) {
    return (provider?.models || []).filter((model) => model.isActive !== false);
}

/**
 * Hydrates a node's configuration with fresh data from the backend.
 * Detects breaking changes (deleted entities) and non-breaking updates (name changes).
 * 
 * @param {string} type - The node type (e.g., 'ORDER_CREATED', 'SEND_WHATSAPP_TEMPLATE')
 * @param {object} config - The current configuration stored in the node
 * @param {boolean} isSuperAdmin 
 * @param {function} t - Translate function from next-intl
 * @returns {Promise<{ isValid: boolean, error?: string, changes: string[], newConfig: object }>}
 */
export async function hydrateNodeConfig(type, config, isSuperAdmin, t) {
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

                    result.changes.push(t("whatsApp.automations.builder.config.hydration.storeUpdated", { oldName: config.store, newName: freshStore.name }));
                    result.newConfig.storeId = freshStore.id;
                    result.newConfig.store = freshStore.name;
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.storeNotFound", { store: config.store || config.storeId });
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
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.statusUpdated", { oldName: currentLabel, newName: freshStatus.name }));

                        if (config.statusId) result.newConfig.status = freshStatus.name;
                        if (config.newStatusId) result.newConfig.newStatus = freshStatus.name;
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.statusNotFound", { status: config.status || config.newStatus || statusId });
                }
                break;
            }

            case 'shipment_created':
                const shippingCompanyId = config.shippingCompanyId;
                if (!shippingCompanyId) break;

                try {
                    const res = await api.get("/shipping/integrations/active");
                    const integrations = Array.isArray(res.data?.integrations) ? res.data.integrations : Array.isArray(res.data) ? res.data : [];
                    const freshCompany = integrations.find(c => String(c.providerId) === String(shippingCompanyId));

                    if (!freshCompany) throw new Error("Shipping company not found");

                    if (config.shippingCompany === freshCompany.name) break;

                    result.changes.push(t("whatsApp.automations.builder.config.hydration.shippingCompanyUpdated", { fieldName: t("whatsApp.automations.builder.config.hydration.fieldNames.shippingCompany"), oldName: config.shippingCompany, newName: freshCompany.name }));
                    result.newConfig.shippingCompanyId = freshCompany.providerId;
                    result.newConfig.shippingCompany = freshCompany.name;
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.shippingCompanyNotFound", { company: config.shippingCompany || shippingCompanyId });
                }
                break;

            case 'shipment_updated':
                // Shipment updated just uses a status enum string, no need to fetch anything
                break;

            case 'assign_order_to_employee': {
                if (!config.employeeId) break;

                try {
                    const res = await api.get(`/users/${config.employeeId}`);
                    const freshUser = res.data;

                    if (!freshUser || !freshUser.isActive) throw new Error("User not found or inActive");

                    // Check user details
                    if (freshUser.name !== config.employeeName) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.employeeNameUpdated", { oldName: config.employeeName, newName: freshUser.name }));
                        result.newConfig.employeeName = freshUser.name;
                    }

                    if (freshUser.email !== config.employeeEmail) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.employeeEmailUpdated", { oldEmail: config.employeeEmail, newEmail: freshUser.email }));
                        result.newConfig.employeeEmail = freshUser.email;
                    }

                    if (freshUser.avatarUrl !== config.employeeAvatarUrl) {
                        result.newConfig.employeeAvatarUrl = freshUser.avatarUrl;
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.employeeNotFound", { employee: config.employeeName || config.employeeId });
                }
                break;
            }

            case 'ai_address_correction': {
                if (!config.providerId || !config.modelId) break;

                try {
                    const [aiRes, shippingRes] = await Promise.all([
                        api.get("/ai/providers", { params: { scope: "all", isActive:"true" } }),
                        config.shippingCompanyId ? api.get("/shipping/integrations/active") : Promise.resolve({ data: { integrations: [] } }),
                    ]);

                    const providers = Array.isArray(aiRes.data) ? aiRes.data : aiRes.data?.records || [];
                    const freshProvider = config.providerCode
                        ? providers.find(p => String(p.code) === String(config.providerCode))
                        : providers.find(p => String(p.id) === String(config.providerId));

                    if (!freshProvider || !aiProviderConnected(freshProvider)) {
                        throw new Error("AI provider not connected");
                    }

                    if (String(freshProvider.id) !== String(config.providerId)) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.aiProviderUpdated", { oldName: config.providerName, newName: freshProvider.name }));
                        result.newConfig.providerId = freshProvider.id;
                        result.newConfig.providerName = freshProvider.name;
                    } else if (freshProvider.name !== config.providerName) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.aiProviderUpdated", { oldName: config.providerName, newName: freshProvider.name }));
                        result.newConfig.providerName = freshProvider.name;
                    }

                    const freshModel = activeProviderModels(freshProvider).find(m => String(m.id) === String(config.modelId));
                    if (!freshModel) {
                        result.isValid = false;
                        result.error = t("whatsApp.automations.builder.config.hydration.aiModelNotFound", { model: config.modelName || config.modelCode || config.modelId });
                        break;
                    }

                    const freshModelName = freshModel.displayName || freshModel.name || freshModel.modelCode;
                    if (freshModelName !== config.modelName) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.aiModelUpdated", { oldName: config.modelName, newName: freshModelName }));
                        result.newConfig.modelName = freshModelName;
                        result.newConfig.modelCode = freshModel.modelCode;
                    }

                    if (config.shippingCompanyId) {
                        const shippingIntegrations = Array.isArray(shippingRes.data?.integrations) ? shippingRes.data.integrations : Array.isArray(shippingRes.data) ? shippingRes.data : [];
                        const freshCompany = shippingIntegrations.find(c => String(c.providerId) === String(config.shippingCompanyId));

                        if (!freshCompany) {
                            result.isValid = false;
                            result.error = t("whatsApp.automations.builder.config.hydration.shippingCompanyNotFound", { company: config.shippingCompany || config.shippingCompanyId });
                            break;
                        }

                        if (freshCompany.name !== config.shippingCompany) {
                            result.changes.push(t("whatsApp.automations.builder.config.hydration.shippingCompanyUpdated", { fieldName: t("whatsApp.automations.builder.config.hydration.fieldNames.shippingCompany"), oldName: config.shippingCompany, newName: freshCompany.name }));
                            result.newConfig.shippingCompany = freshCompany.name;
                        }
                        if (freshCompany.provider !== config.provider) {
                            result.newConfig.provider = freshCompany.provider;
                        }
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.aiProviderNotFound", { provider: config.providerName || config.providerId });
                }
                break;
            }

            case 'assign_shipping_provider': {
                try {
                    const res = await api.get("/shipping/integrations/active");
                    const integrations = Array.isArray(res.data?.integrations) ? res.data.integrations : Array.isArray(res.data) ? res.data : [];

                        if (integrations.length === 0) {
                            result.isValid = false;
                            result.error = t("whatsApp.automations.builder.config.hydration.noActiveShippingCompanies");
                        }
                   
                    if (!config.shippingCompanyId) break;

                    const freshCompany = integrations.find(c => String(c.providerId) === String(config.shippingCompanyId));
                    if (!freshCompany) {
                        throw new Error("Shipping company not connected");
                    }

                    if (freshCompany.name !== config.shippingCompany) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.shippingCompanyUpdated", { fieldName: t("whatsApp.automations.builder.config.hydration.fieldNames.shippingCompany"), oldName: config.shippingCompany, newName: freshCompany.name }));
                        result.newConfig.shippingCompany = freshCompany.name;
                    }
                    if (freshCompany.provider !== config.provider) {
                        result.newConfig.provider = freshCompany.provider;
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.shippingCompanyNotFound", { company: config.shippingCompany || config.shippingCompanyId });
                }
                break;
            }

            case 'send_whatsapp_template': {
                if (!config.templateId) break;

                try {
                    const res = await api.get(`/whatsapp-templates/${config.templateId}`);
                    const freshTemplate = res.data;


                    if (!freshTemplate || (!isSuperAdmin && freshTemplate?.status !== 'approved')) throw new Error("Template not found");

                    // 1. Check template name
                    if (freshTemplate.name !== config.templateName) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.templateNameUpdated", { oldName: config.templateName, newName: freshTemplate.name }));
                        result.newConfig.templateName = freshTemplate.name;
                    }

                    // 2. Check buttons/branches (Breaking Change)
                    const freshButtons = freshTemplate.templateConfig?.buttons?.filter(btn => btn.type === 'CUSTOM') || [];
                    const currentBranches = (config.branches || []).filter(b => !b.isNoResponse);

                    if (freshButtons.length !== currentBranches.length) {
                        result.isValid = false;
                        result.error = t("whatsApp.automations.builder.config.hydration.templateButtonsChanged", { template: config.templateName });
                    } else {
                        freshButtons.forEach((btn, idx) => {
                            // لتفادي أي خطأ إذا تغير عدد الأزرار
                            const currentBranch = currentBranches[idx]?.sourceButton

                            if (!currentBranch) return;

                            // 1️⃣ التحقق من نوع الزر (تغيير كاسر - Breaking Change)
                            if (btn.type !== currentBranch.type) {
                                result.changes.push(t("whatsApp.automations.builder.config.hydration.templateButtonTypeChanged", { label: currentBranch.label || currentBranch.text, type: btn.type }));
                                result.newConfig.branches[idx].type = btn.type;
                                currentBranch.type = btn.type;
                            }

                            // 2️⃣ التحقق من النص (تغيير مرئي - Visual Change)
                            if (btn.text !== currentBranch.text) {
                                result.changes.push(t("whatsApp.automations.builder.config.hydration.templateButtonTextChanged", { oldText: currentBranch.text, newText: btn.text }));
                                result.newConfig.branches[idx].text = btn.text;
                                currentBranch.text = btn.text;
                            }

                            // 3️⃣ التحقق من بيانات الرابط (إذا كان الزر من نوع رابط)
                            if (btn.type === 'VISIT_WEBSITE') {
                                if (btn.url !== currentBranch.url) {
                                    result.changes.push(t("whatsApp.automations.builder.config.hydration.templateButtonUrlUpdated", { text: btn.text }));
                                    currentBranch.url = btn.url;
                                }
                                if (btn.urlType !== currentBranch.urlType) {
                                    currentBranch.urlType = btn.urlType;
                                }
                            }

                            // 4️⃣ التحقق من بيانات رقم الهاتف (إذا كان الزر من نوع اتصال)
                            if (btn.type === 'PHONE_NUMBER') {
                                if (btn.phoneNumber !== currentBranch.phoneNumber) {
                                    result.changes.push(t("whatsApp.automations.builder.config.hydration.templateButtonPhoneUpdated", { text: btn.text }));
                                    currentBranch.phoneNumber = btn.phoneNumber;
                                    currentBranch.countryCode = btn.countryCode;
                                }
                            }
                        });
                    }
                } catch (e) {
                    result.isValid = false;

                    result.error = t("whatsApp.automations.builder.config.hydration.templateNotFound", { template: config.templateName || config.templateId });
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
                            fieldName = t("whatsApp.automations.builder.config.hydration.fieldNames.shippingCompany");
                        }

                        if (check.field === 'status') {
                            freshItem = statuses.find(s => String(s.id) === String(check.targetValue));
                            fieldName = t("whatsApp.automations.builder.config.hydration.fieldNames.status");
                        }

                        if (check.field === 'shippingCompany') {
                            if (!freshItem) {
                                hasErrors = true;

                                result.error = t("whatsApp.automations.builder.config.hydration.shippingCompanyNotFound", { company: check.targetLabel });
                                break;
                            }
                        }

                        if (check.field === 'status') {
                            if (!freshItem) {
                                hasErrors = true;
                                result.error = t("whatsApp.automations.builder.config.hydration.orderStatusCheckNotFound", { status: check.targetLabel });
                                break;
                            }
                        }
                        const isStatusCheck = check.field === 'status' || check.field === 'shippingCompany';
                        if (isStatusCheck && freshItem?.name !== check.targetLabel) {
                            hasChanges = true;
                            if (check.field === 'shippingCompany') {
                                result.changes.push(t("whatsApp.automations.builder.config.hydration.shippingCompanyUpdated", { fieldName, oldName: check.targetLabel, newName: freshItem.name }));
                            } else if (check.field === 'status') {
                                result.changes.push(t("whatsApp.automations.builder.config.hydration.orderStatusCheckUpdated", { fieldName, oldName: check.targetLabel, newName: freshItem.name }));
                            }
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
                    result.error = t("whatsApp.automations.builder.config.hydration.generalError");
                }
                break;
            }

            case 'create_issue': {
                const causeId = config.causeId;
                const statusId = config.statusId;
                const roleId = config.assignedRoleId;
                if (!causeId && !statusId && !roleId) break;

                try {
                    const [causesRes, statusesRes, rolesRes] = await Promise.all([
                        api.get("/issues/causes"),
                        api.get("/issues/statuses"),
                        api.get("/roles"),
                    ]);

                    const causes = Array.isArray(causesRes.data) ? causesRes.data : causesRes.data.records || [];
                    const statuses = Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.records || [];
                    const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.records || [];

                    let hasErrors = false;
                    let hasChanges = false;

                    if (causeId) {
                        const freshCause = causes.find(c => String(c.id) === String(causeId));
                        if (!freshCause) {
                            hasErrors = true;
                            result.error = t("whatsApp.automations.builder.config.hydration.createIssueCauseNotFound", { cause: config.cause?.nameAr || config.cause?.nameEn || causeId });
                        } else if (config.cause && (config.cause.nameAr !== freshCause.nameAr || config.cause.nameEn !== freshCause.nameEn)) {
                            hasChanges = true;
                            result.changes.push(t("whatsApp.automations.builder.config.hydration.createIssueCauseUpdated", { oldName: config.cause.nameAr || config.cause.nameEn, newName: freshCause.nameAr || freshCause.nameEn }));
                            result.newConfig.cause = freshCause;
                        }
                    }

                    if (statusId && !hasErrors) {
                        const freshStatus = statuses.find(s => String(s.id) === String(statusId));
                        if (!freshStatus) {
                            hasErrors = true;
                            result.error = t("whatsApp.automations.builder.config.hydration.createIssueStatusNotFound", { status: statusId });
                        }
                    }

                    if (roleId && !hasErrors) {
                        const freshRole = roles.find(r => String(r.id) === String(roleId));
                        if (!freshRole) {
                            hasErrors = true;
                            result.error = t("whatsApp.automations.builder.config.hydration.createIssueRoleNotFound", { role: roleId });
                        }
                    }

                    if (hasErrors) {
                        result.isValid = false;
                    }
                } catch (e) {
                    console.error("Create Issue Hydration Error:", e);
                }
                break;
            }

            case 'send_whatsapp_message': {
                if (!config.accountId) break;

                try {
                    const res = await api.get("/whatsapp-accounts", { params: { limit: 200, page: 1, isActive: "true" } });
                    const accounts = Array.isArray(res.data?.records) ? res.data.records : [];
                    const freshAccount = accounts.find(acc => String(acc.id) === String(config.accountId));

                    if (!freshAccount || !freshAccount?.isActive) throw new Error("WhatsApp account not found");

                    if (config.accountName && config.accountName !== freshAccount.name) {
                        result.changes.push(t("whatsApp.automations.builder.config.hydration.whatsappAccountUpdated", { oldName: config.accountName, newName: freshAccount.name }));
                        result.newConfig.accountName = freshAccount.name;
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = t("whatsApp.automations.builder.config.hydration.whatsappAccountNotFound", { account: config.accountName || config.accountId });
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
