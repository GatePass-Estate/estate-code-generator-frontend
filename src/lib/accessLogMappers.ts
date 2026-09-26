import { AccessLogEvent, ResidentAccessLog } from '@/src/types/accessLog';
import {
  ResidentCodeHistoryResponse,
  ResidentLogEntry,
  SecurityHistoryEntry,
  VisitorLogEntry,
} from '@/src/types/accessLogs';
import { parseLogDate } from '@/src/lib/helpers';

export function mapResidentLogToAccessLog(entry: ResidentLogEntry): ResidentAccessLog {
  return {
    id: entry.id,
    code: entry.hashed_code,
    // On /residentlog/me list items, created_at is the code generation time.
    generatedAt: entry.created_at,
    isActive: !(entry.code_deleted ?? false),
    usageCount: entry.usage_count ?? 0,
    events: [],
  };
}

export function mapResidentCodeHistoryToEvents(
  history: ResidentCodeHistoryResponse
): AccessLogEvent[] {
  const events: { type: AccessLogEvent['type']; timestamp: string }[] = [];

  if (history.code_created_at) {
    events.push({ type: 'generated', timestamp: history.code_created_at });
  }

  history.items.forEach((item) => {
    events.push({ type: 'validated', timestamp: item.access_time });
  });

  if (history.code_deleted && history.code_deleted_at) {
    events.push({ type: 'expired', timestamp: history.code_deleted_at });
  }

  return events
    .sort((a, b) => parseLogDate(a.timestamp).getTime() - parseLogDate(b.timestamp).getTime())
    .map((event, index) => ({
      id: `${event.type}-${index}`,
      type: event.type,
      timestamp: event.timestamp,
    }));
}

export function mapVisitorLogToSecurityEntry(entry: VisitorLogEntry): SecurityHistoryEntry {
  return {
    id: entry.id,
    name: entry.visitor_fullname,
    category: entry.relationship_with_resident ?? 'other',
    hashed_code: entry.hashed_code,
    timestamp: entry.visit_time,
    receiver: 'visitor',
    user_id: entry.user_id,
  };
}

export function mapResidentLogToSecurityEntry(entry: ResidentLogEntry): SecurityHistoryEntry {
  return {
    id: entry.id,
    name: entry.full_name?.trim() || 'Resident',
    category: 'Resident',
    hashed_code: entry.hashed_code,
    timestamp: entry.access_time,
    receiver: 'resident',
    user_id: entry.user_id,
  };
}
