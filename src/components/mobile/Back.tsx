import { useNavigation } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import icons from '@/src/constants/icons';
import { cn } from '@/src/lib/cn';

const Back = ({
  type = 'long-arrow',
  showText = true,
  showBorder = false,
  onPress,
}: {
  type?: 'long-arrow' | 'short-arrow';
  showText?: boolean;
  showBorder?: boolean;
  onPress?: () => void;
}) => {
  const navigation = useNavigation();
  const handlePress = onPress ?? (() => navigation.goBack());

  return (
    <TouchableOpacity
      style={[styles.backButton, { gap: 8 }]}
      onPress={handlePress}
      className={cn(
        'self-start justify-center',
        showBorder && 'bg-[#EFF1F1] rounded-full w-10 h-10'
      )}
    >
      {type === 'long-arrow' ? (
        <Icon name="arrow-back" size={20} color="#113E55" />
      ) : (
        <Image source={icons.backIcon} style={styles.backIcon} />
      )}
      {showText && <Text style={styles.backText}>Back</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -5,
  },

  backText: {
    color: '#113E55',
    fontSize: 17,
    marginLeft: 5,
    fontWeight: 'medium',
    fontFamily: 'Roboto',
  },

  backIcon: {
    width: 9,
    height: 12,
    top: 1,
    resizeMode: 'contain',
  },
});

export default Back;
