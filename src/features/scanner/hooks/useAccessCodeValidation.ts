import { useState } from 'react';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useValidateCode } from '@/src/features/access-codes/hooks/codes';
import type { Codes } from '@/src/features/access-codes/types/codes';
import {
  ACCESS_CODE_LENGTH,
  EMPTY_CODE,
  INCOMPLETE_CODE_MESSAGE,
  REJECTED_CODE_MESSAGE,
  isRejectedValidation,
} from '@/src/features/scanner/utils/accessCode';

export type CodeValidationOutcome =
  | { status: 'incomplete' }
  | { status: 'blocked' }
  | { status: 'rejected' }
  | { status: 'error' }
  | { status: 'valid'; result: Codes };

type ValidateOptions = {
  /** Extra precondition after the length check (native: account verification gate). */
  guard?: () => boolean;
  /** Runs once the request starts (native: dismiss the keyboard). */
  onStart?: () => void;
  /** Message when the request throws without a readable message. */
  errorFallback: string;
  /** How a rejected/failed code is shown; defaults to the inline error message. */
  onRejected?: (entered: string, message: string) => void;
};

/**
 * Six-box access-code entry and the validation rules shared by the web and native security
 * screens: all six characters required, a 200 with `is_valid: false` or `is_expired` is rejected,
 * and the boxes clear after a valid code.
 */
export function useAccessCodeValidation() {
  const [code, setCode] = useState<string[]>([...EMPTY_CODE]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const validateCodeMutation = useValidateCode();

  const validate = async (
    entered: string,
    { guard, onStart, errorFallback, onRejected }: ValidateOptions
  ): Promise<CodeValidationOutcome> => {
    const reject = onRejected ?? ((_: string, message: string) => setErrorMessage(message));

    if (entered.length < ACCESS_CODE_LENGTH) {
      setErrorMessage(INCOMPLETE_CODE_MESSAGE);
      return { status: 'incomplete' };
    }
    if (guard && !guard()) return { status: 'blocked' };

    setIsValidating(true);
    setErrorMessage('');
    onStart?.();

    try {
      const result = await validateCodeMutation.mutateAsync(entered);
      if (isRejectedValidation(result)) {
        reject(entered, REJECTED_CODE_MESSAGE);
        return { status: 'rejected' };
      }
      setCode([...EMPTY_CODE]);
      return { status: 'valid', result };
    } catch (err: unknown) {
      reject(entered, thrownMessage(err) ?? errorFallback);
      return { status: 'error' };
    } finally {
      setIsValidating(false);
    }
  };

  return { code, setCode, errorMessage, setErrorMessage, isValidating, validate };
}
