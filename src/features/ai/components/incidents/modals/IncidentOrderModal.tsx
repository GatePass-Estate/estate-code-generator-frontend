import { Pressable, Text, View } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
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
        className="shrink text-sm font-inter-light leading-[normal] text-primary"
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
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end bg-black/80"
      panelClassName="rounded-t-[40px] bg-[#F6F7F7]"
      panelStyle={{ height: 473 }}
    >
      <View style={{ paddingHorizontal: 30, paddingTop: 66 }}>
        <Text
          allowFontScaling={false}
          className="pl-3 text-heading font-ubuntu-medium text-primary"
        >
          Select Order
        </Text>

        <View className="mt-6 gap-2">
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
    </BottomSheet>
  );
}
