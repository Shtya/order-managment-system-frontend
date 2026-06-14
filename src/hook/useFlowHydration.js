
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { hydrateNodeConfig } from '../utils/flow-hydration';

export function useFlowHydration() {
  const t = useTranslations();

  const localizedHydrateNodeConfig = useCallback(
    (type, config, isSuperAdmin) => {
      return hydrateNodeConfig(type, config, isSuperAdmin, t);
    },
    [t],
  );

  return { hydrateNodeConfig: localizedHydrateNodeConfig };
}
