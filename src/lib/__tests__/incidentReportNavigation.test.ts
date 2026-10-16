import { describe, expect, it } from '@jest/globals';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
  reportReturnToForTab,
} from '@/src/lib/incidentReportNavigation';

describe('incident report return navigation', () => {
  it('returns to the tab that opened the report', () => {
    expect(reportReturnToForTab('index')).toBe('/user');
    expect(reportReturnToForTab('guests')).toBe('/user/guests');
    expect(reportReturnToForTab('history')).toBe('/user/history');
  });

  it('accepts only known entry screens and falls back to Home', () => {
    expect(parseIncidentReportReturnTo('/settings')).toBe('/settings');
    expect(parseIncidentReportReturnTo('/security/more')).toBe('/security/more');
    expect(parseIncidentReportReturnTo('/admin')).toBe('/admin');
    expect(parseIncidentReportReturnTo('/user/report')).toBe('/user');
    expect(parseIncidentReportReturnTo(undefined)).toBe('/user');
  });

  it('returns to Security More rather than an unrelated history entry', () => {
    const calls: string[] = [];
    leaveIncidentReport('/security/more', {
      replace: (path) => calls.push(`replace:${path}`),
    });
    expect(calls).toEqual(['replace:/security/more']);
  });

  it('returns to each explicit entry destination', () => {
    const calls: unknown[] = [];
    const router = {
      replace: (path: unknown) => calls.push(path),
    };
    leaveIncidentReport('/security/more', router);
    leaveIncidentReport('/settings', router);
    leaveIncidentReport('/admin', router);
    leaveIncidentReport('/user', router);
    expect(calls).toEqual([
      '/security/more',
      '/settings',
      { pathname: '/admin', params: { returnTo: '/settings' } },
      '/user',
    ]);
  });
});
