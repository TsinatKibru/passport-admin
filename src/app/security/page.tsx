'use client';

import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { useRole } from '@/lib/auth/RoleContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { Check, X, Shield, Users, UserPlus, Trash2, Power, Search, Activity } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    movementLogs: number;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  staffCount: number;
}

export default function SecurityPage() {
  const { isAdmin, isLoading: roleLoading, user: currentUser } = useRole();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    isOpen: boolean;
    userId: string;
    newRole: 'ADMIN' | 'STAFF';
  }>({ isOpen: false, userId: '', newRole: 'STAFF' });

  const [confirmToggleStatus, setConfirmToggleStatus] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    currentStatus: boolean;
  }>({ isOpen: false, userId: '', userName: '', currentStatus: false });

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: '', userName: '' });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await apiClient.get<UserStats>('/auth/users/stats');
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<User[]>('/auth/users');
      return res.data;
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      password: string;
      role: 'ADMIN' | 'STAFF';
    }) => {
      await apiClient.post('/auth/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('User created successfully');
      setCreateUserModalOpen(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'STAFF' }) => {
      await apiClient.post(`/auth/users/${userId}/role`, { role: newRole });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success(`User role changed to ${variables.newRole} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change user role';
      toast.error(message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.patch(`/auth/users/${userId}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/auth/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });

  const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'STAFF') => {
    setConfirmRoleChange({ isOpen: true, userId, newRole });
  };

  const confirmRoleChangeAction = () => {
    changeRoleMutation.mutate({ 
      userId: confirmRoleChange.userId, 
      newRole: confirmRoleChange.newRole 
    });
    setConfirmRoleChange({ isOpen: false, userId: '', newRole: 'STAFF' });
  };

  const handleToggleStatus = (user: User) => {
    setConfirmToggleStatus({
      isOpen: true,
      userId: user.id,
      userName: user.name,
      currentStatus: user.isActive,
    });
  };

  const confirmToggleStatusAction = () => {
    toggleStatusMutation.mutate(confirmToggleStatus.userId);
    setConfirmToggleStatus({ isOpen: false, userId: '', userName: '', currentStatus: false });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDelete({ isOpen: true, userId: user.id, userName: user.name });
  };

  const confirmDeleteAction = () => {
    deleteUserMutation.mutate(confirmDelete.userId);
    setConfirmDelete({ isOpen: false, userId: '', userName: '' });
  };

  const rbacMatrix = [
    { action: 'Create/Delete Physical Locations (Room, Shelf, Row, Slot)', admin: true, staff: false },
    { action: 'Register Passports', admin: true, staff: false },
    { action: 'Register & Assign Movable Boxes', admin: true, staff: false },
    { action: 'Issue Passports to Owners', admin: true, staff: true },
    { action: 'Assign/Move Passports Between Boxes', admin: true, staff: true },
    { action: 'View Audit Trails & System Logs', admin: true, staff: true },
    { action: 'Delete Boxes/Passports/Locations', admin: true, staff: false },
    { action: 'Manage Users & Roles', admin: true, staff: false },
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
        {isAdmin && stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px',
          }}>
            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '8px', 
                    background: 'var(--brand-bg)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={20} color="var(--brand)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats.totalUsers}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Total Users
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '8px', 
                    background: 'var(--success-bg)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Activity size={20} color="var(--success)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats.activeUsers}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Active Users
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '8px', 
                    background: 'var(--brand-bg)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={20} color="var(--brand)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats.adminCount}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Administrators
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '8px', 
                    background: 'var(--bg-subtle)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={20} color="var(--text-secondary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stats.staffCount}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Staff Members
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <Card>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ 
                fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', 
                margin: 0, display: 'flex', alignItems: 'center', gap: '8px',
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
                      padding: '12px 16px', textAlign: 'left', fontSize: '13px', 
                      fontWeight: 600, color: 'var(--text-secondary)',
                    }}>
                      Operational Actions
                    </th>
                    <th style={{ 
                      padding: '12px 16px', textAlign: 'center', fontSize: '13px', 
                      fontWeight: 600, color: 'var(--text-secondary)', width: '120px',
                    }}>
                      Admin
                    </th>
                    <th style={{ 
                      padding: '12px 16px', textAlign: 'center', fontSize: '13px', 
                      fontWeight: 600, color: 'var(--text-secondary)', width: '120px',
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
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'var(--success-bg)',
                          }}>
                            <Check size={14} color="var(--success)" />
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'var(--bg-subtle)',
                          }}>
                            <X size={14} color="var(--text-muted)" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {row.staff ? (
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: 'var(--success-bg)',
                          }}>
                            <Check size={14} color="var(--success)" />
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '50%',
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

        {isAdmin && (
          <Card>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', 
                    margin: 0, display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <Users size={18} />
                    User Management
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 26px' }}>
                    Manage system operator accounts and role assignments
                  </p>
                </div>
                <Button variant="primary" onClick={() => setCreateUserModalOpen(true)}>
                  <UserPlus size={16} style={{ marginRight: '6px' }} />
                  Create User
                </Button>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={18} 
                    style={{ 
                      position: 'absolute', left: '12px', top: '50%', 
                      transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    }} 
                  />
                  <Input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {usersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No users found matching your search' : 'No users found'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        User
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Email
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '100px' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '120px' }}>
                        Role
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '100px' }}>
                        Activity
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '200px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: user.isActive ? 'var(--brand)' : 'var(--bg-subtle)',
                              color: user.isActive ? 'white' : 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 600, flexShrink: 0,
                            }}>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {user.name}
                                {currentUser?.id === user.id && (
                                  <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <Badge variant={user.isActive ? 'success' : 'danger'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {currentUser?.id === user.id ? (
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'info'}>
                              {user.role}
                            </Badge>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'STAFF')}
                              disabled={changeRoleMutation.isPending}
                              style={{
                                padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)', background: 'var(--bg-surface)',
                                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', fontWeight: 500,
                              }}
                            >
                              <option value="STAFF">STAFF</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {user._count?.movementLogs || 0} logs
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {currentUser?.id !== user.id && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={toggleStatusMutation.isPending}
                                >
                                  <Power size={14} />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={deleteUserMutation.isPending}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                            {currentUser?.id === user.id && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Cannot modify own account
                              </span>
                            )}
                          </div>
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
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Shield size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                User management is only accessible to administrators.
              </p>
            </div>
          </Card>
        )}
      </div>

      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSubmit={(data) => createUserMutation.mutateAsync(data)}
        isLoading={createUserMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmRoleChange.isOpen}
        onClose={() => setConfirmRoleChange({ isOpen: false, userId: '', newRole: 'STAFF' })}
        onConfirm={confirmRoleChangeAction}
        title="Confirm Role Change"
        message={`Are you sure you want to change this user's role to ${confirmRoleChange.newRole}?`}
        confirmText="Change Role"
        variant="primary"
        isLoading={changeRoleMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmToggleStatus.isOpen}
        onClose={() => setConfirmToggleStatus({ isOpen: false, userId: '', userName: '', currentStatus: false })}
        onConfirm={confirmToggleStatusAction}
        title={`${confirmToggleStatus.currentStatus ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${confirmToggleStatus.currentStatus ? 'deactivate' : 'activate'} ${confirmToggleStatus.userName}?`}
        confirmText={confirmToggleStatus.currentStatus ? 'Deactivate' : 'Activate'}
        variant={confirmToggleStatus.currentStatus ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, userId: '', userName: '' })}
        onConfirm={confirmDeleteAction}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${confirmDelete.userName}? This action cannot be undone.`}
        confirmText="Delete User"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </Shell>
  );
}
