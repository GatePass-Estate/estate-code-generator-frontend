import { ActivityAlertIcon, ActivityInfoIcon } from '@/src/assets/svgs';
import { isAlertNotification } from '@/src/lib/broadcastStyle';

/**
 * Leading icon for an activity item: a red warning triangle for alert types,
 * a navy exclamation circle for everything else (per the Activities design).
 */
export default function ActivityIcon({ type, size }: { type?: string | null; size?: number }) {
  return isAlertNotification(type) ? (
    <ActivityAlertIcon size={size} />
  ) : (
    <ActivityInfoIcon size={size} />
  );
}
