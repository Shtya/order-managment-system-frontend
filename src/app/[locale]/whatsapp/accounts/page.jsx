"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ImagePreviewModal } from "@/components/atoms/ImagePreviewModal";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  FileDown,
  Info,
  MessageSquare,
  Trash2,
  Power,
  Settings,
  CheckCircle2,
  Eye,
  BarChart3,
  Clock,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  HelpCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Edit2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import PageHeader from "@/components/atoms/Pageheader";
import Button_, { GhostBtn, PrimaryBtn } from "@/components/atoms/Button";
import Table, { FilterField } from "@/components/atoms/Table";
import ActionButtons from "@/components/atoms/Actions";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { WhatsAppTab } from "../../settings/page";
import { Settings2 } from "lucide-react";
import api from "@/utils/api";
import { useDebounce } from "@/hook/useDebounce";
import { useExport } from "@/hook/useExport";
import { useSocket } from "@/context/SocketContext";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useOrdersSettings } from "@/hook/useOrdersSettings";
import { useAuth } from "@/context/AuthContext";

function normalizeAxiosError(err) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unexpected error";
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

// Helper to pick localized strings
const pick = (obj, locale) => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj.en || obj.ar || "";
};

// Mocked WhatsApp Guide Config - Edit this later!
const WHATSAPP_GUIDE_CONFIG = {
  label: "WhatsApp Business",
  guide: {
    tabs: [
      {
        label: {
          en: "Meta Developer Account Setup",
          ar: "إعداد حساب مطور Meta"
        },
        steps: [
          {
            title: {
              en: "Open Meta Developers",
              ar: "فتح منصة Meta Developers"
            },
            desc: {
              en: "Visit developers.facebook.com. Click 'Log In' if you already have an account or 'Get Started' to create a new developer account.",
              ar: "ادخل إلى developers.facebook.com واضغط تسجيل الدخول إذا لديك حساب أو ابدأ لإنشاء حساب مطور جديد."
            },
            tip: {
              en: "If you already see 'My Apps', you can skip login/get started and continue directly.",
              ar: "إذا ظهر لديك قسم 'My Apps' يمكنك تخطي تسجيل الدخول أو البدء والمتابعة مباشرة."
            },
            image: "/whatsapp/prepar/step-1-open-developers.png",
            url: "https://developers.facebook.com"
          },

          {
            title: {
              en: "Log In or Create Facebook Account",
              ar: "تسجيل الدخول أو إنشاء حساب فيسبوك"
            },
            desc: {
              en: "Sign in using your existing Facebook account. If you don't have one, create a new Facebook account first.",
              ar: "قم بتسجيل الدخول باستخدام حساب فيسبوك الحالي، أو أنشئ حساب جديد إذا لم يكن لديك."
            },
            tip: {
              en: "Recommended: use your existing Facebook account. New accounts may face restrictions or verification delays.",
              ar: "يفضل استخدام حساب فيسبوك الحالي لأن الحسابات الجديدة قد تواجه قيود أو تأخير في التفعيل."
            },
            image: "/whatsapp/prepar/step-2-login.png"
          },

          {
            title: {
              en: "Start Meta Developer Registration",
              ar: "بدء تسجيل مطور Meta"
            },
            desc: {
              en: "Click 'Get Started' to create your Meta Developer account.",
              ar: "اضغط على 'Get Started' لإنشاء حساب مطور Meta."
            },
            image: "/whatsapp/prepar/step-3-get-started.png"
          },

          {
            title: {
              en: "Accept Developer Terms",
              ar: "الموافقة على شروط المطور"
            },
            desc: {
              en: "Accept Meta Platform Terms and continue.",
              ar: "اقبل شروط منصة Meta للمتابعة."
            },
            image: "/whatsapp/prepar/step-4-terms.png"
          },

          {
            title: {
              en: "Add Phone Number",
              ar: "إضافة رقم الهاتف"
            },
            desc: {
              en: "Enter your phone number for verification.",
              ar: "أدخل رقم الهاتف الخاص بك للتحقق."
            },
            image: "/whatsapp/prepar/step-5-phone.png"
          },
          {
            title: {
              en: "Confirm Email Address",
              ar: "تأكيد البريد الإلكتروني"
            },
            desc: {
              en: "Verify your email address.",
              ar: "قم بتأكيد بريدك الإلكتروني."
            },
            image: "/whatsapp/prepar/step-7-email.png"
          },

          {
            title: {
              en: "Select Role",
              ar: "اختيار الدور"
            },
            desc: {
              en: "Choose your role (for example: Owner/Founder).",
              ar: "اختر دورك (على سبيل المثال: Owner/Founder)."
            },
            image: "/whatsapp/prepar/step-8-role.png"
          },
          {
            title: {
              en: "Optional Identity Verification",
              ar: "التحقق من الهوية (اختياري)"
            },
            desc: {
              en: "You can verify your Facebook identity later. It is completely optional and not required for setup.",
              ar: "يمكنك التحقق من الهوية لاحقاً وهو اختياري تماما وليس مطلوباً للإعداد."
            },
            url: "https://facebook.com/id",
            tip: {
              en: "You can complete identity verification anytime later if needed.",
              ar: "يمكنك إكمال التحقق من الهوية في أي وقت لاحق."
            },
            image: "/whatsapp/prepar/step-7-id.png"
          }

        ]
      },
      {
        label: {
          en: "Create Business Portfolio",
          ar: "إنشاء ملف النشاط التجاري"
        },
        steps: [
          {
            title: {
              en: "Open Business Settings",
              ar: "فتح إعدادات النشاط التجاري"
            },
            desc: {
              en: "Go to https://business.facebook.com/latest/settings and start creating a Business Portfolio.",
              ar: "اذهب إلى الرابط وابدأ إنشاء ملف النشاط التجاري (Business Portfolio)."
            },
            url: "https://business.facebook.com/latest/settings",
            tip: {
              en: "If you already see 'Business Portfolio' created, skip this entire step. After copying and saving your Business Portfolio ID, if you are unsure how to get it, continue following the guide steps.",
              ar: "إذا كان لديك Business Portfolio بالفعل يمكنك تخطي هذه الخطوة بالكامل. بعد نسخ وحفظ Business Portfolio ID، إذا لم تكن متأكداً من كيفية الحصول عليه، أكمل متابعة خطوات الدليل."
            },
            image: "/whatsapp/portfolio/step-1-open-settings.png"
          },

          {
            title: {
              en: "Create Business Portfolio",
              ar: "إنشاء ملف النشاط التجاري"
            },
            desc: {
              en: "Click 'Create Business Portfolio' and fill in all required information such as business name, portfolio name, email, and details.",
              ar: "اضغط على إنشاء ملف النشاط التجاري واملأ البيانات المطلوبة مثل الاسم، البريد الإلكتروني، ومعلومات النشاط."
            },
            image: "/whatsapp/portfolio/step-2-create.png"
          },

          {
            title: {
              en: "Add Business Assets",
              ar: "إضافة الأصول التجارية"
            },
            desc: {
              en: "Add related business assets like Facebook Pages and Instagram accounts to your portfolio.",
              ar: "قم بإضافة الصفحات وحسابات إنستغرام المرتبطة بالنشاط التجاري."
            },
            image: "/whatsapp/portfolio/step-3-assets.png"
          },

          {
            title: {
              en: "Invite People",
              ar: "إضافة الأشخاص"
            },
            desc: {
              en: "Click Next and assign people or team members to the business portfolio.",
              ar: "اضغط التالي ثم أضف الأشخاص أو فريق العمل إلى الحساب."
            },
            image: "/whatsapp/portfolio/step-4-people.png"
          },

          {
            title: {
              en: "Confirm Setup",
              ar: "تأكيد الإعداد"
            },
            desc: {
              en: "Review all information and click Confirm to complete business portfolio creation.",
              ar: "راجع جميع البيانات ثم اضغط تأكيد لإنهاء إنشاء الملف التجاري."
            },
            image: "/whatsapp/portfolio/step-5-confirm.png"
          },

          {
            title: {
              en: "Save Business Portfolio ID",
              ar: "حفظ معرف النشاط التجاري"
            },
            desc: {
              en: "Go to https://business.facebook.com/latest/settings/business_info and copy your Business Portfolio ID. You will need it later.",
              ar: "اذهب إلى الرابط وانسخ Business Portfolio ID لأنك ستحتاجه لاحقاً."
            },
            url: "https://business.facebook.com/latest/settings/business_info",
            image: "/whatsapp/portfolio/step-6-save-id.png"
          },
          {
            title: {
              en: "Complete Business Information",
              ar: "إكمال معلومات النشاط التجاري"
            },
            desc: {
              en: "After creating the Business Portfolio, you must fully complete all business information including business name, address, and required details before continuing.",
              ar: "بعد إنشاء Business Portfolio يجب إكمال جميع معلومات النشاط التجاري مثل الاسم، العنوان، وجميع البيانات المطلوبة قبل المتابعة."
            },
            image: "/whatsapp/portfolio/step-3-business-info.png"
          }

        ]
      },
      {
        label: {
          en: "Create WhatsApp Business Account",
          ar: "إنشاء حساب WhatsApp Business"
        },
        steps: [
          {
            title: {
              en: "Open WhatsApp Settings",
              ar: "فتح إعدادات WhatsApp"
            },
            desc: {
              en: "Go to https://business.facebook.com/latest/settings/whatsapp_account to start creating your WhatsApp Business Account.",
              ar: "اذهب إلى الرابط لبدء إنشاء حساب WhatsApp Business."
            },
            url: "https://business.facebook.com/latest/settings/whatsapp_account",
            image: "/whatsapp/waba/step-1-open-settings.png"
          },

          {
            title: {
              en: "Add WhatsApp Account",
              ar: "إضافة حساب WhatsApp"
            },
            desc: {
              en: "Click 'Add Account' if you do not already have a WhatsApp Business Account.",
              ar: "اضغط على 'Add Account' إذا لم يكن لديك حساب WhatsApp Business مسبقاً."
            },
            tip: {
              en: "If an account already exists, you can skip this step.",
              ar: "إذا كان لديك حساب بالفعل يمكنك تخطي هذه الخطوة."
            },
            image: "/whatsapp/waba/step-2-add-account.png"
          },
          {
            title: {
              en: "Complete WhatsApp Business Information",
              ar: "إكمال معلومات WhatsApp Business"
            },
            desc: {
              en: "Before continuing, you must complete your WhatsApp Business profile by setting the category, business name, and required business details.",
              ar: "قبل المتابعة يجب إكمال ملف WhatsApp Business عبر إضافة التصنيف، اسم النشاط التجاري، وجميع البيانات المطلوبة."
            },
            tip: {
              en: "Make sure the business name matches your real business or store name for better approval and stability.",
              ar: "تأكد من أن اسم النشاط التجاري يطابق اسم متجرك أو عملك لتجنب المشاكل في القبول."
            },
            image: "/whatsapp/waba/step-2.5-business-info.png"
          },
          {
            title: {
              en: "Enter Phone Number",
              ar: "إدخال رقم الهاتف"
            },
            desc: {
              en: "Enter your phone number that will be used for WhatsApp Cloud API.",
              ar: "أدخل رقم الهاتف الذي سيتم استخدامه في WhatsApp Cloud API."
            },
            image: "/whatsapp/waba/step-3-phone.png"
          },

          {
            title: {
              en: "Verify Phone Number",
              ar: "تأكيد رقم الهاتف"
            },
            desc: {
              en: "Enter the verification code sent to your phone number.",
              ar: "أدخل رمز التحقق الذي تم إرساله إلى رقم الهاتف."
            },
            image: "/whatsapp/waba/step-4-verify.png"
          },

          {
            title: {
              en: "Copy WhatsApp Business Account ID",
              ar: "نسخ معرف حساب WhatsApp"
            },
            desc: {
              en: "Go to your WhatsApp Account and copy the WhatsApp Business Account ID (WABA ID). You will need it later.",
              ar: "اذهب إلى حساب WhatsApp الخاص بك وانسخ WABA ID لأنك ستحتاجه لاحقاً."
            },
            image: "/whatsapp/waba/step-5-copy-waba-id.png"
          },

          {
            title: {
              en: "Select Phone Number",
              ar: "اختيار رقم الهاتف"
            },
            desc: {
              en: "Open the Phone Numbers section and select your registered number.",
              ar: "افتح قسم أرقام الهاتف واختر الرقم المسجل."
            },
            image: "/whatsapp/waba/step-6-phone-list.png"
          },

          {
            title: {
              en: "Copy Phone Number ID",
              ar: "نسخ معرف رقم الهاتف"
            },
            desc: {
              en: "Copy the Phone Number ID. This will be required for API integration.",
              ar: "انسخ Phone Number ID، ستحتاجه لاحقاً لربط الـ API."
            },
            image: "/whatsapp/waba/step-7-phone-id.png"
          }
        ]
      },
      {
        label: {
          en: "Create Meta App",
          ar: "إنشاء تطبيق Meta"
        },
        steps: [
          {
            title: {
              en: "Open Meta Apps Dashboard",
              ar: "فتح لوحة تطبيقات Meta"
            },
            desc: {
              en: "Go to https://developers.facebook.com/apps/ to create a new Meta App.",
              ar: "اذهب إلى الرابط لإنشاء تطبيق Meta جديد."
            },
            url: "https://developers.facebook.com/apps/",
            image: "/whatsapp/app/step-1-open-apps.png"
          },

          {
            title: {
              en: "Create New App",
              ar: "إنشاء تطبيق جديد"
            },
            desc: {
              en: "Click 'Create App' to start creating your Meta application.",
              ar: "اضغط على 'Create App' لبدء إنشاء التطبيق."
            },
            image: "/whatsapp/app/step-2-create-app.png"
          },

          {
            title: {
              en: "Enter App Information",
              ar: "إدخال معلومات التطبيق"
            },
            desc: {
              en: "Enter app name (e.g. Madar-Integration) and your email address.",
              ar: "أدخل اسم التطبيق (مثل Madar-Integration) والبريد الإلكتروني."
            },
            image: "/whatsapp/app/step-3-app-info.png"
          },

          {
            title: {
              en: "Select Use Case",
              ar: "اختيار حالة الاستخدام"
            },
            desc: {
              en: "Choose 'Connect with customers through WhatsApp' as the use case.",
              ar: "اختر 'Connect with customers through WhatsApp' كحالة الاستخدام."
            },
            tip: {
              en: "Make sure to select WhatsApp-related use case for correct API setup.",
              ar: "تأكد من اختيار حالة استخدام WhatsApp لضمان إعداد صحيح للـ API."
            },
            image: "/whatsapp/app/step-4-use-case.png"
          },

          {
            title: {
              en: "Select Business Portfolio",
              ar: "اختيار Business Portfolio"
            },
            desc: {
              en: "Select your existing Business Portfolio that you created earlier.",
              ar: "اختر Business Portfolio الذي أنشأته مسبقاً."
            },
            image: "/whatsapp/app/step-5-business-portfolio.png"
          },
          {
            title: {
              en: "Review and Create App",
              ar: "مراجعة وإنشاء التطبيق"
            },
            desc: {
              en: "Review all app details and click 'Create App' to finish.",
              ar: "راجع جميع المعلومات ثم اضغط 'Create App' لإنهاء الإنشاء."
            },
            image: "/whatsapp/app/step-6-review.png"
          }
        ]
      },
      {
        label: {
          en: "Configure Meta App",
          ar: "إعداد تطبيق Meta"
        },
        steps: [
          {
            title: {
              en: "Open Basic Settings",
              ar: "فتح الإعدادات الأساسية"
            },
            desc: {
              en: "From your app dashboard, open Settings → Basic.",
              ar: "من لوحة تحكم التطبيق انتقل إلى Settings → Basic."
            },
            image: "/whatsapp/app-setup/step-1-basic-settings.png"
          },

          {
            title: {
              en: "Complete App Information",
              ar: "إكمال معلومات التطبيق"
            },
            desc: {
              en: "Fill in the required app information including Privacy Policy URL, App Category, and upload your business logo.",
              ar: "أكمل معلومات التطبيق المطلوبة مثل رابط سياسة الخصوصية، فئة التطبيق، ورفع شعار النشاط التجاري."
            },
            tip: {
              en: "The more complete your app information is, the fewer issues you may face later during Meta reviews.",
              ar: "كلما كانت معلومات التطبيق مكتملة، قلت المشاكل التي قد تواجهها لاحقاً أثناء مراجعات Meta."
            },
            image: "/whatsapp/app-setup/step-2-app-info.png"
          },

          {
            title: {
              en: "Save App ID and App Secret",
              ar: "حفظ App ID و App Secret"
            },
            desc: {
              en: "Copy and save your App ID and App Secret from the Basic Settings page. You will need them later.",
              ar: "انسخ واحفظ App ID و App Secret من صفحة الإعدادات الأساسية لأنك ستحتاج إليهما لاحقاً."
            },
            image: "/whatsapp/app-setup/step-3-app-id-secret.png"
          },

          {
            title: {
              en: "Open WhatsApp Product",
              ar: "فتح منتج WhatsApp"
            },
            desc: {
              en: "From the app dashboard, open 'Connect with customers through WhatsApp'.",
              ar: "من لوحة التطبيق افتح قسم 'Connect with customers through WhatsApp'."
            },
            image: "/whatsapp/app-setup/step-4-whatsapp-product.png"
          },

          {
            title: {
              en: "Open API Setup",
              ar: "فتح إعداد API"
            },
            desc: {
              en: "Select API Setup and choose the WhatsApp Business Account phone number you created earlier.",
              ar: "اختر API Setup ثم حدد رقم الهاتف المرتبط بحساب WhatsApp Business الذي أنشأته سابقاً."
            },
            tip: {
              en: "If no phone number is connected yet, click 'Add Phone Number' and complete the setup.",
              ar: "إذا لم يكن هناك رقم هاتف مرتبط بعد، اضغط 'Add Phone Number' وأكمل الإعداد."
            },
            image: "/whatsapp/app-setup/step-5-api-setup.png"
          },

          {
            title: {
              en: "Configure Webhook",
              ar: "إعداد Webhook"
            },
            desc: {
              en: "Scroll down to the Webhook section and click 'Configure Webhooks'.",
              ar: "مرر للأسفل إلى قسم Webhook ثم اضغط على 'Configure Webhooks'."
            },
            image: "/whatsapp/app-setup/step-6-webhook.png"
          },

          {
            title: {
              en: "Enter Webhook URL and Verify Token",
              ar: "إدخال رابط Webhook ورمز التحقق"
            },
            desc: {
              en: "Enter the webhook URL and verify token, then click Verify and Save.",
              ar: "أدخل رابط Webhook ورمز التحقق ثم اضغط Verify and Save."
            },
            tip: {
              en: "Verify Token: 86450596720785999902540762312566",
              ar: "رمز التحقق: 86450596720785999902540762312566"
            },
            copyableTip: {
              en: "Webhook URL: https://api.madartest.online/whatsapp/webhook",
              ar: "Webhook URL: https://api.madartest.online/whatsapp/webhook"
            },
            image: "/whatsapp/app-setup/step-7-webhook-url.png"
          },

          {
            title: {
              en: "Enable Webhook Events",
              ar: "تفعيل أحداث Webhook"
            },
            desc: {
              en: "Subscribe to the webhook events required by MADAR.",
              ar: "قم بتفعيل أحداث Webhook المطلوبة بواسطة MADAR."
            },
            tip: {
              en: "Required events: account_update, account_alerts, messages, template_category_update, message_template_components_update, message_template_quality_update, message_template_status_update",
              ar: "الأحداث المطلوبة: account_update, account_alerts, messages, template_category_update, message_template_components_update, message_template_quality_update, message_template_status_update"
            },
            image: "/whatsapp/app-setup/step-9-events.png"
          }
        ]
      },
      {
        label: {
          en: "Create Permanent Access Token",
          ar: "إنشاء رمز وصول دائم"
        },
        steps: [
          {
            title: {
              en: "Open Business Settings",
              ar: "فتح إعدادات النشاط التجاري"
            },
            desc: {
              en: "Go to Business Settings and open the System Users section.",
              ar: "انتقل إلى إعدادات النشاط التجاري وافتح قسم System Users."
            },
            url: "https://business.facebook.com/latest/settings/business_info",
            image: "/whatsapp/token/step-1-open-system-users.png"
          },

          {
            title: {
              en: "Create a System User",
              ar: "إنشاء مستخدم نظام"
            },
            desc: {
              en: "Create a new System User and choose the Admin role.",
              ar: "قم بإنشاء مستخدم نظام جديد واختر صلاحية Admin."
            },
            tip: {
              en: "If you already have an Admin System User, you can skip this step.",
              ar: "إذا كان لديك Admin System User بالفعل يمكنك تخطي هذه الخطوة."
            },
            image: "/whatsapp/token/step-2-create-system-user.png"
          },

          {
            title: {
              en: "Select the Admin System User",
              ar: "اختيار مستخدم النظام الإداري"
            },
            desc: {
              en: "Select the Admin System User you created earlier.",
              ar: "اختر مستخدم النظام الإداري الذي أنشأته سابقاً."
            },
            image: "/whatsapp/token/step-3-select-user.png"
          },
          {
            title: {
              en: "Assign Assets",
              ar: "ربط الأصول"
            },
            desc: {
              en: "Click 'Assign Assets' to grant the System User access to your Meta assets.",
              ar: "اضغط على 'Assign Assets' لمنح مستخدم النظام صلاحية الوصول إلى الأصول."
            },
            image: "/whatsapp/token/step-4-assign-assets.png"
          },

          {
            title: {
              en: "Assign Your App and Grant Full Control",
              ar: "ربط التطبيق ومنح التحكم الكامل"
            },
            desc: {
              en: "Click 'Assign Assets', choose Apps, select the Meta App you created earlier, then enable Full Control permissions and save your changes.",
              ar: "اضغط على 'Assign Assets' ثم اختر Apps وحدد تطبيق Meta الذي أنشأته سابقاً، وبعد ذلك فعّل صلاحية Full Control واحفظ التغييرات."
            },
            image: "/whatsapp/token/step-5-assign-app-full-control.png"
          },

          {
            title: {
              en: "Generate Access Token",
              ar: "إنشاء رمز الوصول"
            },
            desc: {
              en: "Click 'Generate New Token' from the selected System User.",
              ar: "اضغط على 'Generate New Token' من مستخدم النظام المحدد."
            },
            image: "/whatsapp/token/step-6-generate-token.png"
          },

          {
            title: {
              en: "Select Your Meta App",
              ar: "اختيار تطبيق Meta"
            },
            desc: {
              en: "Choose the Meta App you created earlier. The access token will be generated for this app.",
              ar: "اختر تطبيق Meta الذي أنشأته سابقاً. سيتم إنشاء رمز الوصول لهذا التطبيق."
            },
            image: "/whatsapp/token/step-7-select-app.png"
          },
          {
            title: {
              en: "Choose Token Expiration",
              ar: "اختيار مدة صلاحية الرمز"
            },
            desc: {
              en: "Choose 'Never' as the token expiration period to generate a permanent access token.",
              ar: "اختر 'Never' كمدة انتهاء الصلاحية لإنشاء رمز وصول دائم."
            },
            tip: {
              en: "A permanent token remains valid until it is manually revoked.",
              ar: "يبقى الرمز الدائم صالحاً حتى يتم إلغاؤه يدوياً."
            },
            image: "/whatsapp/token/step-8-token-expiration.png"
          },
          {
            title: {
              en: "Select WhatsApp Permissions",
              ar: "اختيار صلاحيات WhatsApp"
            },
            desc: {
              en: "Select the required WhatsApp permissions before generating the access token.",
              ar: "اختر صلاحيات WhatsApp المطلوبة قبل إنشاء رمز الوصول."
            },
            tip: {
              en: "Required permissions:\nwhatsapp_business_messaging\nwhatsapp_business_management",
              ar: "الصلاحيات المطلوبة:\nwhatsapp_business_messaging\nwhatsapp_business_management"
            },
            image: "/whatsapp/token/step-9-permissions.png"
          },

          {
            title: {
              en: "Save Access Token",
              ar: "حفظ رمز الوصول"
            },
            desc: {
              en: "Copy and save the generated Access Token. You will need it later when connecting your WhatsApp account to MADAR.",
              ar: "انسخ واحفظ Access Token الذي تم إنشاؤه لأنك ستحتاجه لاحقاً عند ربط حساب WhatsApp مع MADAR."
            },
            image: "/whatsapp/token/step-10-save-token.png"
          }
        ]
      },

      {
        label: {
          en: "Publish App & Connect to MADAR",
          ar: "نشر التطبيق وربطه مع MADAR"
        },
        steps: [
          {
            title: {
              en: "Open Your Meta App",
              ar: "فتح تطبيق Meta"
            },
            desc: {
              en: "Go to https://developers.facebook.com/apps/ and select the Meta App you created earlier.",
              ar: "اذهب إلى الرابط واختر تطبيق Meta الذي أنشأته سابقاً."
            },
            url: "https://developers.facebook.com/apps/",
            image: "/whatsapp/final/step-1-open-app.png"
          },

          {
            title: {
              en: "Publish the App",
              ar: "نشر التطبيق"
            },
            desc: {
              en: "Open the Publish section and publish your app.",
              ar: "افتح قسم Publish ثم قم بنشر التطبيق."
            },
            tip: {
              en: "Make sure all required app information has been completed before publishing.",
              ar: "تأكد من إكمال جميع معلومات التطبيق المطلوبة قبل النشر."
            },
            image: "/whatsapp/final/step-2-publish-app.png"
          },

          {
            title: {
              en: "Open WhatsApp Integration in MADAR",
              ar: "فتح تكامل WhatsApp في MADAR"
            },
            desc: {
              en: "Return to MADAR and open the manual WhatsApp integration form.",
              ar: "ارجع إلى MADAR وافتح نموذج ربط WhatsApp اليدوي."
            },
            image: "/whatsapp/final/step-3-open-madar.png"
          },

          {
            title: {
              en: "Enter Your WhatsApp Credentials",
              ar: "إدخال بيانات WhatsApp"
            },
            desc: {
              en: "Paste the information you collected during the previous steps and save the integration.",
              ar: "ألصق البيانات التي قمت بجمعها في الخطوات السابقة ثم احفظ عملية الربط."
            },
            tip: {
              en: "Required data:\n• Business Portfolio ID\n• WhatsApp Business Account ID (WABA ID)\n• Phone Number ID\n• Access Token",
              ar: "البيانات المطلوبة:\n• Business Portfolio ID\n• WhatsApp Business Account ID (WABA ID)\n• Phone Number ID\n• Access Token"
            },
            image: "/whatsapp/final/step-4-connect.png"
          },

          {
            title: {
              en: "Integration Complete",
              ar: "اكتمل الربط"
            },
            desc: {
              en: "Your WhatsApp Business Account is now connected to MADAR and ready to send and receive messages.",
              ar: "تم ربط حساب WhatsApp Business الخاص بك مع MADAR وأصبح جاهزاً لإرسال واستقبال الرسائل."
            },
            image: "/whatsapp/final/step-5-complete.png"
          }
        ]
      }
    ],
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
  },
};
// do not forgot to remove logo from setup app steps
const createManualAccountSchema = (t, isEditMode) =>
  yup.object({
    name: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.nameRequired")),

    phoneNumber: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.phoneNumberRequired")),

    phoneNumberId: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.phoneNumberIdRequired")),

    businessId: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.businessIdRequired")),

    accessToken: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.accessTokenRequired")),

    wabaId: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.wabaIdRequired")),

    appId: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.appIdRequired")),

    appSecret: isEditMode
      ? yup.string().trim()
      : yup.string().trim().required(t("validation.appSecretRequired")),
  });

function ManualAddAccountModal({ open, onOpenChange, onSuccess, account }) {
  const t = useTranslations("whatsApp.accounts.manualAddAccount");
  const [loading, setLoading] = useState(false);
  const isEditMode = !!account;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createManualAccountSchema(t, isEditMode)),
    defaultValues: {
      name: account?.name ?? "",
      phoneNumber: account?.mobileNumber ?? "",
      phoneNumberId: account?.phoneNumberId ?? "",
      businessId: account?.businessId ?? "",
      accessToken: "",
      wabaId: account?.wabaId ?? "",
      appId: account?.appId ?? "",
      appSecret: "",
    },
  });


  useEffect(() => {
    reset({
      name: account?.name ?? "",
      phoneNumber: account?.mobileNumber ?? "",
      phoneNumberId: account?.phoneNumberId ?? "",
      businessId: account?.businessId ?? "",
      accessToken: "",
      wabaId: account?.wabaId ?? "",
      appId: account?.appId ?? "",
      appSecret: "",
    });
  }, [account, reset]);
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      if (isEditMode) {
        const payload = Object.fromEntries(
          Object.entries(data).filter(
            ([, value]) => value !== "" && value !== undefined
          )
        );

        await api.put(
          `/whatsapp/${account.id}/manual-account`,
          payload
        );

        toast.success(t("updateSuccess"));
      } else {
        await api.post("/whatsapp/manual-add-account", data);
        toast.success(t("success"));
      }

      onSuccess();
      reset();
    } catch (err) {
      toast.error(normalizeAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("title")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("name")}{!isEditMode && "*"}</label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("phoneNumber")}{!isEditMode && "*"}</label>
            <Input {...register("phoneNumber")} />
            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("phoneNumberId")}{!isEditMode && "*"}</label>
            <Input {...register("phoneNumberId")} />
            {errors.phoneNumberId && <p className="text-xs text-destructive">{errors.phoneNumberId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("businessId")}{!isEditMode && "*"}</label>
            <Input {...register("businessId")} />
            {errors.businessId && <p className="text-xs text-destructive">{errors.businessId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("accessToken")}{!isEditMode && "*"}</label>
            <Input {...register("accessToken")} />
            {errors.accessToken && <p className="text-xs text-destructive">{errors.accessToken.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("wabaId")}{!isEditMode && "*"}</label>
            <Input {...register("wabaId")} />
            {errors.wabaId && <p className="text-xs text-destructive">{errors.wabaId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("appId")}{!isEditMode && "*"}</label>
            <Input {...register("appId")} />
            {errors.appId && <p className="text-xs text-destructive">{errors.appId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("appSecret")}{!isEditMode && "*"}</label>
            <Input {...register("appSecret")} />
            {errors.appSecret && <p className="text-xs text-destructive">{errors.appSecret.message}</p>}
          </div>
          <DialogFooter className="md:col-span-2">
            <Button_ type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} label={t("common.cancel")} />

            <Button_
              type="submit"
              size="sm"
              disabled={loading}
              label={
                loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isEditMode ? (
                  t("saveChanges")
                ) : (
                  t("saveChanges")
                )
              }
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WhatsAppGuideModal({ open, onOpenChange }) {
  const t = useTranslations("whatsApp.accounts.guide");
  const { user } = useAuth();
  const locale = useLocale();
  const meta = WHATSAPP_GUIDE_CONFIG;

  const tabs = meta?.guide?.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const currentSteps = tabs[activeTab]?.steps || [];
  const currentStep = currentSteps[activeStep] || {};

  // Handle next step: if current step is last in tab, go to next tab, first step
  const handleNext = useCallback(() => {
    if (activeStep < currentSteps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else if (activeTab < tabs.length - 1) {
      setActiveTab((prev) => prev + 1);
      setActiveStep(0);
    }
  }, [activeStep, activeTab, currentSteps.length, tabs.length]);

  const handlePrev = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    } else if (activeTab > 0) {
      const prevSteps = tabs[activeTab - 1]?.steps || [];

      setActiveTab((prev) => prev - 1);
      setActiveStep(prevSteps.length - 1);
    }
  }, [activeStep, activeTab, tabs]);

  const isAr = locale === "ar";
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (previewImage) {
        return; // Let ImagePreviewModal handle ESC
      }
      if (e.key === "ArrowLeft") {
        if (isAr)
          handleNext();
        else
          handlePrev();
      } else if (e.key === "ArrowRight") {
        if (isAr)
          handlePrev();
        else
          handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeTab, activeStep, previewImage, handlePrev, handleNext, isAr]);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onOpenChange()}>
        <DialogContent
          onEscapeKeyDown={(e) => {
            if (previewImage) {
              // 1. Stop Radix from closing the main dialog
              e.preventDefault();

              // 2. Close your image preview instead
              setPreviewImage(null);
            }
          }}
          onPointerDownOutside={(e) => {
            if (previewImage) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (previewImage) {
              e.preventDefault();
            }
          }}
          className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0!">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <HelpCircle size={20} />
              </div>
              {t("title")}
            </DialogTitle>
            <DialogDescription>
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="overflow-y-auto max-h-[calc(90vh-110px)] p-6 pt-0!">
            <div className="flex border-b border-[var(--border)] gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab(i);
                    setActiveStep(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${activeTab === i
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    }`}
                >
                  {pick(tab.label, locale)}
                </button>
              ))}
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + "-" + activeStep}
                initial={{ opacity: 0, x: locale?.startsWith("ar") ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: locale?.startsWith("ar") ? 12 : -12 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5"
                    style={{
                      background: `linear-gradient(135deg, rgb(var(--primary-from)), rgb(var(--primary-to)))`,
                    }}
                  >
                    {activeStep + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--card-foreground)]">
                      {pick(currentStep?.title, locale)}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-1">
                      {pick(currentStep?.desc, locale)}
                    </p>
                    {currentStep?.url && (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                        {(() => {
                          // If URL is a function, call it with user (replace with your param)
                          const url =
                            typeof currentStep.url === "function"
                              ? currentStep.url(user)
                              : currentStep.url;

                          return (
                            <>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {url}
                              </a>

                              <button
                                onClick={() => navigator.clipboard.writeText(url)}
                                className="text-xs font-medium px-2 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 transition"
                              >
                                <Copy size={12} className="text-primary" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {currentStep?.image && (
                  <div
                    className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative cursor-zoom-in hover:ring-2 hover:ring-[var(--primary)]/30 transition-all"
                    style={{ minHeight: 250 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(currentStep.image);
                    }}
                  >
                    {/* Skeleton / placeholder shown while image loads */}
                    {!imgLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full h-full rounded-xl bg-[var(--muted)] animate-pulse" />
                      </div>
                    )}

                    <img
                      src={currentStep.image}
                      alt={pick(currentStep.title, locale)}
                      loading="lazy"
                      width={1200}
                      height={700}
                      onLoad={() => setImgLoaded(true)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        setImgLoaded(false);
                      }}
                      className={`w-full h-full max-h-[350px] object-contain block transition-opacity duration-200 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                      style={{ display: "block" }}
                    />

                    {/* fallback UI */}
                    <div
                      style={{ display: "none" }}
                      className="h-44 flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]"
                    >
                      <ImageIcon size={28} className="opacity-30" />
                      <p className="text-xs">{t("imagePlaceholder")}</p>
                    </div>
                  </div>
                )}

                {currentStep?.tip && (
                  <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
                    <div className="flex gap-2.5">
                      <Info
                        size={14}
                        className="text-[var(--primary)] flex-shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-[var(--foreground)] leading-relaxed">
                        {pick(currentStep.tip, locale)}
                      </p>
                    </div>

                  </div>
                )}
                {currentStep.copyableTip && (
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-dashed border-[var(--primary)]/20 ml-6">
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">
                      {pick(currentStep.copyableTip, locale)}
                    </span>

                    <button
                      onClick={() => {
                        const textToCopy = pick(currentStep.copyableTip, locale);
                        navigator.clipboard.writeText(textToCopy);
                      }}
                      className="text-xs font-medium px-2 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 transition flex-shrink-0"
                    >
                      <Copy size={12} className="text-primary" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step Navigation */}
            <div className="border-t border-[var(--border)] py-4 flex items-center justify-between gap-3">
              <GhostBtn
                onClick={handlePrev}
                className={activeTab === 0 && activeStep === 0 ? "opacity-30 pointer-events-none" : ""}
              >
                <ChevronLeft
                  size={14}
                  className={
                    "rtl:-rotate-180 rtl:transition-transform ltr:transition-transform"
                  }
                />{" "}
                {t("prev")}
              </GhostBtn>

              <div className="flex items-center gap-1.5">
                {currentSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === activeStep ? "16px" : "6px",
                      height: "6px",
                      background:
                        i === activeStep
                          ? `rgb(var(--primary-from))`
                          : "var(--border)",
                    }}
                  />
                ))}
              </div>

              {activeTab < tabs.length - 1 || activeStep < currentSteps.length - 1 ? (
                <PrimaryBtn onClick={handleNext}>
                  {t("next")}
                  <ChevronRight
                    size={14}
                    className={
                      "rtl:rotate-180 rtl:transition-transform ltr:transition-transform"
                    }
                  />
                </PrimaryBtn>
              ) : meta?.guide?.docsUrl ? (
                <a
                  href={meta.guide.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PrimaryBtn>
                    <ExternalLink size={13} /> {t("docs")}
                  </PrimaryBtn>
                </a>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        src={previewImage}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}

function buildListQuery({ page, per_page, search, filters }) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(per_page));
  params.set("sortBy", "createdAt");
  params.set("sortDir", "DESC");
  if (search?.trim()) params.set("search", search.trim());
  if (filters?.isActive && filters.isActive !== "all") params.set("isActive", filters.isActive);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  return params.toString();
}


// --- Integration Progress Modal ---
const IntegrationProgressModal = ({ isOpen, onClose, steps }) => {
  const t = useTranslations("whatsApp.accounts.signupProgress");

  // Sort steps for display
  const stepKeys = [
    'EXCHANGING_TOKEN',
    'FETCHING_PHONE_DATA',
    'SUBSCRIBING_APP',
    'REGISTERING_PHONE',
    'CREATING_ACCOUNT',
    'SYNCING_TEMPLATES'
  ];

  const isFailed = steps.FAILED?.status === 'failed';
  const isCompleted = steps.COMPLETED?.status === 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={!isCompleted && !isFailed ? undefined : onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className={cn("w-5 h-5 animate-spin text-primary", (isCompleted || isFailed) && "hidden")} />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {isFailed ? t("steps.FAILED") : isCompleted ? t("steps.COMPLETED") : t("status.in_progress")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {stepKeys.map((key) => {
            const step = steps[key] || { status: 'pending' };

            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                    step.status === 'completed' && "bg-green-500 border-green-500 text-white",
                    step.status === 'in_progress' && "bg-primary/10 border-primary text-primary",
                    step.status === 'failed' && "bg-red-500 border-red-500 text-white",
                    step.status === 'warning' && "bg-amber-500 border-amber-500 text-white",
                    step.status === 'pending' && "bg-gray-50 border-gray-200 text-gray-400"
                  )}>
                    {step.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {step.status === 'in_progress' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {step.status === 'failed' && <X className="w-4 h-4" />}
                    {step.status === 'warning' && <AlertCircle className="w-4 h-4" />}
                    {step.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium truncate",
                    step.status === 'pending' && "text-gray-400",
                    step.status === 'failed' && "text-red-600"
                  )}>
                    {t(`steps.${key}`)}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  step.status === 'completed' && "bg-green-50 text-green-700 border-green-100",
                  step.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-100",
                  step.status === 'failed' && "bg-red-50 text-red-700 border-red-100",
                  step.status === 'warning' && "bg-amber-50 text-amber-700 border-amber-100",
                  step.status === 'pending' && "bg-gray-50 text-gray-400 border-gray-100"
                )}>
                  {t(`status.${step.status}`)}
                </span>
              </div>
            );
          })}

          {isFailed && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-800">{t("steps.FAILED")}</p>
                <p className="text-xs text-red-600 leading-relaxed">{steps.FAILED?.error || t("errors.general")}</p>
              </div>
            </div>
          )}

          {steps.SYNCING_TEMPLATES?.status === 'warning' && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">{t("status.warning")}</p>
                <p className="text-xs text-amber-600 leading-relaxed">{steps.SYNCING_TEMPLATES?.error || t("errors.templates")}</p>
              </div>
            </div>
          )}
        </div>

        {(isCompleted || isFailed) && (
          <DialogFooter>
            <Button_ size="sm" label={t("close")} tone="primary" variant="solid" onClick={onClose} className="w-full" />

          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function WhatsAppAccountsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("whatsApp.accounts");
  const tTutorial = useTranslations("tutorial.whatsapp.accounts");
  const { settings, isSettingsLoading } = usePlatformSettings();
  const { patch, saveSetting, refreshOrdersSettings } = useOrdersSettings();
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce({ value: search });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    isActive: "all",
    startDate: "",
    endDate: "",
  });
  const [pager, setPager] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 12,
    records: [],
  });
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteState, setDeleteState] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const { handleExport, exportLoading } = useExport();

  const [toggleState, setToggleState] = useState({ open: false, row: null });
  const [toggling, setToggling] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [stats, setStats] = useState({
    deliveryRate: 0,
    readRate: 0,
    newConversations: 0,
    failureRate: 0,
  });

  const statsCards = useMemo(() => [
    { name: t("stats.deliveryRate"), value: `${stats.deliveryRate}%`, icon: CheckCircle2, color: "#10b981", description: tTutorial("stats.deliveryRate.description"), example: tTutorial("stats.deliveryRate.example") },
    { name: t("stats.readRate"), value: `${stats.readRate}%`, icon: Eye, color: "#3b82f6", description: tTutorial("stats.readRate.description"), example: tTutorial("stats.readRate.example") },
    { name: t("stats.newConversations"), value: stats.newConversations, icon: MessageSquare, color: "#8b5cf6", description: tTutorial("stats.newConversations.description"), example: tTutorial("stats.newConversations.example") },
    { name: t("stats.failureRate"), value: `${stats.failureRate}%`, icon: AlertCircle, color: "#f59e0b", description: tTutorial("stats.failureRate.description"), example: tTutorial("stats.failureRate.example") },
  ], [t, tTutorial, stats]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/whatsapp-accounts/stats");
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccounts = async ({ page = 1, per_page = 12 } = {}) => {
    setLoading(true);
    try {
      const qs = buildListQuery({ page, per_page, search: debouncedSearch, filters });
      const res = await api.get(`/whatsapp-accounts?${qs}`);
      setPager({
        total_records: res.data?.total_records ?? 0,
        current_page: res.data?.current_page ?? page,
        per_page: res.data?.per_page ?? per_page,
        records: res.data?.records ?? [],
      });
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAccounts({ page: 1, per_page: pager.per_page });
  }, [debouncedSearch]);

  const applyFilters = () => {
    fetchAccounts({ page: 1, per_page: pager.per_page });
  };

  const handlePageChange = ({ page, per_page }) => {
    fetchAccounts({ page, per_page });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.isActive && filters.isActive !== "all") ||
      Boolean(filters.startDate?.trim()) ||
      Boolean(filters.endDate?.trim())
    );
  }, [filters]);

  const openToggleConfirm = useCallback((row) => {
    setToggleState({ open: true, row });
  }, []);

  const confirmToggle = async () => {
    if (!toggleState.row?.id) return;
    setToggling(true);
    try {
      await api.patch(`/whatsapp-accounts/${toggleState.row.id}/toggle-active`);
      setToggleState({ open: false, row: null });
      toast.success(t("messages.updateSuccess"));
      await fetchAccounts({ page: pager.current_page, per_page: pager.per_page });
      fetchStats();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setToggling(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/whatsapp-accounts/${deleteState.id}`);
      setDeleteState({ open: false, id: null });
      toast.success(t("messages.deleteSuccess"));
      await fetchAccounts({ page: pager.current_page, per_page: pager.per_page });
      fetchStats();
    } catch (e) {
      toast.error(normalizeAxiosError(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncTemplates = async (accountId) => {
    setShowProgress(true);
    setSignupSteps({
      EXCHANGING_TOKEN: { status: 'completed' },
      FETCHING_PHONE_DATA: { status: 'completed' },
      SUBSCRIBING_APP: { status: 'completed' },
      REGISTERING_PHONE: { status: 'completed' },
      CREATING_ACCOUNT: { status: 'completed' },
    });

    try {
      await api.post(`/whatsapp/accounts/${accountId}/sync-templates`);
    } catch (e) {
      console.error("Manual sync failed", e);
      // Errors are handled via socket
    }
  };

  const onExport = async () => {
    await handleExport({
      endpoint: "/whatsapp-accounts/export",
      params: { search: search.trim() || undefined, ...filters },
      filename: `whatsapp_accounts_${Date.now()}.xlsx`,
    });
  };

  const columns = useMemo(
    () => [
      {
        header: t("table.name"),
        key: "name",
        className: "font-bold text-gray-700 dark:text-slate-200",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="font-bold">{row.name}</div>
            </div>
          </div>
        ),
      },
      {
        header: t("table.number"),
        key: "mobileNumber",
        cell: (row) => <span className="font-mono">{row.mobileNumber || "—"}</span>,
      },
      {
        header: t("table.connectDate"),
        key: "createdAt",
        cell: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
      },
      {
        header: t("table.status"),
        key: "isActive",
        cell: (row) => (
          <div
            className={cn(
              "font-bold text-xs",
              row.isActive ? "text-emerald-600" : "text-slate-400"
            )}
          >
            {row.isActive ? t("table.active") : t("table.disabled")}
          </div>
        ),
      },
      {
        header: t("table.actions"),
        key: "actions",
        cell: (row) => (
          <ActionButtons
            row={row}
            actions={[
              {
                icon: <RefreshCw size={16} />,
                tooltip: t("actions.syncTemplates"),
                onClick: () => handleSyncTemplates(row.id),
                variant: "primary",
                permission: "whatsapp.manage",
              },
              {
                icon: <Power size={16} />,
                tooltip: row.isActive ? t("actions.disable") : t("actions.enable"),
                onClick: () => openToggleConfirm(row),
                variant: row.isActive ? "orange" : "emerald",
                permission: "whatsapp.update_account",
              },
              {
                icon: <Edit2 size={16} />,
                tooltip: t("actions.edit"),
                onClick: () => {
                  setEditingAccount(row);
                  setManualModalOpen(true);
                },
                variant: "primary",
                permission: "whatsapp.manage",
                hidden: !row?.isCreatedManual,
              },
              // {
              //   icon: <Trash2 size={16} />,
              //   tooltip: t("actions.delete"),
              //   onClick: () => setDeleteState({ open: true, id: row.id }),
              //   variant: "red",
              // },
            ]}
          />
        ),
      },
    ],
    [t, openToggleConfirm]
  );

  const authRef = useRef(null);
  const wabaRef = useRef(null);

  useEffect(() => {

    const handler = (event) => {
      if (event.origin !== "https://www.facebook.com") return;

      try {

        const data = JSON.parse(event.data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") {
            wabaRef.current = data.data;
            trySend();
          }
        }
      } catch (error) {
        console.log(error);
        // non-JSON postMessage
      }
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  const fbLoginCallback = (response) => {

    if (response.authResponse?.code) {
      authRef.current = response.authResponse.code;
      trySend();
    }
  };

  const { subscribe } = useSocket();

  // Integration Progress State
  const [showProgress, setShowProgress] = useState(false);
  const [signupSteps, setSignupSteps] = useState({});

  useEffect(() => {
    const unsubscribe = subscribe("WHATSAPP_SIGNUP_STATUS", (payload) => {
      if (!payload) return;
      
      setSignupSteps(prev => ({
        ...prev,
        [payload.step]: {
          status: payload.status,
          message: payload.message,
          error: payload.error
        }
      }));
      
      if (payload.step === 'COMPLETED' || (payload.step === 'SYNCING_TEMPLATES' && payload.status === "warning")) {
        // Update the default WhatsApp account in the context and save it
        refreshOrdersSettings();
      }
    });

    return unsubscribe;
  }, [subscribe, patch, saveSetting]);

  const trySend = async () => {
    if (!authRef.current || !wabaRef.current) return;

    setShowProgress(true);
    setSignupSteps({}); // Reset steps

    const signupPromise = api.post("/whatsapp/embedded-signup", {
      code: authRef.current,
      wabaId: wabaRef.current?.waba_id,
      phoneNumberId: wabaRef.current?.phone_number_id,
      businessId: wabaRef.current?.business_id
    });

    try {
      await signupPromise;
      authRef.current = null;
      wabaRef.current = null;
      setSearch("");
      await fetchAccounts({ page: 1, per_page: pager.per_page });
      await fetchStats();
    } catch (err) {
      authRef.current = null;
      wabaRef.current = null;
      // Error is handled via socket status updates as well
      console.error("Signup failed", err);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      toast.error(t("messages.facebookSdkNotInitialized"));
      return;
    }
    window.FB.login(fbLoginCallback, {
      config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { version: process.env.NEXT_PUBLIC_FB_EMBEDDED_ACCOUNT_SIGNUP_VERSION },
    });
  };

  const toggleDialogTitle =
    toggleState.row?.isActive === true ? t("toggle.disableTitle") : t("toggle.enableTitle");
  const toggleDialogDescription =
    toggleState.row?.isActive === true ? t("toggle.disableDescription") : t("toggle.enableDescription");

  return (
    <div className="min-h-screen p-5 space-y-6">
      <PageHeader
        breadcrumbs={[
          { name: t("breadcrumb.home"), href: "/dashboard" },
          { name: t("breadcrumb.whatsapp"), href: "/whatsapp" },
          { name: t("breadcrumb.accounts") },
        ]}
        buttons={
          <>
            <Button_
              size="sm"
              label={settings?.whatsappIntegrationMode === "manual" ? t("howIntegrate") : tCommon("howToUse")}
              tone="outline"
              variant="ghost"
              onClick={() => settings?.whatsappIntegrationMode === "manual" ? setGuideModalOpen(true) : () => { }}
              icon={<Info size={15} />}
            />
            <Button_
              size="sm"
              label={t("actions.openSettings")}
              variant="outline"
              permission="whatsapp.manage"
              onClick={() => setSettingsOpen(true)}
              icon={<Settings size={18} />}
            />
            {!isSettingsLoading && (
              <>
                {settings?.whatsappIntegrationMode === "embedded_signup" && (
                  <Button_
                    size="sm"
                    label={t("toolbar.addAccount")}
                    variant="solid"
                    permission="whatsapp.manage"
                    icon={<Plus size={18} />}
                    onClick={launchWhatsAppSignup}
                  />
                )}
                {settings?.whatsappIntegrationMode === "manual" && (
                  <Button_
                    size="sm"
                    label={t("toolbar.addAccount")}
                    variant="solid"
                    permission="whatsapp.manage"
                    icon={<Plus size={18} />}
                    onClick={() => setManualModalOpen(true)}
                  />
                )}
              </>
            )}
          </>
        }
        stats={statsCards}
      />

      <Table
        isLoading={loading}
        data={pager.records}
        columns={columns}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        labels={{
          searchPlaceholder: t("toolbar.searchPlaceholder"),
          filter: t("toolbar.filter"),
          apply: t("filters.apply"),
          total: tCommon("total"),
          limit: tCommon("limit"),
          emptyTitle: t("table.empty"),
        }}
        actions={[
          {
            key: "export",
            label: t("toolbar.export"),
            icon: exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />,
            color: "primary",
            onClick: onExport,
            disabled: exportLoading,
            permission: "whatsapp.read",
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onApplyFilters={applyFilters}
        pagination={{
          total_records: pager.total_records,
          current_page: pager.current_page,
          per_page: pager.per_page,
        }}
        filters={
          <>
            <FilterField label={t("filters.isActive")}>
              <Select
                value={filters.isActive || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder={t("filters.isActivePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.isActiveAll")}</SelectItem>
                  <SelectItem value="true">{t("filters.isActiveActive")}</SelectItem>
                  <SelectItem value="false">{t("filters.isActiveInactive")}</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            {/* 
            <FilterField label={t("filters.startDate")}>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="h-10 rounded-xl text-sm"
              />
            </FilterField>

            <FilterField label={t("filters.endDate")}>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="h-10 rounded-xl text-sm"
              />
            </FilterField> */}
          </>
        }
      />

      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        title={t("delete.title")}
        description={t("delete.description")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={toggleState.open}
        onOpenChange={(open) => setToggleState((s) => ({ ...s, open, row: open ? s.row : null }))}
        title={toggleDialogTitle}
        description={toggleDialogDescription}
        confirmText={tCommon("confirm")}
        cancelText={tCommon("cancel")}
        loading={toggling}
        onConfirm={confirmToggle}
      />

      <IntegrationProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        steps={signupSteps}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl min-w-[1000px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="text-primary" />
              {t("settingsDialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <WhatsAppTab hideAccount={false} onSave={() => setSettingsOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <ManualAddAccountModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        onSuccess={() => {
          setManualModalOpen(null);
          fetchAccounts({ page: 1, per_page: pager.per_page });
          fetchStats();
          refreshOrdersSettings();
        }}
      />

      <ManualAddAccountModal
        open={manualModalOpen}
        onOpenChange={(open) => {
          setManualModalOpen(open);

          if (!open) {
            setEditingAccount(null);
          }
        }}
        account={editingAccount}
        onSuccess={() => {
          setEditingAccount(null);
          setManualModalOpen(null);
          fetchAccounts({ page: 1, per_page: pager.per_page });
          fetchStats();
          refreshOrdersSettings();
        }}
      />
      <WhatsAppGuideModal
        open={guideModalOpen}
        onOpenChange={setGuideModalOpen}
      />
    </div>
  );
}

