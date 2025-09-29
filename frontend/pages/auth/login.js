// Login Page – /pages/auth/login.js

import AuthForm from '../../components/AuthForm';
import api from '../../utils/api';
import { setToken } from '../../utils/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();

  const handleLogin = async ({ email, password }) => {
    // 1. Log in and get the token
    const loginRes = await api.post('/auth/login', { email, password });
    const token = loginRes.data.access_token;
    setToken(token);

    // 2. Use the new token to get user profile
    const profileRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 3. Redirect based on role
    const userRole = profileRes.data.role;
    if (userRole === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div>
      <AuthForm type="login" onSubmit={handleLogin} />
      <div style={{ marginTop: '1rem' }}>
        <Link href="/auth/forgot-password">
          Forgot Password?
        </Link>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <span>Don't have an account? </span>
        <Link href="/auth/register">
          Register here
        </Link>
      </div>
    </div>
  );
}
