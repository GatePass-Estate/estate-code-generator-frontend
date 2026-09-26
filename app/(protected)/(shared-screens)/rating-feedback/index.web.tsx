import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import Back from '@/src/components/mobile/Back';
import StarRating from '@/src/components/common/StarRating';
import Modal from '@/src/components/web/Modal';
import { GatePassLogo } from '@/src/components/common/GatePassLogo';
import { submitFeedback } from '@/src/lib/api/help';

type Tab = 'Suggestion' | 'Issue';

export default function RatingFeedbackWeb() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Suggestion');
  const [suggestionStep, setSuggestionStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);

  // Form Data
  const [issueText, setIssueText] = useState('');
  const [rating, setRating] = useState(0);
  const [likeMost, setLikeMost] = useState('');
  const [improve, setImprove] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  const hasData = () => {
    return issueText.trim() !== '' || rating > 0 || likeMost.trim() !== '' || improve.trim() !== '';
  };

  const handleBackPress = () => {
    if (suggestionStep === 4) {
      router.push('/user' as any);
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
    <div className="flex flex-row bg-white rounded-full p-1 mb-8 w-64 max-w-sm mx-auto">
      {(['Suggestion', 'Issue'] as Tab[]).map((tab) => (
        <button
          key={tab}
          className={`flex-1 h-10 rounded-full flex items-center justify-center transition ${
            activeTab === tab ? 'bg-[#D1E6EF] text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => {
            setActiveTab(tab);
            setSuggestionStep(1);
          }}
        >
          <span
            className={`text-sm ${activeTab === tab ? 'font-inter-medium' : 'font-inter-regular'}`}
          >
            {tab}
          </span>
        </button>
      ))}
    </div>
  );

  const renderIssueForm = () => (
    <div className="flex flex-col flex-1">
      <h2 className="text-[28px] font-ubuntu-medium text-white text-center mb-6">
        How can we help you?
      </h2>
      {renderTabs()}

      <div className="bg-white/45 rounded-2xl p-5 mb-4 flex-1 flex flex-col min-h-[220px]">
        <textarea
          className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] font-inter-regular text-primary placeholder-[#113E55]"
          placeholder="Describe the technical issue"
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
        />

        <div className="flex flex-row gap-3 mt-4">
          {imagePreview && (
            <div className="relative w-12 h-12">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl border border-[#113E55]/20"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
              >
                ✕
              </button>
            </div>
          )}
          {!imagePreview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl border-2 border-dashed border-[#113E55]/40 flex items-center justify-center text-[#113E55]/40 hover:bg-gray-50 transition"
            >
              <Icon name="add" size={24} color="#113E5566" />
            </button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
        />
      </div>

      <p className="text-[13px] font-inter-regular text-[#113E55] text-justify mt-6 mb-8 px-4">
        By sending, you allow Gatepass to review related technical info to help address your
        feedback
      </p>

      <button
        className="bg-primary text-white font-ubuntu-medium text-base h-12 rounded-full w-full max-w-sm mx-auto hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
        onClick={async () => {
          setIsLoading(true);
          try {
            let uploadedUrl = '';

            if (imageFile) {
              const formData = new FormData();
              formData.append('file', imageFile);
              formData.append('upload_preset', 'GatePass_Feedback');

              const uploadRes = await fetch(
                'https://api.cloudinary.com/v1_1/dcozenahn/image/upload',
                {
                  method: 'POST',
                  body: formData,
                }
              );

              if (!uploadRes.ok) throw new Error('Failed to upload image to Cloudinary');

              const uploadData = await uploadRes.json();
              uploadedUrl = uploadData.secure_url;
              console.log('Cloudinary Web Upload URL:', uploadedUrl);
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
            setImageFile(null);
            setImagePreview(null);
          } catch (error: any) {
            alert(error.message || 'Failed to submit feedback');
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={!issueText.trim() || isLoading}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          'Submit Feedback'
        )}
      </button>
    </div>
  );

  const renderSuggestionStep = () => {
    if (suggestionStep === 4) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-20 h-20 rounded-full bg-[#CEE5ED] flex items-center justify-center mb-8">
            <Icon name="rocket" size={32} color="#FFF" />
          </div>
          <h2 className="text-2xl font-ubuntu-bold text-primary text-center mb-4">
            Thank you for
            <br />
            your feedback!
          </h2>
          <p className="text-[15px] font-inter-regular text-gray-500 text-center mb-auto leading-relaxed">
            We review every submission to
            <br />
            make Gatepass for everyone.
          </p>

          <button
            className="bg-primary text-white font-ubuntu-medium text-base h-12 rounded-full w-full max-w-sm mx-auto mt-12 hover:opacity-90 transition"
            onClick={() => router.push('/user' as any)}
          >
            Back to Home
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1">
        <h2 className="text-2xl font-ubuntu-bold text-primary text-center mb-6">
          We Value your Feedback
        </h2>
        {renderTabs()}

        <div className="bg-[#F7F9F9] rounded-2xl p-6 mb-8 flex-1 flex flex-col items-center justify-center min-h-[250px]">
          {suggestionStep === 1 && (
            <>
              <h3 className="text-base font-inter-medium text-primary text-center leading-relaxed">
                How will you rate your
                <br />
                overall experience with
                <br />
                Gatepass
              </h3>
              <p className="text-sm font-inter-regular text-gray-500 text-center mt-2">
                (1-Poor, 5-Excellent)
              </p>
              <div className="mt-8">
                <StarRating rating={rating} onRatingChange={setRating} size={32} />
              </div>
            </>
          )}

          {suggestionStep === 2 && (
            <div className="w-full flex flex-col h-full">
              <h3 className="text-base font-inter-medium text-primary text-left mb-4">
                What do you like the most about the app?
              </h3>
              <textarea
                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[15px] font-inter-regular text-primary"
                value={likeMost}
                onChange={(e) => setLikeMost(e.target.value)}
              />
            </div>
          )}

          {suggestionStep === 3 && (
            <div className="w-full flex flex-col h-full">
              <h3 className="text-base font-inter-medium text-primary text-left mb-4">
                What is the one thing we could do to improve your experience?
              </h3>
              <textarea
                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[15px] font-inter-regular text-primary"
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-row justify-between gap-4 mt-auto max-w-sm w-full mx-auto">
          <button
            className="flex-1 bg-[#F7F9F9] text-primary font-ubuntu-medium text-base h-12 rounded-full hover:bg-gray-200 transition"
            onClick={handleBackPress}
          >
            Back
          </button>
          <button
            className="flex-1 bg-primary text-white font-ubuntu-medium text-base h-12 rounded-full hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading}
            onClick={async () => {
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
                  alert(error.message || 'Failed to submit feedback');
                } finally {
                  setIsLoading(false);
                }
              } else {
                setSuggestionStep(suggestionStep + 1);
              }
            }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : suggestionStep === 3 ? (
              'Submit'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-b from-[#064379] to-[#F6FDFF] overflow-y-auto">
      {/* Custom Header */}
      <div className="h-20 flex flex-row items-center justify-center shrink-0 relative w-full mt-4">
        {suggestionStep !== 4 && (
          <>
            <button
              onClick={handleBackPress}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:opacity-80 transition cursor-pointer absolute left-4 z-10"
            >
              <Icon name="chevron-back" size={24} color="#FFF" />
            </button>
            <div className="flex flex-row items-center justify-center">
              <GatePassLogo style={{ width: 144, height: 52 }} />
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-8 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col min-h-[500px]">
          {activeTab === 'Issue' ? renderIssueForm() : renderSuggestionStep()}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <Modal
          heading="Are You sure ?"
          message="Going back would erase your progress"
          cancelText="Cancel"
          actionText="Confirm"
          actionBtnClassName="bg-primary hover:bg-[#0c2e40]"
          closeModal={() => setShowExitModal(false)}
          action={handleConfirmExit}
        />
      )}
    </div>
  );
}
