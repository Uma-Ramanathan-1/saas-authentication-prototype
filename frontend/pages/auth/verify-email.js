// Verify Email - /pages/auth/verify-email.js

import VerifyForm from '../../components/VerifyForm';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = router.query;

  const handleVerify = async ({ email, token }) => {
    const response = await api.post('/auth/verify-email', { email, token });
    // Redirect to login after a short delay to show success message
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000); // 2-second delay
    return response;
  };

  return <VerifyForm onSubmit={handleVerify} email={email} />;
}