'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, CheckCircle, AlertCircle, Shield, User, Mail, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function SetupPage() {
  const router = useRouter();
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await apiClient.get('/auth/setup/check');
      setSetupNeeded(res.data.setupNeeded);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      toast.error('Failed to check system status');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post('/auth/setup/admin', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSetupComplete(true);
      toast.success('Admin user created successfully!');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create admin user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
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

  if (loading) {
    return (
      <Shell title="Setup">
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Settings size={48} style={{ margin: '0 auto 12px', opacity: 0.3, animation: 'spin 2s linear infinite' }} />
            <p>Checking system status...</p>
          </div>
        </Card>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Shell>
    );
  }

  if (setupNeeded === false) {
    return (
      <Shell title="Setup">
        <Card>
          <PageHeader
            title="System Already Configured"
            subtitle="Your system has already been set up"
          />
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Setup Complete
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              The system is already configured with admin users. Please log in to continue.
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  if (setupComplete) {
    return (
      <Shell title="Setup">
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Setup Complete!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your admin account has been created. Redirecting to login...
            </p>
          </div>
        </Card>
      </Shell>
    );
  }

  const passwordStrength = getPasswordStrength();

  return (
    <Shell title="Initial Setup">
      <Card>
        <PageHeader
          title="Welcome to Passport Track"
          subtitle="Set up your admin account to get started"
        />

        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
          {/* Info Banner */}
          <div style={{
            padding: '16px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '32px',
            display: 'flex',
            gap: '12px',
          }}>
            <Shield size={20} color="var(--brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                First-Time Setup
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Create your admin account to access the system. This account will have full access to all features.
              </p>
            </div>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Full Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
              {errors.name && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.name}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                <Mail size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={submitting}
              />
              {errors.email && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.email}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                <Lock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={submitting}
              />
              {formData.password && (
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
              {errors.password && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.password}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                <Lock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={submitting}
              />
              {errors.confirmPassword && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Creating Admin Account...' : 'Create Admin Account'}
            </Button>
          </form>
        </div>
      </Card>
    </Shell>
  );
}
