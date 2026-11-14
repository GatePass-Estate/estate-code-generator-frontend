import ResidentIncidentReportList from '@/src/features/ai/components/incidents/report/ResidentIncidentReportList';

export default function IncidentReportScreen() {
  return <ResidentIncidentReportList title="Incident Report" detailPath="/incident-report/[id]" />;
}
