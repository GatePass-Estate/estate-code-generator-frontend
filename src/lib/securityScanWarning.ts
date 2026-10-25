import type { Codes } from '@/src/types/codes';

export type ScanWarningSeverity = 'medium' | 'high';

export function parseScanWarningSeverity(
  value: string | string[] | undefined
): ScanWarningSeverity | null {
  const severity = Array.isArray(value) ? value[0] : value;
  return severity === 'medium' || severity === 'high' ? severity : null;
}

export function getScanWarningSeverity(
  validation: Pick<Codes, 'is_anomalous' | 'severity'>
): ScanWarningSeverity | null {
  if (validation.is_anomalous !== true) return null;
  return validation.severity === 'medium' || validation.severity === 'high'
    ? validation.severity
    : null;
}
