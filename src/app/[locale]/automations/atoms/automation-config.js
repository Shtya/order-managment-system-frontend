import { ShoppingCart, MessageSquare, RefreshCw, Zap, GitBranch, Users, MessageCircle } from 'lucide-react';

/**
 * Automation Configuration
 * This file defines all available triggers, actions, and conditions.
 * Each item can have an optional config component for user input.
 */

export const BASE_CONFIG = {
    TRIGGERS: {
        categories: [
            {
                id: 'INTERNAL',
                items: [
                    {
                        id: 'order_created',
                        icon: ShoppingCart,
                        type: 'trigger',
                        configComponent: 'OrderCreatedConfig',
                        className: 'max-w-xl!'
                    },
                    {
                        id: 'order_updated',
                        icon: RefreshCw,
                        type: 'trigger',
                        configComponent: 'OrderStatusUpdatedConfig',
                        className: 'max-w-xl!'
                    }
                ]
            }
        ]
    },
    ACTIONS: {
        categories: [
            {
                id: 'INTERNAL',
                items: [
                    {
                        id: 'update_order_status',
                        icon: RefreshCw,
                        type: 'action',
                        configComponent: 'UpdateOrderStatusConfig',
                        className: 'max-w-xl!'
                    },
                    {
                        id: 'send_whatsapp_template',
                        icon: MessageSquare,
                        type: 'action',
                        configComponent: 'SendWhatsappTemplateConfig',
                        className: 'max-w-4xl!',
                        hasCustom: true
                    },
                    {
                        id: 'send_whatsapp_message',
                        icon: MessageCircle,
                        type: 'action',
                        configComponent: 'SendWhatsappMessageConfig',
                        className: 'max-w-4xl!',
                        hasCustom: true
                    },
                    {
                        id: 'send_upsell',
                        icon: Zap,
                        type: 'action',
                        noEdit: true,
                        configComponent: 'SendUpsellConfig',
                        className: 'max-w-xl!'
                    },
                    {
                        id: 'assign_order_to_employee',
                        icon: Users,
                        type: 'action',
                        configComponent: 'AssignOrderToEmployeeConfig',
                        className: 'max-w-xl!',
                        hasCustom: true
                    }
                ]
            }
        ]
    },
    CONDITIONS: {
        categories: [
            {
                id: 'LOGIC',
                items: [
                    {
                        id: 'order_check',
                        icon: GitBranch,
                        type: 'condition',
                        configComponent: 'OrderCheckConfig',
                        className: 'max-w-7xl!',
                        hasCustom: true
                    },
                    {
                        id: 'quick_order_status',
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

// Keep AUTOMATION_CONFIG for backwards compatibility (deprecated)
export const AUTOMATION_CONFIG = BASE_CONFIG;
