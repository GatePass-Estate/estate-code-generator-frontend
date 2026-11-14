export function toggleIncidentType(current: string[], label: string): string[] {
  if (current.includes(label)) return current.filter((item) => item !== label);
  const isOther = label.toLowerCase() === 'other';
  if (isOther) return [label];
  return [...current.filter((item) => item.toLowerCase() !== 'other'), label];
}
