'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = pathname === '/login' || pathname === '/setup';

  const fetchUser = async (force = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setIsLoading(false);
      setUser(null);
      setRole(null);
      if (!isPublicPath) {
        router.push('/login');
      }
      return;
    }

    if (user && !force) {
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      setUser(null);
      setRole(null);
      if (!isPublicPath) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';

  // RBAC Permission Matrix (from production spec v2)
  // STAFF: Read-only lists, scanning, simple assignments. Cannot register boxes/locations, delete, or manage users.
  // ADMIN: Full permissions (all CRUDs, delete actions, user role management).
  const canCreate = isAdmin;
  const canDelete = isAdmin;
  const canEditRoles = isAdmin;

  if (isLoading && !isPublicPath) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#FAFAFA',
        color: '#1a1b22',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--brand)',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Loading PassportOS...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isLoading && !user && !isPublicPath) {
    return null;
  }

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
        refetch: () => fetchUser(true),
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
