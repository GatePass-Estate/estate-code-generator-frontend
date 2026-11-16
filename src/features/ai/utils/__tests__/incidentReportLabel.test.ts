import {
  incidentReportSentLabel,
  incidentReportTitle,
} from '@/src/features/ai/utils/incidentReportLabel';

describe('incident report labels', () => {
  it('prefers the title, then a custom category, then the first category', () => {
    expect(incidentReportTitle({ title: '  Gate left open  ', category: ['theft'] })).toBe(
      'Gate left open'
    );
    expect(incidentReportTitle({ title: ' ', custom_category: 'Other', category: [] })).toBe(
      'Other'
    );
    expect(incidentReportTitle({ category: ['noise_complaint'] })).toBe('Noise Complaint');
    expect(incidentReportTitle({ category: [] })).toBe('Incident Report');
  });

  it('formats the sent date and leaves an invalid date blank', () => {
    expect(incidentReportSentLabel('2026-01-01T12:00:00.000Z')).toMatch(
      /^Sent: 1st January, 2026$/
    );
    expect(incidentReportSentLabel('2026-01-02T12:00:00.000Z')).toMatch(/^Sent: 2nd /);
    expect(incidentReportSentLabel('2026-01-03T12:00:00.000Z')).toMatch(/^Sent: 3rd /);
    expect(incidentReportSentLabel('2026-01-11T12:00:00.000Z')).toMatch(/^Sent: 11th /);
    expect(incidentReportSentLabel('not-a-date')).toBe('');
  });
});
