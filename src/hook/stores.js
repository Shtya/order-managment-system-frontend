

import api, { BASE_URL } from '@/utils/api';
import { normalizeAxiosError } from '@/utils/axios';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getUser } from './getUser';
import { tenantId } from '@/utils/healpers';

export const STORE_PROVIDERS = [
    {
        key: 'easyorder',
        code: 'easyorder',
        label: { ar: 'إيزي أوردر', en: 'EasyOrder' },
        img: "/integrate/easyorder.png",
        emoji: '🛒',
        desc: { ar: 'ربط مباشر مع منصة إيزي أوردر', en: 'Direct integration with EasyOrder platform' },
    },
    {
        key: 'shopify',
        code: 'shopify',
        label: { ar: 'Shopify', en: 'Shopify' },
        img: "/integrate/shopify.png",
        emoji: '🟢',
        desc: { ar: 'ربط متجر Shopify الخاص بك', en: 'Connect your Shopify store' },
    },
    {
        key: 'woocommerce',
        code: 'woocommerce',
        label: { ar: 'WooCommerce', en: 'WooCommerce' },
        img: "/integrate/WooCommerce.png",
        emoji: '🛍️',
        desc: { ar: 'ربط متجر WooCommerce', en: 'Connect your WooCommerce store' },
    },
];


export const PROVIDER_CONFIG = {
    easyorder: {
        label: "EasyOrder",
        logo: "/integrate/easyorder.png",
        website: "easy-orders.net",
        description: "ربط متجرك مع منصة EasyOrder واستفد من إدارة الطلبات والمزامنة التلقائية بسهولة.",
        bg: "bg-[linear-gradient(300.09deg,#FAFAFA_74.95%,#F3F0FF_129.29%)]",
        accent: "#c8832a",
        accentBg: "#f5e6cc",
        strip: "linear-gradient(90deg,#c8832a,#e8a84a)",
        docsLink: "https://public-api-docs.easy-orders.net/docs/intro",
        guide: {
            showSteps: true,
            tabs: [
                {
                    key: "api",
                    label: { en: "Get API Key", ar: "الحصول على مفتاح API" },
                    steps: [
                        {
                            title: {
                                en: "Login to EasyOrder",
                                ar: "تسجيل الدخول إلى EasyOrder"
                            },
                            desc: {
                                en: "Login to your EasyOrder dashboard using your account credentials.",
                                ar: "قم بتسجيل الدخول إلى لوحة تحكم EasyOrder باستخدام بيانات حسابك."
                            },
                            url: "https://app.easy-orders.net",
                            image: "/guide/easyorder/step1.png",
                        },
                        {
                            title: { en: "Open Settings → Public API", ar: "افتح الإعدادات ← Public API" },
                            desc: {
                                en: "Click the Settings button, then choose Public API from the menu.",
                                ar: "اضغط على زر الإعدادات ثم اختر Public API من القائمة."
                            },
                            image: "/guide/easyorder/step2.png",
                        },
                        {
                            title: { en: "Create New API Key", ar: "إنشاء مفتاح API جديد" },
                            desc: {
                                en: "Click the Create button to generate a new API key.",
                                ar: "اضغط على زر Create لإنشاء مفتاح API جديد."
                            },
                            image: "/guide/easyorder/step3.png",
                        },
                        {
                            title: { en: "Enable & Set Permissions", ar: "تفعيل وتحديد الصلاحيات" },
                            desc: {
                                en: "Enable the API key and check all required permissions, then click Save.",
                                ar: "قم بتفعيل المفتاح وحدد جميع الصلاحيات ثم اضغط حفظ."
                            },
                            image: "/guide/easyorder/step4.png",
                        },
                        {
                            title: { en: "Copy API Key", ar: "نسخ مفتاح API" },
                            desc: {
                                en: "Click the Copy button to copy the API key and paste it into our store configuration form.",
                                ar: "اضغط على زر النسخ ثم قم بلصق المفتاح داخل نموذج إعدادات المتجر لدينا."
                            },
                            image: "/guide/easyorder/step5.png",
                        }
                    ]
                },
                {
                    key: "webhooks",
                    label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
                    steps: [
                        {
                            title: {
                                en: "Login to EasyOrder",
                                ar: "تسجيل الدخول إلى EasyOrder"
                            },
                            desc: {
                                en: "Login to your EasyOrder dashboard using your account credentials.",
                                ar: "قم بتسجيل الدخول إلى لوحة تحكم EasyOrder باستخدام بيانات حسابك."
                            },
                            url: "https://app.easy-orders.net",
                            image: "/guide/easyorder/step1.png",
                        },
                        {
                            title: {
                                en: "Open Webhooks Settings",
                                ar: "فتح إعدادات Webhooks"
                            },
                            desc: {
                                en: "From the dashboard, go to Settings then click on Webhooks.",
                                ar: "من لوحة التحكم، انتقل إلى الإعدادات ثم اضغط على Webhooks."
                            },
                            image: "/guide/easyorder/webhook-step2.png",
                        },
                        {
                            title: {
                                en: "Create Webhook for New Orders",
                                ar: "إنشاء Webhook للطلبات الجديدة"
                            },
                            desc: {
                                en: "Click 'Create'. Copy the webhook URL provided below and paste it into the URL field. Then select the type 'Orders' and click Save.",
                                ar: "اضغط على 'إنشاء'. قم بنسخ رابط الـ Webhook الموضح بالأسفل وألصقه في حقل الرابط (URL)، ثم اختر النوع 'Orders' واضغط حفظ."
                            },
                            url: (me) => `${BASE_URL}/stores/webhooks/${tenantId(me)}/easyorder/orders/create`,
                            image: "/guide/easyorder/webhook-step3.png",
                        },
                        {
                            title: {
                                en: "Copy Orders Webhook Secret",
                                ar: "نسخ Secret الخاص بطلبات Orders"
                            },
                            desc: {
                                en: "After saving, copy the generated Secret and paste it into our system webhook secret input.",
                                ar: "بعد الحفظ، قم بنسخ الـ Secret الذي تم إنشاؤه وألصقه في حقل Webhook Secret في نظامنا."
                            },

                            image: "/guide/easyorder/webhook-step4.png",
                        },
                        {
                            title: {
                                en: "Create Webhook for Order Status Update",
                                ar: "إنشاء Webhook لتحديث حالة الطلب"
                            },
                            desc: {
                                en: "Create another webhook. Copy the webhook URL provided below and paste it into the URL field. Then select the type 'Order Status Update' and click Save.",
                                ar: "قم بإنشاء Webhook آخر. قم بنسخ رابط الـ Webhook الموضح بالأسفل وألصقه في حقل الرابط (URL)، ثم اختر النوع 'Order Status Update' واضغط حفظ."
                            },
                            url: `${BASE_URL}/stores/webhooks/easyorder/orders/status`,
                            image: "/guide/easyorder/webhook-step5.png",
                        },
                        {
                            title: {
                                en: "Copy Status Update Secret",
                                ar: "نسخ Secret الخاص بتحديث الحالة"
                            },
                            desc: {
                                en: "After saving, copy the generated Secret and paste it into our system webhook secret input.",
                                ar: "بعد الحفظ، قم بنسخ الـ Secret الذي تم إنشاؤه وألصقه في حقل Webhook Secret في نظامنا."
                            },
                            image: "/guide/easyorder/webhook-step6.png",
                        },
                    ]
                }
            ], docsUrl: "https://public-api-docs.easy-orders.net/docs/authentication"
        },
        webhookDocsUrl: "https://public-api-docs.easy-orders.net/docs/webhooks",
        fields: {
            apiKey: { required: true, userProvides: true },
            webhookCreateOrderSecret: { required: true, userProvides: true },
            webhookUpdateStatusSecret: { required: true, userProvides: true },
        },
        webhookEndpoints: {
            create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/easyorder/orders/create`,
            update: (adminId) => `${BASE_URL}/stores/webhooks/easyorder/orders/status`,
        },
        instructions: {
            apiKey: [
                "انتقل إلى لوحة تحكم EasyOrder",
                "ابحث عن قسم API Keys",
                "أنشئ مفتاح API جديد",
                "انسخ المفتاح والصقه أدناه",
            ],
            webhooks: [
                "في EasyOrder، انتقل إلى إعدادات Webhooks",
                "أضف webhook لإنشاء الطلبات باستخدام الرابط أدناه",
                "أدخل السر الخاص بك (أي نص عشوائي آمن)",
                "أضف webhook لتحديث الحالة باستخدام الرابط الثاني",
                "أدخل سر آخر لتحديث الحالة",
                "احفظ كلا السرين أدناه",
            ],
        },
    },
    shopify: {
        label: "Shopify",
        logo: "/integrate/shopify.png",
        website: "shopify.com",
        description: "صل متجرك بـ Shopify وأدر منتجاتك وطلباتك من مكان واحد.",
        bg: "bg-[linear-gradient(300.09deg,#F0FFF4_74.95%,#F3F0FF_129.29%)]",
        accent: "#3a6b4a",
        accentBg: "#d4e8da",
        strip: "linear-gradient(90deg,#3a6b4a,#5a9b6e)",
        docsLink: "https://help.shopify.com/api",
        guide: {
            showSteps: true,
            docsUrl: "https://help.shopify.com/api",
            tabs: [
                {
                    key: "create-app",
                    label: { en: "Create Shopify App", ar: "إنشاء تطبيق Shopify" },
                    steps: [
                        {
                            title: { en: "Open Develop Apps", ar: "فتح Develop Apps" },
                            desc: {
                                en: "From your Shopify store dashboard, click Apps → Develop apps.",
                                ar: "من لوحة تحكم المتجر في Shopify، اضغط على Apps ثم Develop apps."
                            },
                            image: "/guide/shopify/step1.png",
                        },
                        {
                            title: { en: "Build App", ar: "إنشاء تطبيق" },
                            desc: {
                                en: "Click 'Build app' inside the Developer Dashboard.",
                                ar: "اضغط على 'Build apps' داخل لوحة التحكم."
                            },
                            image: "/guide/shopify/step2.png",
                        },
                        {
                            title: { en: "Create App Name", ar: "إنشاء اسم التطبيق" },
                            desc: {
                                en: "In the 'Create app' form, write the app name as 'store-integrate', then click Create.",
                                ar: "في نموذج إنشاء التطبيق، اكتب اسم التطبيق 'store-integrate' ثم اضغط Create."
                            },
                            image: "/guide/shopify/step3.png",
                        },
                        {
                            title: { en: "Configure App URL & Scopes", ar: "إعداد رابط التطبيق والصلاحيات" },
                            desc: {
                                en: "Add the URL shown below into the App URL field. Uncheck 'Embedded app'. Then add the required scopes and click Save.",
                                ar: "أضف الرابط المعروض أدناه في حقل App URL. قم بإلغاء تحديد 'Embedded app'. ثم أضف الصلاحيات المطلوبة واضغط حفظ."
                            },
                            url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/shopify/init`,
                            image: "/guide/shopify/step4.png",
                            tip: {
                                en: "Click 'Add scopes' and include the required permissions (read_all_orders,write_locations,read_locations,read_orders,write_orders,read_products,write_products,read_publications,write_publications).",
                                ar: "اضغط على 'Add scopes' وأضف الصلاحيات المطلوبة  (read_all_orders,write_locations,read_locations,read_orders,write_orders,read_products,write_products,read_publications,write_publications)."
                            }
                        },
                        {
                            title: { en: "Release App Version", ar: "إصدار نسخة التطبيق" },
                            desc: {
                                en: "Click 'Release'. A popup will appear asking for the version name. Enter a version number (for example: 1) and confirm to release the app.",
                                ar: "اضغط على 'Release'. ستظهر نافذة منبثقة تطلب إدخال رقم الإصدار. اكتب رقم الإصدار (مثلاً: 1) ثم قم بالتأكيد لإصدار التطبيق."
                            },
                            image: "/guide/shopify/step5.png",
                        },
                        {
                            title: { en: "Copy Client ID & Secret", ar: "نسخ Client ID و Secret" },
                            desc: {
                                en: "After releasing the app, copy the Client ID and Client Secret and paste them into our store configuration form.",
                                ar: "بعد إصدار التطبيق، انسخ Client ID و Client Secret والصقهما في نموذج إعداد المتجر لدينا."
                            },
                            image: "/guide/shopify/step6.png",
                            tip: {
                                en: "Keep the Client Secret secure and do not share it publicly.",
                                ar: "احفظ Client Secret بأمان ولا تشاركه علنًا."
                            }
                        },
                        {
                            title: { en: "Install the App", ar: "تثبيت التطبيق" },
                            desc: {
                                en: "After releasing the app version, click on 'Install app'",
                                ar: "بعد إصدار نسخة التطبيق، اضغط على 'Install app'."
                            },
                            image: "/guide/shopify/install.png",
                        },
                    ]
                },
                {
                    key: "webhooks",
                    label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
                    steps: [
                        {
                            title: { en: "Go to Webhooks", ar: "اذهب إلى Webhooks" },
                            desc: {
                                en: "From your Shopify dashboard, go to Notifications → Webhooks. Copy the existing Webhook Secret into our system.",
                                ar: "من لوحة تحكم Shopify، انتقل إلى Notifications → Webhooks. انسخ الـ Webhook Secret الموجود والصقه في نظامنا."
                            },
                            image: "/guide/shopify/webhook-step1.png",
                        },
                        {
                            title: { en: "Create Webhook for Order Creation", ar: "إنشاء Webhook لإنشاء الطلبات" },
                            desc: {
                                en: "Click 'Create Webhook'. For Event select 'Order Creation', format JSON, then copy the URL shown below into the URL field in Shopify.",
                                ar: "اضغط على 'Create Webhook'. اختر Event 'Order Creation'، الصيغة JSON، ثم انسخ الرابط المعروض أدناه وألصقه في حقل URL في Shopify."
                            },
                            url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/shopify/orders/create`,
                            image: "/guide/shopify/webhook-step2.png",
                        },

                        {
                            title: { en: "Create Webhook for Order Status Update", ar: "إنشاء Webhook لتحديث حالة الطلب" },
                            desc: {
                                en: "Click 'Create Webhook'. For Event select 'Order Update', format JSON, then copy the URL shown below into the URL field in Shopify.",
                                ar: "اضغط على 'Create Webhook'. اختر Event 'Order Update'، الصيغة JSON، ثم انسخ الرابط المعروض أدناه وألصقه في حقل URL في Shopify."
                            },
                            url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/shopify/orders/status`,
                            image: "/guide/shopify/webhook-step3.png",
                        }
                    ]
                }
            ]
        },
        webhookDocsUrl: "https://help.shopify.com/en/manual/apps/app-types/custom-apps/webhooks",
        fields: {
            apiKey: { required: true, userProvides: true },
            clientSecret: { required: true, userProvides: true },
            webhookSecret: { required: true, userProvides: true },
        },
        webhookEndpoints: {
            create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/shopify/orders/create`,
            update: (adminId) => `${BASE_URL}/stores/webhooks/shopify/orders/status`,
        },
        instructions: {
            apiKey: [
                "انتقل إلى Shopify Admin > Apps > Develop apps",
                "أنشئ تطبيق خاص جديد",
                "اذهب إلى API credentials",
                "انسخ API key و API secret key",
            ],
            webhooks: [
                "في إعدادات التطبيق، اذهب إلى Webhooks",
                "أضف webhook subscription لـ orders/create",
                "استخدم الرابط أدناه كـ Webhook URL",
                "سيتم إنشاء Webhook secret تلقائيًا - انسخه",
            ],
        },
    },
    woocommerce: {
        label: "WooCommerce",
        logo: "/integrate/woocommerce.png",
        website: "woocommerce.com",
        description: "اربط متجر WooCommerce الخاص بك وأدر كل شيء بطريقة سهلة والأمان أولًا.",
        bg: "bg-[linear-gradient(300.09deg,#FAFAFA_74.95%,#FFF0F5_129.29%)]",
        accent: "#5c3d8f",
        accentBg: "#e0d4f5",
        strip: "linear-gradient(90deg,#5c3d8f,#8b6abf)",
        docsLink: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
        guide: {
            showSteps: true,
            docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
            tabs: [
                {
                    key: "api",
                    label: { en: "Get API Key", ar: "الحصول على مفتاح API" },
                    steps: [
                        {
                            title: {
                                en: "Open WooCommerce Settings",
                                ar: "فتح إعدادات WooCommerce"
                            },
                            desc: {
                                en: "Go to your WordPress dashboard, click WooCommerce, then Settings.",
                                ar: "اذهب إلى لوحة التحكم في WordPress، اضغط على WooCommerce ثم الإعدادات."
                            },
                            image: "/guide/woocommerce/step1.png",
                        },
                        {
                            title: {
                                en: "Go to Advanced Tab",
                                ar: "اذهب إلى تبويب Advanced"
                            },
                            desc: {
                                en: "Click the 'Advanced' tab to access REST API settings.",
                                ar: "اضغط على تبويب 'Advanced' للوصول إلى إعدادات REST API."
                            },
                            image: "/guide/woocommerce/step2.png",
                        },
                        {
                            title: {
                                en: "Add REST API Key",
                                ar: "إضافة مفتاح REST API"
                            },
                            desc: {
                                en: "In the REST API section, click 'Add Key', fill in the details, select Read/Write permission, then save.",
                                ar: "في قسم REST API، اضغط 'Add Key'، املأ البيانات، اختر صلاحيات Read/Write ثم اضغط حفظ."
                            },
                            image: "/guide/woocommerce/step3.png",
                        },
                        {
                            title: {
                                en: "Copy Key and Secret",
                                ar: "نسخ المفتاح والسر"
                            },
                            desc: {
                                en: "After saving, the Key and Secret will appear. Copy them and paste into our store configuration form.",
                                ar: "بعد الحفظ، سيظهر المفتاح والسر. انسخهم والصقهم داخل نموذج إعدادات المتجر لدينا."
                            },
                            image: "/guide/woocommerce/step4.png",
                            tip: {
                                en: "Store the Key and Secret securely. Do not share publicly.",
                                ar: "احفظ المفتاح والسر بأمان ولا تشاركهم علنًا."
                            }
                        }
                    ]
                },

                {
                    key: "webhooks",
                    label: { en: "Setup Webhooks", ar: "إعداد Webhooks" },
                    steps: [
                        {
                            title: { en: "Open WooCommerce Settings", ar: "فتح إعدادات WooCommerce" },
                            desc: {
                                en: "Go to your WordPress dashboard, click WooCommerce, then Settings.",
                                ar: "اذهب إلى لوحة التحكم في WordPress، اضغط على WooCommerce ثم الإعدادات."
                            },
                            image: "/guide/woocommerce/step1.png",
                        },
                        {
                            title: { en: "Go to Webhooks Tab", ar: "اذهب إلى تبويب Webhooks" },
                            desc: {
                                en: "Click the 'Webhooks' tab to manage WooCommerce webhooks.",
                                ar: "اضغط على تبويب 'Webhooks' لإدارة الـ Webhooks في WooCommerce."
                            },
                            image: "/guide/woocommerce/webhook-step2.png",
                        },
                        {
                            title: { en: "Create Webhook for New Orders", ar: "إنشاء Webhook للطلبات الجديدة" },
                            desc: {
                                en: "Click 'Add Webhook', fill the details, select topic 'Order created', set status 'Active', then click Save. Copy the generated Secret into our system webhook secret input.",
                                ar: "اضغط 'Add Webhook'، املأ البيانات، اختر الموضوع 'Order created'، اجعل الحالة 'Active' ثم اضغط حفظ. انسخ الـ Secret وضعه في حقل Webhook Secret في نظامنا."
                            },
                            url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/woocommerce/orders/create`,
                            image: "/guide/woocommerce/webhook-step3.png",
                            tip: {
                                en: "After saving, check that the message 'Webhook updated successfully' appears.",
                                ar: "بعد الحفظ، تحقق من ظهور الرسالة 'Webhook updated successfully'."
                            }
                        },
                        {
                            title: { en: "Create Webhook for Order Status Update", ar: "إنشاء Webhook لتحديث حالة الطلب" },
                            desc: {
                                en: "Create another webhook, fill details, select topic 'Order updated', set status 'Active', then click Save. Copy the generated Secret into our system webhook secret input.",
                                ar: "قم بإنشاء Webhook آخر، املأ البيانات، اختر الموضوع 'Order updated'، اجعل الحالة 'Active' ثم اضغط حفظ. انسخ الـ Secret وضعه في حقل Webhook Secret في نظامنا."
                            },
                            url: (me) => `${process.env.NEXT_PUBLIC_BASE_URL}/stores/webhooks/${tenantId(me)}/woocommerce/orders/status`,
                            image: "/guide/woocommerce/webhook-step4.png",
                            tip: {
                                en: "After saving, check that the message 'Webhook updated successfully' appears.",
                                ar: "بعد الحفظ، تحقق من ظهور الرسالة 'Webhook updated successfully'."
                            }
                        }
                    ]
                }
            ],
        },
        webhookDocsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks",
        fields: {
            apiKey: { required: true, userProvides: true },
            clientSecret: { required: true, userProvides: true },
            webhookCreateOrderSecret: { required: true, systemProvides: true }, // System generates
            webhookUpdateStatusSecret: { required: true, systemProvides: true }, // System generates
        },
        webhookEndpoints: {
            create: (adminId) => `${BASE_URL}/stores/webhooks/${adminId}/woocommerce/orders/create`,
            update: (adminId) => `${BASE_URL}/stores/webhooks/woocommerce/orders/status`,
        },
        instructions: {
            apiKey: [
                "انتقل إلى WooCommerce > Settings > Advanced > REST API",
                "أنشئ مفتاح API جديد",
                "اختر Read/Write permissions",
                "انسخ Consumer key و Consumer secret",
            ],
            webhooks: [
                "في WooCommerce > Settings > Advanced > Webhooks",
                "أنشئ  لـ Order created",
                "استخدم الرابط أدناه",
                "انسخ السر الذي تم إنشاؤه والصقه في متجرك",
            ],
        },
    },
};

export function useStoreWebhook({ store, provider, onClose }) {
    const t = useTranslations("storeIntegrations");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [storeData, setStoreData] = useState(null);
    const [webhookFields, setWebhookFields] = useState({});
    const [rotating, setRotating] = useState(false);

    // --- Helper Logic: Map Fields based on Provider ---
    const mapFields = useCallback((data) => {
        const cred = data?.credentials || {};
        if (provider === "easyorder") {
            setWebhookFields({
                webhookCreateOrderSecret: cred.webhookCreateOrderSecret || "",
                webhookUpdateStatusSecret: cred.webhookUpdateStatusSecret || "",
            });
        } else if (provider === "shopify") {
            setWebhookFields({ webhookSecret: cred.webhookSecret || "" });
        } else {
            setWebhookFields({});
        }
    }, [provider]);

    // --- Action: Fetch Store Data ---
    const fetchStore = useCallback(async () => {
        if (!store?.id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/stores/${store.id}`);
            setStoreData(res.data);
            mapFields(res.data);
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setLoading(false);
        }
    }, [store?.id, mapFields]);

    useEffect(() => {

        fetchStore();
    }, [fetchStore]);

    // --- Action: Save Secrets ---
    const saveSecrets = async () => {
        const credentials = {};
        if (provider === "easyorder") {
            if (webhookFields.webhookCreateOrderSecret?.trim())
                credentials.webhookCreateOrderSecret = webhookFields.webhookCreateOrderSecret.trim();
            if (webhookFields.webhookUpdateStatusSecret?.trim())
                credentials.webhookUpdateStatusSecret = webhookFields.webhookUpdateStatusSecret.trim();
        } else if (provider === "shopify") {
            if (webhookFields.webhookSecret?.trim())
                credentials.webhookSecret = webhookFields.webhookSecret.trim();
        }

        if (Object.keys(credentials).length === 0) return;

        setSaving(true);
        setError(null);
        try {
            await api.patch(`/stores/${store.id}`, { credentials });
            toast.success(t("form.updateSuccess"));

            // Refresh data after save
            const res = await api.get(`/stores/${store.id}`);
            setStoreData(res.data);
            mapFields(res.data);
            onClose?.()
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setSaving(false);
        }
    };

    // --- Action: Rotate WooCommerce Secrets ---
    const rotateWooCommerce = async () => {
        if(!store?.id) return;
        setRotating(true);
        setError(null);
        try {
            await api.post(`/stores/${store?.id}/regenerate-secrets`);
            const res = await api.get(`/stores/${store.id}`);
            setStoreData(res.data);
            toast.success(t("messages.secretsRegenerated"));
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setRotating(false);
        }
    };

    // --- Helper: Copy Utility ---
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(String(text || ""));
            toast.success(t("form.copied") || "Copied");
        } catch (_) { }
    };

    return {
        loading,
        saving,
        error,
        storeData,
        webhookFields,
        setWebhookFields,
        rotating,
        copyToClipboard,
        saveSecrets,
        rotateWooCommerce,
        cred: storeData?.credentials || {} // Keeping 'cred' shortcut as requested
    };
}


export function useStoreConfig({ open, onClose, provider, existingStore, fetchStores, onCreated }) {
    const t = useTranslations("storeIntegrations");
    const config = PROVIDER_CONFIG[provider];
    const isEdit = !!existingStore;

    const [fetchingStore, setFetchingStore] = useState(false);
    const [regeneratingSecrets, setRegeneratingSecrets] = useState(false);
    const [error, setError] = useState(null);

    // Form schema
    const schema = useMemo(
        () =>
            yup.object({
                name: yup.string().trim().required(t("validation.nameRequired")),
                storeUrl: yup.string().trim().url(t("validation.invalidUrl")).required(t("validation.storeUrlRequired")),
                isActive: yup.boolean().default(true),
            }),
        [t]
    );

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { name: "", storeUrl: "", isActive: true },
        resolver: yupResolver(schema),
    });

    // Field states
    const [fields, setFields] = useState({});
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [masks, setMasks] = useState({});
    const [systemSecrets, setSystemSecrets] = useState({});

    // Load store data
    useEffect(() => {
        if (!open) return;
        setError(null);

        if (isEdit) {
            (async () => {
                setFetchingStore(true);
                try {
                    const res = await api.get(`/stores/${existingStore.id}`);
                    const d = res.data;

                    reset({
                        name: d.name || "",
                        storeUrl: d.storeUrl || "",
                        isActive: d.isActive ?? true,
                    });

                    // Load masked secrets
                    const integ = d.credentials || {};
                    const newMasks = {};
                    const newSystemSecrets = {};

                    Object.keys(config.fields).forEach((fieldName) => {
                        if (config.fields[fieldName].systemProvides) {
                            newSystemSecrets[fieldName] = integ[fieldName] || "";
                        } else {
                            newMasks[fieldName] = integ[fieldName] || "";
                        }
                    });

                    setMasks(newMasks);
                    setSystemSecrets(newSystemSecrets);
                } catch (e) {
                    toast.error(normalizeAxiosError(e));
                    onClose();
                } finally {
                    setFetchingStore(false);
                }
            })();
        } else {
            reset({ name: "", storeUrl: "", isActive: true });
            setMasks({});
            setSystemSecrets({});
        }

        // Clear all fields
        setFields({});
        setTouched({});
        setFieldErrors({});
    }, [open, isEdit, existingStore?.id, provider, config, reset]);

    const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

    const isValid = () => {
        const fieldEntries = Object.entries(config.fields || {});
        const requiredUserFields = fieldEntries.filter(([, fc]) => fc.required && fc.userProvides);

        // 1. All required (user-provided) fields satisfied
        const allRequiredSatisfied = requiredUserFields.every(([key]) => {
            const hasNewValue = (fields[key]?.trim() || "").length > 0;
            const hasExistingValue = !!(masks[key] || (config.fields[key].systemProvides && systemSecrets[key]));
            return hasExistingValue || hasNewValue;
        });
        if (!allRequiredSatisfied) return false;

        if (isEdit) {
            // 2. On edit: at least one new value
            const hasAtLeastOneNewValue = fieldEntries.some(([key]) => (fields[key]?.trim() || "").length > 0);
            return hasAtLeastOneNewValue;
        }
        // Create: all required must have value in fields
        return requiredUserFields.every(([key]) => (fields[key]?.trim() || "").length > 0);
    };

    // Regenerate WooCommerce secrets
    const handleRegenerateSecrets = async () => {
        if (!isEdit || provider !== "woocommerce") return;

        setRegeneratingSecrets(true);
        try {
            const res = await api.post(`/stores/${existingStore.id}/regenerate-secrets`);
            const { webhookCreateOrderSecret, webhookUpdateStatusSecret } = res.data;

            setSystemSecrets({
                webhookCreateOrderSecret,
                webhookUpdateStatusSecret,
            });

            toast.success(t("messages.secretsRegenerated"));
        } catch (e) {
            toast.error(normalizeAxiosError(e));
        } finally {
            setRegeneratingSecrets(false);
        }
    };

    // Submit handler
    const onSubmit = async (data) => {
        setError(null);
        let createdStoreId = null;

        // Validate required user-provided fields on create
        if (!isEdit) {
            let hasError = false;
            Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
                if (fieldConfig.userProvides && fieldConfig.required && !fields[fieldName]?.trim()) {
                    setFieldErrors((prev) => ({
                        ...prev,
                        [fieldName]: t(`validation.${fieldName}Required`),
                    }));
                    hasError = true;
                }
            });
            if (hasError) return;
            setFieldErrors({});
        }

        try {
            const payload = {
                name: data.name.trim(),
                storeUrl: data.storeUrl.trim(),
                isActive: data.isActive,
            };

            if (isEdit) {
                // Only include touched user-provided fields
                const credentials = {};
                Object.keys(config.fields).forEach((fieldName) => {
                    if (config.fields[fieldName].userProvides && touched[fieldName] && fields[fieldName]?.trim()) {
                        credentials[fieldName] = fields[fieldName].trim();
                    }
                });

                if (Object.keys(credentials).length > 0) {
                    payload.credentials = credentials;
                }

                const res = await api.patch(`/stores/${existingStore.id}`, payload);

                // Update masks
                const freshInteg = res.data?.credentials || {};
                const newMasks = {};
                Object.keys(config.fields).forEach((fieldName) => {
                    if (config.fields[fieldName].userProvides) {
                        newMasks[fieldName] = freshInteg[fieldName] || "";
                    }
                });
                setMasks(newMasks);

                toast.success(t("form.updateSuccess"));
            } else {
                // Create new store
                const credentials = {};
                Object.keys(config.fields).forEach((fieldName) => {
                    if (config.fields[fieldName].userProvides) {
                        credentials[fieldName] = fields[fieldName]?.trim() || "";
                    }
                });

                const res = await api.post("/stores", {
                    ...payload,
                    provider,
                    credentials,
                });
                createdStoreId = res.data?.id;
                toast.success(t("form.createSuccess"));
            }

            // Clear fields and reset touched
            setFields({});
            setTouched({});
            await fetchStores();

            if (!isEdit) {
                onClose();
                if (provider === "woocommerce" && createdStoreId) {
                    if (typeof onCreated === "function") {
                        onCreated(provider, createdStoreId);
                    }
                }
            } else {
                onClose();
            }
        } catch (e) {
            const msg = normalizeAxiosError(e);
            toast.error(msg);
        }
    };

    return {
        config,
        isEdit,
        fetchingStore,
        regeneratingSecrets,
        error,
        register,
        control,
        handleSubmit,
        errors,
        isSubmitting,
        fields,
        setFields,
        touched,
        markTouched,
        fieldErrors,
        masks,
        systemSecrets,
        isValid,
        handleRegenerateSecrets,
        onSubmit
    };
}