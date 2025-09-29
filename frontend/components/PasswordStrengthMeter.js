// components/PasswordStrengthMeter.js

export default function PasswordStrengthMeter({ score, label }) {
  const getBarColor = (barIndex) => {
    if (score > barIndex) {
      if (score >= 4) return '#28a745'; // Strong (green)
      if (score >= 2) return '#ffc107'; // Medium (orange)
      return '#dc3545'; // Weak (red)
    }
    return '#e9ecef'; // Default (gray)
  };

  return (
    <div style={styles.container}>
      <div style={styles.barsContainer}>
        {Array.from(Array(5).keys()).map((index) => (
          <div
            key={index}
            style={{ ...styles.bar, backgroundColor: getBarColor(index) }}
          />
        ))}
      </div>
      <p style={styles.label}>{label}</p>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '0.5rem',
    width: '100%',
  },
  barsContainer: {
    display: 'flex',
    gap: '4px',
    height: '8px',
  },
  bar: {
    flex: 1,
    borderRadius: '4px',
    transition: 'background-color 0.3s ease-in-out',
  },
  label: {
    fontSize: '0.8rem',
    textAlign: 'right',
    margin: '4px 0 0',
  },
};