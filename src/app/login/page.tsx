'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Authentication View Flow: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Password Recovery States
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token already exists, redirect to dashboard
    if (localStorage.getItem('accessToken')) {
      router.push('/');
      return;
    }
    
    // Load remembered email
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast.success('Logged in successfully');
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Reset OTP verification code generated successfully!');
      setView('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: forgotEmail,
        otp,
        newPassword,
      });
      toast.success('Password reset successfully! Please sign in with your new password.');
      setEmail(forgotEmail);
      // Clean up states
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setView('login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Check if the OTP is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-page)',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .branding-panel { display: none !important; }
          .form-panel { width: 100% !important; max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>

      {/* Left Column: Branding Panel */}
      <div
        className="branding-panel"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Shield size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.05em' }}>
            PSM
          </span>
        </div>

        {/* Center branding */}
        <div style={{ zIndex: 10, maxWidth: '440px', margin: 'auto 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <Image
              src="/ics-logo-horizontal.png"
              alt="PSM Logo"
              width={160}
              height={160}
              style={{
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)', // Clean white logo rendering
                opacity: 0.95,
              }}
            />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
            Passport Storage & Management
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
            Logistical vault management and asset tracking system. Securely control, monitor, and audit passport movements in real-time.
          </p>
        </div>

        {/* Bottom Skyline background */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '240px',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.15,
          }}
        >
          <Image
            src="/sidebar-decoration-bkp.png"
            alt="Cityscape Skyline"
            fill
            style={{ objectFit: 'cover', objectPosition: 'bottom' }}
          />
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div
        className="form-panel"
        style={{
          width: '520px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>

          {/* Logo visible only on mobile screens */}
          <div style={{ display: 'none' }} className="md:hidden">
            <style>{`
              @media (max-width: 768px) {
                .mobile-logo-header { display: flex !important; }
              }
            `}</style>
            <div className="mobile-logo-header" style={{ alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'var(--brand)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="var(--text-inverse)" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                PSM
              </span>
            </div>
          </div>

          {view === 'login' && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Sign in with your staff or administrator credentials
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '24px',
                  }}
                >
                  <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@passport-track.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Forgot Password */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        width: '15px',
                        height: '15px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        accentColor: 'var(--brand)',
                        cursor: 'pointer',
                      }}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setForgotEmail(email);
                    }}
                    style={{
                      fontSize: '13px',
                      color: 'var(--brand)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  style={{ width: '100%', height: '40px' }}
                >
                  <div style={{ width: '100%', textAlign: 'center', fontWeight: 600 }}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </div>
                </Button>
              </form>
            </>
          )}

          {view === 'forgot' && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--brand)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: 0,
                    marginBottom: '16px',
                  }}
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Reset Password
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Enter your email address to receive a 6-digit verification code.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '24px',
                  }}
                >
                  <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              {/* Forgot Password Form */}
              <form onSubmit={handleForgotPassword}>
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@passport-track.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  style={{ width: '100%', height: '40px' }}
                >
                  <div style={{ width: '100%', textAlign: 'center', fontWeight: 600 }}>
                    {loading ? 'Sending code...' : 'Send OTP Code'}
                  </div>
                </Button>
              </form>
            </>
          )}

          {view === 'reset' && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--brand)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: 0,
                    marginBottom: '16px',
                  }}
                >
                  <ArrowLeft size={16} />
                  Change Email
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  Verification Code
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  We sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong>.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '24px',
                  }}
                >
                  <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    6-digit OTP Code
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />

                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  style={{ width: '100%', height: '40px' }}
                >
                  <div style={{ width: '100%', textAlign: 'center', fontWeight: 600 }}>
                    {loading ? 'Resetting password...' : 'Reset Password'}
                  </div>
                </Button>
              </form>
            </>
          )}

          {/* Footer Info */}
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Designed and developed by Melfan Tech.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
