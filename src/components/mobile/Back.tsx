import { useNavigation } from 'expo-router';
import {
  Image,
  type ImageStyle,
  StyleSheet,
  type StyleProp,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import icons from '@/src/constants/icons';
import { cn } from '@/src/lib/cn';

const Back = ({
  type = 'long-arrow',
  showText = true,
  showBorder = false,
  borderSize = 40,
  leftOffset = -5,
  iconStyle,
  onPress,
}: {
  type?: 'long-arrow' | 'short-arrow';
  showText?: boolean;
  showBorder?: boolean;
  borderSize?: number;
  leftOffset?: number;
  iconStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
}) => {
  const navigation = useNavigation();
  const handlePress = onPress ?? (() => navigation.goBack());

  return (
    <TouchableOpacity
      style={[
        styles.backButton,
        { gap: 8, marginLeft: leftOffset },
        showBorder && {
          backgroundColor: '#EFF1F1',
          borderRadius: borderSize / 2,
          height: borderSize,
          justifyContent: 'center',
          width: borderSize,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      className={cn('self-start justify-center', showBorder && 'items-center')}
    >
      {type === 'long-arrow' ? (
        <Icon name="arrow-back" size={20} color="#113E55" />
      ) : (
        <Image source={icons.backIcon} style={[styles.backIcon, iconStyle]} />
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
