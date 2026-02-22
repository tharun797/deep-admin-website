import React, { useState, useEffect } from 'react';
import { FirestoreUser } from '../types';
import { userService } from '../services/userService';
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
   User List
───────────────────────────────────────────── */
const UserList: React.FC<{
  users: FirestoreUser[];
  onUserClick: (user: FirestoreUser) => void;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (userId: string) => void;
}> = ({ users, onUserClick, onEdit, onDelete }) => (
  <div style={listStyles.userList}>
    {users.map((user) => {
      const userImage = getFirstImage(user);
      return (
        <div
          key={user.id}
          style={listStyles.userTile}
          onClick={() => onUserClick(user)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#764ba2';
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 4px 16px rgba(118,75,162,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          <div style={listStyles.tileContent}>
            {/* Avatar */}
            <div style={listStyles.imageContainer}>
              {userImage ? (
                <img src={userImage} alt={user.name} style={listStyles.userImage} />
              ) : (
                <div style={listStyles.placeholderImage}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={listStyles.userInfo}>
              <div style={listStyles.userName}>
                {user.name}
                {user.verified && <span style={listStyles.verifiedBadge}>✓</span>}
              </div>
              <div style={listStyles.userEmail}>{user.email ?? user.id}</div>
            </div>

            {/* Status */}
            <span
              style={{
                ...listStyles.statusBadge,
                ...(user.isOnline ? listStyles.statusActive : listStyles.statusInactive),
              }}
            >
              {user.isOnline ? 'Online' : 'Offline'}
            </span>

            {/* Join date */}
            <div style={listStyles.joinDate}>{formatJoinDate(user.createdAt)}</div>

            {/* Actions */}
            <div style={listStyles.tileActions}>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(user); }}
                style={{ ...listStyles.actionBtn, ...listStyles.editBtn }}
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
                style={{ ...listStyles.actionBtn, ...listStyles.deleteBtn }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────
   Root Component
───────────────────────────────────────────── */
const Users: React.FC = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getAllUsers();
      const sortedUsers = fetchedUsers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: FirestoreUser) => {
    console.log('Edit user:', user.id);
    // Edit functionality to be implemented
  };

  const handleDelete = async (userId: string) => {
    console.log('Delete user:', userId);
    // try {
    //   await userService.deleteUser(userId);
    //   setUsers(users.filter(u => u.id !== userId));
    //   setSelectedUser(null);
    // } catch (err) {
    //   console.error('Error deleting user:', err);
    //   alert('Failed to delete user. Please try again.');
    // }
  };

  /* ── Detail screen ── */
  if (selectedUser) {
    return (
      <div style={rootStyles.section}>
        <UserDetailView
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={rootStyles.section}>
        <div style={rootStyles.centered}><h3>Loading users...</h3></div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={rootStyles.section}>
        <div style={{ ...rootStyles.centered, color: '#dc2626', flexDirection: 'column', gap: '1rem' }}>
          <h3>{error}</h3>
          <button onClick={fetchUsers} style={listStyles.actionBtn}>Retry</button>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (users.length === 0) {
    return (
      <div style={rootStyles.section}>
        <div style={rootStyles.centered}><h3>No users found</h3></div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div style={rootStyles.section}>
      <div style={rootStyles.header}>
        <h2 style={rootStyles.title}>Users ({users.length})</h2>
      </div>
      <UserList
        users={users}
        onUserClick={setSelectedUser}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Users;

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const rootStyles: Record<string, React.CSSProperties> = {
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
    minHeight: '300px',
  },
  header: {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f3f4f6',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1d29',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
};

const listStyles: Record<string, React.CSSProperties> = {
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userTile: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  tileContent: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    gap: '1.5rem',
  },
  imageContainer: {
    width: '60px',
    height: '60px',
    flexShrink: 0,
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  userImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'white',
  },
  userInfo: { flex: 1, minWidth: '200px' },
  userName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1d29',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userEmail: { fontSize: '0.85rem', color: '#6b7280' },
  statusBadge: {
    padding: '0.35rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  statusActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
  },
  joinDate: { fontSize: '0.85rem', color: '#6b7280', minWidth: '120px', flexShrink: 0 },
  tileActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
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
};