// AuthForm.js to support both login and register flows

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TokenModal from './TokenModal';
import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function AuthForm({ type = 'login', onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Too weak' });

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    let label = 'Too weak';
    if (score > 4) label = 'Strong';
    else if (score > 2) label = 'Medium';
    else if (score > 1) label = 'Weak';

    return { score, label };
  };

  useEffect(() => {
    if (type === 'register') {
      setPasswordStrength(checkPasswordStrength(password));
    }
  }, [password, type]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (type === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (passwordStrength.score < 3) {
        setError('Password is not strong enough. Please include a mix of uppercase, lowercase, numbers, and special characters.');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = { email, password };
      if (type === 'register') {
        payload.role = role;
      }
      const response = await onSubmit(payload);
      if (type === 'register' && response && response.data && response.data.msg) {
        // Extract token and show modal
        const msg = response.data.msg;
        const tokenMatch = msg.match(/Verification token sent: (.*)/);
        if (tokenMatch && tokenMatch[1]) {
          setVerificationToken(tokenMatch[1]);
          setShowTokenModal(true);
        } else {
          setError('Could not retrieve verification token.');
        }
      }
    } catch (err) {
      let errorMessage = 'Something went wrong';
      if (err.response) {
        // Handle FastAPI 422 validation errors
        if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail[0].msg;
        } else {
          errorMessage = err.response.data?.error?.message || err.response.data?.detail || 'An unexpected error occurred.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowTokenModal(false);
    router.push({
      pathname: '/auth/verify-email',
      query: { email: email },
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>{type === 'login' ? 'Login' : 'Register'}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.input}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={styles.input}
        required
      />

      {type === 'register' && (
        <>
          <PasswordStrengthMeter score={passwordStrength.score} label={passwordStrength.label} />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />
          <div style={styles.inputGroup}>
            <label htmlFor="role-select" style={styles.label}>Role</label>
            <select 
              id="role-select"
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              style={styles.input}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={styles.button} disabled={loading || showTokenModal}>
        {loading ? 'Please wait...' : type === 'login' ? 'Login' : 'Sign Up'}
      </button>

      {showTokenModal && (
        <TokenModal token={verificationToken} onClose={handleModalClose} />
      )}
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '300px',
    margin: '2rem auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '0.5rem',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    fontSize: '0.9rem',
  },
  success: {
    color: 'green',
    fontSize: '0.9rem',
    border: '1px solid green',
    padding: '10px',
    borderRadius: '5px',
  },
  label: {
    marginBottom: '0.25rem',
    fontSize: '0.9rem',
  },
};