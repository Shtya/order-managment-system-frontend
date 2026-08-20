
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BASE_CONFIG } from '@/app/[locale]/automations/atoms/automation-config';
import { useAuth } from '@/context/AuthContext';

export function useAutomationConfig() {
  const t = useTranslations('whatsApp.automations.builder');
  const { user } = useAuth();
  const userEmail = user?.email?.toLowerCase();

  return useMemo(() => {
    const filterByAllowedEmails = (items) => {
      return items.filter(item => {
        if (!item.allowedEmails?.length) return true;
        return userEmail && item.allowedEmails.includes(userEmail);
      });
    };

    return {
      TRIGGERS: {
        label: t('sidebar.triggers'),
        categories: BASE_CONFIG.TRIGGERS.categories.map(category => ({
          ...category,
          label: t(`sidebar.${category.id === 'INTERNAL' ? 'internalSystem' : category.id.toLowerCase()}`),
          items: filterByAllowedEmails(category.items).map(item => ({
            ...item,
            label: t(`triggerTypes.${item.id}`)
          }))
        }))
      },
      ACTIONS: {
        label: t('sidebar.actions'),
        categories: BASE_CONFIG.ACTIONS.categories.map(category => ({
          ...category,
          label: t(`sidebar.${category.id === 'INTERNAL' ? 'internalSystem' : category.id.toLowerCase()}`),
          items: filterByAllowedEmails(category.items).map(item => ({
            ...item,
            label: t(`actionTypes.${item.id}`)
          }))
        }))
      },
      CONDITIONS: {
        label: t('sidebar.conditions'),
        categories: BASE_CONFIG.CONDITIONS.categories.map(category => ({
          ...category,
          label: t(`sidebar.${category.id === 'LOGIC' ? 'logic' : category.id.toLowerCase()}`),
          items: filterByAllowedEmails(category.items).map(item => ({
            ...item,
            label: t(`conditionTypes.${item.id}`)
          }))
        }))
      }
    };
  }, [t, userEmail]);
}
