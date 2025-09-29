// Register - /pages/auth/register.js

import AuthForm from '../../components/AuthForm';
import api from '../../utils/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const handleRegister = (credentials) => api.post('/auth/register', credentials);

  return (
    <div>
      <AuthForm type="register" onSubmit={handleRegister} />
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span>Already have an account? </span>
        <Link href="/auth/login">
          Login here
        </Link>
      </div>
    </div>
  );
}
