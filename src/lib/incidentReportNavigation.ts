export type IncidentReportReturnTo =
  | '/user'
  | '/user/guests'
  | '/user/history'
  | '/settings'
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
    value === '/settings' ||
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
};

export function leaveIncidentReport(returnTo: IncidentReportReturnTo, router: ReportRouter): void {
  if (returnTo === '/admin') {
    router.replace({ pathname: '/admin', params: { returnTo: '/settings' } });
    return;
  }
  router.replace(returnTo);
}
