import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../utils/api';
import { getToken, removeToken } from "../../utils/auth";
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAdminRole = async () => {
      const token = getToken();
      if (!token) {
        // This case is already handled by ProtectedRoute, but it's good for robustness.
        router.push('/auth/login');
        return;
      }

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.role !== 'admin') {
          // If not an admin, redirect to the user dashboard.
          router.push('/dashboard');
        } else {
          // If admin, fetch users
          const usersRes = await api.get('/auth/admin/users', { headers: { Authorization: `Bearer ${token}` } });
          setUsers(usersRes.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to verify admin role:', error);
        // If token is invalid or any other error, redirect to login.
        router.push('/auth/login');
      }
    };

    checkAdminRole();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/auth/login');
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to delete the user ${email}?`)) {
      try {
        const token = getToken();
        await api.delete(`/auth/admin/users/${email}`, { headers: { Authorization: `Bearer ${token}` } });
        // Remove the user from the local state to update the UI
        setUsers(users.filter(user => user.email !== email));
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to delete user.');
      }
    }
  };

  if (isLoading) {
    return <ProtectedRoute><p>Verifying access...</p></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <div style={{ padding: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <p>Welcome, administrator. You have special powers.</p>
        <button onClick={handleLogout} style={{ marginTop: '1rem', marginBottom: '2rem' }}>Logout</button>

        <h2>User Management</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Verified</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.email} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{user.email}</td>
                <td style={{ padding: '8px' }}>{user.role}</td>
                <td style={{ padding: '8px' }}>{user.is_verified ? 'Yes' : 'No'}</td>
                <td style={{ padding: '8px' }}><button onClick={() => handleDeleteUser(user.email)} style={{ backgroundColor: '#dc3545', color: 'white' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
