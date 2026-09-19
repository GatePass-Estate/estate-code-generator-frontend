import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface UserOverviewItemProps {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  anomalyLevel: 'high' | 'medium' | 'low';
}

export default function UserOverviewItem({ id, name, role, avatarUrl, anomalyLevel }: UserOverviewItemProps) {
  const getLevelColor = () => {
    switch (anomalyLevel) {
      case 'high': return '#ED0808';
      case 'medium': return '#F46036';
      case 'low': return '#1B998B';
      default: return '#1B998B';
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/(protected)/(shared-screens)/ai-store/anomaly-detection/user/${id}`)}
      className="flex-row items-center justify-between py-3 border-b border-[#F3F4F6]"
    >
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: avatarUrl }}
          className="w-10 h-10 rounded-full bg-[#E5E7EB]"
        />
        <View>
          <Text allowFontScaling={false} className="text-[14px] font-ubuntu-medium text-[#113E55]">{name}</Text>
          <Text allowFontScaling={false} className="text-[12px] font-inter-regular text-[#8A9A9D]">{role}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <MaterialIcons 
          name="trending-up" 
          size={20} 
          color={getLevelColor()} 
        />
        <MaterialIcons name="chevron-right" size={20} color="#8A9A9D" />
      </View>
    </Pressable>
  );
}
