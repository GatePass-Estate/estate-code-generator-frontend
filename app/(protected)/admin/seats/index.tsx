import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';

export default function ManageSeatsScreen() {
  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7', paddingHorizontal: 20 }]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          headerShadowVisible: false,
        }}
      />

      <Back type="short-arrow" showText={false} showBorder borderSize={30} leftOffset={-3} />

      <Text
        style={{
          color: '#113E55',
          fontFamily: 'UbuntuSans-SemiBold',
          fontSize: 21.88,
          lineHeight: 26,
          marginBottom: 8,
          marginLeft: 6,
          marginTop: 40,
        }}
      >
        Add Seats
      </Text>
      <Text
        style={{
          color: '#878686',
          fontFamily: 'Inter_18pt-Light',
          fontSize: 14,
          lineHeight: 17,
          marginLeft: 6,
          maxWidth: 320,
        }}
      >
        Manage and purchase additional seat capacity for your estate.
      </Text>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: 'Inter_18pt-Medium',
            fontSize: 16,
            color: '#8A9A9D',
          }}
        >
          Add Seats
        </Text>
      </View>
    </SafeAreaView>
  );
}
