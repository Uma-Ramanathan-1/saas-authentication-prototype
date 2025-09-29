// ResetForm.js

import { useState, useEffect } from 'react';

export default function ResetForm({ onSubmit, email: initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !token || !newPassword) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ email, token, newPassword });
      setSuccess('Password has been reset successfully! Redirecting to login...');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Reset Password</h2>
      {success && <p style={styles.success}>{success}</p>}
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ ...styles.input, backgroundColor: '#e9ecef' }}
        readOnly
      />
      <input placeholder="Reset Token" value={token} onChange={e => setToken(e.target.value)} style={styles.input} />
      <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={styles.input} />
      {error && <p style={styles.error}>{error}</p>}
      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto' },
  input: { padding: '0.5rem', fontSize: '1rem' },
  button: { padding: '0.75rem', fontSize: '1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' },
  error: { color: 'red', fontSize: '0.9rem' },
  success: { color: 'green', fontSize: '0.9rem' },
};