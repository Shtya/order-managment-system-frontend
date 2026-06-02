"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";
import {
    MessageSquareQuote,
    Layout,
    Check,
    RefreshCw,
    Trash2,
    LayoutDashboard,
    ExternalLink,
    Type,
    Link as LinkIcon,
    MessageSquare
} from "lucide-react";
import { useConversation } from "./ConversationContext";
import Button_ from "@/components/atoms/Button";
import TemplatePreview from "../TemplatePreview";
import { Input } from "@/components/ui/input";
import { extractVariableNames } from "@/utils/whatsapp-healper";
import { cn } from "@/utils/cn";
import { InternalTemplateDialog } from "../InternalTemplateDialog";
import { avatarSrc } from "@/components/atoms/UserSelect";

export default function TemplateMessageModal() {
    const t = useTranslations("chats");
    const locale = useLocale();
    const {
        selectedAccount,
        showTemplateModal,
        setShowTemplateModal,
        templateMessage,
        setTemplateMessage,
        handleSendMessage,
        selectedConversation
    } = useConversation();

    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    const extractVariables = useCallback((text) => {
        if (!text) return [];
        const matches = extractVariableNames(text, 'number');
        return [...new Set(matches)].sort((a, b) => Number(a) - Number(b));
    }, []);

    const handleSelectTemplate = (template) => {
        const config = template.templateConfig || {};
        const headerVars = extractVariables(config.headerText);
        const bodyVars = extractVariables(config.bodyText);

        const headerVariables = {};
        headerVars.forEach(num => {
            headerVariables[num] = { type: 'direct', value: '', example: config.headerVariables?.[num] || '' };
        });

        const bodyVariables = {};
        bodyVars.forEach(num => {
            bodyVariables[num] = { type: 'direct', value: '', example: config.bodyVariables?.[num] || '' };
        });

        const buttonVariables = {};
        config.buttons?.forEach((btn, idx) => {
            if (btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic') {
                buttonVariables[String(idx)] = {
                    type: 'direct',
                    value: '',
                    label: btn.text || '',
                    example: btn.urlExample || ''
                };
            }
        });

        setTemplateMessage({
            templateId: template.id,
            accountId: template.accountId,
            language: template?.language,
            templateName: template.name,
            templateData: config,
            category: template.category,
            subCategory: template.subCategory,
            headerVariables,
            bodyVariables,
            buttonVariables
        });
        setIsTemplateDialogOpen(false);
    };

    const handleVariableChange = (type, num, updates) => {
        const key = type === 'header' ? 'headerVariables' : type === 'body' ? 'bodyVariables' : 'buttonVariables';
        setTemplateMessage(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [num]: { ...prev[key][num], ...updates }
            }
        }));
    };

    const headerVars = useMemo(() => {
        return extractVariables(templateMessage.templateData?.headerText);
    }, [templateMessage.templateData?.headerText, extractVariables]);

    const bodyVars = useMemo(() => {
        return extractVariables(templateMessage.templateData?.bodyText);
    }, [templateMessage.templateData?.bodyText, extractVariables]);

    const buttonVarsIndices = useMemo(() => {
        const buttons = templateMessage.templateData?.buttons || [];
        return buttons
            .map((btn, idx) => (btn.type === 'VISIT_WEBSITE' && btn.urlType === 'Dynamic' ? String(idx) : null))
            .filter(Boolean);
    }, [templateMessage.templateData?.buttons]);

    const isAllFilled = useMemo(() => {
        if (!templateMessage.templateId) return false;

        const hFilled = headerVars.every(num => templateMessage.headerVariables[num]?.value?.trim());
        const bFilled = bodyVars.every(num => templateMessage.bodyVariables[num]?.value?.trim());
        const btnFilled = buttonVarsIndices.every(idx => templateMessage.buttonVariables[idx]?.value?.trim());

        return hFilled && bFilled && btnFilled;
    }, [templateMessage, headerVars, bodyVars, buttonVarsIndices]);

    const handleSend = () => {
        const lang = templateMessage.language;

        handleSendMessage({
            accountId: templateMessage.accountId,
            type: "template",
            template: {
                name: templateMessage.templateName,
                language: { code: lang },
                components: [
                    ...(headerVars.length > 0 ? [{
                        type: "header",
                        parameters: headerVars.map(num => ({
                            type: "text",
                            text: templateMessage.headerVariables[num].value
                        }))
                    }] : []),
                    ...(templateMessage.templateData?.headerType === 'IMAGE' || templateMessage.templateData?.headerType === 'VIDEO' || templateMessage.templateData?.headerType === 'DOCUMENT' ? [{
                        type: "header",
                        parameters: [{
                            type: templateMessage.templateData.headerType.toLowerCase(),
                            [templateMessage.templateData.headerType.toLowerCase()]: {
                                link: avatarSrc(templateMessage.templateData.headerUrl)
                            }
                        }]
                    }] : []),
                    {
                        type: "body",
                        parameters: bodyVars.map(num => ({
                            type: "text",
                            text: templateMessage.bodyVariables[num].value
                        }))
                    },
                    ...(buttonVarsIndices.length > 0 ? [{
                        type: "button",
                        sub_type: "url",
                        index: 0, // WhatsApp usually expects 0 for the first dynamic URL button
                        parameters: buttonVarsIndices.map(idx => ({
                            type: "text",
                            text: templateMessage.buttonVariables[idx].value
                        }))
                    }] : [])
                ]
            }

        },
            {
                template: {
                    templateConfig: templateMessage.templateData,
                    language: templateMessage.language,
                    category: templateMessage.category,
                    subCategory: templateMessage.subCategory
                },
            });

        setShowTemplateModal(false);
        setTemplateMessage({
            templateId: null,
            accountId: null,
            templateName: "",
            templateData: null,
            headerVariables: {},
            bodyVariables: {},
            buttonVariables: {}
        });
    };

    const renderVariableInput = (type, num, buttonLabel) => {
        const varData = (
            type === 'header' ? templateMessage.headerVariables :
                type === 'body' ? templateMessage.bodyVariables :
                    templateMessage.buttonVariables
        )[num] || {};

        const badgeLabel = type === 'header' ? t("header") : type === 'body' ? t("body") : buttonLabel || `${t("button")} ${num}`;
        const isButtonType = type === 'button';

        return (
            <div key={`${type}-${num}`} className="flex gap-3 items-start group">
                <div className="w-[60px] h-10 text-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 shrink-0 shadow-sm">
                    {isButtonType ? <LinkIcon size={14} /> : `{{${num}}}`}
                </div>
                <div className="flex-1">
                    <Input
                        placeholder={varData.example ? (isButtonType ? varData.example : `${t("example")}: ${varData.example}`) : t("enterValue")}
                        value={varData.value || ""}
                        onChange={(e) => handleVariableChange(type, num, { value: e.target.value })}
                        className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-4 text-sm"
                    />
                    {isButtonType && <p className="text-[10px] text-slate-400 mt-1 px-1 font-medium">{badgeLabel}</p>}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-slate-900 shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <MessageSquareQuote size={20} />
                        </div>
                        {t("templateMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2">
                        {t("templateDescription") || "Choose a template and fill in variables to send."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Section */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900">
                        {!templateMessage.templateId ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
                                    <LayoutDashboard size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                                    {t("noTemplateSelected") || "No Template Selected"}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-[300px] mb-8">
                                    {t("selectTemplateToStart") || "Select a pre-approved WhatsApp template to send to this customer."}
                                </p>
                                <Button_
                                    onClick={() => setIsTemplateDialogOpen(true)}
                                    label={t("chooseTemplate") || "Choose Template"}
                                    className="bg-primary text-white px-8"
                                />
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Selected Template Header */}
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Check size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{templateMessage.templateName}</h4>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{t("templateSelected") || "Template Selected"}</p>
                                        </div>
                                    </div>
                                    <Button_
                                        variant="outline"
                                        onClick={() => setIsTemplateDialogOpen(true)}
                                        className="h-10 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs gap-2"
                                        label={t("changeTemplate") || "Change Template"}
                                    />
                                </div>

                                {/* Variables Filling Section */}
                                {(headerVars.length > 0 || bodyVars.length > 0 || buttonVarsIndices.length > 0) && (
                                    <div className="space-y-6 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">{t("fillVariables") || "Fill Variables"}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">{t("enterValuesManual") || "Enter the values for the template variables below."}</p>
                                        </div>

                                        {headerVars.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Layout size={12} /> {t("header")}
                                                </p>
                                                {headerVars.map(num => renderVariableInput('header', num))}
                                            </div>
                                        )}

                                        {bodyVars.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare size={12} /> {t("body")}
                                                </p>
                                                {bodyVars.map(num => renderVariableInput('body', num))}
                                            </div>
                                        )}

                                        {buttonVarsIndices.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <LinkIcon size={12} /> {t("dynamicButtons") || "Dynamic Buttons"}
                                                </p>
                                                {buttonVarsIndices.map(idx => renderVariableInput('button', idx, templateMessage.buttonVariables[idx]?.label))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Preview Section */}
                    <div className="w-[300px] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 shrink-0 overflow-y-auto border-s">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                                {t("preview")}
                            </p>
                            {templateMessage.templateData ? (
                                <div className="scale-90 origin-top transform-gpu w-full">
                                    <TemplatePreview
                                        template={{
                                            ...templateMessage.templateData,
                                            preview: {
                                                ...templateMessage.templateData,
                                                examples: {
                                                    ...Object.keys(templateMessage.headerVariables).reduce((acc, k) => ({ ...acc, [k]: templateMessage.headerVariables[k].value }), {}),
                                                    ...Object.keys(templateMessage.bodyVariables).reduce((acc, k) => ({ ...acc, [k]: templateMessage.bodyVariables[k].value }), {}),
                                                }
                                            }
                                        }}
                                        flat
                                        forceShowExamples={true}
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                    <p className="text-xs font-bold text-slate-400">{t("noPreviewAvailable") || "No Preview"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white dark:bg-slate-900 shrink-0 gap-2">
                    <Button_
                        type="button"
                        variant="outline"
                        onClick={() => setShowTemplateModal(false)}
                        label={t("cancel")}
                    />
                    <Button_
                        type="button"
                        disabled={!templateMessage.templateId || !isAllFilled}
                        onClick={handleSend}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        label={t("sendMessage")}
                    />
                </DialogFooter>
            </DialogContent>

            <InternalTemplateDialog
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
                onSelectTemplate={handleSelectTemplate}
                defaultAccountId={selectedAccount?.id}
            />
        </Dialog>
    );
}
