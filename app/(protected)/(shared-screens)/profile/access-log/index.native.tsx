import { View, Pressable, ScrollView } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AccessLogCard } from '@/src/components/mobile/AccessLogCard';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { mockResidentAccessLogs } from '@/src/data/mockResidentAccessLogs';
import { sharedStyles } from '@/src/theme/styles';

export default function AccessLogScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader title="Access Log" subtitle="View your access code history." />

      <ScrollView
        
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 21 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          {mockResidentAccessLogs.map((log) => (
            <AccessLogCard
              key={log.id}
              log={log}
              onPress={() => router.push(`/profile/access-log/${log.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
