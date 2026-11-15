import type { SubmitFeedbackPayload as FeedbackPayload } from '@/src/features/support/services/help';

export type FeedbackTab = 'Suggestion' | 'Issue';

/** Step shown after a successful submit ("Thank you for your feedback!"). */
export const FEEDBACK_SUCCESS_STEP = 4;
/** Last suggestion question; its primary button submits. */
export const FEEDBACK_LAST_STEP = 3;

/** The feedback payload carries one `attachment_url`. */
export const MAX_ATTACHMENTS = 1;

type FeedbackDraft = {
  issueText: string;
  rating: number;
  likeMost: string;
  improve: string;
};

/** True when leaving would lose something the user entered (asks for confirmation first). */
export function hasFeedbackData({ issueText, rating, likeMost, improve }: FeedbackDraft): boolean {
  return issueText.trim() !== '' || rating > 0 || likeMost.trim() !== '' || improve.trim() !== '';
}

export type FeedbackBackAction = 'home' | 'previous-step' | 'confirm-exit' | 'exit';

/** What the back button does for the current screen state. */
export function feedbackBackAction(
  state: FeedbackDraft & { activeTab: FeedbackTab; suggestionStep: number }
): FeedbackBackAction {
  if (state.suggestionStep === FEEDBACK_SUCCESS_STEP) return 'home';
  if (state.activeTab === 'Suggestion' && state.suggestionStep > 1) return 'previous-step';
  return hasFeedbackData(state) ? 'confirm-exit' : 'exit';
}

export function issueFeedbackPayload(description: string, attachmentUrl: string): FeedbackPayload {
  return {
    feedback_type: 'issue',
    rating: 1,
    liked: '',
    improvement: '',
    description,
    attachment_url: attachmentUrl,
  };
}

export function suggestionFeedbackPayload(
  rating: number,
  liked: string,
  improvement: string
): FeedbackPayload {
  return {
    feedback_type: 'suggestion',
    rating,
    liked,
    improvement,
    description: '',
    attachment_url: '',
  };
}

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

type PickedImage = { uri: string; fileName?: string | null; mimeType?: string | null };

/** Multipart file part for a picked image, using the picker's type/name when it has them. */
export function attachmentFile(asset: PickedImage) {
  const fromUri = asset.uri.split(/[?#]/)[0].split('/').pop() || '';
  const name = asset.fileName || fromUri || 'upload.jpg';
  const extension = name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '';
  // Without a picker type or a known extension, fall back to JPEG (the picker's default output).
  const type = asset.mimeType || EXTENSION_MIME[extension] || 'image/jpeg';
  return { uri: asset.uri, type, name: extension ? name : `${name}.jpg` };
}
