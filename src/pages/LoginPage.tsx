import React, { useState } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import LifeLine from '../assets/life-line.svg';

interface Styles {
  label: React.CSSProperties;
  input: React.CSSProperties;
  button: React.CSSProperties;
  // googleButton: React.CSSProperties;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Whitelist of allowed admin emails
  const ALLOWED_EMAILS = ['admin@deep.com', 'notanadmin@deep.com'];

  // Handle Email/Password Login with Firebase
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Sign-in attempt with email:', user.email);
      
      // Check if email is authorized
      if (!ALLOWED_EMAILS.includes(user.email || '')) {
        console.log('Unauthorized email detected:', user.email);
        
        // Sign out immediately
        await auth.signOut();
        
        const errorMessage = '🚫 Unauthorized Access';
        setError(errorMessage);
        setLoading(false);
        
        // Show alert popup
        alert(
          '⚠️ Unauthorized Access\n\n' +
          'Only authorized administrators can access this panel.\n\n' +
          `Your email: ${user.email}\n\n` +
          'Please contact the administrator if you need access.'
        );
        
        return;
      }
      
      // If we reach here, user is authorized
      console.log('✅ Authorized admin login:', user.email);
      setLoading(false);
      
      // Now App.jsx can detect auth state and navigate to Dashboard
      
    } catch (err) {
      console.error('Email/Password Sign-In Error:', err);
      const authError = err as AuthError;
      
      // Handle specific error cases
      if (authError.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (authError.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (authError.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else if (authError.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else if (authError.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Sign-in failed. Please try again.');
      }
      
      setLoading(false);
    }
  };

  /* GOOGLE SIGN-IN - COMMENTED OUT
  // Handle Google Sign-In with email validation BEFORE navigation
  const handleGoogleSignIn = async (): Promise<void> => {
    let signedInUser = null;
    
    try {
      setLoading(true);
      setError('');
      
      // Step 1: Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      signedInUser = user;
      
      console.log('Sign-in attempt with email:', user.email);
      
      // Step 2: IMMEDIATELY check if email is authorized
      if (!ALLOWED_EMAILS.includes(user.email || '')) {
        console.log('Unauthorized email detected:', user.email);
        
        // Sign out IMMEDIATELY before any navigation
        await auth.signOut();
        
        const errorMessage = '🚫 Unauthorized Access';
        setError(errorMessage);
        setLoading(false);
        
        // Show alert popup
        alert(
          '⚠️ Unauthorized Access\n\n' +
          'Only authorized administrators can access this panel.\n\n' +
          `Your email: ${user.email}\n\n` +
          'Please contact the administrator if you need access.'
        );
        
        // Stop execution - do NOT proceed
        return;
      }
      
      // Step 3: If we reach here, user is authorized
      console.log('✅ Authorized admin login:', user.email);
      setLoading(false);
      
      // Now App.jsx can detect auth state and navigate to Dashboard
      
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      const authError = err as AuthError;
      
      // Clean up if needed
      if (signedInUser) {
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
      }
      
      // Handle specific error cases
      if (authError.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (authError.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups for this site.');
      } else if (authError.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled');
      } else {
        setError('Sign-in failed. Please try again.');
      }
      
      setLoading(false);
    }
  };
  */

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
        position: 'relative',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Left side - Logo */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={LifeLine}
          alt="LifeLine"
          style={{
            width: '50%',
            height: '20%',
            filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(93deg) brightness(104%) contrast(104%)',
            opacity: 0.8,
          }}
        />
      </div>

      {/* Right side - Login Form */}
      <div
        style={{
          minWidth: '40%',
          position: 'absolute',
          top: '1%',
          right: '0.5%',
          bottom: '1%',
          width: '380px',
          padding: '2.5rem',
          borderRadius: '30px',
          backgroundColor: 'white',
          color: '#111',
          fontFamily: "'Poppins', sans-serif",
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            marginBottom: '-0.5rem',
            fontSize: '2rem',
            fontWeight: '500',
            letterSpacing: '-1px',
          }}
        >
          Welcome Back!
        </h2>
        <p style={{ marginBottom: '2rem', color: '#666', fontSize: '0.9rem' }}>
          Log in to deep's control center
        </p>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '10px',
              backgroundColor: '#fee',
              color: '#c33',
              fontSize: '0.85rem',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Input your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={loading}
          />

          {/* Password Input */}
          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Input your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#999',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPassword ? (
                // Eye-slash icon (password visible)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Eye icon (password hidden)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </span>
          </div>

          {/* Login Button */}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* GOOGLE SIGN-IN SECTION - COMMENTED OUT */}
        {/* 
        <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#999', fontSize: '0.9rem' }}>
          Or continue with:
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            ...styles.googleButton,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '0.5rem' }}>
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        */}
      </div>
    </div>
  );
};

// Styles
const styles: Styles = {
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    marginBottom: '1rem',
    padding: '0.8rem 1rem',
    fontSize: '1rem',
    borderRadius: '30px',
    border: '1px solid rgba(26, 26, 26, 0.1)',
    outline: 'none',
    color: '#1a1a1a',
    boxSizing: 'border-box',
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: 'white',
  },
  button: {
    width: '100%',
    marginTop: '1.5rem',
    padding: '0.9rem',
    fontSize: '1rem',
    borderRadius: '30px',
    border: 'none',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    color: 'white',
    fontWeight: 500,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  // googleButton: {
  //   width: '100%',
  //   padding: '0.9rem',
  //   borderRadius: '30px',
  //   border: '1px solid rgba(26, 26, 26, 0.1)',
  //   backgroundColor: 'white',
  //   color: '#333',
  //   fontWeight: '500',
  //   cursor: 'pointer',
  //   fontFamily: "'Poppins', sans-serif",
  //   display: 'flex',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   boxSizing: 'border-box',
  //   fontSize: '1rem',
  // },
};

export default LoginPage;