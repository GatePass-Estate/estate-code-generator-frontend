import { getScanWarningSeverity, parseScanWarningSeverity } from '../securityScanWarning';

describe('getScanWarningSeverity', () => {
  it.each(['medium', 'high'] as const)('shows the %s warning for an anomalous scan', (severity) => {
    expect(getScanWarningSeverity({ is_anomalous: true, severity })).toBe(severity);
  });

  it.each([
    { is_anomalous: false, severity: 'high' as const },
    { is_anomalous: null, severity: 'medium' as const },
    { is_anomalous: true, severity: 'low' as const },
    { is_anomalous: true, severity: null },
  ])('does not show a medium/high warning for %p', (validation) => {
    expect(getScanWarningSeverity(validation)).toBeNull();
  });
});

describe('security result warning parameter', () => {
  it.each(['medium', 'high'] as const)(
    'accepts %s from a validated-code result route',
    (severity) => {
      expect(parseScanWarningSeverity(severity)).toBe(severity);
    }
  );

  it.each([undefined, 'low', 'unknown', ['low', 'high']])(
    'ignores an unsupported warning parameter: %p',
    (severity) => {
      expect(parseScanWarningSeverity(severity)).toBeNull();
    }
  );
});
