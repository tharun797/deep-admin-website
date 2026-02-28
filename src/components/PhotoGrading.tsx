import React, { useEffect } from 'react';
import usePhotoGrading from '../hooks/usePhotoGrading';

interface PhotoGradingProps {
  onLastRunChange?: (lastRun: string) => void;
  onDurationChange?: (duration: string) => void;
}

// Add scrollbar styles to document
const addScrollbarStyles = () => {
  const styleId = 'photo-grading-scrollbar-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .photo-grading-container::-webkit-scrollbar {
      width: 10px;
    }

    .photo-grading-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .photo-grading-container::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #FF6DD9, #8336C7);
      border-radius: 10px;
      transition: background 0.3s ease;
    }

    .photo-grading-container::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #ff5bc7, #6b2ba0);
    }

    /* Firefox scrollbar */
    .photo-grading-container {
      scrollbar-color: rgba(131, 54, 199, 0.6) transparent;
      scrollbar-width: thin;
    }
  `;
  document.head.appendChild(style);
};

const TIER_CONFIG = {
  A: { color: '#10b981', bg: '#10b98115', range: '85–100', description: 'Exceptional' },
  B: { color: '#3b82f6', bg: '#3b82f615', range: '70–84', description: 'Above Average' },
  C: { color: '#f59e0b', bg: '#f59e0b15', range: '55–69', description: 'Average' },
  D: { color: '#ef4444', bg: '#ef444415', range: '0–54', description: 'Below Average' },
};

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div
    style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s ease, border-color 0.2s ease', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#d1d5db'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
  >
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `linear-gradient(135deg, ${color}20, ${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: '4px 0 0 0', letterSpacing: '-1px' }}>{value}</p>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${color}22, ${color})` }} />
  </div>
);

const TierCard: React.FC<{ tier: 'A' | 'B' | 'C' | 'D'; count: number; total: number }> = ({ tier, count, total }) => {
  const config = TIER_CONFIG[tier];
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, border-color 0.2s ease', cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = config.color; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: config.bg, border: `2px solid ${config.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: config.color, fontFamily: "'Poppins', sans-serif" }}>
          {tier}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: config.color, background: config.bg, padding: '4px 10px', borderRadius: '20px' }}>
          {config.description}
        </span>
      </div>
      <p style={{ fontSize: '2.25rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0', letterSpacing: '-1.5px' }}>{count}</p>
      <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 16px 0' }}>Score: {config.range} • {percentage}% of total</p>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, background: `linear-gradient(90deg, ${config.color}88, ${config.color})`, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${config.color}22, ${config.color})` }} />
    </div>
  );
};

const Photograding: React.FC<PhotoGradingProps> = ({ onLastRunChange, onDurationChange }) => {
  const {
    isAdmin, loading, isProcessing, tierStats, progress,
    handleTriggerGrading, getProgressPercentage, getProgressMessage,
  } = usePhotoGrading(onLastRunChange, onDurationChange);

  // Initialize scrollbar styles on mount
  useEffect(() => {
    addScrollbarStyles();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #8336C7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#666', fontSize: '1rem', marginTop: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px 40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '4rem' }}>🔒</div>
          <h2 style={{ color: '#1a1a1a', margin: '16px 0 8px 0' }}>Access Denied</h2>
          <p style={{ color: '#666', margin: 0 }}>Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#f8f9fa' }} className="photo-grading-container">
      <div style={{ padding: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <StatCard title="Recently Updated Photos" value={tierStats.recentlyUpdated} icon="🆕" color="#8336C7" />
          <StatCard title="Needs Grading" value={tierStats.ungraded} icon="⏳" color="#f59e0b" />
          <StatCard title="Total Graded" value={tierStats.totalGraded} icon="✅" color="#10b981" />
          <StatCard title="Failed / Error" value={tierStats.failed} icon="⚠️" color="#ef4444" />
        </div>

        {/* Tier Distribution */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1d29', margin: 0 }}>Tier Distribution</h2>
            <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{tierStats.totalGraded} users graded total</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {(['A', 'B', 'C', 'D'] as const).map(tier => (
              <TierCard key={tier} tier={tier} count={tierStats[tier]} total={tierStats.totalGraded} />
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', paddingBottom: '2rem' }}>
          {/* Trigger Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#1a1a1a', margin: '0 0 8px 0' }}>Run Photo Grading</h2>
              <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
                Grades users where <strong>tier is null</strong> or <strong>photo was recently updated</strong>. Uses Gemini Vision to analyze profile images.
              </p>
              <button
                style={{ background: 'linear-gradient(135deg, #FF6DD9, #8336C7)', color: 'white', border: 'none', borderRadius: '16px', padding: '20px 48px', fontSize: '1.125rem', fontWeight: '600', cursor: isProcessing ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(131, 54, 199, 0.4)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", opacity: isProcessing ? 0.6 : 1 }}
                onClick={handleTriggerGrading}
                disabled={isProcessing}
                onMouseEnter={(e) => { if (!isProcessing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(131, 54, 199, 0.5)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(131, 54, 199, 0.4)'; }}
              >
                {isProcessing
                  ? <><div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><span style={{ marginLeft: '12px' }}>Grading...</span></>
                  : <span>Trigger Grading</span>
                }
              </button>

              {isProcessing && (
                <div style={{ marginTop: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div style={{ width: '100%', height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${getProgressPercentage()}%`, background: 'linear-gradient(90deg, #FF6DD9, #8336C7)', transition: 'width 0.5s ease', borderRadius: '6px' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>{getProgressPercentage()}%</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: '12px 0 0 0', fontWeight: '500' }}>{getProgressMessage()}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Processed</span>
                      <span style={{ color: '#1a1a1a', fontSize: '1.125rem', fontWeight: '600' }}>{progress.processed} / {progress.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tier Legend */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1a1a1a', margin: '0 0 20px 0' }}>Tier Thresholds</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['A', 'B', 'C', 'D'] as const).map(tier => {
                const config = TIER_CONFIG[tier];
                return (
                  <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: config.bg, border: `1.5px solid ${config.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: config.color, fontSize: '1rem', flexShrink: 0 }}>
                      {tier}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1a1a' }}>{config.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Score: {config.range}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: config.color, background: config.bg, padding: '4px 10px', borderRadius: '20px' }}>
                      {tierStats[tier]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Photograding;