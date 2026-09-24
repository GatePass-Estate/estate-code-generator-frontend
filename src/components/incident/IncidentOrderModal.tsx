import { Modal, Pressable, Text, View } from 'react-native';
import { CheckRingIcon } from '@/src/assets/svgs';

type IncidentOrderModalProps = {
  visible: boolean;
  onClose: () => void;
  sortAscending: boolean;
  onSelect: (ascending: boolean) => void;
};

function OrderOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-12 w-full flex-row items-center justify-between overflow-visible rounded-2xl bg-[#EFF1F1] px-4"
      hitSlop={4}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        className="shrink text-sm font-inter-light leading-[normal] text-[#113E55]"
      >
        {label}
      </Text>
      <View className="ml-2 h-6 w-6 shrink-0 items-center justify-center">
        {selected ? <CheckRingIcon width={24} height={24} /> : null}
      </View>
    </Pressable>
  );
}

export default function IncidentOrderModal({
  visible,
  onClose,
  sortAscending,
  onSelect,
}: IncidentOrderModalProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7]"
          onPress={() => {}}
          style={{ height: 473 }}
        >
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="px-5 pt-[66px]">
            <Text
              allowFontScaling={false}
              className="text-[27.34px] font-ubuntu-medium text-[#113E55]"
            >
              Select Order
            </Text>

            <View className="mt-6 gap-2 p-2">
              <OrderOption
                label="Ascending Order"
                selected={sortAscending}
                onPress={() => {
                  onSelect(true);
                  onClose();
                }}
              />
              <OrderOption
                label="Descending Order"
                selected={!sortAscending}
                onPress={() => {
                  onSelect(false);
                  onClose();
                }}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
