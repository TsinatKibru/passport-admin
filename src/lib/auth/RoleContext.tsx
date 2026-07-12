'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

type Role = 'ADMIN' | 'STAFF';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canEditRoles: boolean;
  refetch: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Secure: Fetch role from server-side verification via /auth/me endpoint
      const response = await apiClient.get<User>('/auth/me');
      const userData = response.data;
      
      setUser(userData);
      setRole(userData.role);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Clear invalid token
      localStorage.removeItem('accessToken');
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';

  // RBAC Permission Matrix (from production spec v2)
  // STAFF: Read-only lists, scanning, simple assignments. Cannot register boxes/locations, delete, or manage users.
  // ADMIN: Full permissions (all CRUDs, delete actions, user role management).
  const canCreate = isAdmin;
  const canDelete = isAdmin;
  const canEditRoles = isAdmin;

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAdmin,
        isStaff,
        canCreate,
        canDelete,
        canEditRoles,
        refetch: fetchUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
