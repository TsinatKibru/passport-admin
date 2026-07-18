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
import { useRole } from '@/lib/auth/RoleContext';
import { useTranslation } from '@/lib/contexts/LanguageContext';

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user: profile, isLoading: loading, refetch: refetchProfile } = useRole();
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [savingDetails, setSavingDetails] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setEditForm({ name: profile.name, email: profile.email });
    }
  }, [profile]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingDetails(true);

    try {
      await apiClient.put(`/auth/users/${profile.id}`, {
        name: editForm.name,
      });
      toast.success(t('profile.toast_details_success', 'Profile details updated successfully'));
      await refetchProfile();
      setIsEditingDetails(false);
    } catch (error: any) {
      const message = error.response?.data?.message || t('profile.toast_details_fail', 'Failed to update profile details');
      toast.error(message);
    } finally {
      setSavingDetails(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = t('profile.err_current_required', 'Current password is required');
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = t('profile.err_new_required', 'New password is required');
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = t('profile.err_len_min', 'Password must be at least 8 characters');
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = t('profile.err_uppercase', 'Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = t('profile.err_lowercase', 'Password must contain at least one lowercase letter');
    } else if (!/\d/.test(passwordForm.newPassword)) {
      newErrors.newPassword = t('profile.err_number', 'Password must contain at least one number');
    } else if (!/[@$!%*?&]/.test(passwordForm.newPassword)) {
      newErrors.newPassword = t('profile.err_special', 'Password must contain at least one special character');
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = t('profile.err_mismatch', 'Passwords do not match');
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = t('profile.err_must_differ', 'New password must be different from current password');
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

      toast.success(t('profile.toast_password_success', 'Password changed successfully'));
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error: any) {
      const message = error.response?.data?.message || t('profile.toast_password_fail', 'Failed to change password');
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

    if (strength <= 2) return { strength, label: t('profile.strength_weak', 'Weak'), color: 'var(--danger)' };
    if (strength <= 3) return { strength, label: t('profile.strength_fair', 'Fair'), color: 'var(--warning)' };
    if (strength <= 4) return { strength, label: t('profile.strength_good', 'Good'), color: 'var(--brand)' };
    return { strength, label: t('profile.strength_strong', 'Strong'), color: 'var(--success)' };
  };

  const passwordStrength = getPasswordStrength();

  if (loading) {
    return (
      <Shell title={t('sidebar.profile', 'Profile')}>
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <User size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>{t('profile.loading', 'Loading profile...')}</p>
          </div>
        </Card>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell title={t('sidebar.profile', 'Profile')}>
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <p>{t('profile.failed_load', 'Failed to load profile')}</p>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title={t('sidebar.profile', 'Profile')}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Information Card */}
        <div style={{ marginBottom: '24px' }}>
          <Card>
          <PageHeader
            title={t('profile.info_title', 'Profile Information')}
            subtitle={t('profile.info_subtitle', 'View and manage your account details')}
            action={
              profile.role === 'ADMIN' && !isEditingDetails && (
                <Button variant="secondary" size="sm" onClick={() => {
                  setEditForm({ name: profile.name, email: profile.email });
                  setIsEditingDetails(true);
                }}>
                  {t('profile.edit_details', 'Edit Details')}
                </Button>
              )
            }
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
                    {profile.isActive ? t('profile.status_active', 'Active') : t('profile.status_inactive', 'Inactive')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            {isEditingDetails ? (
              <form onSubmit={handleSaveDetails}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {t('profile.full_name', 'Full Name')}
                    </label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {t('profile.email', 'Email Address')}
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      disabled
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                    />
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {t('profile.email_immutable', 'Email address cannot be changed.')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditingDetails(false)}
                    disabled={savingDetails}
                  >
                    {t('profile.cancel', 'Cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingDetails}
                  >
                    {savingDetails ? t('profile.saving', 'Saving...') : t('profile.save_changes', 'Save Changes')}
                  </Button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Mail size={14} />
                    {t('profile.email', 'Email Address')}
                  </label>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <User size={14} />
                    {t('profile.user_id', 'User ID')}
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {profile.id}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Calendar size={14} />
                    {t('profile.member_since', 'Member Since')}
                  </label>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                    {new Date(profile.createdAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
        </div>

        {/* Password Change Card */}
        <Card>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('profile.password_security', 'Password & Security')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t('profile.password_subtitle', 'Manage your password and account security')}
                </p>
              </div>
              {!showPasswordForm && (
                <Button variant="secondary" onClick={() => setShowPasswordForm(true)}>
                  <Lock size={14} style={{ marginRight: '6px' }} />
                  {t('profile.change_password_btn', 'Change Password')}
                </Button>
              )}
            </div>
          </div>

          {showPasswordForm && (
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {t('profile.current_password', 'Current Password')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('profile.current_password_placeholder', 'Enter current password')}
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
                    {t('profile.new_password', 'New Password')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('profile.new_password_placeholder', 'Enter new password')}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  {passwordForm.newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('profile.password_strength', 'Password strength:')}</span>
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
                    {t('profile.password_rules', 'Must be 8+ characters with uppercase, lowercase, number, and special character')}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {t('profile.confirm_password', 'Confirm New Password')}
                  </label>
                  <Input
                    type="password"
                    placeholder={t('profile.confirm_password_placeholder', 'Confirm new password')}
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
                    {t('profile.cancel', 'Cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={changingPassword}
                  >
                    {changingPassword ? t('profile.changing_password', 'Changing Password...') : t('profile.change_password_btn', 'Change Password')}
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
                    {t('profile.password_active', 'Password Protection Active')}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('profile.password_active_desc', 'Your account is secured with a strong password')}
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
