import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGenerateCode, useMyResidentCode } from '@/src/features/access-codes/hooks/codes';
import { accessCodeExpiry } from '@/src/features/profile/utils/residentAccessCode';
import { useUserStore } from '@/src/store/userStore';

type Options = {
  /** False skips the code entirely (security staff have no resident code). */
  enabled?: boolean;
  /** Runs before generating; return false to stop (the native verification gate). */
  canGenerate?: () => boolean;
  onGenerated?: () => void;
  onGenerateError?: (error: unknown) => void;
  /** A reload came back without a code and with an error. */
  onLoadError?: (error: unknown) => void;
};

/**
 * The signed-in resident's own access code, shared by the web and native profile screens:
 * cached code, explicit reload, regenerate, and the expiry line.
 */
export function useResidentAccessCode({
  enabled = true,
  canGenerate,
  onGenerated,
  onGenerateError,
  onLoadError,
}: Options = {}) {
  const user_id = useUserStore((s) => s.user_id);
  const estate_id = useUserStore((s) => s.estate_id);
  const {
    data: residentCode,
    isFetched: residentCodeFetched,
    refetch: refetchResidentCode,
  } = useMyResidentCode(enabled ? user_id : null);
  const generateResidentCode = useGenerateCode();

  const [code, setCode] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noCode, setNoCode] = useState(false);

  const applyCode = useCallback((next: { hashed_code: string; valid_until: string } | null) => {
    setCode(next?.hashed_code ?? null);
    setExpiry(next?.valid_until ?? null);
    setNoCode(!next);
  }, []);

  const fetchMyCode = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    const result = await refetchResidentCode();
    if (!result.data && result.error) onLoadError?.(result.error);
    applyCode(result.data ?? null);
    setLoading(false);
  }, [applyCode, onLoadError, refetchResidentCode, user_id]);

  const handleGenerateCode = useCallback(async () => {
    if (canGenerate && !canGenerate()) return;
    if (!user_id) return;
    setLoading(true);
    try {
      const result = await generateResidentCode.mutateAsync({
        user_id,
        estate_id: estate_id ?? '',
        receiver: 'resident',
      });
      applyCode(result);
      onGenerated?.();
    } catch (error) {
      onGenerateError?.(error);
    } finally {
      setLoading(false);
    }
  }, [
    applyCode,
    canGenerate,
    estate_id,
    generateResidentCode,
    onGenerateError,
    onGenerated,
    user_id,
  ]);

  // Mirror the cached code (and later cache updates) into the card.
  useEffect(() => {
    if (!enabled) return;
    if (!residentCodeFetched) {
      setLoading(true);
      return;
    }
    applyCode(residentCode ?? null);
    setLoading(false);
  }, [applyCode, enabled, residentCode, residentCodeFetched]);

  const { expiring, formattedDate } = useMemo(() => accessCodeExpiry(expiry), [expiry]);

  return {
    code,
    expiry,
    noCode,
    loading,
    expiring,
    formattedDate,
    fetchMyCode,
    handleGenerateCode,
  };
}
