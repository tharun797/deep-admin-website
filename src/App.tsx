import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

interface Styles {
  loader: React.CSSProperties;
  spinner: React.CSSProperties;
  loaderText: React.CSSProperties;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <p style={styles.loaderText}>Loading...</p>
      </div>
    );
  }

  // Show Dashboard if user is logged in, otherwise show Login
  return user ? <Dashboard /> : <LoginPage />;
};

const styles: Styles = {
  loader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loaderText: {
    marginTop: '1rem',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '500',
  },
};

export default App;