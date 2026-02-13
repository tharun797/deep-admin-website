import React, { useState, useEffect } from 'react';
import { FirestoreUser } from '../types';
import { userService } from '../services/userService';
import UserDetailModal from './UserDetailModal';

interface Styles {
  section: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  userList: React.CSSProperties;
  userTile: React.CSSProperties;
  tileContent: React.CSSProperties;
  imageContainer: React.CSSProperties;
  userImage: React.CSSProperties;
  placeholderImage: React.CSSProperties;
  userInfo: React.CSSProperties;
  userName: React.CSSProperties;
  userEmail: React.CSSProperties;
  statusBadge: React.CSSProperties;
  statusActive: React.CSSProperties;
  statusInactive: React.CSSProperties;
  verifiedBadge: React.CSSProperties;
  joinDate: React.CSSProperties;
  tileActions: React.CSSProperties;
  actionBtn: React.CSSProperties;
  editBtn: React.CSSProperties;
  deleteBtn: React.CSSProperties;
  loadingContainer: React.CSSProperties;
  errorContainer: React.CSSProperties;
  emptyState: React.CSSProperties;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getAllUsers();
      
      // Sort by createdAt (most recent first)
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

  const handleUserClick = (user: FirestoreUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleEdit = (user: FirestoreUser) => {
    console.log('Edit user:', user.id);
    // Edit functionality to be implemented
  };

  const handleDelete = async (userId: string) => {
      console.log('Delete user:', userId);
    // try {
    //   await userService.deleteUser(userId);
    //   setUsers(users.filter(user => user.id !== userId));
    //   handleCloseModal();
    // } catch (err) {
    //   console.error('Error deleting user:', err);
    //   alert('Failed to delete user. Please try again.');
    // }
  };

  const getFirstImage = (user: FirestoreUser): string => {
    const validImages = user.images?.filter(
      (img) => img.imagePath && img.imagePath.trim() !== ''
    ) || [];
    return validImages[0]?.imagePath || '';
  };

  const formatJoinDate = (date: Date | undefined): string => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.section}>
        <div style={styles.loadingContainer}>
          <h3>Loading users...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.section}>
        <div style={styles.errorContainer}>
          <h3>{error}</h3>
          <button onClick={fetchUsers} style={styles.actionBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div style={styles.section}>
        <div style={styles.emptyState}>
          <h3>No users found</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.section}>
        <div style={styles.header}>
          <h2 style={styles.title}>Users ({users.length})</h2>
        </div>

        <div style={styles.userList}>
          {users.map((user) => {
            const userImage = getFirstImage(user);
            
            return (
              <div 
                key={user.id} 
                style={styles.userTile}
                onClick={() => handleUserClick(user)}
              >
                <div style={styles.tileContent}>
                  <div style={styles.imageContainer}>
                    {userImage ? (
                      <img 
                        src={userImage} 
                        alt={user.name} 
                        style={styles.userImage}
                      />
                    ) : (
                      <div style={styles.placeholderImage}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {user.name}
                      {user.verified && (
                        <span style={styles.verifiedBadge}>✓</span>
                      )}
                    </div>
                    <div style={styles.userEmail}>
                      {user.id || 'No email'}
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(user.isOnline ? styles.statusActive : styles.statusInactive),
                    }}
                  >
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>

                  <div style={styles.joinDate}>
                    {formatJoinDate(user.createdAt)}
                  </div>

                  <div style={styles.tileActions}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(user);
                      }}
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                          handleDelete(user.id);
                        }
                      }}
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};

const styles: Styles = {
  section: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
  },
  header: {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f3f4f6',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a1d29',
  },
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
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: '1',
    minWidth: '200px',
  },
  userName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1a1d29',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  statusBadge: {
    padding: '0.35rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
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
    fontWeight: '700',
  },
  joinDate: {
    fontSize: '0.85rem',
    color: '#6b7280',
    minWidth: '120px',
    flexShrink: 0,
  },
  tileActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem',
    color: '#dc2626',
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
};

export default Users;