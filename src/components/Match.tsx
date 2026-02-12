import React from 'react';
import { BatchMatchingService } from '../services/batchMatchingService';

interface Styles {
  container: React.CSSProperties;
  buttonContainer: React.CSSProperties;
  triggerButton: React.CSSProperties;
  buttonText: React.CSSProperties;
}

const Match: React.FC = () => {

  const handleTriggerMatch = async () => {
    try {
      console.log('Match triggered!');

      const batchMatchingService = new BatchMatchingService();

      await batchMatchingService.processAllUsersMatching();

      console.log('Matching completed!');
    } catch (error) {
      console.error('Error running matching:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button 
          style={styles.triggerButton}
          onClick={handleTriggerMatch}
        >
          <span style={styles.buttonText}>Trigger Match</span>
        </button>
      </div>
    </div>
  );
};

const styles: Styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerButton: {
    width: '200px',
    height: '200px',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    fontSize: '1.25rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(131, 54, 199, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
    lineHeight: '1.4',
  },
};

export default Match;
