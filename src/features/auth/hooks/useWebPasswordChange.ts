import { useCallback, useRef, useState } from 'react';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { updatepassword } from '@/src/features/users/services/user';
import { useUserStore } from '@/src/store/userStore';
import { passwordChangeError } from '@/src/features/auth/utils/accountSecurity';

/**
 * State for the web Change Password modal on Account Security (large screens). The update
 * itself stays a service call.
 */
export function useWebPasswordChange() {
  const user_id = useUserStore((state) => state.user_id);

  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const setNewPassword = useCallback(async () => {
    setSavingPassword(true);
    setError('');
    setSuccess('');

    const validationError = passwordChangeError({
      ...password,
      confirmPassword: confirmPasswordRef.current?.value || '',
    });
    if (validationError) {
      setError(validationError);
      setSavingPassword(false);
      return;
    }

    try {
      await updatepassword({
        user_id,
        current_password: password.currentPassword,
        new_password: password.newPassword,
      });
      setSuccess('Password updated successfully');
      setTimeout(() => setShowUpdatePassword(false), 1500);
    } catch (err: unknown) {
      const message = thrownMessage(err) || 'Failed to update password.';
      setError(message);
    } finally {
      setSavingPassword(false);
    }
  }, [password, user_id]);

  /** Clears the last result before the modal (or the mobile password screen) opens. */
  const resetMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    showUpdatePassword,
    setShowUpdatePassword,
    resetMessages,
    modalProps: {
      setShowUpdatePassword,
      error,
      success,
      savingPassword,
      setPassword,
      password,
      showCurrent,
      showNew,
      showConfirm,
      confirmPasswordRef,
      setError,
      setShowCurrent,
      setShowNew,
      setShowConfirm,
      setNewPassword,
    },
  };
}
