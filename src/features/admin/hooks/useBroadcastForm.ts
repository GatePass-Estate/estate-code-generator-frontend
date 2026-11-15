import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ToastType } from '@/src/shared/components/feedback/Toast';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { userFacingError } from '@/src/shared/services/api/errors';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { refreshEstateEntitlements } from '@/src/features/billing';
import {
  createBroadcast,
  isBroadcastEntitlementError,
} from '@/src/features/notifications/services/broadcast';
import {
  buildBroadcastPayload,
  toCreateBroadcastPayload,
} from '@/src/features/notifications/utils/broadcastForm';
import type {
  BroadcastFormData,
  BroadcastFormErrors,
  CreateBroadcastPayload,
} from '@/src/features/notifications/types/broadcast';
import {
  INITIAL_BROADCAST_FORM,
  INITIAL_WEB_BROADCAST_FORM,
  validateBroadcastMessage,
  validateBroadcastSettings,
  validateWebBroadcastStep,
  type WebBroadcastForm,
} from '@/src/features/admin/utils/broadcastForm';

const SEND_ERROR_FALLBACK = 'An error occurred while sending broadcast';

/** Sends a broadcast and refreshes the cached broadcast lists. */
export function useSendBroadcast() {
  return useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => createBroadcast(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all });
    },
  });
}

/**
 * Mobile broadcast: step 1 (audience, priority, duration) → step 2 (subject, body) → send.
 * `onSent` runs after the success toast (the screen navigates back).
 */
export function useBroadcastMobileForm({ onSent }: { onSent: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BroadcastFormData>(INITIAL_BROADCAST_FORM);
  const [errors, setErrors] = useState<BroadcastFormErrors>({});
  const [loading, setLoading] = useState(false);
  const broadcastGate = useFeatureGate('admin_broadcast');
  const send = useSendBroadcast();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const updateFormData = useCallback(
    <K extends keyof BroadcastFormData>(key: K, value: BroadcastFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  /** Step 2 → step 1 (the back gesture on step 2 stays in the flow). */
  const backToSettings = useCallback(() => {
    setCurrentStep(1);
    setErrors({});
  }, []);

  const handleSendBroadcast = async () => {
    setLoading(true);

    try {
      // Admin home already checks the plan, but this screen can also be reached directly.
      if (!(await broadcastGate.requestAccessWhenReady())) return;

      await send.mutateAsync(toCreateBroadcastPayload(formData));

      setToastMessage('Broadcast sent successfully!');
      setToastType('success');
      setToastVisible(true);

      setFormData(INITIAL_BROADCAST_FORM);
      setCurrentStep(1);
      setErrors({});

      setTimeout(() => onSent(), 1500);
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : '';
      const message = userFacingError(error, SEND_ERROR_FALLBACK);

      // The server's plan check disagreed with the cached entitlements (e.g. the plan changed
      // since sign-in): refresh the cache and show the same message the cache would have.
      if (isBroadcastEntitlementError(raw) || isBroadcastEntitlementError(message)) {
        refreshEstateEntitlements();
        broadcastGate.showDenied();
        return;
      }

      setToastMessage(message);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (next: BroadcastFormErrors) => {
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (validateStep(validateBroadcastSettings(formData))) {
        setCurrentStep(2);
        setErrors({});
      }
      return;
    }

    if (validateStep(validateBroadcastMessage(formData))) {
      void handleSendBroadcast();
    }
  };

  return {
    currentStep,
    formData,
    errors,
    loading,
    updateFormData,
    backToSettings,
    handleContinue,
    noticeProps: broadcastGate.noticeProps,
    toast: { visible: toastVisible, message: toastMessage, type: toastType },
    hideToast: () => setToastVisible(false),
  };
}

/** Desktop broadcast wizard: recipient → message → priority + duration → send. */
export function useBroadcastWebForm({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<WebBroadcastForm>(INITIAL_WEB_BROADCAST_FORM);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const send = useSendBroadcast();

  const setField = <K extends keyof WebBroadcastForm>(key: K, value: WebBroadcastForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Shows the step's validation message; true when the step is valid. */
  const validate = (current: 1 | 2 | 3): boolean => {
    const message = validateWebBroadcastStep(current, form);
    if (message) setError(message);
    return !message;
  };

  const handleNextStep = () => {
    if (step === 1 && validate(1)) {
      setStep(2);
    } else if (step === 2 && validate(2)) {
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2);
    } else {
      onExit();
    }
  };

  const handleSendBroadcast = async () => {
    if (!validate(3)) return;
    try {
      await send.mutateAsync(
        buildBroadcastPayload({
          title: form.subjectLine,
          message: form.message,
          audience: form.recipientType,
          priority: form.priority,
          duration: form.duration,
        })
      );

      setMessageType('success');
      setError('Broadcast sent successfully!');
      setForm(INITIAL_WEB_BROADCAST_FORM);
      setStep(1);
    } catch (err) {
      setMessageType('error');
      setError(userFacingError(err, SEND_ERROR_FALLBACK));
    }
  };

  return {
    step,
    form,
    setField,
    error,
    setError,
    messageType,
    running: send.isPending,
    handleNextStep,
    handlePreviousStep,
    handleSendBroadcast,
  };
}
