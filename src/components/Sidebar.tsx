import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { User } from 'firebase/auth';
import LifeLine from '../assets/life-line.svg';


type TabType = 'overview' | 'users' |'match' | 'analytics' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
}

interface Styles {
  sidebar: React.CSSProperties;
  logo: React.CSSProperties;
  logoIcon: React.CSSProperties;
  logoText: React.CSSProperties;
  nav: React.CSSProperties;
  navItem: React.CSSProperties;
  navItemActive: React.CSSProperties;
  navIcon: React.CSSProperties;
  sidebarFooter: React.CSSProperties;
  userProfile: React.CSSProperties;
  userAvatar: React.CSSProperties;
  userName: React.CSSProperties;
  userEmail: React.CSSProperties;
  logoutBtn: React.CSSProperties;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}> <img
          src={LifeLine}
          alt="LifeLine"
          style={{
            width: '20%',
            height: '20%',
            filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(93deg) brightness(104%) contrast(104%)',
            opacity: 0.8,
          }}
        /></div>
        {/* <span style={styles.logoText}>Deep Admin</span> */}
        
      </div>

      <nav style={styles.nav}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'overview' ? styles.navItemActive : {}),
          }}
        >
          <span style={styles.navIcon}>📊</span>
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'users' ? styles.navItemActive : {}),
          }}
        >
          <span style={styles.navIcon}>👥</span>
          Users
        </button>
         <button
          onClick={() => setActiveTab('match')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'match' ? styles.navItemActive : {}),
          }}
        >
          <span style={styles.navIcon}>🎯</span>
          Match
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'analytics' ? styles.navItemActive : {}),
          }}
        >
          <span style={styles.navIcon}>📈</span>
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'settings' ? styles.navItemActive : {}),
          }}
        >
          <span style={styles.navIcon}>⚙️</span>
          Settings
        </button>
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={styles.userProfile}>
          <div style={styles.userAvatar}>
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={styles.userName}>{user?.displayName || 'User'}</div>
            <div style={styles.userEmail}>{user?.email || ''}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout →
        </button>
      </div>
    </aside>
  );
};

const styles: Styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#1a1d29',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
  },
  logo: {
    padding: '2rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.25rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  nav: {
    flex: 1,
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    fontFamily: "'Poppins', sans-serif",
  },
  navItemActive: {
    backgroundColor: 'rgba(255,109,217,0.15)',
    color: '#FF6DD9',
  },
  navIcon: {
    fontSize: '1.25rem',
  },
  sidebarFooter: {
    padding: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1rem',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '2px',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '150px',
  },
  logoutBtn: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif'",
  },
};

export default Sidebar;