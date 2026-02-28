import React, { useMemo, useEffect } from 'react';
import { FirestoreUser, UserPromptStatus } from '../types';
import { TIER_CONFIG, TierKey } from '../constants/tierConfig';

// Add scrollbar styles to document
const addScrollbarStyles = () => {
  const styleId = 'user-detail-scrollbar-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .user-detail-container::-webkit-scrollbar {
      width: 10px;
    }

    .user-detail-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .user-detail-container::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #FF6DD9, #8336C7);
      border-radius: 10px;
      transition: background 0.3s ease;
    }

    .user-detail-container::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #ff5bc7, #6b2ba0);
    }

    /* Firefox scrollbar */
    .user-detail-container {
      scrollbar-color: rgba(131, 54, 199, 0.6) transparent;
      scrollbar-width: thin;
    }
  `;
  document.head.appendChild(style);
};

/* ─────────────────────────────────────────────
   Helpers
 ───────────────────────────────────────────── */
const getValidImages = (user: FirestoreUser) =>
  user.images?.filter((img) => img.imagePath && img.imagePath.trim() !== '') ?? [];

const hasAdditionalDetails = (user: FirestoreUser): boolean =>
  !!(
    user.city ||
    user.work ||
    user.jobTitle ||
    (user.college && user.college.length > 0) ||
    user.educationLevel ||
    (user.religiousBeliefs && user.religiousBeliefs.length > 0) ||
    user.politics ||
    (user.languagesSpoken && user.languagesSpoken.length > 0)
  );

const getCombinedWorkInfo = (user: FirestoreUser): string => {
  if (user.jobTitle && user.work) return `${user.jobTitle} at ${user.work}`;
  if (user.jobTitle) return user.jobTitle;
  if (user.work) return user.work;
  return '';
};

/* ─────────────────────────────────────────────
   Shared Components
 ───────────────────────────────────────────── */
const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  children,
  style,
  className = ""
}) => (
  <div className={`glass-card ${className}`} style={{ padding: '1.5rem', ...style }}>
    {children}
  </div>
);

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={sharedStyles.detailRow}>
    <div style={sharedStyles.detailIcon}>{icon}</div>
    <div style={sharedStyles.detailText}>
      <span style={sharedStyles.detailLabel}>{label}</span>
      <span style={sharedStyles.detailValue}>{value}</span>
    </div>
  </div>
);

const PhotoBox: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => (
  <div style={{ borderRadius: '20px', overflow: 'hidden', backgroundColor: 'var(--bg-main)', boxShadow: 'var(--glass-shadow)', ...style }}>
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  </div>
);

/* ─────────────────────────────────────────────
   Logic-based Sub-components
 ───────────────────────────────────────────── */
const PromptCard: React.FC<{ prompt: UserPromptStatus; style?: React.CSSProperties }> = ({ prompt, style }) => (
  <GlassCard style={style}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <span style={sharedStyles.promptQuestion}>
        {prompt.question ?? 'Profile Prompt'}
      </span>
      <span style={sharedStyles.promptAnswer}>
        {(prompt.answer ?? 'No answer provided').trim()}
      </span>
    </div>
  </GlassCard>
);

const TierBadge: React.FC<{ tier?: string; gradingFailed?: boolean }> = ({ tier, gradingFailed }) => {
  if (gradingFailed) {
    return (
      <div style={{ ...sharedStyles.badge, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}>
        <span style={{ fontSize: '1rem' }}>⚠️</span>
        <span>Grading Failed</span>
      </div>
    );
  }

  if (!tier) {
    return (
      <div style={{ ...sharedStyles.badge, backgroundColor: '#f8fafc', color: '#94a3b8', border: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '1rem' }}>⏳</span>
        <span>Ungraded</span>
      </div>
    );
  }

  const config = TIER_CONFIG[tier as TierKey];
  if (!config) return null;
  return (
    <div style={{ ...sharedStyles.badge, backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}20` }}>
      <span style={{ fontWeight: 800 }}>{tier}</span>
      <span>{config.description}</span>
    </div>
  );
};

const AdditionalDetails: React.FC<{ user: FirestoreUser }> = ({ user }) => {
  return (
    <GlassCard style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
      {user.city && (
        <DetailRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
          label="Location"
          value={user.city}
        />
      )}
      {(user.work || user.jobTitle) && (
        <DetailRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
          label="Work"
          value={getCombinedWorkInfo(user)}
        />
      )}
      {user.college && user.college.length > 0 && (
        <DetailRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>}
          label="Education"
          value={user.college.join(', ')}
        />
      )}
      {user.politics && (
        <DetailRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a7 7 0 0 0-7 7c0 1.5.5 3 1.5 4.5L12 22l5.5-8.5c1-1.5 1.5-3 1.5-4.5a7 7 0 0 0-7-7z" /></svg>}
          label="Politics"
          value={user.politics}
        />
      )}
      {user.languagesSpoken && user.languagesSpoken.length > 0 && (
        <DetailRow
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>}
          label="Languages"
          value={user.languagesSpoken.join(', ')}
        />
      )}
    </GlassCard>
  );
};

/* ─────────────────────────────────────────────
   Main Component
 ───────────────────────────────────────────── */
export interface UserDetailViewProps {
  user: FirestoreUser;
  onBack: () => void;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (userId: string) => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onEdit, onDelete }) => {
  const validImages = getValidImages(user);

  // Initialize scrollbar styles on mount
  useEffect(() => {
    addScrollbarStyles();
  }, []);

  const prompts = useMemo(() => {
    if (!user.answeredPrompts || user.answeredPrompts.length === 0) return [];
    return [...user.answeredPrompts];
  }, [user.answeredPrompts]);

  if (validImages.length === 0) {
    return (
      <div style={s.container} className="user-detail-container">
        <header style={s.header}>
          <button onClick={onBack} style={s.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Directory</span>
          </button>
        </header>
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>📷</div>
          <h3>No profile images found</h3>
          <p>This user hasn't uploaded any photos yet.</p>
        </div>
      </div>
    );
  }

  const [img0, , , , , img5] = validImages;

  return (
    <div style={s.container} className="user-detail-container">
      {/* Sleek Navigation Bar */}
      <header style={s.header}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Directory</span>
        </button>
        <div style={s.headerActions}>
          <button onClick={() => onEdit(user)} style={s.editBtn}>Edit Profile</button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                onDelete(user.id);
              }
            }}
            style={s.deleteBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </header>

      <div style={s.content}>
        {/* Hero Section */}
        <section style={s.heroSection}>
          <div style={s.heroPhotoContainer}>
            <PhotoBox src={img0.imagePath} alt={user.name} style={{ width: '100%', height: '100%', aspectRatio: '3/4' }} />
          </div>
          <div style={s.heroInfo}>
            <div style={s.nameBadgeRow}>
              <h1 style={s.userName} className="premium-gradient-text">
                {user.name}
                {user.verified && (
                  <span style={s.verifiedIcon} title="Verified Account">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </h1>
              <div style={s.badgesRow}>
                <TierBadge tier={user.tier} gradingFailed={user.gradingFailed} />
                {user.datingIntention && (
                  <div style={{ ...sharedStyles.badge, backgroundColor: 'rgba(131, 54, 199, 0.05)', color: 'var(--primary)', border: '1px solid rgba(131, 54, 199, 0.1)' }}>
                    <span>❤️</span>
                    <span>{user.datingIntention}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={s.quickMetaRow}>
              {user.isOnline && <span style={s.onlineBadge}>Online</span>}
              <span style={s.metaItem}>{user.age} yrs</span>
              <span style={s.metaDivider}>•</span>
              <span style={s.metaItem}>{user.gender}</span>
              <span style={s.metaDivider}>•</span>
              <span style={s.metaItem}>{user.sexuality}</span>
            </div>

            {prompts[0] && <PromptCard prompt={prompts[0]} style={{ marginTop: '1rem' }} />}
          </div>
        </section>

        {/* Dynamic Grid Layout */}
        <div style={s.gridContainer}>
          {/* Left Column: Prompts & Details */}
          <div style={s.detailsColumn}>
            {hasAdditionalDetails(user) && (
              <div style={s.sectionGroup}>
                <h3 style={s.sectionTitle}>About {user.name.split(' ')[0]}</h3>
                <AdditionalDetails user={user} />
              </div>
            )}

            {prompts.slice(1, 3).map((p) => (
              <div key={p.promptId} style={s.sectionGroup}>
                <PromptCard prompt={p} />
              </div>
            ))}
          </div>

          {/* Right Column: Photo Grid */}
          <div style={s.photoColumn}>
            <div style={s.photoGrid}>
              {validImages.slice(1, 5).map((img, idx) => (
                <PhotoBox
                  key={img.docId}
                  src={img.newImagePath ?? img.replacedImagePath ?? img.imagePath}
                  alt={`Profile ${idx + 2}`}
                  style={{ width: '100%', aspectRatio: '1/1' }}
                />
              ))}
            </div>
            {prompts[3] && (
              <div style={{ marginTop: '1.5rem' }}>
                <PromptCard prompt={prompts[3]} />
              </div>
            )}
          </div>
        </div>

        {/* Final Photo - Constrained size */}
        {img5 && (
          <section style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ width: '320px', maxWidth: '100%' }}>
              <PhotoBox
                src={img5.newImagePath ?? img5.replacedImagePath ?? img5.imagePath}
                alt="Final Profile"
                style={{ width: '100%', aspectRatio: '3/4' }}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserDetailView;

/* ─────────────────────────────────────────────
   Styles
 ───────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: 1,
    height: '100%',
    padding: '2rem',
    overflowY: 'auto',
    color: 'var(--text-primary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
    padding: '0.5rem 0',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  editBtn: {
    padding: '0.6rem 1.25rem',
    borderRadius: '12px',
    background: 'var(--gradient-primary)',
    color: 'white',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(131, 54, 199, 0.2)',
  },
  deleteBtn: {
    padding: '0.6rem',
    borderRadius: '12px',
    background: 'rgba(239, 68, 68, 0.08)',
    color: '#ef4444',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    paddingBottom: '3rem',
  },
  heroSection: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  heroPhotoContainer: {
    flex: '0 0 320px',
    maxWidth: '100%',
  },
  heroInfo: {
    flex: 1,
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '1.25rem',
  },
  nameBadgeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userName: {
    fontSize: '3rem',
    margin: 0,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    lineHeight: 1.1,
  },
  verifiedIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--gradient-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgesRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  quickMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.1rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  onlineBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  metaDivider: {
    color: 'var(--border-light)',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
    gap: '2.5rem',
    alignItems: 'start',
  },
  detailsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  photoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--text-primary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    gap: '1rem',
  },
  emptyIcon: {
    fontSize: '3rem',
    opacity: 0.5,
  }
};

const sharedStyles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  detailRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0,0,0,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
    flexShrink: 0,
  },
  detailText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  promptQuestion: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  promptAnswer: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  }
};