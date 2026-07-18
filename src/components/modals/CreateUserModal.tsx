'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/contexts/LanguageContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    name: string;
    password: string;
    role: 'ADMIN' | 'STAFF';
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateUserModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('security.modal_err_email_required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('security.modal_err_email_invalid', 'Invalid email address');
    }

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = t('security.modal_err_name_len', 'Name must be at least 2 characters');
    }

    if (!formData.password) {
      newErrors.password = t('security.modal_err_password_required', 'Password is required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('profile.err_len_min', 'Password must be at least 8 characters');
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = t('profile.err_uppercase', 'Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = t('profile.err_lowercase', 'Password must contain at least one lowercase letter');
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = t('profile.err_number', 'Password must contain at least one number');
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      newErrors.password = t('profile.err_special', 'Password must contain at least one special character');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.err_mismatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      email: formData.email,
      name: formData.name,
      password: formData.password,
      role: formData.role,
    });

    // Reset form
    setFormData({
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'STAFF',
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'STAFF',
    });
    setErrors({});
    onClose();
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (!/[@$!%*?&]/.test(password)) strength += 1;

    if (strength <= 2) return { strength, label: t('profile.strength_weak', 'Weak'), color: 'var(--danger)' };
    if (strength <= 3) return { strength, label: t('profile.strength_fair', 'Fair'), color: 'var(--warning)' };
    if (strength <= 4) return { strength, label: t('profile.strength_good', 'Good'), color: 'var(--brand)' };
    return { strength, label: t('profile.strength_strong', 'Strong'), color: 'var(--success)' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('security.modal_create_title', 'Create New User')}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('security.modal_name_label', 'Name *')}
          </label>
          <Input
            type="text"
            placeholder={t('security.modal_name_placeholder', 'Enter full name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
          />
          {errors.name && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> {errors.name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('security.modal_email_label', 'Email *')}
          </label>
          <Input
            type="email"
            placeholder={t('security.modal_email_placeholder', 'user@example.com')}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isLoading}
          />
          {errors.email && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> {errors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('security.modal_role_label', 'Role *')}
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'STAFF' })}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="STAFF">{t('security.modal_role_staff', 'Staff - Limited Permissions')}</option>
            <option value="ADMIN">{t('security.modal_role_admin', 'Admin - Full Access')}</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('security.modal_password_label', 'Password *')}
          </label>
          <Input
            type="password"
            placeholder={t('security.modal_password_placeholder', 'Enter password')}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={isLoading}
          />
          {formData.password && (
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
          {errors.password && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> {errors.password}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {t('profile.password_rules', 'Must be 8+ characters with uppercase, lowercase, number, and special character')}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('security.modal_confirm_password_label', 'Confirm Password *')}
          </label>
          <Input
            type="password"
            placeholder={t('security.modal_confirm_password_placeholder', 'Confirm password')}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            disabled={isLoading}
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
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('profile.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? t('security.modal_creating', 'Creating...') : t('security.modal_create_btn', 'Create User')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
