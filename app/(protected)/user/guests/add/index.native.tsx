import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import HeaderActions from '@/src/components/mobile/HeaderActions';
import { createGuest } from '@/src/lib/api/guests';
import { useUserStore } from '@/src/lib/stores/userStore';
import { GenderType, RelationshipType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { Picker } from '@/src/components/mobile/Picker';
import { CheckIcon } from '@/src/assets/svgs';

const AddGuestMobile = () => {
  const { tabContentPadding } = useAndroidBottomInset();
  const [guestName, setGuestName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState<GenderType>(null);
  const [addToGuestList, setAddToGuestList] = useState(false);
  const [running, setRunning] = useState<boolean>(false);

  const router = useRouter();

  const inputChecks = (): boolean => {
    if (guestName.trim() === '') {
      Alert.alert('Error', "Please enter the guest's name.");
      return false;
    }

    if (relationship.trim() === '') {
      Alert.alert('Error', 'Please enter your relationship with the guest.');
      return false;
    }

    if (gender == null) {
      Alert.alert('Error', 'Please select a gender.');
      return false;
    }

    return true;
  };

  function handleContinue() {
    if (!inputChecks()) return;

    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: guestName.trim(),
        relationship: relationship.trim(),
        gender: gender as string,
        saveGuest: addToGuestList ? 'true' : 'false',
      },
    });
  }

  async function handleSaveGuest() {
    if (!inputChecks()) return;

    setRunning(true);
    try {
      await createGuest({
        resident_id: useUserStore.getState().user_id,
        guest_name: guestName.trim(),
        relationship: relationship.trim() as RelationshipType,
        gender: gender as GenderType,
      });

      setGuestName('');
      setRelationship('');
      setGender(null);
      setAddToGuestList(false);

      router.push({
        pathname: '/user/guests',
        params: {
          refresh: 'true',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save guest. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <ScrollView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
      contentContainerStyle={{ paddingBottom: tabContentPadding }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F6F7F7' },
          headerRight: () => <HeaderActions />,
        }}
      />

      <Text className="text-[27.34px] font-ubuntu-medium text-primary mt-4">Add Guest</Text>
      <Text className="text-sm font-inter-light text-[#878686] mt-3 mb-6">
        Fill in your guest information
      </Text>

      <View style={{ gap: 20 }}>
        <View className="gap-2">
          <Text className="text-[9px] font-inter-medium text-[#878686]">Name</Text>
          <TextInput
            className="h-12 rounded-2xl bg-[#EFF1F1] px-4 text-sm font-inter-light text-[#878686]"
            placeholder="Enter Guest Name..."
            placeholderTextColor="#878686"
            value={guestName}
            onChangeText={setGuestName}
          />
        </View>

        <View>
          <Picker
            label="Gender"
            selectedValue={gender}
            onValueChange={(value) => setGender(value as GenderType)}
            placeholder="Select the gender of your guest"
            labelClassName="text-[9px] font-inter-medium text-[#878686] mb-2"
            fieldClassName="h-12 rounded-2xl bg-[#EFF1F1] px-4 mt-0"
            placeholderColor="#878686"
            chevronColor="#878686"
            items={[
              { label: 'Female', value: 'female' },
              { label: 'Male', value: 'male' },
              { label: "I'd prefer not to say", value: 'prefer_not_to_say' },
            ]}
          />
        </View>

        <View className="gap-2">
          <Text className="text-[9px] font-inter-medium text-[#878686]">Relationship</Text>
          <TextInput
            className="h-12 rounded-2xl bg-[#EFF1F1] px-4 text-sm font-inter-light text-[#878686]"
            placeholder="Enter your relationship with guest"
            placeholderTextColor="#878686"
            value={relationship}
            onChangeText={setRelationship}
          />
        </View>
      </View>

      <Pressable
        onPress={() => setAddToGuestList((prev) => !prev)}
        className="mt-8 flex-row items-center gap-1.5 self-start"
      >
        {addToGuestList ? <CheckIcon /> : null}
        <Text className="text-[11.2px] font-inter-semibold text-primary">Add to Guest List</Text>
      </Pressable>

      <View className="mt-14 mb-6 flex-row items-center justify-center gap-3">
        <Pressable
          onPress={handleSaveGuest}
          disabled={running}
          className={`h-11 w-[155px] items-center justify-center rounded-full bg-[#E5F6FF] ${running ? 'opacity-70' : ''}`}
        >
          <Text className="text-sm font-ubuntu-semibold text-primary">Save Guest</Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={running}
          className={`h-11 w-[155px] items-center justify-center rounded-full bg-primary ${running ? 'opacity-70' : ''}`}
        >
          <Text className="text-sm font-ubuntu-semibold text-white">Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default AddGuestMobile;
