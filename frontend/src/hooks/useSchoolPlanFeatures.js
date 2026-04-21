import { useEffect, useCallback } from 'react';
import useSubscriptionStore from '../store/subscriptionStore';

/**
 * Loads `/subscription/usage` and exposes per-feature checks.
 * @returns {{
 *   usage: object | null,
 *   ready: boolean,
 *   feature: (key: string) => boolean | null
 * }}
 * `feature(key)` returns `null` while usage is still loading, then boolean from effective features.
 */
export function useSchoolPlanFeatures() {
  const { usage, fetchUsage } = useSubscriptionStore();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const ready = usage != null;

  const feature = useCallback(
    (key) => {
      if (!usage?.features) return null;
      return !!usage.features[key];
    },
    [usage]
  );

  return { usage, ready, feature };
}
