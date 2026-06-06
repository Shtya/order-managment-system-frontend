import { ShoppingCart, UserPlus, Clock, MessageSquare, RefreshCw, Zap, Bell, GitBranch, MousePointerClick } from 'lucide-react';

/**
 * Automation Configuration
 * This file defines all available triggers, actions, and conditions.
 * Each item can have an optional config component for user input.
 */

export const AUTOMATION_CONFIG = {
    TRIGGERS: {
        label: 'المحفزات',
        categories: [
            {
                id: 'INTERNAL',
                label: 'نظام داخلي',
                items: [
                    {
                        id: 'order_created',
                        label: 'إنشاء طلب جديد',
                        icon: ShoppingCart,
                        type: 'trigger',
                        configComponent: 'OrderCreatedConfig',
                        className: 'max-w-xl!'
                    },
                    {
                        id: 'order_updated',
                        label: 'تحديث حالة الطلب',
                        icon: RefreshCw,
                        type: 'trigger',
                        configComponent: 'OrderStatusUpdatedConfig',
                        className: 'max-w-xl!'
                    }
                ]
            },
            // {
            //     id: 'WHATSAPP',
            //     label: 'واتساب',
            //     items: [
            //         {
            //             id: 'WHATSAPP_INCOMING',
            //             label: 'رسالة واردة جديدة',
            //             icon: MessageSquare,
            //             type: 'trigger',
            //             configComponent: 'WhatsappIncomingConfig'
            //         }
            //     ]
            // }
        ]
    },
    ACTIONS: {
        label: 'الإجراءات',
        categories: [
            {
                id: 'INTERNAL',
                label: 'نظام داخلي',
                items: [
                    {
                        id: 'update_order_status',
                        label: 'تحديث حالة الطلب',
                        icon: RefreshCw,
                        type: 'action',
                        configComponent: 'UpdateOrderStatusConfig',
                        className: 'max-w-xl!'
                    },
                    {
                        id: 'send_whatsapp_template',
                        label: 'إرسال قالب واتساب',
                        icon: MessageSquare,
                        type: 'action',
                        configComponent: 'SendWhatsappTemplateConfig',
                        className: 'max-w-4xl!',
                        hasCustom: true    
                    },
                    {
                        id: "send_upsell",
                        label: "إرسال عرض",
                        icon: Zap,
                        type: "action",
                        noEdit: true,
                        configComponent: "SendUpsellConfig",
                        className: "max-w-xl!"
                    }
                ]
            }
            // {
            //     id: 'WHATSAPP',
            //     label: 'واتساب',
            //     items: [
            //         {
            //             id: 'send_whatsapp_template',
            //             label: 'إرسال قالب واتساب',
            //             icon: MessageSquare,
            //             type: 'action',
            //             configComponent: 'SendWhatsappTemplateConfig',
            //             className: 'max-w-2xl!'
            //         }
            //     ]
            // }
        ]
    },
    CONDITIONS: {
        label: 'الشروط',
        categories: [
            {
                id: 'LOGIC',
                label: 'منطق',
                items: [
                    {
                        id: 'order_check',
                        label: 'فحص بيانات الطلب',
                        icon: GitBranch,
                        type: 'condition',
                        configComponent: 'OrderCheckConfig',
                        className: 'max-w-7xl!',
                        hasCustom: true
                    },
                    {
                        id: 'quick_order_status',
                        label: 'فحص سريع للحالة',
                        icon: Zap,
                        type: 'condition',
                        configComponent: 'QuickOrderStatusConfig',
                        className: 'max-w-xl!'
                    }
                ]
            }
        ]
    }
};
