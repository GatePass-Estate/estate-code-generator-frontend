export type IncidentReportReturnTo =
  | '/user'
  | '/user/guests'
  | '/user/history'
  | '/profile'
  | '/settings'
  | '/security'
  | '/security/history'
  | '/security/more'
  | '/admin';

export function reportReturnToForTab(tabName: string): IncidentReportReturnTo {
  if (tabName === 'guests') return '/user/guests';
  if (tabName === 'history') return '/user/history';
  return '/user';
}

export function parseIncidentReportReturnTo(
  value: string | string[] | undefined
): IncidentReportReturnTo {
  if (
    value === '/user/guests' ||
    value === '/user/history' ||
    value === '/profile' ||
    value === '/settings' ||
    value === '/security' ||
    value === '/security/history' ||
    value === '/security/more' ||
    value === '/admin'
  ) {
    return value;
  }
  return '/user';
}

type ReportRouter = {
  replace: (
    path: IncidentReportReturnTo | { pathname: '/admin'; params: { returnTo: '/settings' } }
  ) => void;
  dismissTo: (path: IncidentReportReturnTo) => void;
  back?: () => void;
  canGoBack?: () => boolean;
};

/**
 * Leave report the Broadcast way when the stack allows: `back()` → previous screen slides in.
 * Fallback `dismissTo(returnTo)` only when there is nothing to pop (deep link / cold open).
 * Screens must be opened with `push` on the same stack (e.g. `/admin/report`) for the slide.
 */
export function leaveIncidentReport(returnTo: IncidentReportReturnTo, router: ReportRouter): void {
  if (router.canGoBack?.()) {
    router.back?.();
    return;
  }
  router.dismissTo(returnTo);
}

/** List + detail live under `/admin/report` when opened from Admin Tools. */
export function incidentReportPaths(pathname: string): {
  list: '/admin/report' | '/user/report';
  detail: '/admin/report/[id]' | '/user/report/[id]';
} {
  if (pathname.startsWith('/admin/report')) {
    return { list: '/admin/report', detail: '/admin/report/[id]' };
  }
  return { list: '/user/report', detail: '/user/report/[id]' };
}
