import React, { useState, useMemo } from 'react';
import { FirestoreUser } from '../types';
import useUsers from '../hooks/useUsers';
import UserDetailView from './UserDetailView';

/* ─────────────────────────────────────────────
   Helpers
 ───────────────────────────────────────────── */
const formatJoinDate = (date: Date | undefined): string => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};


const getFirstImage = (user: FirestoreUser): string =>
  user.images?.filter((img) => img.imagePath && img.imagePath.trim() !== '')[0]
    ?.imagePath ?? '';

/* ─────────────────────────────────────────────
   Components
 ───────────────────────────────────────────── */

const UserCardSkeleton: React.FC = () => (
  <div className="glass-card" style={listStyles.userCard}>
    <div style={listStyles.cardContent}>
      <div style={{
        ...listStyles.avatarContainer,
        backgroundColor: '#e5e7eb',
        animation: 'pulse 1.5s infinite'
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          height: '14px',
          width: '40%',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          animation: 'pulse 1.5s infinite'
        }} />
        <div style={{
          height: '12px',
          width: '70%',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          animation: 'pulse 1.5s infinite'
        }} />
        <div style={{
          height: '10px',
          width: '50%',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          animation: 'pulse 1.5s infinite'
        }} />
      </div>
    </div>
  </div>
);

const SearchBar: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => (
  <div style={sharedStyles.searchContainer}>
    <svg style={sharedStyles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      type="text"
      placeholder="Search by name or email..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={sharedStyles.searchInput}
    />
  </div>
);

const FilterTabs: React.FC<{ activeFilter: string; onFilterChange: (f: string) => void }> = ({ activeFilter, onFilterChange }) => {
  const filters = ['All', 'Online', 'Offline', 'Verified'];
  return (
    <div style={sharedStyles.filterContainer}>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          style={{
            ...sharedStyles.filterTab,
            ...(activeFilter === f ? sharedStyles.activeFilterTab : {}),
          }}
        >
          {f}
        </button>
      ))}
    </div>
  );
};

const UserCard: React.FC<{
  user: FirestoreUser;
  onClick: (user: FirestoreUser) => void;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (userId: string) => void;
}> = ({ user, onClick, onEdit, onDelete }) => {
  const userImage = getFirstImage(user);

  return (
    <div
      className="glass-card"
      style={listStyles.userCard}
      onClick={() => onClick(user)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)';
      }}
    >
      <div style={listStyles.cardContent}>
        {/* Avatar Section */}
        <div style={listStyles.avatarContainer}>
          {userImage ? (
            <img src={userImage} alt={user.name} style={listStyles.userImage} />
          ) : (
            <div style={listStyles.placeholderImage}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{
            ...listStyles.statusIndicator,
            backgroundColor: user.isOnline ? '#10b981' : '#94a3b8'
          }} title={user.isOnline ? 'Online' : 'Offline'} />
        </div>

        {/* User Info */}
        <div style={listStyles.userInfo}>
          <div style={listStyles.nameRow}>
            <span style={listStyles.userName}>{user.name}</span>
            {user.verified && (
              <span style={listStyles.verifiedBadge} title="Verified User">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </div>
          <div style={listStyles.userEmail}>{user.email ?? user.id}</div>
          <div style={listStyles.metaRow}>
            <svg style={listStyles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Joined {formatJoinDate(user.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={listStyles.cardActions}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(user); }}
            style={listStyles.editBtn}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                onDelete(user.id);
              }
            }}
            style={listStyles.deleteBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Root Component
 ───────────────────────────────────────────── */
const Users: React.FC = () => {
  const {
    users,
    loading,
    error,
    selectedUser,
    setSelectedUser,
    handleEdit,
    handleDelete,
    fetchUsers,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Online' && user.isOnline) ||
        (filter === 'Offline' && !user.isOnline) ||
        (filter === 'Verified' && user.verified);

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filter]);

  if (selectedUser) {
    return (
      <div style={{ ...rootStyles.container, padding: '2rem' }} className="animate-zoom-in">
        <div style={rootStyles.section}>
          <UserDetailView
            user={selectedUser}
            onBack={() => setSelectedUser(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={rootStyles.container}>
        <div style={listStyles.userGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={rootStyles.section}>
        <div style={{ ...rootStyles.centered, color: '#ef4444', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={rootStyles.errorIcon}>!</div>
          <h3>{error}</h3>
          <button onClick={fetchUsers} style={rootStyles.retryBtn}>Try Again</button>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div style={rootStyles.container} className="animate-slide-up">
      <header style={rootStyles.header}>
        <div style={rootStyles.titleRow}>
          <h2 style={rootStyles.title}>
            <span className="premium-gradient-text">Users Directory</span>
            <span style={rootStyles.countBadge}>{users.length}</span>
          </h2>
          <p style={rootStyles.subtitle}>Manage and monitor your application users</p>
        </div>
        <div style={rootStyles.controlsRow}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
        </div>
      </header>

      <div style={listStyles.gridCard} className="glass-card">
        <div
          style={listStyles.userGrid}
          className="user-grid-scroll"
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onClick={setSelectedUser}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div style={rootStyles.emptyState}>
              <h3>No users match your criteria</h3>
              <p>Try adjusting your search or filters</p>
              <button
                onClick={() => { setSearchTerm(''); setFilter('All'); }}
                style={rootStyles.resetBtn}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;

/* ─────────────────────────────────────────────
   Styles
 ───────────────────────────────────────────── */
const rootStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    paddingRight: '2rem',
    // padding: '2rem 0 0 2rem ',
    overflow: 'hidden',
  },
  section: {
    backgroundColor: 'var(--surface-white)',
    borderRadius: '24px',
    padding: '0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '2rem 0 2rem 2rem',  // top right bottom left
    flexShrink: 0,
    // padding: '0 0 1.5rem 0',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  subtitle: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  countBadge: {
    fontSize: '0.9rem',
    backgroundColor: 'rgba(131, 54, 199, 0.1)',
    color: 'var(--primary)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontWeight: 600,
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5rem 2rem',
    color: 'var(--text-secondary)',
    gap: '1.5rem',
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(131, 54, 199, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 800,
  },
  retryBtn: {
    padding: '0.75rem 2rem',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  emptyState: {
    gridColumn: '1 / -1',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  resetBtn: {
    marginTop: '1rem',
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 500,
  }
};

const sharedStyles: Record<string, React.CSSProperties> = {
  searchContainer: {
    position: 'relative',
    display: 'flex',
    // padding: '2rem',
    alignItems: 'center',
    flex: 1,
    minWidth: '300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '1.25rem',
    width: '18px',
    height: '18px',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 3rem',
    borderRadius: '16px',
    border: '1px solid var(--border-light)',
    backgroundColor: 'var(--surface-white)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },
  filterContainer: {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: '0.35rem',
    borderRadius: '14px',
    gap: '0.25rem',
  },
  filterTab: {
    padding: '0.5rem 1.25rem',
    borderRadius: '11px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeFilterTab: {
    backgroundColor: 'var(--surface-white)',
    color: 'var(--primary)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  }
};

const listStyles: Record<string, React.CSSProperties> = {
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '1rem',  // This adds right padding for scrollbar space
    paddingTop: '1rem',
    paddingLeft: '1rem',
    paddingBottom: '1rem',

    // padding: '2rem 1rem 2rem 2rem',  // top right bottom left
  },
  gridCard: {
    backgroundColor: 'var(--surface-white)',
    borderRadius: '24px',
    // border: '1px solid var(--border-light)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    marginLeft: '2rem',
    paddingRight: '1rem',
    marginBottom: '2rem',

    // margin: '0 2rem 2rem 2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  userCard: {
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cardContent: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  avatarContainer: {
    position: 'relative',
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: 'var(--bg-main)',
  },
  userImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gradient-primary)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflow: 'hidden',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userName: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'var(--gradient-primary)',
    color: 'white',
    flexShrink: 0,
  },
  userEmail: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  metaIcon: {
    width: '14px',
    height: '14px',
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  editBtn: {
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(131, 54, 199, 0.08)',
    color: 'var(--primary)',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteBtn: {
    padding: '0.4rem 0.5rem',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};