import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import {
  CheckRingIcon,
  ExtendActionIcon,
  FreezeActionIcon,
  ShareActionIcon,
  UnfreezeActionIcon,
} from '@/src/assets/svgs';

type SheetView = 'menu' | 'confirmDelete';

type CodeActionsSheetProps = {
  visible: boolean;
  frozen: boolean;
  initialView?: SheetView;
  deleting?: boolean;
  onClose: () => void;
  onFreezeToggle: () => void;
  onExtend: () => void;
  onShare: () => void;
  onHistory: () => void;
  onConfirmDelete: () => void;
};

function ActionButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EFF1F1]">
        {children}
      </View>
      <Text className="text-[11.2px] font-inter-regular text-[#878686]">{label}</Text>
    </Pressable>
  );
}

function OptionRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-12 flex-row items-center justify-between rounded-2xl bg-[#EFF1F1] px-4"
    >
      <Text className="text-sm font-inter-light text-primary">{label}</Text>
      <CheckRingIcon />
    </Pressable>
  );
}

export default function CodeActionsSheet({
  visible,
  frozen,
  initialView = 'menu',
  deleting = false,
  onClose,
  onFreezeToggle,
  onExtend,
  onShare,
  onHistory,
  onConfirmDelete,
}: CodeActionsSheetProps) {
  const [view, setView] = useState<SheetView>(initialView);

  useEffect(() => {
    if (visible) setView(initialView);
  }, [visible, initialView]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/30" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7] pb-8"
          onPress={() => {}}
          style={{ minHeight: view === 'menu' ? 416 : 300 }}
        >
          <View className="items-center py-2.5">
            <View className="h-[7px] w-[134px] rounded-full bg-[#9B9797]" />
          </View>

          {view === 'menu' ? (
            <View className="px-5 pt-4">
              <View className="flex-row items-center justify-around">
                <ActionButton label={frozen ? 'UNFREEZE' : 'FREEZE'} onPress={onFreezeToggle}>
                  {frozen ? <UnfreezeActionIcon /> : <FreezeActionIcon />}
                </ActionButton>
                <ActionButton label="EXTEND" onPress={onExtend}>
                  <ExtendActionIcon />
                </ActionButton>
                <ActionButton label="SHARE" onPress={onShare}>
                  <ShareActionIcon />
                </ActionButton>
              </View>

              <View className="mt-12 gap-4">
                <OptionRow label="History" onPress={onHistory} />
                <OptionRow label="Delete" onPress={() => setView('confirmDelete')} />
              </View>
            </View>
          ) : (
            <View className="px-5 pt-8 items-center">
              <Text className="text-[27.34px] font-ubuntu-medium text-[#878686]">
                Are You sure ?
              </Text>
              <Text className="mt-6 text-center text-sm font-inter-light text-[#0A1F29]">
                Confirm if you want to delete your invite code. This action is irreverisble.
              </Text>

              <View className="mt-14 flex-row items-center justify-center gap-3">
                <Pressable
                  onPress={() => setView('menu')}
                  className="h-12 w-[152px] items-center justify-center rounded-full bg-[#E5F6FF]"
                >
                  <Text className="text-sm font-ubuntu-semibold text-primary">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmDelete}
                  disabled={deleting}
                  className={`h-12 w-[152px] items-center justify-center rounded-full bg-primary ${deleting ? 'opacity-70' : ''}`}
                >
                  {deleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-sm font-ubuntu-semibold text-white">Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
