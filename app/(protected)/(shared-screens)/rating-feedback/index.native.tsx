import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import StarRating from '@/src/components/common/StarRating';
import { GatePassLogo } from '@/src/components/common/GatePassLogo';
import { DeviconStarshipIcon } from '@/src/components/common/FeedbackIcons';
import icons from '@/src/constants/icons';
import { submitFeedback } from '@/src/lib/api/help';

type Tab = 'Suggestion' | 'Issue';

export default function RatingFeedbackNative() {
  const [activeTab, setActiveTab] = useState<Tab>('Suggestion');
  const [suggestionStep, setSuggestionStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);

  // Form Data
  const [issueText, setIssueText] = useState('');
  const [rating, setRating] = useState(3);
  const [likeMost, setLikeMost] = useState('');
  const [improve, setImprove] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          setShowExitModal(false);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (showExitModal) {
      panY.setValue(0);
    }
  }, [showExitModal]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const hasData = () => {
    return issueText.trim() !== '' || rating > 0 || likeMost.trim() !== '' || improve.trim() !== '';
  };

  const handleBackPress = () => {
    if (suggestionStep === 4) {
      router.push('/user'); // Success screen -> go home
      return;
    }

    if (activeTab === 'Suggestion' && suggestionStep > 1) {
      setSuggestionStep(suggestionStep - 1);
      return;
    }

    if (hasData()) {
      setShowExitModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    router.back();
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(['Suggestion', 'Issue'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab(tab);
            setSuggestionStep(1); // Reset step if they switch back to Suggestion
          }}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderIssueForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.headerTitle}>How can we help you?</Text>
      {renderTabs()}

      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the technical issue"
          placeholderTextColor="#113E55"
          multiline
          value={issueText}
          onChangeText={setIssueText}
          textAlignVertical="top"
        />
        <View style={styles.imagesContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imagePreviewWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImages(images.filter((_, i) => i !== index))}
              >
                <Icon name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Icon name="add" size={24} color="#113E5566" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        By sending, you allow Gatepass to review related technical info to help address your
        feedback
      </Text>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
        onPress={async () => {
          setIsLoading(true);
          try {
            let uploadedUrl = '';
            
            if (images.length > 0) {
              const formData = new FormData();
              formData.append('file', {
                uri: images[0],
                type: 'image/jpeg',
                name: 'upload.jpg',
              } as any);
              formData.append('upload_preset', 'GatePass_Feedback');
              
              const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dcozenahn/image/upload', {
                method: 'POST',
                body: formData,
              });
              
              if (!uploadRes.ok) throw new Error('Failed to upload image to Cloudinary');
              
              const uploadData = await uploadRes.json();
              uploadedUrl = uploadData.secure_url;
              console.log('Cloudinary Native Upload URL:', uploadedUrl);
            }

            await submitFeedback({
              feedback_type: 'issue',
              rating: 1,
              liked: '',
              improvement: '',
              description: issueText,
              attachment_url: uploadedUrl,
            });
            setSuggestionStep(4);
            setActiveTab('Suggestion');
            setImages([]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit feedback');
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={!issueText.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionStep = () => {
    if (suggestionStep === 4) {
      return (
        <View style={styles.successContainer}>
          <View style={{ marginBottom: 32 }}>
            <DeviconStarshipIcon size={80} />
          </View>
          <Text style={styles.successTitle}>Thank you for{'\n'}your feedback!</Text>
          <Text style={styles.successSubtitle}>
            We review every submission to{'\n'}make Gatepass for everyone.
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, { marginTop: 64, width: 260 }]}
            onPress={() => router.push('/user')}
          >
            <Text style={styles.submitButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        {suggestionStep === 1 && (
          <>
            <Text style={styles.headerTitle}>We Value your Feedback</Text>
            {renderTabs()}
          </>
        )}

        <View style={styles.stepContainer}>
          {suggestionStep === 1 && (
            <>
              <Text style={styles.questionTitle}>
                How will you rate your{'\n'}overall experience with{'\n'}Gatepass
              </Text>
              <Text style={styles.questionSubtitle}>(1=Poor, 5= Excellent)</Text>
              <View style={styles.starsWrapper}>
                <StarRating rating={rating} onRatingChange={setRating} size={32} />
              </View>
            </>
          )}

          {suggestionStep === 2 && (
            <TextInput
              style={[styles.textArea, { minHeight: 250, padding: 0 }]}
              placeholder="What do you like the most about the app?"
              placeholderTextColor="#113E5580"
              multiline
              value={likeMost}
              onChangeText={setLikeMost}
              textAlignVertical="top"
            />
          )}

          {suggestionStep === 3 && (
            <TextInput
              style={[styles.textArea, { minHeight: 250, padding: 0 }]}
              placeholder={'What is the one thing we could do to\nimprove your experience?'}
              placeholderTextColor="#113E5580"
              multiline
              value={improve}
              onChangeText={setImprove}
              textAlignVertical="top"
            />
          )}
        </View>

        <View style={[styles.actionRow, { marginTop: 64 }]}>
          <TouchableOpacity
            style={[styles.backStepButton, suggestionStep > 1 && styles.backStepButtonActive]}
            onPress={handleBackPress}
          >
            <Text style={[styles.backStepText, suggestionStep > 1 && styles.backStepTextActive]}>
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextStepButton, isLoading && { opacity: 0.7 }]}
            disabled={isLoading}
            onPress={async () => {
              if (suggestionStep === 3) {
                setIsLoading(true);
                try {
                  await submitFeedback({
                    feedback_type: 'suggestion',
                    rating: rating,
                    liked: likeMost,
                    improvement: improve,
                    description: '',
                    attachment_url: '',
                  });
                  setSuggestionStep(4);
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to submit feedback');
                } finally {
                  setIsLoading(false);
                }
              } else {
                setSuggestionStep(suggestionStep + 1);
              }
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.nextStepText}>{suggestionStep === 3 ? 'Submit' : 'Next'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#064379', '#F6FDFF']} style={{ flex: 1 }}>
      <SafeAreaView style={[sharedStyles.container, { backgroundColor: 'transparent' }]}>
        {/* Custom Header for this screen */}
        <View style={styles.header}>
          {suggestionStep !== 4 && (
            <>
              <TouchableOpacity onPress={handleBackPress} style={styles.headerBack}>
                <Icon name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerLogo}>
                <GatePassLogo style={{ width: 144, height: 52 }} />
              </View>
            </>
          )}
        </View>

        {/* Main Content Area */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {activeTab === 'Issue' ? renderIssueForm() : renderSuggestionStep()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Exit Confirmation Modal */}
        <Modal
          visible={showExitModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowExitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[styles.modalContent, { transform: [{ translateY: panY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragIndicator} />
              <Text style={styles.modalTitle}>Are You sure ?</Text>
              <Text style={styles.modalSubtitle}>Going back would erase your progress</Text>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowExitModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmExit}>
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'UbuntuSans-Bold',
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  card: {
    flex: 1,
    minHeight: '100%',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'UbuntuSans-Medium',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
    marginBottom: 32,
    alignSelf: 'center',
    width: 260,
  },
  tabButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#D1E6EF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#113E55',
  },
  formContainer: {
    flex: 1,
  },
  textAreaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 16,
    minHeight: 220,
    padding: 20,
    marginBottom: 16,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#113E55',
  },
  addImageButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#113E5566',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imagePreviewWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#113E55',
    textAlign: 'justify',
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  submitButton: {
    backgroundColor: '#113E55',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Medium',
  },
  stepContainer: {
    backgroundColor: '#D1E6EF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  questionTitle: {
    fontSize: 20,
    fontFamily: 'UbuntuSans-Bold',
    color: '#113E55',
    textAlign: 'center',
    lineHeight: 28,
  },
  questionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#113E55',
    textAlign: 'center',
    marginTop: 8,
  },
  starsWrapper: {
    marginTop: 32,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 64,
  },
  backStepButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backStepText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Medium',
  },
  backStepButtonActive: {
    backgroundColor: '#E5F3F8',
  },
  backStepTextActive: {
    color: '#113E55',
  },
  nextStepButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#113E55',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Medium',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CEE5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 34,
    fontFamily: 'UbuntuSans-Medium',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    paddingBottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 80,
    height: 5,
    backgroundColor: '#9CA3AF',
    borderRadius: 2.5,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'UbuntuSans-Medium',
    color: '#828282',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 40,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#E5F3F8',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#113E55',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Medium',
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#113E55',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Medium',
  },
});
