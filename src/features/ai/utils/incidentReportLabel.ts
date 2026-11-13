type ReportLabelSource = {
  title?: string | null;
  custom_category?: string | null;
  category?: string[] | null;
};

/** Card title: the report title, then a custom category, then the first category. */
export function incidentReportTitle(report: ReportLabelSource): string {
  if (report.title?.trim()) return report.title.trim();
  if (report.custom_category?.trim()) return report.custom_category.trim();
  const category = report.category?.[0];
  if (!category) return 'Incident Report';
  return category.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** `Sent: 1st January, 2026`. An unreadable date is blank so the card does not show `Invalid Date`. */
export function incidentReportSentLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';
  return `Sent: ${day}${suffix} ${date.toLocaleString('en-GB', { month: 'long' })}, ${date.getFullYear()}`;
}
