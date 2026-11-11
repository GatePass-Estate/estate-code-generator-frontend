import React from 'react';
import PaymentProcessingModal, {
  type PaymentProcessingCopyMap,
  type PaymentProcessingState,
} from '@/src/components/common/PaymentProcessingModal';

export type PaymentVerificationState = PaymentProcessingState;

interface PaymentVerificationModalProps {
  visible: boolean;
  status: PaymentVerificationState;
  onClose: () => void;
}

/** Copy for a standalone AI feature purchase. */
const AI_FEATURE_COPY: PaymentProcessingCopyMap = {
  verifying: {
    title: 'Verifying Payment...',
    message:
      'Please stay on this screen while we confirm your transaction with the payment gateway.',
  },
  success: {
    title: 'Payment Confirmed!',
    message:
      'Your subscription has been activated successfully. You can now install and use this feature.',
    actionLabel: 'Continue',
  },
  delayed: {
    title: 'Payment Processing',
    message:
      'Your payment was received and is finalizing in the background. Your feature will activate shortly.',
    actionLabel: 'Got It',
  },
  failed: {
    title: 'Payment Incomplete',
    message:
      'We could not confirm your payment. If funds were debited, they will be refunded or credited automatically.',
    actionLabel: 'Close',
  },
};

/** The AI marketplace's payment overlay: the shared payment overlay with AI feature copy. */
export default function PaymentVerificationModal({
  visible,
  status,
  onClose,
}: PaymentVerificationModalProps) {
  return (
    <PaymentProcessingModal
      visible={visible}
      status={status}
      copy={AI_FEATURE_COPY}
      onClose={onClose}
    />
  );
}
