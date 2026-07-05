import { View, Text, Pressable } from 'react-native';
import { EditIcon, EllipsisIcon } from '@/src/assets/svgs';

type ProfileFieldRowProps = {
  label: string;
  value: string | null;
  pendingValue?: string | null;
  onEdit?: () => void;
  onPendingPress?: () => void;
  isLast?: boolean;
  hasPendingRequest?: boolean;
};

export function ProfileFieldRow({
  label,
  value,
  pendingValue,
  onEdit,
  onPendingPress,
  hasPendingRequest = false,
}: ProfileFieldRowProps) {
  const displayValue = hasPendingRequest
    ? pendingValue?.trim() || value?.trim() || '—'
    : value?.trim() || '—';

  const showAction = hasPendingRequest ? onPendingPress : onEdit;

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Pressable onPress={showAction} disabled={!showAction} className="flex-1 flex-col pr-3">
        <Text className="font-ubuntu-bold text-xs leading-[14px] text-[#6C6C6C]">{label}</Text>
        <Text className="mt-1 font-ubuntu-regular text-xs leading-[14px] text-[#6C6C6C]">
          {displayValue}
        </Text>
      </Pressable>

      {showAction ? (
        hasPendingRequest ? (
          <Pressable onPress={onPendingPress} hitSlop={8}>
            <EllipsisIcon width={17} height={17} />
          </Pressable>
        ) : (
          <Pressable onPress={onEdit} hitSlop={8}>
            <EditIcon width={20} height={20} />
          </Pressable>
        )
      ) : null}
    </View>
  );
}
