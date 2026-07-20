import Api from '.';
import { getErrorMessage } from '../helpers';

export interface SubmitFeedbackPayload {
  feedback_type: 'suggestion' | 'issue';
  rating?: number;
  liked?: string;
  improvement?: string;
  description?: string;
  attachment_url?: string;
}

export const submitFeedback = async (payload: SubmitFeedbackPayload): Promise<any> => {
  try {
    const api = Api();

    const axiosRes = await api.post(`/help/feedback`, payload);
    return axiosRes.data;
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'An error occured'} `);
  }
};
