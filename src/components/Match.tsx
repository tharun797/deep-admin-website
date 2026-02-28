import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { BatchMatchingService } from '../services/batchMatchingService';
import { MatchConfigService, MatchConfig } from '../services/matchConfigService';
import { doc, onSnapshot } from 'firebase/firestore';
import { ResetMatchesService } from '../services/resetMatchesService';

interface Styles {
  [key: string]: React.CSSProperties;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

interface MatchProps {
  onLastRunChange?: (lastRun: string) => void;
  onActiveMatchesChange?: (count: number) => void;
  onDurationChange?: (duration: string) => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.borderColor = '#d1d5db';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = '#e5e7eb';
    }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${color}20, ${color}10)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: '4px 0 0 0', letterSpacing: '-1px' }}>{value}</p>
    </div>
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${color}22, ${color})`,
      }}
    />
  </div>
);

const Match: React.FC<MatchProps> = ({ onLastRunChange, onActiveMatchesChange, onDurationChange }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [progress, setProgress] = useState<MatchConfig | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMatches: 0,
    unmatchedUsers: 0,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const ALLOWED_EMAILS = ['admin@deep.com'];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setIsAdmin(ALLOWED_EMAILS.includes(user.email));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Load initial data
    const loadInitialData = async () => {
      try {
        const config = await MatchConfigService.getMatchConfig();
        setProgress(config);

        // Update stats
        if (config.totalMatches) {
          setStats(prev => ({
            ...prev,
            activeMatches: config.totalMatches,
            unmatchedUsers: config.unmatchedUsers || 0
          }));
          if (onActiveMatchesChange) {
            onActiveMatchesChange(config.totalMatches);
          }
        }

        if (config.lastRun && onLastRunChange) {
          onLastRunChange(formatTimeAgo(config.lastRun));
        }

        if (config.startTime && config.endTime && onDurationChange) {
          onDurationChange(formatDuration(config.startTime, config.endTime));
        }

        if (config.matchingInProgress) {
          setIsProcessing(true);
          subscribeToProgress();
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    return () => {
      unsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onLastRunChange, onActiveMatchesChange, onDurationChange]);

  const subscribeToProgress = () => {
    // Real-time listener for progress updates
    const configRef = doc(db, 'appConfig', 'matchSettings');

    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const config: MatchConfig = {
          lastRun: data.lastRun?.toDate() || null,
          matchingInProgress: data.matchingInProgress || false,
          totalMatches: data.totalMatches || 0,
          lastRunBy: data.lastRunBy || null,
          progressStatus: data.progressStatus || 'idle',
          totalUsers: data.totalUsers || 0,
          processedUsers: data.processedUsers || 0,
          matchedUsers: data.matchedUsers || 0,
          unmatchedUsers: data.unmatchedUsers || 0,
          startTime: data.startTime?.toDate() || null,
          endTime: data.endTime?.toDate() || null,
          estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        };

        setProgress(config);

        // If matching completed, stop processing
        if (!config.matchingInProgress && isProcessing) {
          setIsProcessing(false);
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }

          // Update stats
          if (config.totalMatches) {
            setStats(prev => ({
              ...prev,
              activeMatches: config.totalMatches,
              unmatchedUsers: config.unmatchedUsers || 0
            }));
            if (onActiveMatchesChange) {
              onActiveMatchesChange(config.totalMatches);
            }
          }

          if (config.lastRun && onLastRunChange) {
            onLastRunChange(formatTimeAgo(config.lastRun));
          }

          if (config.startTime && config.endTime && onDurationChange) {
            onDurationChange(formatDuration(config.startTime, config.endTime));
          }
        }
      }
    });

    unsubscribeRef.current = unsubscribe;
  };

  const handleTriggerMatch = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email || !ALLOWED_EMAILS.includes(currentUser.email)) {
      alert(
        '⚠️ Unauthorized Action\n\n' +
        'You are not an admin.\n\n' +
        'Only authorized administrators can trigger matching.\n\n' +
        'Please contact the administrator if you need access.'
      );
      return;
    }

    // Check if matching is already in progress
    const isInProgress = await MatchConfigService.isMatchingInProgress();
    if (isInProgress) {
      alert(
        '⚠️ Matching Already Running\n\n' +
        'A matching process is already in progress.\n\n' +
        'Please wait for it to complete before starting another one.'
      );
      return;
    }

    setIsProcessing(true);

    // Subscribe to real-time progress updates
    subscribeToProgress();

    try {
      console.log('Match triggered by admin:', currentUser.email);

      const batchMatchingService = new BatchMatchingService();

      const totalMatches = await batchMatchingService.processAllUsersMatching(currentUser.email);

      console.log('Matching completed! Total matches:', totalMatches);

      // Get the updated config
      const config = await MatchConfigService.getMatchConfig();

      if (config.lastRun && onLastRunChange) {
        onLastRunChange(formatTimeAgo(config.lastRun));
      }

      if (config.startTime && config.endTime && onDurationChange) {
        onDurationChange(formatDuration(config.startTime, config.endTime));
      }

      if (onActiveMatchesChange) {
        onActiveMatchesChange(totalMatches);
      }

      // Update local stats
      setStats(prev => ({
        ...prev,
        activeMatches: totalMatches,
        unmatchedUsers: config.unmatchedUsers || 0
      }));

      const duration = config.startTime && config.endTime
        ? Math.round((config.endTime.getTime() - config.startTime.getTime()) / 1000)
        : 0;

      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const timeStr = duration > 0 ? `${minutes}m ${seconds}s` : 'N/A';

      alert(
        `✅ Matching Completed Successfully!\n\n` +
        `Total matches created: ${totalMatches}\n` +
        `Unmatched users: ${config.unmatchedUsers || 0}\n` +
        `Time taken: ${timeStr}`
      );
    } catch (error) {
      console.error('Error running matching:', error);
      alert('❌ Error running matching. Please check the console for details.');
    } finally {
      setIsProcessing(false);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };

  const getProgressMessage = (): string => {
    if (!progress) return '';

    switch (progress.progressStatus) {
      case 'initializing':
        return 'Loading user profiles...';
      case 'matching':
        return `Processing user ${progress.processedUsers || 0} of ${progress.totalUsers || 0}...`;
      case 'processing_unmatched':
        return 'Finding potential matches for unmatched users...';
      case 'finalizing':
        return 'Finalizing matches and updating priorities...';
      case 'completed':
        return 'Matching completed successfully!';
      case 'error':
        return 'Error occurred during matching';
      default:
        return 'Preparing...';
    }
  };

  const getProgressPercentage = (): number => {
    if (!progress) return 0;

    switch (progress.progressStatus) {
      case 'initializing':
        return 5;

      case 'matching':
        {
          if (!progress.totalUsers) return 10;
          const matchingProgress = (progress.processedUsers || 0) / progress.totalUsers;
          return 10 + (matchingProgress * 60);
        }

      case 'processing_unmatched':
        return 80;

      case 'finalizing':
        return 95;

      case 'completed':
        return 100;

      default:
        return 0;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDuration = (startTime: Date | null, endTime: Date | null): string => {
    if (!startTime || !endTime) return 'N/A';
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}m ${secs}s`;
  };

  const handleResetMatch = async () => {
    try {
      setIsResetting(true);
      const resetMatchesService = new ResetMatchesService();
      await resetMatchesService.resetAllMatches();
      // Clear local stats to reflect the reset
      setStats({ totalUsers: 0, activeMatches: 0, unmatchedUsers: 0 });
      alert('✅ Reset completed successfully!');
    } catch (error) {
      console.error('Error resetting matches:', error);
      alert('❌ Error resetting matches. Please check the console for details.');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>
          <div style={styles.loaderSpinner}></div>
          <p style={{ color: '#666', fontSize: '1rem', marginTop: '16px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.unauthorizedCard}>
          <div style={styles.unauthorizedIcon}>🔒</div>
          <h2 style={{ color: '#1a1a1a', margin: '16px 0 8px 0' }}>Access Denied</h2>
          <p style={{ color: '#666', margin: 0 }}>Admin privileges required to view this dashboard</p>
        </div>
      </div>
    );
  }

  // Whether any async operation is running
  const isBusy = isProcessing || isResetting;

  return (
    <div style={styles.dashboardContainer}>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard title="Total Users" value={progress?.totalUsers || stats.totalUsers} icon="👥" color="#8336C7" />
        <StatCard title="Active Matches" value={stats.activeMatches} icon="💝" color="#FF6DD9" />
        <StatCard title="No Matches" value={stats.unmatchedUsers} icon="❌" color="#ef4444" />
      </div>

      {/* Main Action Section */}
      <div style={styles.actionSection}>
        {/* Trigger Match Card */}
        <div style={styles.actionCard}>
          <div style={styles.actionCardContent}>
            <h2 style={{ fontSize: '1.5rem', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              Run Matching Algorithm
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
              Process all users and generate new matches based on compatibility scores
            </p>

            <button
              style={{
                ...styles.triggerButton,
                opacity: isBusy ? 0.6 : 1,
                cursor: isBusy ? 'not-allowed' : 'pointer',
              }}
              onClick={handleTriggerMatch}
              disabled={isBusy}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(131, 54, 199, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(131, 54, 199, 0.4)';
              }}
            >
              {isProcessing ? (
                <>
                  <div style={styles.buttonSpinner}></div>
                  <span style={{ marginLeft: '12px' }}>Processing...</span>
                </>
              ) : (
                <span>Trigger Match</span>
              )}
            </button>

            {isProcessing && progress && (
              <div style={styles.processingIndicator}>
                {/* Progress Bar */}
                <div style={styles.progressBarContainer}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${getProgressPercentage()}%`,
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                    {getProgressPercentage()}%
                  </span>
                </div>

                {/* Status Message */}
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '12px 0 0 0', fontWeight: '500' }}>
                  {getProgressMessage()}
                </p>

                {/* Progress Stats */}
                <div style={styles.progressStats}>
                  <div style={styles.progressStat}>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Processed</span>
                    <span style={{ color: '#1a1a1a', fontSize: '1.125rem', fontWeight: '600' }}>
                      {progress.processedUsers || 0} / {progress.totalUsers || 0}
                    </span>
                  </div>
                  <div style={styles.progressStat}>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Matched</span>
                    <span style={{ color: '#10b981', fontSize: '1.125rem', fontWeight: '600' }}>
                      {progress.matchedUsers || 0}
                    </span>
                  </div>
                  {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                    <div style={styles.progressStat}>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Est. Time</span>
                      <span style={{ color: '#1a1a1a', fontSize: '1.125rem', fontWeight: '600' }}>
                        {formatTime(progress.estimatedTimeRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Card */}
        <div style={styles.resetCard}>
          <div style={styles.resetCardContent}>
            <h2 style={{ fontSize: '1.5rem', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              Reset
            </h2>
            <p style={{ color: '#666', margin: '0 0 16px 0', fontSize: '0.875rem' }}>
              Clear all matching statistics and history
            </p>

            <button
              style={{
                ...styles.resetButton,
                opacity: isBusy ? 0.4 : 1,
                cursor: isBusy ? 'not-allowed' : 'pointer',
              }}
              onClick={handleResetMatch}
              disabled={isBusy}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              {isResetting ? (
                <>
                  <div style={styles.resetSpinner}></div>
                  <span style={{ marginLeft: '8px' }}>Resetting...</span>
                </>
              ) : (
                <span>Reset</span>
              )}
            </button>
          </div>
        </div>
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
    background: '#f8f9fa',
  },
  dashboardContainer: {
    minHeight: '100vh',
    width: '100%',
    padding: '0 2rem 2rem 2rem',
    boxSizing: 'border-box',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  actionSection: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  actionCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid #e5e7eb',
  },
  actionCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  resetCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid #e5e7eb',
  },
  resetCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  triggerButton: {
    background: 'linear-gradient(135deg, #FF6DD9, #8336C7)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '20px 48px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(131, 54, 199, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    background: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '140px',
  },
  loader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  loaderSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #8336C7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  unauthorizedCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  },
  unauthorizedIcon: {
    fontSize: '4rem',
  },
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  resetSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    flexShrink: 0,
  },
  processingIndicator: {
    marginTop: '24px',
    width: '100%',
    maxWidth: '500px',
  },
  progressBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: '#f0f0f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #FF6DD9, #8336C7)',
    transition: 'width 0.5s ease',
    borderRadius: '6px',
  },
  progressStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '16px',
    marginTop: '20px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
  },
  progressStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
};

// Add keyframe animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 1024px) {
    .actionSection {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Match;