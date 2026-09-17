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
    <Pressable onPress={onPress} className="w-[72px] items-center gap-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EFF1F1]">
        {children}
      </View>
      <Text className="text-center text-[11.2px] font-inter-regular text-[#878686]">{label}</Text>
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
              {/* FREEZE / UNFREEZE · EXTEND · SHARE — Figma 5165:6080 / 5166:1100 */}
              <View className="mt-8 flex-row items-start justify-center gap-[38px]">
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

              <View className="mt-8 gap-2">
                <OptionRow label="History" onPress={onHistory} />
                <OptionRow label="Delete" onPress={() => setView('confirmDelete')} />
              </View>
            </View>
          ) : (
            <View className="items-center px-[35px]">
              <Text className="mt-[50px] text-center text-[27.34px] font-ubuntu-medium text-[#878686]">
                Are You sure ?
              </Text>
              <Text className="mt-[30px] w-[305px] text-center text-sm font-inter-light leading-[17px] text-[#0A1F29]">
                Confirm if you want to delete your invite code. This action is irreversible.
              </Text>

              <View className="mt-[63px] flex-row items-center justify-center gap-5">
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  className="h-12 w-[152px]"
                  onPress={() => {
                    if (initialView === 'confirmDelete') onClose();
                    else setView('menu');
                  }}
                />
                <Button
                  label="Delete"
                  size="md"
                  className="h-12 w-[152px]"
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
