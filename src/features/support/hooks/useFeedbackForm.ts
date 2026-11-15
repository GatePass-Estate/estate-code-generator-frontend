import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { errorMessage } from '@/src/shared/services/api/errors';
import { submitFeedback } from '@/src/features/support/services/help';
import { uploadFeedbackAttachment } from '@/src/features/support/services/feedbackAttachment';
import {
  FEEDBACK_LAST_STEP,
  FEEDBACK_SUCCESS_STEP,
  feedbackBackAction,
  issueFeedbackPayload,
  suggestionFeedbackPayload,
  type FeedbackTab,
} from '@/src/features/support/utils/feedbackForm';

type UploadFile = Parameters<typeof uploadFeedbackAttachment>[0];

type Options<Attachment> = {
  /** Starting star rating (web starts empty, native starts at 3). */
  initialRating: number;
  /** Leave the screen (no confirmation). */
  exit: () => void;
  /** Go to the resident home after a successful submit. */
  goHome: () => void;
  /** Platform error display (window.alert vs Alert.alert). */
  showError: (message: string) => void;
  /** Turns the platform attachment into the multipart file part to upload. */
  toUploadFile: (attachment: Attachment) => UploadFile;
};

/**
 * State and actions for the Rating & Feedback screen, shared by web and native.
 * The screens only lay it out and supply platform navigation / alerts / attachment handling.
 */
export function useFeedbackForm<Attachment>({
  initialRating,
  exit,
  goHome,
  showError,
  toUploadFile,
}: Options<Attachment>) {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('Suggestion');
  const [suggestionStep, setSuggestionStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);

  const [issueText, setIssueText] = useState('');
  const [rating, setRating] = useState(initialRating);
  const [likeMost, setLikeMost] = useState('');
  const [improve, setImprove] = useState('');
  // The feedback payload has a single `attachment_url`, so only one image can be attached.
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  const issueMutation = useMutation({
    mutationFn: async ({ description, file }: { description: string; file: Attachment | null }) => {
      const uploadedUrl = file ? await uploadFeedbackAttachment(toUploadFile(file)) : '';
      await submitFeedback(issueFeedbackPayload(description, uploadedUrl));
    },
    onSuccess: () => {
      setSuggestionStep(FEEDBACK_SUCCESS_STEP);
      setActiveTab('Suggestion');
      setAttachment(null);
    },
    onError: (error: unknown) => showError(errorMessage(error) || 'Failed to submit feedback'),
  });

  const suggestionMutation = useMutation({
    mutationFn: () => submitFeedback(suggestionFeedbackPayload(rating, likeMost, improve)),
    onSuccess: () => setSuggestionStep(FEEDBACK_SUCCESS_STEP),
    onError: (error: unknown) => showError(errorMessage(error) || 'Failed to submit feedback'),
  });

  const isLoading = issueMutation.isPending || suggestionMutation.isPending;

  const selectTab = useCallback((tab: FeedbackTab) => {
    setActiveTab(tab);
    setSuggestionStep(1);
  }, []);

  const handleBackPress = () => {
    switch (
      feedbackBackAction({ activeTab, suggestionStep, issueText, rating, likeMost, improve })
    ) {
      case 'home':
        goHome();
        return;
      case 'previous-step':
        setSuggestionStep(suggestionStep - 1);
        return;
      case 'confirm-exit':
        setShowExitModal(true);
        return;
      case 'exit':
        exit();
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    exit();
  };

  const submitIssue = () => {
    issueMutation.mutate({ description: issueText, file: attachment });
  };

  /** Primary button on the suggestion steps: next question, or submit on the last one. */
  const nextOrSubmitSuggestion = () => {
    if (suggestionStep === FEEDBACK_LAST_STEP) {
      suggestionMutation.mutate();
    } else {
      setSuggestionStep(suggestionStep + 1);
    }
  };

  return {
    activeTab,
    selectTab,
    suggestionStep,
    isSuccess: suggestionStep === FEEDBACK_SUCCESS_STEP,
    isLastStep: suggestionStep === FEEDBACK_LAST_STEP,
    showExitModal,
    setShowExitModal,
    issueText,
    setIssueText,
    rating,
    setRating,
    likeMost,
    setLikeMost,
    improve,
    setImprove,
    attachment,
    setAttachment,
    isLoading,
    canSubmitIssue: !!issueText.trim() && !isLoading,
    handleBackPress,
    handleConfirmExit,
    submitIssue,
    nextOrSubmitSuggestion,
    goHome,
  };
}
