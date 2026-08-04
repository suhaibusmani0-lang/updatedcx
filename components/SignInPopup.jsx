'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '@/store/reducer/authReducer';
import { showToast } from '@/lib/showToast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase'; 

export default function SignInPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-signin-popup', openHandler);
    window.showSignInPopup = () => setOpen(true);

    return () => {
      window.removeEventListener('open-signin-popup', openHandler);
      try { delete window.showSignInPopup; } catch (e) {}
    };
  }, []);

  const dispatch = useDispatch();

  const [step, setStep] = useState('credentials');
  const [emailForOtp, setEmailForOtp] = useState('');
  
  // 1. CHENGE: Default loginMethod ko 'mobile' kar diya hai
  const [loginMethod, setLoginMethod] = useState('mobile'); 
  
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileStep, setMobileStep] = useState('phone');
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState('');
  
  // 2. CHANGE: Nayi states T&C aur New User ke liye add ki hain
  const [isTcAccepted, setIsTcAccepted] = useState(false); 
  const [isNewUserStep, setIsNewUserStep] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const headerText = (() => {
    if (isNewUserStep) return 'Complete your profile details'; 
    // Photo ke hisaab se Mobile header text
    if (step === 'credentials' && loginMethod === 'mobile' && mobileStep === 'phone') {
      return 'Enter Mobile Number & Accept T&C to Continue';
    }
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

  // --- Email Login / Register / Forgot Password Logic Unchanged ---
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

  // --- UPDATED SMS API LOGIC START ---
  const handleSendMobileOtp = async (e) => {
    e.preventDefault();
    setMobileError('');
    setMobileLoading(true);

    try {
      const normalizedPhone = (mobilePhone || '').trim();
      if (!normalizedPhone || normalizedPhone.length !== 10) {
        throw new Error('Please enter a valid 10 digit mobile number');
      }
      
      // 3. CHANGE: Check for T&C acceptance
      if (!isTcAccepted) {
        throw new Error('Please accept the Terms of Service & Privacy Policy');
      }

      const result = await postJson('/api/auth/send-mobile-otp', { mobile: normalizedPhone });
      
      setMobileStep('otp');
      showToast('success', result?.message || 'OTP sent to your phone number');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send OTP';
      setMobileError(message);
      showToast('error', message);
    } finally {
      setMobileLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    setMobileError('');
    setMobileLoading(true);

    try {
      const otp = (mobileOtp || '').trim();
      if (!otp) {
        throw new Error('OTP is required');
      }

      const result = await postJson('/api/auth/verify-mobile-otp', { mobile: mobilePhone, otp: otp });

      const user = result?.data?.user;
      
      // 4. CHANGE: Check if user is new from backend
      if (result?.data?.isNewUser) {
        setIsNewUserStep(true);
        showToast('success', 'OTP Verified! Please enter your details.');
      } else {
        if (user) {
          dispatch(login(user));
        }
        showToast('success', result?.message || 'Logged in successfully');
        setOpen(false);
        try { window.location.reload(); } catch (e) {}
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setMobileError(message);
      showToast('error', message);
    } finally {
      setMobileLoading(false);
    }
  };

  // 5. CHANGE: Naya function profile complete karne ke liye
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await postJson('/api/auth/update-profile', { 
        phone: mobilePhone, 
        name: newUserName, 
        email: newUserEmail 
      });

      const updatedUser = result?.data?.user;
      if (updatedUser) dispatch(login(updatedUser)); 
      
      showToast('success', 'Profile updated successfully!');
      setOpen(false);
      try { window.location.reload(); } catch (e) {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };
  // --- UPDATED SMS API LOGIC END ---

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* values in your environment.');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Customer',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Google login failed');
      }

      const user = data?.data?.user;
      if (user) {
        dispatch(login(user));
      }
      showToast('success', data?.message || 'Logged in successfully');
      setOpen(false);
      try { window.location.reload(); } catch (e) {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      const friendlyMessage = message.includes('operation-not-allowed')
        ? 'Google sign-in is not enabled in your Firebase project. Please enable Google in Firebase Authentication > Sign-in method.'
        : message;
      setError(friendlyMessage);
      showToast('error', friendlyMessage);
    } finally {
      setGoogleLoading(false);
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

        {/* 6. CHANGE: Agar Naya User Hai Toh Ye Form Dikhayega */}
        {isNewUserStep ? (
          <form onSubmit={handleCompleteProfile}>
            <input 
              value={newUserName} 
              onChange={(e) => setNewUserName(e.target.value)} 
              type="text" 
              placeholder="Full Name" 
              required 
              style={inputStyle} 
            />
            <input 
              value={newUserEmail} 
              onChange={(e) => setNewUserEmail(e.target.value)} 
              type="email" 
              placeholder="Email Address" 
              required 
              style={inputStyle} 
            />
            <button type="submit" style={primaryBtnStyle} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
            {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
          </form>
        ) : (
          /* Puraani Logic Waisi Ki Waisi */
          step === 'credentials' && (
            <div>
              {/* Tab Buttons tabhi dikhenge jab user Phone/Email daal raha ho, OTP daalte waqt nahi */}
              {mobileStep === 'phone' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('email');
                      setMobileError('');
                      setError('');
                      setMobileStep('phone');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: loginMethod === 'email' ? '1px solid #111827' : '1px solid #d1d5db',
                      background: loginMethod === 'email' ? '#111827' : '#fff',
                      color: loginMethod === 'email' ? '#fff' : '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('mobile');
                      setMobileError('');
                      setError('');
                      setMobileStep('phone');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: loginMethod === 'mobile' ? '1px solid #111827' : '1px solid #d1d5db',
                      background: loginMethod === 'mobile' ? '#111827' : '#fff',
                      color: loginMethod === 'mobile' ? '#fff' : '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    Mobile
                  </button>
                </div>
              )}

              {loginMethod === 'email' ? (
                <form key="email-login-form" onSubmit={handleCredentialsSubmit}>
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
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    style={{
                      ...primaryBtnStyle,
                      marginTop: 10,
                      background: '#fff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                    }}
                  >
                    {googleLoading ? 'Connecting...' : 'Continue with Google'}
                  </button>
                  {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
                </form>
              ) : (
                <form key="mobile-login-form" onSubmit={mobileStep === 'phone' ? handleSendMobileOtp : handleVerifyMobileOtp}>
                  {mobileStep === 'phone' ? (
                    <>
                      {/* === PHOTO WALA +91 FLOATING LABEL BOX === */}
                      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px' }}>
                        <label style={{ position: 'absolute', top: '-10px', left: '12px', background: '#fff', padding: '0 4px', fontSize: '12px', color: '#555' }}>
                          Mobile *
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px', boxSizing: 'border-box' }}>
                          <span style={{ color: '#333', marginRight: '10px', borderRight: '1px solid #ddd', paddingRight: '10px', fontWeight: '500', fontSize: '15px' }}>
                            +91
                          </span>
                          <input
                            value={mobilePhone}
                            // Sirf numbers accept karega aur maximum 10 digits
                            onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            type="tel"
                            placeholder="81234 56789"
                            required
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', background: 'transparent', padding: 0 }}
                          />
                        </div>
                      </div>
                      {/* === END OF BOX === */}
                      
                      {/* 7. CHANGE: T&C Checkbox */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px', fontSize: '13px', color: '#555' }}>
                        <input
                          type="checkbox"
                          id="tc-checkbox"
                          checked={isTcAccepted}
                          onChange={(e) => setIsTcAccepted(e.target.checked)}
                          style={{ marginTop: '3px', cursor: 'pointer' }}
                        />
                        <label htmlFor="tc-checkbox" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                          By continuing, I agree to the <a href="/terms" style={{textDecoration: 'underline'}}>Terms of Service</a> & <a href="/privacy" style={{textDecoration: 'underline'}}>Privacy Policy</a>.
                        </label>
                      </div>

                      <button
                        type="submit"
                        style={primaryBtnStyle}
                        disabled={mobileLoading || !isTcAccepted}
                      >
                        {mobileLoading ? 'SENDING...' : 'GET OTP'}
                      </button>
                      {mobileError && <div style={{color:'red', marginTop:8}}>{mobileError}</div>}
                    </>
                  ) : (
                    <>
                      <input
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        type="text"
                        placeholder="Enter OTP"
                        required
                        style={inputStyle}
                      />
                      <button
                        type="submit"
                        style={primaryBtnStyle}
                        disabled={mobileLoading}
                      >
                        {mobileLoading ? 'Verifying...' : 'VERIFY OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileStep('phone');
                          setMobileOtp('');
                          setMobileError('');
                        }}
                        style={{
                          ...linkBtnStyle,
                          display: 'block',
                          marginTop: 12,
                        }}
                      >
                        Back to phone entry
                      </button>
                      {mobileError && <div style={{color:'red', marginTop:8}}>{mobileError}</div>}
                    </>
                  )}
                </form>
              )}
            </div>
          )
        )}

        {/* ... YAHAN SE NEECHE POORA CODE TUMHARA HI HAI (Unchanged) ... */}
        {step === 'otp' && (
          <form key="otp-form" onSubmit={handleOtpSubmit}>
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
          <form key="forgot-email-form" onSubmit={handleForgotSendOtp}>
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
          <form key="forgot-otp-form" onSubmit={handleForgotVerifyOtp}>
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
          <form key="forgot-reset-form" onSubmit={handleForgotUpdatePassword}>
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

        {!isNewUserStep && (
          <>
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
          </>
        )}

        {step === 'register' && !isNewUserStep && (
          <div style={{marginTop:16}}>
            <form key="register-form" onSubmit={handleRegisterSubmit}>
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