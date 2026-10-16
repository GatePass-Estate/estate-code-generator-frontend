import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export type PaymentVerificationState = 'verifying' | 'success' | 'delayed' | 'failed';

interface PaymentVerificationModalProps {
  visible: boolean;
  status: PaymentVerificationState;
  onClose: () => void;
}

export default function PaymentVerificationModal({
  visible,
  status,
  onClose,
}: PaymentVerificationModalProps) {
  const isVerifying = status === 'verifying';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isVerifying ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        {!isVerifying && <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />}

        <View style={styles.card}>
          {isVerifying && (
            <>
              {/* Do not close warning badge */}
              <View style={styles.warningPill}>
                <Ionicons name="warning-outline" size={16} color="#92400E" />
                <Text allowFontScaling={false} style={styles.warningPillText}>
                  Do not close this window
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color="#113E55" />
              </View>

              <Text allowFontScaling={false} style={styles.title}>
                Verifying Payment...
              </Text>

              <Text allowFontScaling={false} style={styles.message}>
                Please stay on this screen while we confirm your transaction with the payment
                gateway.
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>

              <Text allowFontScaling={false} style={[styles.title, { color: '#065F46' }]}>
                Payment Confirmed!
              </Text>

              <Text allowFontScaling={false} style={styles.message}>
                Your subscription has been activated successfully. You can now install and use this
                feature.
              </Text>

              <Pressable onPress={onClose} style={styles.actionButton}>
                <Text allowFontScaling={false} style={styles.actionButtonText}>
                  Continue
                </Text>
              </Pressable>
            </>
          )}

          {status === 'delayed' && (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={60} color="#0284C7" />
              </View>

              <Text allowFontScaling={false} style={[styles.title, { color: '#0369A1' }]}>
                Payment Processing
              </Text>

              <Text allowFontScaling={false} style={styles.message}>
                Your payment was received and is finalizing in the background. Your feature will
                activate shortly.
              </Text>

              <Pressable onPress={onClose} style={styles.actionButton}>
                <Text allowFontScaling={false} style={styles.actionButtonText}>
                  Got It
                </Text>
              </Pressable>
            </>
          )}

          {status === 'failed' && (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
              </View>

              <Text allowFontScaling={false} style={[styles.title, { color: '#B91C1C' }]}>
                Payment Incomplete
              </Text>

              <Text allowFontScaling={false} style={styles.message}>
                We could not confirm your payment. If funds were debited, they will be refunded or
                credited automatically.
              </Text>

              <Pressable
                onPress={onClose}
                style={[styles.actionButton, { backgroundColor: '#475569' }]}
              >
                <Text allowFontScaling={false} style={styles.actionButtonText}>
                  Close
                </Text>
              </Pressable>
            </>
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
