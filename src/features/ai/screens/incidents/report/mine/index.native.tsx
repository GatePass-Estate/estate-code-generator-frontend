import ResidentIncidentReportList from '@/src/features/ai/components/incidents/report/ResidentIncidentReportList';

export default function MyIncidentReportsScreen() {
  return (
    <ResidentIncidentReportList title="Reported Incidents" detailPath="/user/report/mine/[id]" />
  );
}
