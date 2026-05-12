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
                        id: 'ORDER_CREATED',
                        label: 'إنشاء طلب جديد',
                        icon: ShoppingCart,
                        type: 'trigger',
                        configComponent: 'OrderCreatedConfig'
                    },
                    {
                        id: 'ORDER_STATUS_UPDATED',
                        label: 'تحديث حالة الطلب',
                        icon: RefreshCw,
                        type: 'trigger',
                        configComponent: 'OrderStatusUpdatedConfig'
                    }
                ]
            },
            {
                id: 'WHATSAPP',
                label: 'واتساب',
                items: [
                    {
                        id: 'WHATSAPP_INCOMING',
                        label: 'رسالة واردة جديدة',
                        icon: MessageSquare,
                        type: 'trigger',
                        configComponent: 'WhatsappIncomingConfig'
                    }
                ]
            }
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
                        id: 'UPDATE_ORDER_STATUS',
                        label: 'تحديث حالة الطلب',
                        icon: RefreshCw,
                        type: 'action',
                        configComponent: 'UpdateOrderStatusConfig'
                    }
                ]
            },
            {
                id: 'WHATSAPP',
                label: 'واتساب',
                items: [
                    {
                        id: 'SEND_WHATSAPP_TEMPLATE',
                        label: 'إرسال قالب واتساب',
                        icon: MessageSquare,
                        type: 'action',
                        configComponent: 'SendWhatsappTemplateConfig'
                    }
                ]
            }
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
                        id: 'ORDER_CHECK',
                        label: 'فحص بيانات الطلب',
                        icon: GitBranch,
                        type: 'condition',
                        configComponent: 'OrderCheckConfig'
                    },
                    {
                        id: 'QUICK_ORDER_STATUS',
                        label: 'فحص سريع للحالة',
                        icon: Zap,
                        type: 'condition',
                        configComponent: 'QuickOrderStatusConfig'
                    }
                ]
            }
        ]
    }
};
