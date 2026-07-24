import { AccessLogEntry } from '@/src/types/accessLog';

export const MOCK_VISITOR_LOGS: AccessLogEntry[] = [
  {
    id: 'visitor-1',
    name: 'James Okonkwo',
    category: 'Friend',
    hashed_code: 'ABC12345',
    timestamp: '2026-07-04 14:30:00+0100',
    codeCreatedAt: '2026-07-04 12:00:00+0100',
    receiver: 'visitor',
  },
  {
    id: 'visitor-2',
    name: 'Sarah Adeyemi',
    category: 'Family',
    hashed_code: 'DEF67890',
    timestamp: '2026-07-03 09:15:00+0100',
    codeCreatedAt: '2026-07-03 08:00:00+0100',
    receiver: 'visitor',
  },
  {
    id: 'visitor-3',
    name: 'Michael Chen',
    category: 'Delivery',
    hashed_code: 'GHI11223',
    timestamp: '2026-06-28 16:45:00+0100',
    codeCreatedAt: '2026-06-28 16:30:00+0100',
    receiver: 'visitor',
  },
];

export const MOCK_RESIDENT_LOGS: AccessLogEntry[] = [
  {
    id: 'resident-1',
    name: 'Ada Okafor',
    category: 'Resident',
    hashed_code: 'JKL44556',
    timestamp: '2026-07-04 07:20:00+0100',
    codeCreatedAt: '2026-06-01 10:00:00+0100',
    receiver: 'resident',
  },
  {
    id: 'resident-2',
    name: 'Chidi Nwosu',
    category: 'Resident',
    hashed_code: 'MNO77889',
    timestamp: '2026-07-02 18:05:00+0100',
    codeCreatedAt: '2026-05-15 09:30:00+0100',
    receiver: 'resident',
  },
  {
    id: 'resident-3',
    name: 'Funke Bello',
    category: 'Resident',
    hashed_code: 'PQR99001',
    timestamp: '2026-06-25 11:40:00+0100',
    codeCreatedAt: '2026-04-20 14:00:00+0100',
    receiver: 'resident',
  },
];
