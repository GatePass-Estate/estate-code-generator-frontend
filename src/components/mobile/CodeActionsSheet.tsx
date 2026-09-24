import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  CheckRingIcon,
  ExtendActionIcon,
  FreezeActionIcon,
  ShareActionIcon,
  UnfreezeActionIcon,
} from '@/src/assets/svgs';
import Button from '@/src/components/mobile/Button';

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
    <Pressable onPress={onPress} className="w-10 items-center">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EFF1F1]">
        {children}
      </View>
      <Text
        className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]"
        style={{ width: 72, marginHorizontal: -16 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OptionRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-12 w-full flex-row items-center justify-between rounded-2xl bg-[#EFF1F1] px-4"
    >
      <Text className="text-sm font-inter-light text-[#113E55]">{label}</Text>
      <View className="h-6 w-6 items-center justify-center">
        <CheckRingIcon />
      </View>
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
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7]"
          onPress={() => {}}
          style={{ height: view === 'menu' ? 416 : 423 }}
        >
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          {view === 'menu' ? (
            <View className="flex-1 px-5">
              <View
                className="flex-row items-start justify-center"
                style={{ marginTop: 50, gap: 40 }}
              >
                <ActionButton label={frozen ? 'UNFREEZE' : 'FREEZE'} onPress={onFreezeToggle}>
                  {frozen ? (
                    <UnfreezeActionIcon width={16} height={16} />
                  ) : (
                    <FreezeActionIcon width={14} height={14} />
                  )}
                </ActionButton>
                <ActionButton label="EXTEND" onPress={onExtend}>
                  <ExtendActionIcon width={19.5} height={19.5} />
                </ActionButton>
                <ActionButton label="SHARE" onPress={onShare}>
                  <ShareActionIcon width={13.33} height={15} />
                </ActionButton>
              </View>

              <View style={{ marginTop: 34, gap: 8 }}>
                <OptionRow label="History" onPress={onHistory} />
                <OptionRow label="Delete" onPress={() => setView('confirmDelete')} />
              </View>
            </View>
          ) : (
            <View className="items-center">
              <Text className="mt-[50px] text-center text-[27.34px] font-ubuntu-medium text-[#878686]">
                Are You sure ?
              </Text>
              <Text className="mt-[30px] w-[305px] text-sm text-center font-inter-light text-[#0A1F29]">
                Confirm if you want to delete your invite code. This action is irreversible.
              </Text>

              <View
                className="flex-row items-center justify-center"
                style={{ marginTop: 63, gap: 20 }}
              >
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  className="w-[152px] shrink-0 overflow-visible px-8"
                  onPress={() => {
                    if (initialView === 'confirmDelete') onClose();
                    else setView('menu');
                  }}
                />
                <Button
                  label="Delete"
                  size="md"
                  className="w-[152px] shrink-0 overflow-visible px-8"
                  loading={deleting}
                  onPress={onConfirmDelete}
                />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
