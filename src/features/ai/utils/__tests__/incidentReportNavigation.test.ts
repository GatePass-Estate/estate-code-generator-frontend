import { describe, expect, it } from '@jest/globals';
import {
  incidentReportPaths,
  leaveIncidentReport,
  parseIncidentReportReturnTo,
  reportReturnToForTab,
} from '@/src/features/ai/utils/incidentReportNavigation';

describe('incident report return navigation', () => {
  it('returns to the tab that opened the report', () => {
    expect(reportReturnToForTab('index')).toBe('/user');
    expect(reportReturnToForTab('guests')).toBe('/user/guests');
    expect(reportReturnToForTab('history')).toBe('/user/history');
  });

  it('accepts only known entry screens and falls back to Home', () => {
    expect(parseIncidentReportReturnTo('/settings')).toBe('/settings');
    expect(parseIncidentReportReturnTo('/profile')).toBe('/profile');
    expect(parseIncidentReportReturnTo('/security')).toBe('/security');
    expect(parseIncidentReportReturnTo('/security/history')).toBe('/security/history');
    expect(parseIncidentReportReturnTo('/security/more')).toBe('/security/more');
    expect(parseIncidentReportReturnTo('/admin')).toBe('/admin');
    expect(parseIncidentReportReturnTo('/user/report')).toBe('/user');
    expect(parseIncidentReportReturnTo(undefined)).toBe('/user');
  });

  it('returns to Security More rather than an unrelated history entry', () => {
    const calls: string[] = [];
    leaveIncidentReport('/security/more', {
      replace: (path) => calls.push(`replace:${path}`),
      dismissTo: (path) => calls.push(`dismissTo:${path}`),
    });
    expect(calls).toEqual(['dismissTo:/security/more']);
  });

  it('falls back to dismissTo when the stack cannot go back', () => {
    const calls: unknown[] = [];
    const router = {
      canGoBack: () => false,
      back: () => calls.push('back'),
      replace: (path: unknown) => calls.push(`replace:${JSON.stringify(path)}`),
      dismissTo: (path: unknown) => calls.push(`dismissTo:${path}`),
    };
    leaveIncidentReport('/security/more', router);
    leaveIncidentReport('/admin', router);
    leaveIncidentReport('/user', router);
    expect(calls).toEqual(['dismissTo:/security/more', 'dismissTo:/admin', 'dismissTo:/user']);
  });

  it('prefers stack back whenever possible so every entry gets the Broadcast slide', () => {
    const calls: string[] = [];
    const router = {
      canGoBack: () => true,
      back: () => calls.push('back'),
      replace: (path: unknown) => calls.push(`replace:${JSON.stringify(path)}`),
      dismissTo: (path: unknown) => calls.push(`dismissTo:${path}`),
    };

    leaveIncidentReport('/admin', router);
    leaveIncidentReport('/settings', router);
    leaveIncidentReport('/profile', router);
    leaveIncidentReport('/security/more', router);

    expect(calls).toEqual(['back', 'back', 'back', 'back']);
  });

  it('maps admin vs user report pathnames to the matching list/detail routes', () => {
    expect(incidentReportPaths('/admin/report')).toEqual({
      list: '/admin/report',
      detail: '/admin/report/[id]',
    });
    expect(incidentReportPaths('/admin/report/abc')).toEqual({
      list: '/admin/report',
      detail: '/admin/report/[id]',
    });
    expect(incidentReportPaths('/user/report')).toEqual({
      list: '/user/report',
      detail: '/user/report/[id]',
    });
  });
});
