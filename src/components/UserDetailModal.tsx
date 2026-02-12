import React from 'react';
import { FirestoreUser } from '../types';

interface UserDetailModalProps {
  user: FirestoreUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (userId: string) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !user) return null;

  const validImages = user.images?.filter(
    (img) => img.imagePath && img.imagePath.trim() !== ''
  ) || [];

  const firstImage = validImages[0]?.imagePath || '';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      onDelete(user.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={styles.backdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>{user.name}</h2>
            {user.verified && (
              <div style={styles.verifiedBadge}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5.5 8L7 9.5L10.5 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Profile Image */}
          {firstImage && (
            <div style={styles.imageContainer}>
              <img src={firstImage} alt={user.name} style={styles.image} />
            </div>
          )}

          {/* User Info Grid */}
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Email</div>
              <div style={styles.infoValue}>{user.email || 'Not provided'}</div>
            </div>

            {user.age && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Age</div>
                <div style={styles.infoValue}>{user.age}</div>
              </div>
            )}

            {user.gender && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Gender</div>
                <div style={styles.infoValue}>{user.gender}</div>
              </div>
            )}

            {user.sexuality && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Sexuality</div>
                <div style={styles.infoValue}>{user.sexuality}</div>
              </div>
            )}

            {user.city && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>City</div>
                <div style={styles.infoValue}>{user.city}</div>
              </div>
            )}

            {user.work && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Work</div>
                <div style={styles.infoValue}>
                  {user.jobTitle ? `${user.jobTitle} at ${user.work}` : user.work}
                </div>
              </div>
            )}

            {user.college && user.college.length > 0 && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Education</div>
                <div style={styles.infoValue}>{user.college.join(', ')}</div>
              </div>
            )}

            {user.datingIntention && (
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Dating Intention</div>
                <div style={styles.infoValue}>{user.datingIntention}</div>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div style={styles.badgeContainer}>
            <span
              style={{
                ...styles.statusBadge,
                ...(user.isOnline ? styles.statusActive : styles.statusInactive),
              }}
            >
              {user.isOnline ? 'Active Now' : 'Offline'}
            </span>
            {user.isPremium && (
              <span style={styles.premiumBadge}>Premium</span>
            )}
            {user.markedForDeletion && (
              <span style={styles.deletionBadge}>Marked for Deletion</span>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.editButton} onClick={() => onEdit(user)}>
              Edit Profile
            </button>
            <button style={styles.deleteButton} onClick={handleDelete}>
              Delete User
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 999,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1000,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease-out',
  },
  header: {
    padding: '2rem 2rem 1.5rem',
    borderBottom: '2px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  verifiedBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
    color: 'white',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  content: {
    padding: '2rem',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 100px)',
  },
  imageContainer: {
    marginBottom: '2rem',
    borderRadius: '16px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  infoCard: {
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  infoLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.5rem',
  },
  infoValue: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1f2937',
  },
  badgeContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '2rem',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  premiumBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#78350f',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  deletionBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: '700',
    backgroundColor: '#fecaca',
    color: '#7f1d1d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
  },
  editButton: {
    flex: 1,
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  deleteButton: {
    flex: 1,
    padding: '1rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '2px solid #dc2626',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default UserDetailModal;