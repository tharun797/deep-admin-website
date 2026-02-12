import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import Sidebar from '../components/Sidebar';
import Overview from '../components/Overview';
import Users from '../components/Users';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import Match from '../components/Match';

type TabType = 'overview' | 'users' |'match'| 'analytics' | 'settings';

interface Styles {
  container: React.CSSProperties;
  main: React.CSSProperties;
  header: React.CSSProperties;
  headerTitle: React.CSSProperties;
  headerSubtitle: React.CSSProperties;
  headerActions: React.CSSProperties;
  headerBtn: React.CSSProperties;
  primaryBtn: React.CSSProperties;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard Overview';
      case 'users':
        return 'User Management';
      case 'match':
        return 'Match'
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>{getTabTitle()}</h1>
            <p style={styles.headerSubtitle}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.headerBtn}>📥 Export</button>
            <button style={{ ...styles.headerBtn, ...styles.primaryBtn }}>
              + Add New
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'users' && <Users />}
        {activeTab === 'match' && <Match />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
};

const styles: Styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: "'Poppins', sans-serif",
  },
  main: {
    flex: 1,
    marginLeft: '280px',
    padding: '2rem',
    maxWidth: 'calc(100% - 280px)',
  },
  header: {
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1d29',
    marginBottom: '0.25rem',
    letterSpacing: '-1px',
  },
  headerSubtitle: {
    fontSize: '0.95rem',
    color: '#6b7280',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  headerBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
    color: '#1a1d29',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    color: 'white',
    border: 'none',
  },
};

export default Dashboard;