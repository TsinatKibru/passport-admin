'use client';

import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useRole } from '@/lib/auth/RoleContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { Check, X, Shield, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SecurityPage() {
  const { isAdmin, isLoading: roleLoading, user: currentUser } = useRole();
  const queryClient = useQueryClient();

  // Fetch all users (Admin only)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<User[]>('/auth/users');
      return res.data;
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  // Mutation to change user role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'STAFF' }) => {
      await apiClient.post(`/auth/users/${userId}/role`, { role: newRole });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User role changed to ${variables.newRole} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change user role';
      toast.error(message);
    },
  });

  const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'STAFF') => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      changeRoleMutation.mutate({ userId, newRole });
    }
  };

  // RBAC Matrix data
  const rbacMatrix = [
    { action: 'Create/Delete Physical Locations (Room, Shelf, Row, Slot)', admin: true, staff: false },
    { action: 'Register Passports', admin: true, staff: false },
    { action: 'Register & Assign Movable Boxes', admin: true, staff: false },
    { action: 'Issue Passports to Owners', admin: true, staff: true },
    { action: 'Assign/Move Passports Between Boxes', admin: true, staff: true },
    { action: 'View Audit Trails & System Logs', admin: true, staff: true },
    { action: 'Delete Boxes/Passports/Locations', admin: true, staff: false },
    { action: 'Manage User Roles', admin: true, staff: false },
  ];

  if (roleLoading) {
    return (
      <Shell title="Security & Access Control" subtitle="Loading...">
        <div style={{ padding: '24px' }}>Loading...</div>
      </Shell>
    );
  }

  return (
    <Shell title="Security & Access Control" subtitle="Role-based permissions and user management">
      <div style={{ padding: '24px', maxWidth: '1400px' }}>
        {/* RBAC Matrix */}
        <div style={{ marginBottom: '24px' }}>
          <Card>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Shield size={18} />
              RBAC Permission Matrix
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 26px' }}>
              System-wide security policy for all operational actions
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                  }}>
                    Operational Actions
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    width: '120px',
                  }}>
                    Admin
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    width: '120px',
                  }}>
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {row.action}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {row.admin ? (
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--success-bg)',
                        }}>
                          <Check size={14} color="var(--success)" />
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--bg-subtle)',
                        }}>
                          <X size={14} color="var(--text-muted)" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {row.staff ? (
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--success-bg)',
                        }}>
                          <Check size={14} color="var(--success)" />
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--bg-subtle)',
                        }}>
                          <X size={14} color="var(--text-muted)" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

        {/* User Management (Admin Only) */}
        {isAdmin && (
          <Card>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Users size={18} />
                Operator User Management
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 26px' }}>
                Manage system operator accounts and role assignments
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {usersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                      }}>
                        Name
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                      }}>
                        Email
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        width: '120px',
                      }}>
                        Active Role
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        width: '180px',
                      }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {user.name}
                          {currentUser?.id === user.id && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '11px', 
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                            }}>
                              (You)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={user.role === 'ADMIN' ? 'success' : 'default'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {currentUser?.id === user.id ? (
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Cannot modify own role
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'STAFF')}
                              disabled={changeRoleMutation.isPending}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="STAFF">STAFF</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}

        {!isAdmin && (
          <Card>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: 'var(--text-muted)',
            }}>
              <Shield size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                User management is only accessible to administrators.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}
