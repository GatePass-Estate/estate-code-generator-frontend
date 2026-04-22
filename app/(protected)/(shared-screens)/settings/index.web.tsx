import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import WebSidebar from "@/src/components/web/WebSidebar";
import { menuRoutes } from "../../user/_layout";
import Back from "@/src/components/mobile/Back";
import { getWidthBreakpoint } from "@/src/lib/helpers";
import { useAuth } from "@/src/hooks/useAuthContext";
import { useUserStore } from "@/src/lib/stores/userStore";
import { deleteAccount } from "@/src/lib/api/user";
import icons from "@/src/constants/icons";
import Modal from "@/src/components/web/Modal";

function SettingsRowWeb({
  label,
  onPress,
  showChevron = true,
}: {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row justify-between items-center gap-10 h-14 bg-[#F7F9F9] rounded-[8px] px-5 mb-3"
    >
      <Text className="text-base font-inter-medium text-primary">{label}</Text>
      {showChevron ? (
        <Image
          source={icons.rightIcon}
          style={{ width: 14, height: 14 }}
          resizeMode="contain"
        />
      ) : null}
    </Pressable>
  );
}

function SectionTitleWeb({ children }: { children: string }) {
  return (
    <Text className="text-xs font-inter-medium uppercase tracking-wider text-grey mt-6 mb-2">
      {children}
    </Text>
  );
}

export default function SettingsWeb() {
  const router = useRouter();
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") document.title = "Settings - GatePass";
  }, []);

  const handleDeleteAccount = () => {
    void (async () => {
      if (!user_id) return;
      setDeleting(true);
      try {
        await deleteAccount();
        await signOut();
      } catch (e: any) {
        setDeleteError(e?.message ?? "Could not delete account.");
      } finally {
        setDeleting(false);
        setShowDeleteModal(false);
      }
    })();
  };

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar
          routes={menuRoutes}
          onNavigate={(route) => router.push(route as any)}
        />
      )}
      <div className="web-body">
        <div
          className={`flex flex-col ${isLargeScreen ? "mt-20 px-4 w-full" : "mt-5 md:px-5"}`}
        >
          {!isLargeScreen && <Back type="short-arrow" />}

          <Text
            className={`text-primary font-ubuntu-bold mt-8 ${isLargeScreen ? "text-4xl" : "text-2xl"}`}
          >
            Settings
          </Text>

          <SectionTitleWeb>Account</SectionTitleWeb>
          <SettingsRowWeb
            label="My Profile"
            onPress={() => router.push("/profile")}
          />
          <SettingsRowWeb
            label="Account Security"
            onPress={() => router.push("/account-security")}
          />

          <SectionTitleWeb>About</SectionTitleWeb>
          <SettingsRowWeb
            label="Terms of Use"
            onPress={() =>
              router.push({
                pathname: "/auth/tos",
                params: { readonly: "true" },
              })
            }
          />
          <SettingsRowWeb
            label="Data Privacy"
            onPress={() =>
              router.push({
                pathname: "/auth/data-protection-policy",
                params: { source: "settings" },
              })
            }
          />

          <SectionTitleWeb>Sign out</SectionTitleWeb>
          <Pressable
            onPress={signOut}
            className="border border-grey rounded-xl px-4 py-4 bg-white mb-3 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-primary text-center">
              Log Out
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="mt-8 items-center py-2 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-tertiary">
              {deleting ? "Deleting…" : "Delete Account"}
            </Text>
          </Pressable>
        </div>
      </div>

      {showDeleteModal && (
        <Modal
          heading="Delete Account"
          message="This will permanently remove your account and sign you out. This action cannot be undone."
          cancelText="Cancel"
          actionText="Delete"
          runningText="Deleting..."
          actionRunnig={deleting}
          btnDisabled={deleting}
          closeModal={() => {
            if (!deleting) setShowDeleteModal(false);
          }}
          action={handleDeleteAccount}
        />
      )}

      {deleteError ? (
        <Modal
          heading="Delete failed"
          message={deleteError}
          cancelText="Close"
          closeModal={() => setDeleteError("")}
        />
      ) : null}
    </div>
  );
}
