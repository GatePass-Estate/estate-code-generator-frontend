export function toggleIncidentType(current: string[], label: string): string[] {
  if (current.includes(label)) return current.filter((item) => item !== label);
  if (label === 'Other') return ['Other'];
  return [...current.filter((item) => item !== 'Other'), label];
}
