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
