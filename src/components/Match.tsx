import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { BatchMatchingService } from '../services/batchMatchingService';

interface Styles {
  container: React.CSSProperties;
  buttonContainer: React.CSSProperties;
  triggerButton: React.CSSProperties;
  buttonText: React.CSSProperties;
}

const Match: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Whitelist of allowed admin emails (same as LoginPage)
  const ALLOWED_EMAILS = ['admin@deep.com'];

  useEffect(() => {
    // Check if current user is an admin
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setIsAdmin(ALLOWED_EMAILS.includes(user.email));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTriggerMatch = async () => {
    // Double-check admin status before allowing action
    const currentUser = auth.currentUser;
    
    if (!currentUser || !currentUser.email || !ALLOWED_EMAILS.includes(currentUser.email)) {
      // Show popup for unauthorized users
      alert(
        '⚠️ Unauthorized Action\n\n' +
        'You are not an admin.\n\n' +
        'Only authorized administrators can trigger matching.\n\n' +
        'Please contact the administrator if you need access.'
      );
      return;
    }

    try {
      console.log('Match triggered by admin:', currentUser.email);
      const batchMatchingService = new BatchMatchingService();
      await batchMatchingService.processAllUsersMatching();
      console.log('Matching completed!');
      
      // Success feedback
      alert('✅ Matching process completed successfully!');
    } catch (error) {
      console.error('Error running matching:', error);
      alert('❌ Error running matching. Please check the console for details.');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#666', fontSize: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.buttonContainer}>
        <button 
          style={{
            ...styles.triggerButton,
            opacity: isAdmin ? 1 : 0.6,
            cursor: isAdmin ? 'pointer' : 'not-allowed',
          }}
          onClick={handleTriggerMatch}
        >
          <span style={styles.buttonText}>Trigger Match</span>
        </button>
      </div>
      
      {!isAdmin && (
        <p style={{ 
          position: 'absolute', 
          bottom: '20%', 
          color: '#999', 
          fontSize: '0.9rem',
          textAlign: 'center',
        }}>
          ⚠️ Admin access required
        </p>
      )}
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
    position: 'relative',
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