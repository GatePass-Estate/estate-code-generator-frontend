import { isAxiosError } from 'axios';

function messageOf(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as { detail?: unknown; message?: unknown };

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
            return item.msg;
          }
          return undefined;
        })
        .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }

    if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
      return data.detail;
    }

    if (
      data.detail &&
      typeof data.detail === 'object' &&
      'message' in data.detail &&
      typeof data.detail.message === 'string'
    ) {
      return data.detail.message;
    }

    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  }

  const message = messageOf(error);
  if (message) {
    if (message === 'Network Error')
      return 'Network error - please check your internet connection.';

    if (message === 'Request failed with status code 401')
      return 'Unauthorized - please check your credentials.';

    if (message === 'Request failed with status code 403')
      return 'Forbidden - you do not have permission to access this resource.';

    if (message === 'Request failed with status code 404')
      return 'Not Found - the requested resource could not be found.';

    if (message === 'Request failed with status code 409')
      return 'A conflicting request or subscription state already exists. Please refresh and try again.';

    if (message === 'Request failed with status code 422')
      return 'Invalid checkout or request details. Please verify your selection and try again.';

    if (message === 'Request failed with status code 500')
      return 'Server error - please try again later.';

    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('exceeded')
    )
      return 'Request timed out - please check your network connection and try again.';
  }

  return message ?? 'An unknown error occurred';
};

export const isDataEqual = (obj1: unknown, obj2: unknown): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const getWidthBreakpoint = (): number => {
  const breakpoint = process.env.EXPO_PUBLIC_WIDTH_BREAKPOINT;
  return breakpoint ? parseInt(breakpoint, 10) : 768;
};

export {
  ordinalSuffix,
  formatDateWithOrdinal,
  parseLogDate,
  logDateMs,
  compareLogDatesDesc,
  formatPastHistoryVisitDate,
  formatUpcomingInviteCardDate,
  toUtcClock,
  utcClockToLocal,
  isUpcomingCode,
  formatInviteScheduleDate,
  formatInviteClockTime,
  groupLogsByMonth,
  formatGeneratedOnDate,
  formatAccessLogTimestamp,
  formatAccessCodeWithSpace,
  timeCalc,
  formatInvitePeriodDisplay,
} from '@/src/shared/utils/schedule';
export type { MonthGroup } from '@/src/shared/utils/schedule';

export {
  getRoleIcon,
  getRoleIconHeight,
  getRoleIconWidth,
  getRoleColor,
} from '@/src/shared/utils/roles';
