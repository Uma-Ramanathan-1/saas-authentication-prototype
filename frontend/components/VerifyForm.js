// VerifyForm.js

import { useState, useEffect } from 'react';

export default function VerifyForm({ onSubmit, email: initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!email || !token) {
      setError('Email and token are required');
      return;
    }

    try {
      setLoading(true);
      const response = await onSubmit({ email, token });
      setSuccess((response && response.data.msg) || 'Email verified successfully! Redirecting to login...');
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || 'Verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Verify Email</h2>
      {success && <p style={styles.success}>{success}</p>}
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ ...styles.input, backgroundColor: '#e9ecef' }}
        readOnly
      />
      <input placeholder="Verification Token" value={token} onChange={e => setToken(e.target.value)} style={styles.input} />
      {error && <p style={styles.error}>{error}</p>}
      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '2rem auto' },
  input: { padding: '0.5rem', fontSize: '1rem' },
  button: { padding: '0.75rem', fontSize: '1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer' },
  error: { color: 'red', fontSize: '0.9rem' },
  success: {
    color: 'green',
    fontSize: '0.9rem',
    border: '1px solid green',
    padding: '10px',
    borderRadius: '5px',
  },
};