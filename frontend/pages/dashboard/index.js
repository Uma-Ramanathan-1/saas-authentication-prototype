// Dashboard Page – /pages/dashboard/index.js

import ProtectedRoute from '../../components/ProtectedRoute';
// Assuming you have an AuthContext providing user info and a logout function.
// You might need to create this.
// import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { removeToken, getToken } from '../../utils/auth';
import Link from 'next/link';
import api from '../../utils/api';

export default function Dashboard() {
  // Example of using an auth hook. If you don't have one,
  // you'd fetch user data another way.
  // const { user, logout } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = getToken();
        await api.delete('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        handleLogout(); // Log out and redirect after successful deletion
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('There was an error deleting your account. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      removeToken();
      console.log('User logged out successfully.');
      // Redirect to the login page after logout
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      // You could show an error message to the user here
    }
  };

  return (
    <ProtectedRoute>
      <div>
        {/* Display user-specific information */}
        <h1>User Dashboard</h1>
        <p>Welcome to your personal dashboard.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={handleLogout}>Logout</button>
          <Link href="/auth/forgot-password">
            <button>Reset Password</button>
          </Link>
          <button onClick={handleDeleteAccount} style={{ backgroundColor: '#dc3545', color: 'white' }}>Delete Account</button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
