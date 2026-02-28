import { useState, useEffect, useRef } from 'react';
import { FirestoreUser } from '../types';
import { userService } from '../services/userService';

export interface UseUsersReturn {
  users: FirestoreUser[];
  loading: boolean;
  error: string | null;
  selectedUser: FirestoreUser | null;
  setSelectedUser: (user: FirestoreUser | null) => void;
  handleEdit: (user: FirestoreUser) => void;
  handleDelete: (userId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);

  // Cache ref — fetched once, won't re-fetch unless data is invalidated
  const usersLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!usersLoadedRef.current) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async (): Promise<void> => {
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
      usersLoadedRef.current = true; // Mark as loaded — won't fetch again unless invalidated
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      usersLoadedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: FirestoreUser): void => {
    console.log('Edit user:', user.id);
    // Edit functionality to be implemented
  };

  const handleDelete = async (userId: string): Promise<void> => {
    console.log('Delete user:', userId);
    // try {
    //   await userService.deleteUser(userId);
    //   setUsers(prev => prev.filter(u => u.id !== userId));
    //   setSelectedUser(null);
    //   usersLoadedRef.current = false; // Invalidate cache → re-fetch fresh list
    //   await fetchUsers();
    // } catch (err) {
    //   console.error('Error deleting user:', err);
    //   alert('Failed to delete user. Please try again.');
    // }
  };

  return {
    users,
    loading,
    error,
    selectedUser,
    setSelectedUser,
    handleEdit,
    handleDelete,
    fetchUsers,
  };
};

export default useUsers;