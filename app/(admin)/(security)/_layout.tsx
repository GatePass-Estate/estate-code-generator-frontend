import { Stack } from "expo-router";

export default function UserListLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Admin Register", headerShown: false }}
      />
      <Stack.Screen
        name="invite"
        options={{ headerShown: false, presentation: "modal" as any }}
      />
    </Stack>
  );
}
