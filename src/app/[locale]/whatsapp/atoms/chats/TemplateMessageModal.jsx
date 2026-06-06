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
import LocationFields from "./LocationFields";
import MapLocationPicker from "@/components/atoms/MapLocationPicker";
import { MapPin } from "lucide-react";

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
                    type: 'Dynamic',
                    value: '',
                    label: btn.text || '',
                    example: btn.url || ''
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
            buttonVariables,
            locationData: config.headerType === 'LOCATION' ? {
                latitude: 30.0444,
                longitude: 31.2357,
                name: '',
                address: ''
            } : null
        });
        setIsTemplateDialogOpen(false);
    };

    const handleLocationSelect = async (newLat, newLng) => {
        setTemplateMessage(prev => ({
            ...prev,
            locationData: {
                ...prev.locationData,
                latitude: newLat,
                longitude: newLng
            }
        }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&accept-language=ar`);
            const data = await res.json();
            setTemplateMessage(prev => ({
                ...prev,
                locationData: {
                    ...prev.locationData,
                    address: data.display_name,
                    name: data.name || data.display_name.split(',')[0]
                }
            }));
        } catch (error) {
            console.error("Geocoding error:", error);
        }
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

        let locationFilled = true;
        if (templateMessage.templateData?.headerType === 'LOCATION') {
            const loc = templateMessage.locationData;
            locationFilled = !!(loc?.name?.trim() && loc?.address?.trim() && loc?.latitude && loc?.longitude);
        }

        return hFilled && bFilled && btnFilled && locationFilled;
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
                    ...(templateMessage.templateData?.headerType === 'LOCATION' ? [{
                        type: "header",
                        parameters: [{
                            type: "location",
                            location: {
                                latitude: templateMessage.locationData.latitude.toString(),
                                longitude: templateMessage.locationData.longitude.toString(),
                                name: templateMessage.locationData.name,
                                address: templateMessage.locationData.address
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
                    ...buttonVarsIndices.map(idx => ({
                        type: "button",
                        sub_type: "url",
                        index: Number(idx),
                        parameters: [{
                            type: "text",
                            text: templateMessage.buttonVariables[idx].value
                        }]
                    }))
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
        
        const placeholder = varData.example
            ? isButtonType ? varData.example : t("enterValueFor", { example: varData.example })
            : t("enterValue");

        return (
            <div key={`${type}-${num}`} className="flex gap-3 items-start group">
                <div className="w-[60px] h-10 text-center rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-black text-muted-foreground/60 shrink-0 shadow-sm">
                    {isButtonType ? <LinkIcon size={14} /> : `{{${num}}}`}
                </div>
                <div className="flex-1">
                    <Input
                        placeholder={placeholder}
                        value={varData.value || ""}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (isButtonType) {
                                val = val.replace(/\s/g, '_');
                            }
                            handleVariableChange(type, num, { value: val });
                        }}
                        className="h-10 rounded-xl bg-card border-border px-4 text-sm text-foreground"
                    />
                    {isButtonType && (
                        <div className="space-y-1 mt-1 px-1">
                            <p className="text-[10px] text-muted-foreground/60 font-medium">{`${badgeLabel} - ${varData.example}`}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
            <DialogContent className="sm:max-w-[900px] w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-muted/30">
                <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <MessageSquareQuote size={20} />
                        </div>
                        {t("templateMessage")}
                    </DialogTitle>
                    <DialogDescription className="ps-[52px] -mt-2 text-muted-foreground/60">
                        {t("templateDescription") || "Choose a template and fill in variables to send."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Section */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-card">
                        {!templateMessage.templateId ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground/40 mb-6">
                                    <LayoutDashboard size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">
                                    {t("noTemplateSelected") || "No Template Selected"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-[300px] mb-8">
                                    {t("selectTemplateToStart") || "Select a pre-approved WhatsApp template to send to this customer."}
                                </p>
                                <Button_
                                    onClick={() => setIsTemplateDialogOpen(true)}
                                    label={t("chooseTemplate") || "Choose Template"}
                                    className="bg-primary text-primary-foreground px-8"
                                />
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Selected Template Header */}
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Check size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-foreground">{templateMessage.templateName}</h4>
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
                                {(headerVars.length > 0 || bodyVars.length > 0 || buttonVarsIndices.length > 0 || templateMessage.templateData?.headerType === 'LOCATION') && (
                                    <div className="space-y-6 p-6 rounded-3xl bg-muted/30 border border-border">
                                        <div>
                                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">{t("fillVariables") || "Fill Variables"}</h4>
                                            <p className="text-[10px] text-muted-foreground/60 font-bold">{t("enterValuesManual") || "Enter the values for the template variables below."}</p>
                                        </div>

                                        {templateMessage.templateData?.headerType === 'LOCATION' && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                                                    <MapPin size={12} /> {t("locationHeader") || "Location Header"}
                                                </p>
                                                <div className="flex flex-col gap-6">
                                                    <div className="w-full  aspect-video rounded-2xl overflow-hidden border border-border relative bg-muted">
                                                        <MapLocationPicker
                                                            initialLocation={{
                                                                lat: templateMessage.locationData?.latitude || 30.0444,
                                                                lng: templateMessage.locationData?.longitude || 31.2357
                                                            }}
                                                            onLocationSelect={handleLocationSelect}
                                                            height="100%"
                                                            width="100%"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <LocationFields
                                                            values={templateMessage.locationData || {}}
                                                            onChange={(updates) => setTemplateMessage(prev => ({
                                                                ...prev,
                                                                locationData: { ...prev.locationData, ...updates }
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {headerVars.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                                                    <Layout size={12} /> {t("header")}
                                                </p>
                                                {headerVars.map(num => renderVariableInput('header', num))}
                                            </div>
                                        )}

                                        {bodyVars.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare size={12} /> {t("body")}
                                                </p>
                                                {bodyVars.map(num => renderVariableInput('body', num))}
                                            </div>
                                        )}

                                        {buttonVarsIndices.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
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
                    <div className="w-[300px] bg-muted/30 flex flex-col items-center justify-center p-6 shrink-0 overflow-y-auto border-s border-border">
                        <div className="sticky top-0 w-full flex flex-col items-center">
                            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mb-6">
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
                                <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                                    <p className="text-xs font-bold text-muted-foreground/40">{t("noPreviewAvailable") || "No Preview"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-card shrink-0 gap-2">
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
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
