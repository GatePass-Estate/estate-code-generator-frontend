import { ResidentAccessLog } from '@/src/types/accessLog';

const generatedAt = '2026-05-07T20:56:00';
const validatedAt = '2026-05-27T20:58:00';
const expiredAt = '2026-05-27T20:58:00';

function buildUsageEvents(validationCount: number) {
  const events = [
    { id: 'evt-generated', type: 'generated' as const, timestamp: generatedAt },
    ...Array.from({ length: validationCount }, (_, index) => ({
      id: `evt-validated-${index}`,
      type: 'validated' as const,
      timestamp: validatedAt,
    })),
    { id: 'evt-expired', type: 'expired' as const, timestamp: expiredAt },
  ];

  return events;
}

export const mockResidentAccessLogs: ResidentAccessLog[] = [
  {
    id: 'log-1',
    code: '213903',
    generatedAt: '2026-05-30T09:00:00',
    isActive: true,
    usageCount: 344,
    events: buildUsageEvents(9),
  },
  {
    id: 'log-2',
    code: '213903',
    generatedAt: '2026-05-30T09:00:00',
    isActive: false,
    usageCount: 344,
    events: buildUsageEvents(9),
  },
  {
    id: 'log-3',
    code: '213903',
    generatedAt: '2026-05-30T09:00:00',
    isActive: false,
    usageCount: 344,
    events: buildUsageEvents(9),
  },
  {
    id: 'log-4',
    code: '213903',
    generatedAt: '2026-05-30T09:00:00',
    isActive: false,
    usageCount: 344,
    events: buildUsageEvents(9),
  },
];

export function getResidentAccessLogById(id: string): ResidentAccessLog | undefined {
  return mockResidentAccessLogs.find((log) => log.id === id);
}
