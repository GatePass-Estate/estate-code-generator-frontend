import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import { useUserStore } from '@/src/lib/stores/userStore';
import { UbuntuSans, Inter } from '@/src/constants/fonts';

export default function ManageSeatsScreen() {
  const router = useRouter();
  const { data: estateEntitlements } = useEstateEntitlements();
  const role = useUserStore((s) => s.role);
  const isPrimaryAdmin = role === 'primary_admin' || role === 'root';

  const totalSeats = estateEntitlements?.coveredUsers ?? 0;
  const tierSlug = estateEntitlements?.tierSlug
    ? estateEntitlements.tierSlug.toUpperCase()
    : 'STANDARD';

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text
          allowFontScaling={false}
          style={{
            color: '#113E55',
            fontFamily: UbuntuSans.bold,
            fontSize: 24,
            lineHeight: 28,
            marginBottom: 8,
            marginTop: 24,
          }}
        >
          Add Seats
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            color: '#878686',
            fontFamily: Inter.light,
            fontSize: 14,
            lineHeight: 18,
            marginBottom: 24,
          }}
        >
          Manage and monitor user seat capacity for your estate.
        </Text>

        {/* Current Plan & Capacity Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#CEE5ED',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="account-group-outline" size={22} color="#113E55" />
              </View>
              <View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: Inter.semiBold,
                    fontSize: 15,
                    color: '#113E55',
                  }}
                >
                  Estate Capacity
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: Inter.regular,
                    fontSize: 12,
                    color: '#8A9A9D',
                  }}
                >
                  Current Plan: {tierSlug}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#D9EAE8',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: Inter.medium,
                  fontSize: 11,
                  color: '#1B998B',
                }}
              >
                ACTIVE
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: UbuntuSans.bold,
                fontSize: 36,
                color: '#113E55',
                lineHeight: 42,
              }}
            >
              {totalSeats.toLocaleString()}
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: Inter.medium,
                fontSize: 12,
                color: '#8A9A9D',
                letterSpacing: 0.5,
                marginTop: 2,
              }}
            >
              TOTAL SEATS AVAILABLE
            </Text>
          </View>
        </View>

        {/* Informational Guidance */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Feather name="info" size={18} color="#113E55" />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: Inter.semiBold,
                fontSize: 14,
                color: '#113E55',
              }}
            >
              About Seat Allocation
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: Inter.regular,
              fontSize: 13,
              color: '#6B7280',
              lineHeight: 20,
            }}
          >
            Each seat represents one registered user (resident or security personnel) in your
            estate. To increase your seat capacity, upgrade your plan or request additional seats.
          </Text>
        </View>

        {/* Add Seats Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isPrimaryAdmin}
          onPress={() => router.push('/billing/manage-seats')}
          style={{
            backgroundColor: '#113E55',
            height: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isPrimaryAdmin ? 1 : 0.45,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: UbuntuSans.medium,
              fontSize: 15,
              color: '#FFFFFF',
            }}
          >
            Add Seats
          </Text>
        </TouchableOpacity>
        {!isPrimaryAdmin && (
          <Text
            allowFontScaling={false}
            style={{
              textAlign: 'center',
              marginTop: 10,
              fontFamily: Inter.regular,
              fontSize: 12,
              color: '#878686',
            }}
          >
            Only the primary admin can add seats.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
