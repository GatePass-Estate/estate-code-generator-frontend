import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/src/shared/utils/logger';
import type { TierFlags } from '@/src/features/ai/utils/aiTierState';

/**
 * Tiers this device just bought (paid but not yet installed) and just cancelled. The server
 * keeps reporting a cancelled tier as active until the period ends, so cancellations are
 * remembered per estate in AsyncStorage under `storageKey` (null = no estate yet).
 */
export function useTierBookkeeping(storageKey: string | null) {
  const [justPurchasedTiers, setJustPurchasedTiers] = useState<TierFlags>({});
  const [justCancelledTiers, setJustCancelledTiers] = useState<TierFlags>({});

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (stored) setJustCancelledTiers(JSON.parse(stored));
      })
      .catch((error) => logger.error('Could not load cancelled tiers', error));
  }, [storageKey]);

  const markTierPurchased = useCallback((tierKey: string, purchased: boolean) => {
    setJustPurchasedTiers((prev) => ({ ...prev, [tierKey]: purchased }));
  }, []);

  const markTierCancelled = useCallback(
    (tierKey: string, cancelled: boolean) => {
      setJustCancelledTiers((prev) => {
        const next = { ...prev, [tierKey]: cancelled };
        if (storageKey) {
          AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch((error) =>
            logger.error('Could not save cancelled tiers', error)
          );
        }
        return next;
      });
    },
    [storageKey]
  );

  return { justPurchasedTiers, markTierPurchased, justCancelledTiers, markTierCancelled };
}

export type TierBookkeeping = ReturnType<typeof useTierBookkeeping>;
