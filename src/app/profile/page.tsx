'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Shield, Lock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setProfile(res.data);
    } catch (error) {
      toast.error('Failed to load profile');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/\d/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[@$!%*?&]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setChangingPassword(true);

    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      if (message.includes('Current password')) {
        setErrors({ currentPassword: message });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const getPasswordStrength = () => {
    const password = passwordForm.newPassword;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;

    if (strength <= 2) return { strength, label: 'Weak', color: 'var(--danger)' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'var(--warning)' };
    if (strength <= 4) return { strength, label: 'Good', color: 'var(--brand)' };
    return { strength, label: 'Strong', color: 'var(--success)' };
  };

  const passwordStrength = getPasswordStrength();

  if (loading) {
    return (
      <Shell title="Profile">
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <User size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Loading profile...</p>
          </div>
        </Card>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell title="Profile">
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <p>Failed to load profile</p>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title="Profile">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Information Card */}
        <div style={{ marginBottom: '24px' }}>
          <Card>
          <PageHeader
            title="Profile Information"
            subtitle="View and manage your account details"
          />

          <div style={{ padding: '24px' }}>
            {/* Avatar and Name */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--brand)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
                  {profile.name}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge variant={profile.role === 'ADMIN' ? 'default' : 'info'}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} />
                      {profile.role}
                    </span>
                  </Badge>
                  <Badge variant={profile.isActive ? 'success' : 'danger'}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Mail size={14} />
                  Email Address
                </label>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {profile.email}
                </p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <User size={14} />
                  User ID
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {profile.id}
                </p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <Calendar size={14} />
                  Member Since
                </label>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
        </div>

        {/* Password Change Card */}
        <Card>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Password & Security
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Manage your password and account security
                </p>
              </div>
              {!showPasswordForm && (
                <Button variant="secondary" onClick={() => setShowPasswordForm(true)}>
                  <Lock size={14} style={{ marginRight: '6px' }} />
                  Change Password
                </Button>
              )}
            </div>
          </div>

          {showPasswordForm && (
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  {errors.currentPassword && (
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.currentPassword}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  {passwordForm.newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Password strength:</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          background: passwordStrength.color,
                          transition: 'all 300ms',
                        }} />
                      </div>
                    </div>
                  )}
                  {errors.newPassword && (
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.newPassword}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Must be 8+ characters with uppercase, lowercase, number, and special character
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  {errors.confirmPassword && (
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.confirmPassword}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setErrors({});
                    }}
                    disabled={changingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {!showPasswordForm && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Password Protection Active
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Your account is secured with a strong password
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
