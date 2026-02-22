import React, { useMemo } from 'react';
import { FirestoreUser, UserPromptStatus } from '../types';

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
   Shared primitives
───────────────────────────────────────────── */
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1.5px solid #e5e7eb', padding: '16px 20px', ...style }}>
    {children}
  </div>
);

const RowDivider: React.FC = () => (
  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
);

const DetailRow: React.FC<{ icon: string; value: string }> = ({ icon, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '0.88rem', color: '#1a1d29', fontWeight: 500 }}>{value}</span>
  </div>
);

/* ─────────────────────────────────────────────
   Image component
───────────────────────────────────────────── */
const PhotoBox: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => (
  <div style={{ borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f3f4f6', ...style }}>
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  </div>
);

/* ─────────────────────────────────────────────
   Prompt card
───────────────────────────────────────────── */
const PromptCard: React.FC<{ prompt: UserPromptStatus; style?: React.CSSProperties }> = ({ prompt, style }) => (
  <Card style={style}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {prompt.question ?? 'Prompt'}
      </span>
      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1d29', lineHeight: 1.35 }}>
        {(prompt.answer ?? 'No answer provided').trim()}
      </span>
    </div>
  </Card>
);

/* ─────────────────────────────────────────────
   Dating Intention card
───────────────────────────────────────────── */
const DatingIntentionCard: React.FC<{ intention: string }> = ({ intention }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '1.1rem' }}>❤️</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1d29' }}>{intention}</span>
    </div>
  </Card>
);

/* ─────────────────────────────────────────────
   Additional Details card
───────────────────────────────────────────── */
const AdditionalDetailsCard: React.FC<{ user: FirestoreUser; style?: React.CSSProperties }> = ({ user, style }) => {
  const rows: { icon: string; value: string; showDivider: boolean }[] = [];

  if (user.work || user.jobTitle) {
    rows.push({ icon: '💼', value: getCombinedWorkInfo(user), showDivider: !!(user.city || (user.college && user.college.length > 0)) });
  }
  if (user.city) {
    rows.push({ icon: '🏠', value: `Lives in ${user.city}`, showDivider: !!(user.college && user.college.length > 0) });
  }
  if (user.college && user.college.length > 0) {
    rows.push({ icon: '🎓', value: `Studied at ${user.college.join(', ')}`, showDivider: !!user.educationLevel });
  }
  if (user.educationLevel) {
    rows.push({ icon: '📚', value: user.educationLevel, showDivider: !!user.politics });
  }
  if (user.politics) {
    rows.push({ icon: '🗳️', value: user.politics, showDivider: !!(user.languagesSpoken && user.languagesSpoken.length > 0) });
  }
  if (user.languagesSpoken && user.languagesSpoken.length > 0) {
    rows.push({ icon: '🌐', value: user.languagesSpoken.join(', '), showDivider: false });
  }

  if (rows.length === 0) return null;

  return (
    <Card style={style}>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          <DetailRow icon={row.icon} value={row.value} />
          {row.showDivider && <RowDivider />}
        </React.Fragment>
      ))}
    </Card>
  );
};

/* ─────────────────────────────────────────────
   Back bar
───────────────────────────────────────────── */
const BackBar: React.FC<{
  onBack: () => void;
  user: FirestoreUser;
  onEdit: (u: FirestoreUser) => void;
  onDelete: (id: string) => void;
}> = ({ onBack, user, onEdit, onDelete }) => (
  <div style={s.backBar}>
    <button onClick={onBack} style={s.backBtn}>
      <span>←</span>
      <span>Back</span>
    </button>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={() => onEdit(user)} style={{ ...s.actionBtn, ...s.editBtn }}>Edit</button>
      <button
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
            onDelete(user.id);
          }
        }}
        style={{ ...s.actionBtn, ...s.deleteBtn }}
      >
        Delete
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
export interface UserDetailViewProps {
  user: FirestoreUser;
  onBack: () => void;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (userId: string) => void;
}

/* ─────────────────────────────────────────────
   Main export

   Layout:
   ┌─────────────────────────────────────────┐
   │ HERO:  [photo0]   [name/info/prompt0]   │
   ├─────────────────────────────────────────┤
   │ ROW A: [prompt1]  [photo1][photo2]      │
   ├─────────────────────────────────────────┤
   │ ROW B: [photo3][photo4]  [prompt2]      │
   ├─────────────────────────────────────────┤
   │ ROW C: [details+prompt3]  [photo5]      │
   └─────────────────────────────────────────┘
───────────────────────────────────────────── */
const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onEdit, onDelete }) => {
  const validImages = getValidImages(user);

  // All hooks before any early return
  const prompts: UserPromptStatus[] = useMemo(() => {
    if (!user.answeredPrompts || user.answeredPrompts.length === 0) return [];
    return [...user.answeredPrompts].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const pronounsText = user.pronouns && user.pronouns.length > 0 ? user.pronouns.join(' / ') : '';

  if (validImages.length === 0) {
    return (
      <div style={s.wrapper}>
        <BackBar onBack={onBack} user={user} onEdit={onEdit} onDelete={onDelete} />
        <div style={s.emptyImages}>No images available</div>
      </div>
    );
  }

  const [img0, img1, img2, img3, img4, img5] = validImages;
  const p0 = prompts[0];
  const p1 = prompts[1];
  const p2 = prompts[2];
  const p3 = prompts[3];

  return (
    <div style={s.wrapper}>
      <BackBar onBack={onBack} user={user} onEdit={onEdit} onDelete={onDelete} />

      <div style={s.scroll}>

        {/* ══════════════════════════════════
            HERO — photo0 left, info right
        ══════════════════════════════════ */}
        <div style={s.heroRow}>
          <div style={s.heroImageCol}>
            <PhotoBox
              src={img0.imagePath}
              alt={user.name}
              style={{ aspectRatio: '3/4', width: '100%' }}
            />
          </div>

          <div style={s.heroInfoCol}>
            <div style={s.nameRow}>
              <span style={s.name}>{user.name}</span>
              {user.verified && <span style={s.verifiedBadge} title="Verified">✓</span>}
            </div>

            {(pronounsText || user.isOnline) && (
              <div style={s.subRow}>
                {pronounsText && <span style={s.pronouns}>{pronounsText}</span>}
                {pronounsText && user.isOnline && <span style={s.dividerDot}>·</span>}
                {user.isOnline && <span style={s.onlineText}>Active Now</span>}
              </div>
            )}

            <div style={s.pillRow}>
              <div style={s.pillItem}>
                <span style={s.pillLabel}>Age</span>
                <span style={s.pillValue}>{user.age !== undefined ? String(user.age) : '—'}</span>
              </div>
              <div style={s.pillSep} />
              <div style={s.pillItem}>
                <span style={s.pillLabel}>Gender</span>
                <span style={s.pillValue}>{user.gender ?? '—'}</span>
              </div>
              <div style={s.pillSep} />
              <div style={s.pillItem}>
                <span style={s.pillLabel}>Sexuality</span>
                <span style={s.pillValue}>{user.sexuality ?? '—'}</span>
              </div>
            </div>

            {user.datingIntention && <DatingIntentionCard intention={user.datingIntention} />}
            {p0 && <PromptCard prompt={p0} />}
          </div>
        </div>

        {/* ══════════════════════════════════
            ROW A — prompt1 left | photo1+photo2 right
        ══════════════════════════════════ */}
        {img1 && (
          <div style={s.altRow}>
            <div style={s.altInfoCol}>
              {p1
                ? <PromptCard prompt={p1} style={{ height: '100%', boxSizing: 'border-box' }} />
                : <div style={s.emptySlot} />}
            </div>
            <div style={s.altPhotoPair}>
              <PhotoBox
                src={img1.newImagePath ?? img1.replacedImagePath ?? img1.imagePath}
                alt={`${user.name} photo 2`}
                style={{ flex: 1 }}
              />
              {img2 && (
                <PhotoBox
                  src={img2.newImagePath ?? img2.replacedImagePath ?? img2.imagePath}
                  alt={`${user.name} photo 3`}
                  style={{ flex: 1 }}
                />
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ROW B — photo3+photo4 left | prompt2 right
        ══════════════════════════════════ */}
        {img3 && (
          <div style={s.altRow}>
            <div style={s.altPhotoPair}>
              <PhotoBox
                src={img3.newImagePath ?? img3.replacedImagePath ?? img3.imagePath}
                alt={`${user.name} photo 4`}
                style={{ flex: 1 }}
              />
              {img4 && (
                <PhotoBox
                  src={img4.newImagePath ?? img4.replacedImagePath ?? img4.imagePath}
                  alt={`${user.name} photo 5`}
                  style={{ flex: 1 }}
                />
              )}
            </div>
            <div style={s.altInfoCol}>
              {p2
                ? <PromptCard prompt={p2} style={{ height: '100%', boxSizing: 'border-box' }} />
                : <div style={s.emptySlot} />}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ROW C — details+prompt3 left | photo5 right
            photo5 is a single image constrained to one
            grid-photo slot (≈ half of altPhotoPair width)
            so it looks identical to any single photo in
            rows A / B.
        ══════════════════════════════════ */}
        {img5 && (
          <div style={s.altRow}>
            <div style={{ ...s.altInfoCol, flex: 1, gap: '12px' }}>
              {hasAdditionalDetails(user) && <AdditionalDetailsCard user={user} />}
              {p3 && <PromptCard prompt={p3} />}
              {!hasAdditionalDetails(user) && !p3 && <div style={s.emptySlot} />}
            </div>
            {/* Outer container keeps the 60% column width */}
            <div style={s.altPhotoPair}>
              {/* Inner wrapper constrains the single photo to one slot */}
              <div style={s.singlePhotoSlot}>
                <PhotoBox
                  src={img5.newImagePath ?? img5.replacedImagePath ?? img5.imagePath}
                  alt={`${user.name} photo 6`}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Details standalone fallback when no img5 */}
        {!img5 && hasAdditionalDetails(user) && (
          <AdditionalDetailsCard user={user} />
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
};

export default UserDetailView;

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  scroll: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    paddingBottom: '1rem',
  },

  /* ── Back bar ── */
  backBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '1rem',
    marginBottom: '1.25rem',
    borderBottom: '2px solid #f3f4f6',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#667eea',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Poppins', sans-serif",
  },
  editBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '2px solid #dc2626',
  },

  /* ── Hero row ── */
  heroRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  heroImageCol: {
    flexShrink: 0,
    width: '260px',
  },
  heroInfoCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: 0,
  },

  /* ── Name / pronouns / online ── */
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  name: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1d29',
    lineHeight: 1.2,
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  subRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pronouns: { fontSize: '0.88rem', color: '#6b7280' },
  dividerDot: { color: '#d1d5db', fontSize: '1rem' },
  onlineText: { fontSize: '0.88rem', color: '#22c55e', fontWeight: 600 },

  /* ── Pill row ── */
  pillRow: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  pillItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 8px',
    gap: '2px',
  },
  pillLabel: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  pillValue: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: '#1a1d29',
  },
  pillSep: {
    width: '1px',
    backgroundColor: '#e5e7eb',
    alignSelf: 'stretch',
  },

  /* ── Alternating rows ── */
  altRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'stretch',
    minHeight: '340px',
  },
  // Info / prompt column — 38%
  altInfoCol: {
    flex: '0 0 38%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: 0,
  },
  // Photo pair column — 60%
  altPhotoPair: {
    flex: '0 0 60%',
    display: 'flex',
    gap: '10px',
    minHeight: '320px',
  },
  // Single photo slot — constrains one photo to ~half the pair column
  // so it looks identical to one of the two photos in rows A / B
  singlePhotoSlot: {
    flex: '0 0 calc(50% - 5px)',   // mirrors one half of a pair (gap=10px → 5px each side)
    minHeight: '320px',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },

  /* Empty placeholder */
  emptySlot: {
    flex: 1,
    borderRadius: '14px',
    backgroundColor: '#f9fafb',
    border: '1.5px dashed #e5e7eb',
  },

  /* Empty state */
  emptyImages: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#6b7280',
    fontSize: '1rem',
  },
};