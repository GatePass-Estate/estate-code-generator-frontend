import { useCallback, useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { consumePendingRecoveryCodes } from '@/src/features/auth/services/recoveryCodes';

/** How long the copy button reads "Copied". */
const COPIED_RESET_MS = 2000;

/**
 * The one-time recovery-code list shared by the web and native Recovery Codes screens:
 * reads the pending codes once, copy feedback, and the "I have saved these codes" tick.
 */
export function useRecoveryCodes() {
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read once on mount: consuming clears the codes so a back-navigation, a
  // refresh or a re-render cannot resurface them.
  useEffect(() => {
    setCodes(consumePendingRecoveryCodes() ?? []);
  }, []);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const codesText = codes.join('\n');

  const copyCodes = useCallback(async () => {
    await Clipboard.setStringAsync(codesText);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [codesText]);

  const toggleAcknowledged = useCallback(() => setAcknowledged((value) => !value), []);

  return { codes, codesText, copied, copyCodes, acknowledged, setAcknowledged, toggleAcknowledged };
}
