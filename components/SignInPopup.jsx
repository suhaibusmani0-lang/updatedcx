'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '@/store/reducer/authReducer';
import { showToast } from '@/lib/showToast';

export default function SignInPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-signin-popup', openHandler);
    // expose a simple global helper (optional)
    window.showSignInPopup = () => setOpen(true);

    return () => {
      window.removeEventListener('open-signin-popup', openHandler);
      try { delete window.showSignInPopup; } catch (e) {}
    };
  }, []);

  const dispatch = useDispatch();

  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [emailForOtp, setEmailForOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headerText = (() => {
    switch (step) {
      case 'credentials':
        return 'Sign in to continue to your account';
      case 'otp':
        return `Enter the 6-digit code sent to ${emailForOtp}`;
      case 'register':
        return 'Create an account to get started';
      case 'forgot-email':
        return 'Reset your password';
      case 'forgot-otp':
        return `Enter the 6-digit code sent to ${emailForOtp}`;
      case 'forgot-reset':
        return 'Choose a new password for your account';
      default:
        return 'Sign in to continue to your account';
    }
  })();

  // helper to POST JSON and throw on non-ok
  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = data?.message || 'Request failed';
      const err = new Error(msg);
      err.response = data;
      throw err;
    }
    return data;
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.email.value || '').toLowerCase().trim();
    const password = form.password.value;
    setLoading(true);
    setError('');

    try {
      const result = await postJson('/api/auth/login', { email, password });
      const otpEmail = result?.data?.otp ? result.data.otp : null;
      setEmailForOtp(email);
      setStep('otp');
      showToast('success', result?.message || 'OTP sent');
      if (otpEmail) showToast('info', `Dev OTP: ${otpEmail}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const otp = form.otp.value.trim();
    setLoading(true);
    setError('');

    try {
      const result = await postJson('/api/auth/verify-otp', { email: emailForOtp, otp });
      showToast('success', result?.message || 'Logged in');
      const user = result?.data?.user;
      if (user) dispatch(login(user));
      setOpen(false);
      try { window.location.reload(); } catch (e) {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.name.value || '').trim();
    const phone = (form.phone.value || '').trim();
    const email = (form.email.value || '').toLowerCase().trim();
    const password = form.password.value;
    setLoading(true);
    setError('');

    try {
      const result = await postJson('/api/auth/register', { name, phone, email, password });
      showToast('success', result?.message || 'Registered successfully');
      // After registration, go back to sign-in so user can login (email verification may be required)
      setStep('credentials');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

    
  const handleResendOtp = async () => {
    if (!emailForOtp) return showToast('error', 'No email to resend OTP');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to resend OTP');
      showToast('success', data?.message || 'OTP resent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      showToast('error', message);
    }
  };

  // Forgot password handlers
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.email.value || '').toLowerCase().trim();
    setLoading(true);
    setError('');
    try {
      const result = await postJson('/api/auth/forget-password/sendotp', { email });
      setEmailForOtp(email);
      setStep('forgot-otp');
      showToast('success', result?.message || 'OTP sent for password reset');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const otp = (form.otp.value || '').trim();
    setLoading(true);
    setError('');
    try {
      const result = await postJson('/api/auth/forget-password/verify-otp', { email: emailForOtp, otp });
      setStep('forgot-reset');
      showToast('success', result?.message || 'OTP verified');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUpdatePassword = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const password = form.password.value;
    const confirm = form.confirm.value;
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forget-password/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOtp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update password');
      showToast('success', data?.message || 'Password updated');
      setStep('credentials');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={panelStyle}>
        <button 
          aria-label="Close" 
          onClick={() => setOpen(false)} 
          style={closeBtnStyle}
        >
          ×
        </button>
          <span className="block w-min mx-auto sm:w-auto text-center text-base sm:text-lg font-bold uppercase">
                      Cosmopolitan Xccessories
                    </span>
         
        <p className='text-center' style={{color:'#555', marginBottom:16}}>{headerText}</p>

        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit}>
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              required 
              style={inputStyle} 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="Password" 
              required 
              style={inputStyle} 
            />
            <button 
              type="submit" 
              style={primaryBtnStyle} 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <p style={{marginBottom:8}}>
              Enter the OTP sent to <strong>{emailForOtp}</strong>
            </p>
            <input 
              name="otp" 
              type="text" 
              placeholder="6-digit code" 
              required 
              style={inputStyle} 
            />
            <button 
              type="submit" 
              style={primaryBtnStyle} 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{textAlign:'center', marginTop:12}}>
              <button 
                style={linkBtnStyle} 
                type="button" 
                onClick={handleResendOtp}
              >
                Resend OTP
              </button>
            </div>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        )}

        {step === 'forgot-email' && (
          <form onSubmit={handleForgotSendOtp}>
            <input 
              name="email" 
              type="email" 
              placeholder="Enter your account email" 
              required 
              style={inputStyle} 
            />
            <button 
              type="submit" 
              style={primaryBtnStyle} 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        )}

        {step === 'forgot-otp' && (
          <form onSubmit={handleForgotVerifyOtp}>
            <p style={{marginBottom:8}}>
              Enter the OTP sent to <strong>{emailForOtp}</strong>
            </p>
            <input 
              name="otp" 
              type="text" 
              placeholder="6-digit code" 
              required 
              style={inputStyle} 
            />
            <button 
              type="submit" 
              style={primaryBtnStyle} 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{textAlign:'center', marginTop:12}}>
              <button 
                style={linkBtnStyle} 
                type="button" 
                onClick={handleResendOtp}
              >
                Resend OTP
              </button>
            </div>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        )}

        {step === 'forgot-reset' && (
          <form onSubmit={handleForgotUpdatePassword}>
            <input 
              name="password" 
              type="password" 
              placeholder="New password" 
              required 
              style={inputStyle} 
            />
            <input 
              name="confirm" 
              type="password" 
              placeholder="Confirm password" 
              required 
              style={inputStyle} 
            />
            <button 
              type="submit" 
              style={primaryBtnStyle} 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        )}

        <div style={{textAlign:'center', marginTop:12}}>
          <button 
            style={linkBtnStyle} 
            onClick={() => setStep('forgot-email')}
          >
            Forgot password?
          </button>
        </div>
        <div style={{textAlign:'center', marginTop:12}}>
          {step !== 'register' ? (
            <button 
              style={linkBtnStyle} 
              onClick={() => setStep('register')}
            >
              Don't have an account? Sign Up
            </button>
          ) : (
            <button 
              style={linkBtnStyle} 
              onClick={() => setStep('credentials')}
            >
              ← Back to Sign In
            </button>
          )}
        </div>

        {step === 'register' && (
          <div style={{marginTop:16}}>
            <form onSubmit={handleRegisterSubmit}>
              <input 
                name="name" 
                type="text" 
                placeholder="Full name" 
                required 
                style={inputStyle} 
              />
              <input 
                name="phone" 
                type="text" 
                placeholder="Phone" 
                required 
                style={inputStyle} 
              />
              <input 
                name="email" 
                type="email" 
                placeholder="Email" 
                required 
                style={inputStyle} 
              />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                style={inputStyle} 
              />
              <button 
                type="submit" 
                style={primaryBtnStyle} 
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
              {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline styles to avoid editing your global CSS
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 20,
};

const panelStyle = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 10,
  padding: 24,
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  position: 'relative',
};

const closeBtnStyle = {
  position: 'absolute',
  right: 10,
  top: 8,
  border: 'none',
  background: 'transparent',
  fontSize: 22,
  cursor: 'pointer',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 6,
  border: '1px solid #ddd',
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};

const linkBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  padding: 0,
};