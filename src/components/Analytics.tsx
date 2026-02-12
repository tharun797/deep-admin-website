import React from 'react';

interface Styles {
  section: React.CSSProperties;
  placeholder: React.CSSProperties;
  placeholderIcon: React.CSSProperties;
  placeholderTitle: React.CSSProperties;
  placeholderText: React.CSSProperties;
  placeholderBtn: React.CSSProperties;
}

const Analytics: React.FC = () => {
  return (
    <div style={styles.section}>
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>📊</div>
        <h3 style={styles.placeholderTitle}>Analytics Dashboard</h3>
        <p style={styles.placeholderText}>
          Charts and analytics will be displayed here
        </p>
        <button style={styles.placeholderBtn}>
          Coming Soon
        </button>
      </div>
    </div>
  );
};

const styles: Styles = {
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
  },
  placeholder: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  placeholderIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  placeholderTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a1d29',
    marginBottom: '0.5rem',
  },
  placeholderText: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  placeholderBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    fontFamily: "'Poppins', sans-serif",
    opacity: 0.7,
  },
};

export default Analytics;