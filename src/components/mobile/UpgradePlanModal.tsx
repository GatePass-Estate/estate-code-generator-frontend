import { Modal, Pressable, Text, View } from 'react-native';
import { CrownIcon, CloseCircleIcon } from '@/src/assets/svgs';
import Button from './Button';
import { PlanFeature, UPGRADE_COPY } from '@/src/lib/plans';

type UpgradePlanModalProps = {
  visible: boolean;
  feature: PlanFeature | null;
  onClose: () => void;
  onUpgrade?: () => void;
};

export default function UpgradePlanModal({
  visible,
  feature,
  onClose,
  onUpgrade,
}: UpgradePlanModalProps) {
  const body = feature ? UPGRADE_COPY[feature] : UPGRADE_COPY.advanced_code_management;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/80 px-5">
        <View className="items-center" style={{ width: 337, transform: [{ translateY: -48 }] }}>
          <View
            className="items-center rounded-[24px] border-[0.5px] border-[#CEE5ED] bg-white"
            style={{
              width: 337,
              paddingHorizontal: 16,
              paddingVertical: 40,
            }}
          >
            <View className="items-center" style={{ padding: 5, gap: 24 }}>
              <View className="items-center" style={{ width: 257, maxWidth: 257, gap: 16 }}>
                <View className="items-center" style={{ gap: 8 }}>
                  <CrownIcon width={40} height={40} />
                  <Text
                    className="text-center font-ubuntu-medium text-[#0A1F29]"
                    style={{ fontSize: 27.34, lineHeight: 27.34 }}
                  >
                    Upgrade Plan
                  </Text>
                </View>
                <Text
                  className="text-center font-inter-light text-[#878686]"
                  style={{ fontSize: 14, lineHeight: 18, width: '100%', maxWidth: 257 }}
                >
                  {body}
                </Text>
              </View>
              <Button
                label="Upgrade Your Plan"
                onPress={() => {
                  onUpgrade?.();
                  onClose();
                }}
              />
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{ position: 'absolute', top: '100%', marginTop: '40%', alignSelf: 'center' }}
          >
            <CloseCircleIcon width={32} height={32} color="#F6F7F7" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
