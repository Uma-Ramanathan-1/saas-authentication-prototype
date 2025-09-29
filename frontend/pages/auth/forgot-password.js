// Forgot Password - /pages/auth/forgot-password.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import TokenModal from '../../components/TokenModal';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const router = useRouter();

  const handleRequest = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const msg = res.data.msg;
      const tokenMatch = msg.match(/token: (.*)/);
      if (tokenMatch && tokenMatch[1]) {
        setResetToken(tokenMatch[1]);
        setShowTokenModal(true);
      } else {
        setError('Could not retrieve reset token.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowTokenModal(false);
    router.push({
      pathname: '/auth/reset-password',
      query: { email: email },
    });
  };

  return (
    <div style={styles.container}>
      <h2>Forgot Password</h2>
      <p>Enter your email to receive a password reset token.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={styles.input} />
      <button onClick={handleRequest} disabled={loading} style={styles.button}>
        {loading ? 'Sending...' : 'Send Reset Token'}
      </button>
      {error && <p style={styles.error}>{error}</p>}

      {showTokenModal && (
        <TokenModal token={resetToken} onClose={handleModalClose} />
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto' },
  input: { padding: '0.5rem', fontSize: '1rem' },
  button: { padding: '0.75rem', fontSize: '1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' },
  error: { color: 'red', fontSize: '0.9rem' },
};
