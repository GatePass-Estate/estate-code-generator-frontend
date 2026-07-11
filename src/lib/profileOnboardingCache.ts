import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileOnboardingCache = {
  hasIdentification: boolean;
  hasPhoto: boolean;
};

function cacheKey(userId: string) {
  return `@gatepass/profile-onboarding/${userId}`;
}

export async function getProfileOnboardingCache(
  userId: string
): Promise<ProfileOnboardingCache | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ProfileOnboardingCache;
  } catch {
    return null;
  }
}

export async function setProfileOnboardingCache(
  userId: string,
  partial: Partial<ProfileOnboardingCache>
) {
  if (!userId) return;

  const existing =
    (await getProfileOnboardingCache(userId)) ?? {
      hasIdentification: false,
      hasPhoto: false,
    };

  await AsyncStorage.setItem(
    cacheKey(userId),
    JSON.stringify({ ...existing, ...partial })
  );
}
