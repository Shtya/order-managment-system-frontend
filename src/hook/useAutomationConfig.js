
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BASE_CONFIG } from '@/app/[locale]/automations/atoms/automation-config';

export function useAutomationConfig() {
  const t = useTranslations('whatsApp.automations.builder');

  return useMemo(() => {
    return {
      TRIGGERS: {
        label: t('sidebar.triggers'),
        categories: BASE_CONFIG.TRIGGERS.categories.map(category => ({
          ...category,
          label: t(`sidebar.${category.id === 'INTERNAL' ? 'internalSystem' : category.id.toLowerCase()}`),
          items: category.items.map(item => ({
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
          items: category.items.map(item => ({
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
          items: category.items.map(item => ({
            ...item,
            label: t(`conditionTypes.${item.id}`)
          }))
        }))
      }
    };
  }, [t]);
}
