import {
  attachmentFile,
  feedbackBackAction,
  hasFeedbackData,
  issueFeedbackPayload,
  suggestionFeedbackPayload,
} from '@/src/features/support/utils/feedbackForm';

const empty = { issueText: '', rating: 0, likeMost: '', improve: '' };

describe('hasFeedbackData', () => {
  it('is false for an untouched form and whitespace-only text', () => {
    expect(hasFeedbackData(empty)).toBe(false);
    expect(hasFeedbackData({ ...empty, issueText: '   ' })).toBe(false);
  });

  it('counts a rating or any text', () => {
    expect(hasFeedbackData({ ...empty, rating: 3 })).toBe(true);
    expect(hasFeedbackData({ ...empty, improve: 'x' })).toBe(true);
  });
});

describe('feedbackBackAction', () => {
  it('goes home from the success step', () => {
    expect(feedbackBackAction({ ...empty, activeTab: 'Suggestion', suggestionStep: 4 })).toBe(
      'home'
    );
  });

  it('steps back through suggestion questions', () => {
    expect(feedbackBackAction({ ...empty, activeTab: 'Suggestion', suggestionStep: 2 })).toBe(
      'previous-step'
    );
  });

  it('confirms before discarding entered data, otherwise exits', () => {
    expect(
      feedbackBackAction({ ...empty, issueText: 'bug', activeTab: 'Issue', suggestionStep: 2 })
    ).toBe('confirm-exit');
    expect(feedbackBackAction({ ...empty, activeTab: 'Issue', suggestionStep: 1 })).toBe('exit');
  });
});

describe('payloads', () => {
  it('builds the issue payload', () => {
    expect(issueFeedbackPayload('broken', 'https://img')).toEqual({
      feedback_type: 'issue',
      rating: 1,
      liked: '',
      improvement: '',
      description: 'broken',
      attachment_url: 'https://img',
    });
  });

  it('builds the suggestion payload', () => {
    expect(suggestionFeedbackPayload(5, 'fast', 'colors')).toEqual({
      feedback_type: 'suggestion',
      rating: 5,
      liked: 'fast',
      improvement: 'colors',
      description: '',
      attachment_url: '',
    });
  });
});

describe('attachmentFile', () => {
  it('uses the picker name and type when present', () => {
    expect(
      attachmentFile({ uri: 'file:///a/b.png', fileName: 'photo.png', mimeType: 'image/png' })
    ).toEqual({ uri: 'file:///a/b.png', type: 'image/png', name: 'photo.png' });
  });

  it('infers the type from the extension in the uri', () => {
    expect(attachmentFile({ uri: 'file:///a/pic.HEIC?x=1' })).toEqual({
      uri: 'file:///a/pic.HEIC?x=1',
      type: 'image/heic',
      name: 'pic.HEIC',
    });
  });

  it('falls back to JPEG and adds an extension', () => {
    expect(attachmentFile({ uri: 'content://media/123' })).toEqual({
      uri: 'content://media/123',
      type: 'image/jpeg',
      name: '123.jpg',
    });
  });
});
