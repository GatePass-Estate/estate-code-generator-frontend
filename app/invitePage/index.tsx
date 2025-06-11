import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import InviteCard from './InviteCard';
import QrBox from './QrBox';

export default function InvitePage() {
  const accessCode = '56T73E';
  const name = 'Sandra Happiness';
  const address = 'Flat 1, 18A Clayinka Something Street, U3 Estate';
  const date = '14/08/2023';
  const time = '6:23pm to 7:23pm';

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(accessCode);
    alert('Copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${time}\nCode: ${accessCode}`,
      });
    } catch (error) {
      alert('Failed to share');
    }
  };

  return (
    <View style={styles.container}>
      <QrBox value={accessCode} />

      <View style={styles.codeRow}>
        <Text style={styles.code}>{accessCode}</Text>
        <Ionicons name="copy-outline" size={18} color="#113E55" onPress={copyToClipboard} />
      </View>

      <InviteCard
        name={name}
        address={address}
        date={date}
        time={time}
        code={accessCode}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
        <Text style={styles.primaryButtonText}>Share Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.cancelText}>Cancel Invite</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  backIcon: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  code: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: '#113E55',
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#113E55',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelText: {
    color: '#113E55',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
