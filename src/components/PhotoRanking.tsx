import React, { useEffect } from 'react';
import usePhotoRanking from '../hooks/usePhotoRanking';

interface PhotoRankingProps {
    onLastRunChange?: (lastRun: string) => void;
    onDurationChange?: (duration: string) => void;
}

// Add scrollbar styles to document
const addScrollbarStyles = () => {
    const styleId = 'photo-ranking-scrollbar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    .photo-ranking-container::-webkit-scrollbar {
      width: 10px;
    }

    .photo-ranking-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .photo-ranking-container::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #FF6DD9, #8336C7);
      border-radius: 10px;
      transition: background 0.3s ease;
    }

    .photo-ranking-container::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #ff5bc7, #6b2ba0);
    }

    /* Firefox scrollbar */
    .photo-ranking-container {
      scrollbar-color: rgba(131, 54, 199, 0.6) transparent;
      scrollbar-width: thin;
    }
  `;
    document.head.appendChild(style);
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

const PhotoRanking: React.FC<PhotoRankingProps> = ({ onLastRunChange, onDurationChange }) => {
    const {
        isAdmin, loading, isProcessing, rankingStats, progress,
        handleTriggerRanking, getProgressPercentage, getProgressMessage,
    } = usePhotoRanking(onLastRunChange, onDurationChange);

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
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#f8f9fa' }} className="photo-ranking-container">
            <div style={{ padding: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Top Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <StatCard title="Total Processed" value={rankingStats.totalProcessed} icon="📊" color="#8336C7" />
                    <StatCard title="Successfully Ranked" value={rankingStats.totalSuccess} icon="✅" color="#10b981" />
                    <StatCard title="Failed Rankings" value={rankingStats.totalFailed} icon="⚠️" color="#ef4444" />
                    <StatCard title="Remaining" value={Math.max(0, 6 - rankingStats.totalProcessed)} icon="📷" color="#3b82f6" />
                </div>

                {/* Action Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', paddingBottom: '2rem' }}>
                    
                    {/* Trigger Card */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', color: '#1a1a1a', margin: '0 0 8px 0' }}>Run Photo Ranking</h2>
                            <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
                                Analyzes each user's photos and ranks them from best to worst based on dating profile effectiveness.
                                AI evaluates photo quality, composition, facial visibility, and profile optimization value.
                            </p>
                            <button
                                style={{ background: 'linear-gradient(135deg, #FF6DD9, #8336C7)', color: 'white', border: 'none', borderRadius: '16px', padding: '20px 48px', fontSize: '1.125rem', fontWeight: '600', cursor: isProcessing ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(131, 54, 199, 0.4)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", opacity: isProcessing ? 0.6 : 1 }}
                                onClick={handleTriggerRanking}
                                disabled={isProcessing}
                                onMouseEnter={(e) => { if (!isProcessing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(131, 54, 199, 0.5)'; } }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(131, 54, 199, 0.4)'; }}
                            >
                                {isProcessing
                                    ? <><div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><span style={{ marginLeft: '12px' }}>Ranking...</span></>
                                    : <span>🎬 Trigger Photo Ranking</span>
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

                    {/* Info Card */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#1a1a1a', margin: '0 0 20px 0' }}>Ranking Criteria</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>📸 Photo Quality</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Resolution, lighting, focus</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>😊 Facial Visibility</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Expression & eye visibility</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>🎯 Optimization Value</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Profile effectiveness</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>💫 Swipe-Worthiness</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>First impression impact</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoRanking;