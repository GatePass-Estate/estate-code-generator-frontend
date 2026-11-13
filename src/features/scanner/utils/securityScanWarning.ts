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

export function getScanWarningSeverity(validation: {
  is_anomalous?: boolean | null;
  /** The API sometimes sends MEDIUM, HIGH, or the abbreviation med. */
  severity?: string | null;
}): ScanWarningSeverity | null {
  if (validation.is_anomalous !== true) return null;
  return parseScanWarningSeverity(validation.severity ?? undefined);
}
