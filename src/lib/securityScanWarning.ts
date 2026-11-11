import type { Codes } from '@/src/types/codes';

export type ScanWarningSeverity = 'medium' | 'high';

export function parseScanWarningSeverity(
  value: string | string[] | undefined
): ScanWarningSeverity | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const severity = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (severity === 'medium' || severity === 'med') return 'medium';
  if (severity === 'high') return 'high';
  return null;
}

export function getScanWarningSeverity(
  validation: Pick<Codes, 'is_anomalous' | 'severity'>
): ScanWarningSeverity | null {
  if (validation.is_anomalous !== true) return null;
  return parseScanWarningSeverity(validation.severity ?? undefined);
}
