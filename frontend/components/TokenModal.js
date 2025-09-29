// components/TokenModal.js
import { useState } from 'react';

export default function TokenModal({ token, onClose }) {
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(
      () => setCopySuccess('Copied!'),
      () => setCopySuccess('Failed to copy')
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>One More Step!</h3>
        <p>Please copy the token below to verify your email.</p>
        <div style={styles.tokenContainer}>
          <pre style={styles.token}>{token}</pre>
          <button type="button" onClick={handleCopy} style={styles.copyButton}>
            Copy
          </button>
        </div>
        {copySuccess && <p style={styles.copySuccess}>{copySuccess}</p>}
        <button type="button" onClick={onClose} style={styles.continueButton}>
          Continue
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  tokenContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f0f0f0',
    padding: '5px 10px',
    borderRadius: '4px',
    margin: '15px 0',
  },
  token: { fontFamily: 'monospace', margin: 0 },
  copyButton: { marginLeft: '10px' },
  copySuccess: { color: 'green', fontSize: '0.9rem' },
  continueButton: { padding: '10px 20px', cursor: 'pointer' },
};