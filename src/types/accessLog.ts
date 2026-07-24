import { ReceiverType } from './codes';

export type AccessLogEntry = {
  id: string;
  name: string;
  category: string;
  hashed_code: string;
  timestamp: string;
  codeCreatedAt?: string;
  receiver: ReceiverType;
};

export type AccessLogEventType = 'generated' | 'validated' | 'expired';

export type AccessLogEvent = {
  id: string;
  type: AccessLogEventType;
  timestamp: string;
};

export type ResidentAccessLog = {
  id: string;
  code: string;
  generatedAt: string;
  isActive: boolean;
  usageCount: number;
  events: AccessLogEvent[];
};
