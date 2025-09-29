//Protected Route – /components/ProtectedRoute.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getToken } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.push('/auth/login');
  }, []);

  return <>{children}</>;
}
