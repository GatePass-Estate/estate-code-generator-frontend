import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export type PaymentProcessingState = 'verifying' | 'success' | 'delayed' | 'failed';

export type PaymentProcessingCopy = {
  title: string;
  message: string;
  /** Button label for the finished states (the verifying state has no button). */
  actionLabel?: string;
};

export type PaymentProcessingCopyMap = Record<PaymentProcessingState, PaymentProcessingCopy>;

interface PaymentProcessingModalProps {
  visible: boolean;
  status: PaymentProcessingState;
  copy: PaymentProcessingCopyMap;
  /** Pill shown while verifying. */
  warningLabel?: string;
  onClose: () => void;
  /** Called once the modal is on screen. */
  onShow?: () => void;
}

const FINISHED_VISUALS: Record<
  Exclude<PaymentProcessingState, 'verifying'>,
  {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconSize: number;
    iconColor: string;
    titleColor: string;
    buttonColor?: string;
  }
> = {
  success: { icon: 'checkmark-circle', iconSize: 64, iconColor: '#10B981', titleColor: '#065F46' },
  delayed: { icon: 'time-outline', iconSize: 60, iconColor: '#0284C7', titleColor: '#0369A1' },
  failed: {
    icon: 'close-circle',
    iconSize: 64,
    iconColor: '#EF4444',
    titleColor: '#B91C1C',
    buttonColor: '#475569',
  },
};

/**
 * Payment verification overlay. It can't be closed while verifying (no back button, no backdrop
 * tap). The finished states close from their button, the backdrop or the back button.
 */
export default function PaymentProcessingModal({
  visible,
  status,
  copy,
  warningLabel = 'Do not close this window',
  onClose,
  onShow,
}: PaymentProcessingModalProps) {
  const isVerifying = status === 'verifying';
  const { title, message, actionLabel } = copy[status];
  const visuals = isVerifying ? null : FINISHED_VISUALS[status];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isVerifying ? undefined : onClose}
      onShow={onShow}
    >
      <View style={styles.backdrop}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        {!isVerifying && <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />}

        <View style={styles.card}>
          {isVerifying && (
            <View style={styles.warningPill}>
              <Ionicons name="warning-outline" size={16} color="#92400E" />
              <Text allowFontScaling={false} style={styles.warningPillText}>
                {warningLabel}
              </Text>
            </View>
          )}

          <View style={styles.iconContainer}>
            {visuals ? (
              <Ionicons name={visuals.icon} size={visuals.iconSize} color={visuals.iconColor} />
            ) : (
              <ActivityIndicator size="large" color="#113E55" />
            )}
          </View>

          <Text
            allowFontScaling={false}
            style={[styles.title, visuals ? { color: visuals.titleColor } : null]}
          >
            {title}
          </Text>

          <Text allowFontScaling={false} style={styles.message}>
            {message}
          </Text>

          {visuals && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={[
                styles.actionButton,
                visuals.buttonColor ? { backgroundColor: visuals.buttonColor } : null,
              ]}
            >
              <Text allowFontScaling={false} style={styles.actionButtonText}>
                {actionLabel ?? 'Close'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
  },
  warningPillText: {
    fontSize: 12,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#92400E',
    fontWeight: '600',
  },
  iconContainer: {
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'UbuntuSans-Bold',
    fontSize: 20,
    color: '#113E55',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#113E55',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
