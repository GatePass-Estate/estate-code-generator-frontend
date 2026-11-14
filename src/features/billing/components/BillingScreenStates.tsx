import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import LoadError from '@/src/shared/components/feedback/LoadError';
import InfoNote from '@/src/features/billing/components/InfoNote';
import { BILLING_VIEW_ONLY_NOTE } from '@/src/features/billing/utils/billing';

/** Full-height centred spinner for a billing screen that is loading or redirecting. */
export function BillingLoading() {
  return <ScreenLoading />;
}

/** Inline load error with a "Try again" button. */
export function BillingLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <LoadError message={message} onRetry={onRetry} />;
}

/** "Only the primary admin can change the subscription." note for view-only admins. */
export function BillingViewOnlyNote({ className }: { className?: string }) {
  return <InfoNote className={className} text={BILLING_VIEW_ONLY_NOTE} />;
}
