import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';

export interface SubmitFeedbackPayload {
  feedback_type: 'suggestion' | 'issue';
  rating?: number;
  liked?: string;
  improvement?: string;
  description?: string;
  attachment_url?: string;
}

export const submitFeedback = async (payload: SubmitFeedbackPayload): Promise<void> => {
  try {
    const api = Api();
    await api.post(`/help/feedback`, payload);
  } catch (error: unknown) {
    raiseApiError(error, 'An error occured', true);
  }
};
