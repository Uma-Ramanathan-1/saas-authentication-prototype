// Reset Password - /pages/auth/reset-password.js

import ResetForm from '../../components/ResetForm';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const router = useRouter();
  const { email } = router.query;

  const handleReset = async ({ email, token, newPassword }) => {
    await api.post('/auth/reset-password', { email, token, newPassword });
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  };

  return <ResetForm onSubmit={handleReset} email={email} />;
}