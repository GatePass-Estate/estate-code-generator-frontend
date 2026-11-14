import AsyncStorage from '@react-native-async-storage/async-storage';

export type IncidentReportDraft = {
  categories: string[];
  customCategory: string;
  title: string;
  narrative: string;
  updatedAt: string;
};

const draftKey = (userId: string) => `gatepass-incident-draft:${userId}`;
const pendingWrites = new Map<string, Promise<void>>();

function queueWrite(key: string, operation: () => Promise<void>): Promise<void> {
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  pendingWrites.set(key, next);
  void next
    .finally(() => {
      if (pendingWrites.get(key) === next) pendingWrites.delete(key);
    })
    .catch(() => undefined);
  return next;
}

export async function loadIncidentReportDraft(userId: string): Promise<IncidentReportDraft | null> {
  if (!userId) return null;
  const key = draftKey(userId);
  await pendingWrites.get(key)?.catch(() => undefined);
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object') return null;
    const draft = value as Partial<IncidentReportDraft>;
    if (!Array.isArray(draft.categories) || typeof draft.title !== 'string') return null;
    if (typeof draft.narrative !== 'string' || typeof draft.customCategory !== 'string')
      return null;
    if (!draft.title.trim() && !draft.narrative.trim()) {
      await queueWrite(key, () => AsyncStorage.removeItem(key));
      return null;
    }
    return {
      categories: draft.categories.filter(
        (category): category is string => typeof category === 'string'
      ),
      customCategory: draft.customCategory,
      title: draft.title,
      narrative: draft.narrative,
      updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export async function saveIncidentReportDraft(
  userId: string,
  draft: Omit<IncidentReportDraft, 'updatedAt'>
): Promise<void> {
  if (!userId) return;
  const key = draftKey(userId);
  if (!draft.title.trim() && !draft.narrative.trim()) {
    await queueWrite(key, () => AsyncStorage.removeItem(key));
    return;
  }
  await queueWrite(key, () =>
    AsyncStorage.setItem(key, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }))
  );
}

export async function clearIncidentReportDraft(userId: string): Promise<void> {
  if (!userId) return;
  const key = draftKey(userId);
  await queueWrite(key, () => AsyncStorage.removeItem(key));
}
