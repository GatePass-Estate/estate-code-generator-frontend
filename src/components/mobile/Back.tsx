import { useNavigation } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import icons from '@/src/constants/icons';

const Back = ({
  type = 'long-arrow',
  onPress,
}: {
  type?: 'long-arrow' | 'short-arrow';
  onPress?: () => void;
}) => {
  const navigation = useNavigation();
  const handlePress = onPress ?? (() => navigation.goBack());

  if (type === 'long-arrow')
    return (
      <TouchableOpacity style={styles.backButton} onPress={handlePress}>
        <Icon name="arrow-back" size={20} color="#113E55" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    );

  if (type === 'short-arrow')
    return (
      <TouchableOpacity style={[styles.backButton, { gap: 8 }]} onPress={handlePress}>
        <Image source={icons.backIcon} style={styles.backIcon} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    );

  return null;
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
