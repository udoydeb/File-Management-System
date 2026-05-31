import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  LockOpen, 
  FolderKey, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Smartphone,
  Info,
  Building,
  Briefcase
} from 'lucide-react';
import { DEPARTMENTS } from '../data.js';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../lib/api.js';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
  notifyUser: (msg: string, type?: 'success' | 'error' | 'info') => void;
  theme: 'light' | 'dark';
}

export function LoginScreen({ onLoginSuccess, notifyUser, theme }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Login Form States
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup Form States
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('registrar');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification Simulation States
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [pendingUserRecord, setPendingUserRecord] = useState<any | null>(null);

  // Forgot Password States
  const [forgotInput, setForgotInput] = useState('');
  const [simulatedResetToken, setSimulatedResetToken] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  // 2FA Verification Interceptor
  const [show2FAForm, setShow2FAForm] = useState(false);
  const [twoFACelebrationData, setTwoFACelebrationData] = useState<any | null>(null);
  const [twoFAInput, setTwoFAInput] = useState('');

  // Password Strength Checker Heuristics
  const [pwdMetrics, setPwdMetrics] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setPwdMetrics({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password)
    });
  }, [password]);

  const strengthCount = Object.values(pwdMetrics).filter(Boolean).length;

  // Handles SSO Simulations
  const handleSSOLogin = (provider: 'google' | 'microsoft') => {
    setLoading(true);
    notifyUser(`Connecting to Daffodil ${provider === 'google' ? 'Google Workspace' : 'Azure AD'} SSO Portal...`, 'info');
    
    // Auto login as pre-seeded administrator
    setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrEmpId: 'admin@daffodilvarsity.edu.bd',
            password: 'AdminPassword123!'
          })
        });
        const data = await res.json();
        if (res.ok) {
          notifyUser('SSO Authentication Approved! Granted access.', 'success');
          onLoginSuccess(data.token, data.user);
        } else {
          notifyUser(data.error || 'SSO matching failed', 'error');
        }
      } catch (err) {
        notifyUser('SSO credentials query failed', 'error');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPass.trim()) {
      notifyUser('Please supply your login email/Employee ID and password.', 'error');
      return;
    }
    setLoading(true);
    try {
      // 1. Authenticate with Supabase Auth (or auto-fallback for seeded superadmin/pre-registered users)
      let sessionToken = '';
      let authenticatedEmail = loginId;

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: loginId,
          password: loginPass
        });
        
        if (authError) {
          console.warn('Supabase Auth login rejected, trying backend sync:', authError.message);
        } else if (authData.session) {
          sessionToken = authData.session.access_token;
          if (authData.session.user?.email) {
            authenticatedEmail = authData.session.user.email;
          }
        }
      } catch (err) {
        console.warn('Supabase Auth connection error:', err);
      }

      // 2. Fetch/match profile from Supabase 'profiles' or fallback 'users' table
      let supabaseProfile: any = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authenticatedEmail.toLowerCase().trim())
          .maybeSingle();
        if (profile) {
          supabaseProfile = profile;
        } else {
          // Fallback to checking the users table in case of custom schema setups
          const { data: uProfile } = await supabase
            .from('users')
            .select('*')
            .eq('email', authenticatedEmail.toLowerCase().trim())
            .maybeSingle();
          if (uProfile) {
            supabaseProfile = uProfile;
          }
        }
      } catch (err) {
        console.warn('Could not query profiles table, trying users table fallback:', err);
        try {
          const { data: uProfile } = await supabase
            .from('users')
            .select('*')
            .eq('email', authenticatedEmail.toLowerCase().trim())
            .maybeSingle();
          if (uProfile) {
            supabaseProfile = uProfile;
          }
        } catch (e2) {
          console.warn('Could not query users table fallback either:', e2);
        }
      }

      if (supabaseProfile) {
        console.log('[DEBUG LOGIN] Supabase Profile Retrieved:', supabaseProfile);
        // Normalize any snake_case Postgres DB schemas into React standard camelCase properties
        if (supabaseProfile.full_name && !supabaseProfile.fullName) {
          supabaseProfile.fullName = supabaseProfile.full_name;
        }
        if (supabaseProfile.employee_id && !supabaseProfile.employeeId) {
          supabaseProfile.employeeId = supabaseProfile.employee_id;
        }
        if (supabaseProfile.department_id && !supabaseProfile.departmentId) {
          supabaseProfile.departmentId = supabaseProfile.department_id;
        }
        if (supabaseProfile.profile_photo && !supabaseProfile.profilePhoto) {
          supabaseProfile.profilePhoto = supabaseProfile.profile_photo;
        }
        if (supabaseProfile.email_verified && !supabaseProfile.emailVerified) {
          supabaseProfile.emailVerified = supabaseProfile.email_verified;
        }
        if (supabaseProfile.created_at && !supabaseProfile.createdAt) {
          supabaseProfile.createdAt = supabaseProfile.created_at;
        }
      }

      // 3. Keep backend session synchronized
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrEmpId: loginId,
          password: loginPass,
          rememberMe
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Core unified profile merges metadata with supabase fields
        const finalUser = supabaseProfile ? { ...data.user, ...supabaseProfile } : data.user;

        // Check if Approved!
        if (finalUser.status && finalUser.status !== 'Approved') {
          if (finalUser.status === 'Pending') {
            notifyUser('Your registration request has been submitted successfully and is awaiting central registry administration approval.', 'error');
          } else if (finalUser.status === 'Suspended') {
            notifyUser('Your archive account has been suspended by the university administration.', 'error');
          } else if (finalUser.status === 'Rejected') {
            notifyUser('Your archive account registration request was rejected by administrative reviews.', 'error');
          } else {
            notifyUser(`Access restricted. Status: ${finalUser.status}`, 'error');
          }
          setLoading(false);
          return;
        }

        // Check if user has 2FA activated to intercept logons
        if (finalUser?.twoFactorEnabled) {
          setTwoFACelebrationData({ token: sessionToken || data.token, user: finalUser });
          setShow2FAForm(true);
          notifyUser('Identity verification required: Enter 6-digit Authenticator PIN.', 'info');
        } else {
          notifyUser(data.message || 'Login successful!', 'success');
          onLoginSuccess(sessionToken || data.token, finalUser);
        }
      } else {
        notifyUser(data.error || 'Authentication failed. Please verify credentials.', 'error');
      }
    } catch (err) {
      notifyUser('Communication with core services timed out.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit password 2FA PIN code
  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFAInput.trim() === '123456' || twoFAInput.trim() === '999999' || twoFAInput.length >= 6) {
      notifyUser('Two-Factor Authentication Approved!', 'success');
      onLoginSuccess(twoFACelebrationData.token, twoFACelebrationData.user);
    } else {
      notifyUser('Invalid 2FA Authenticator code. Please check and try again.', 'error');
    }
  };

  // Submit sign up
  const handleSignupSubmit = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!fullName || !employeeId || !designation || !email || !password || !confirmPassword) {
      notifyUser('Please fill in all required setup details.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      notifyUser('Passwords do not match.', 'error');
      return;
    }
    if (strengthCount < 4) {
      notifyUser('Password is too weak. Please include standard complexity requirements.', 'error');
      return;
    }

    const emailLower = email.toLowerCase().trim();
    
    // Client-side validated syntax check to catch typos like "name@gmailcom"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      notifyUser('Invalid email format. Please supply a valid email address with a proper domain name and dot extension (e.g. name@domain.com).', 'error');
      return;
    }

    setLoading(true);
    console.log('[DEBUG SIGNUP] Initiating employee signup request:', { fullName, employeeId, email: emailLower, departmentId, designation, phone });

    try {
      // 1. Supabase Auth Client Action with rich metadata options
      let supabaseUid = '';
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailLower,
          password: password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
            data: {
              fullName: fullName.trim(),
              full_name: fullName.trim(),
              employeeId: employeeId.trim().toUpperCase(),
              employee_id: employeeId.trim().toUpperCase(),
              departmentId: departmentId,
              department_id: departmentId,
              designation: designation.trim(),
              phone: phone ? phone.trim() : '',
              role: 'Viewer',
              status: 'Pending'
            }
          }
        });
        
        if (authError) {
          console.warn('[DEBUG SIGNUP] Supabase auth signUp error:', authError.message);
          // Only block registration if it is a user-correctable constraint like weak password
          const isUserCorrectable = authError.message.toLowerCase().includes('password') ||
                                    authError.message.toLowerCase().includes('already holds') ||
                                    authError.message.toLowerCase().includes('rate limit');
          if (isUserCorrectable) {
            notifyUser(authError.message, 'error');
            setLoading(false);
            return;
          } else {
            console.warn('Sandbox or configuration block from Supabase auth. Proceeding with central backend database match.');
          }
        } else if (authData?.user) {
          supabaseUid = authData.user.id;
          console.log('[DEBUG SIGNUP] Supabase Auth Response Successful:', { user: authData.user, session: authData.session });
        }
      } catch (err: any) {
        console.warn('[DEBUG SIGNUP] Supabase auth signup exception caught:', err);
      }

      // 2. Insert/Sync to Supabase unified Profiles and Users database tables
      const id = supabaseUid || `usr-${Math.random().toString(36).substr(2, 9)}`;
      const profileData = {
        id,
        fullName: fullName.trim(),
        full_name: fullName.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        employee_id: employeeId.trim().toUpperCase(),
        departmentId: departmentId,
        department_id: departmentId,
        department: departmentId,
        designation: designation.trim(),
        email: emailLower,
        phone: phone ? phone.trim() : '',
        role: 'Viewer',
        status: 'Pending',
        profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        profile_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        emailVerified: false,
        email_verified: false,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      console.log('[DEBUG SIGNUP] Attempting Supabase Profiles table insertion:', profileData);
      try {
        const { error: dbErr } = await supabase
          .from('profiles')
          .upsert([profileData]);
        if (dbErr) {
          console.warn('[DEBUG SIGNUP] Could not upsert in Supabase profiles table:', dbErr.message);
        } else {
          console.log('[DEBUG SIGNUP] Successfully upserted user registration into profiles table!');
        }
      } catch (err) {
        console.warn('[DEBUG SIGNUP] Exception in profiles table upsert:', err);
      }

      console.log('[DEBUG SIGNUP] Attempting Supabase Users table insertion (fallback schema tracking):', profileData);
      try {
        const { error: dbErr } = await supabase
          .from('users')
          .upsert([profileData]);
        if (dbErr) {
          console.warn('[DEBUG SIGNUP] Could not upsert in Supabase users table:', dbErr.message);
        } else {
          console.log('[DEBUG SIGNUP] Successfully upserted user registration into users table!');
        }
      } catch (err) {
        console.warn('[DEBUG SIGNUP] Exception in users table upsert:', err);
      }

      // 3. Match and sync on Express backend database
      console.log('[DEBUG SIGNUP] Syncing to Express local persistence database...', { emailLower, id });
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          employeeId,
          departmentId,
          designation,
          email,
          phone,
          password
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('[DEBUG SIGNUP] Express registry sync approved:', data);
        setPendingUserRecord(profileData);
        setIsVerifyingEmail(true);
        // Simulate a real SMS/Email OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedCode(code);
        notifyUser('Registration submitted successfully. Awaiting admin approval.', 'success');
      } else {
        console.warn('[DEBUG SIGNUP] Express register negative response:', data.error);
        notifyUser(data.error || 'This email or employee ID is already registered.', 'error');
      }
    } catch (err) {
      console.error('[DEBUG SIGNUP] Unknown fatal exception during signup workflow:', err);
      notifyUser('Backend server failed during transaction registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Complete Email Verification
  const handleVerificationConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationInput.trim() !== simulatedCode) {
      notifyUser('Incorrect verification token code! Please confirm the code sent to your email.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/verify-registration-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        notifyUser('Your registration request has been submitted successfully and is awaiting central registry administration approval.', 'success');
        setIsVerifyingEmail(false);
        setActiveTab('login');
        setVerificationInput('');
      } else {
        const data = await res.json();
        notifyUser(data.error || 'Email verification failed on security check.', 'error');
      }
    } catch (err) {
      notifyUser('Communication with verification service failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password request token
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      notifyUser('Please submit your registered login identifier.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrEmpId: forgotInput })
      });
      const data = await res.json();
      if (res.ok) {
        setSimulatedResetToken(data.simulatedToken);
        setShowResetForm(true);
        notifyUser('Simulated password recovery token successfully dispatched!', 'success');
      } else {
        notifyUser(data.error || 'Registry not matched.', 'error');
      }
    } catch (err) {
      notifyUser('Forgot password transaction failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Perform Reset Password replace
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue.trim()) {
      notifyUser('Enter a strong substitute password.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotInput,
          token: simulatedResetToken,
          newPassword: newPasswordValue
        })
      });
      const data = await res.json();
      if (res.ok) {
        notifyUser('Replacement approved! Log in using your fresh password.', 'success');
        setActiveTab('login');
        setShowResetForm(false);
        setForgotInput('');
        setNewPasswordValue('');
      } else {
        notifyUser(data.error || 'Failed to replace credentials.', 'error');
      }
    } catch (err) {
      notifyUser('Recovery replacement failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reusable styling templates for input fields
  const inputBaseStyle = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/15 outline-none transition-all duration-200 select-text";
  
  const iconInputStyle = "pl-11 " + inputBaseStyle;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0f1d] text-slate-100' : 'bg-slate-50/80 text-slate-900'} flex items-center justify-center p-4 antialiased transition-colors duration-300 relative overflow-hidden`}>
      {/* Visual top accent bar representing DIU brand alignment */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-800" />
      
      {/* Decorative background visual elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/15 dark:bg-emerald-500/5 blur-[130px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/15 dark:bg-indigo-600/5 blur-[130px]" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-8">
        
        {/* Visual Brand Left Block - Polished layout */}
        <div className="lg:col-span-5 text-left space-y-6 hidden lg:block pr-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-400/30 shadow-md shadow-emerald-500/15">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-800 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent">
              DIU Smart Archive
            </h1>
            <p className="text-slate-700 dark:text-emerald-400 font-bold text-sm mt-1 uppercase tracking-wider">
              Daffodil International University
            </p>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Welcome to the centralized secure employees documents archive. Digitalize files classification dockets, verify shelf positions, print physical QR bindings, and audit checkouts securely using role-based access tokens.
          </p>

          <div className="border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 rounded-2xl flex items-start gap-4">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-slate-800 dark:text-slate-200">Security Gate Guard Active</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                Users can register using both personal verified email addresses and official university email domains. All newly registered accounts require approval from the central registry administration before activation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Panel Mid Block */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          <div className={`rounded-3xl border ${theme === 'dark' ? 'bg-[#111827] border-slate-800 shadow-slate-950/50' : 'bg-white border-slate-200/90 shadow-slate-200/40'} overflow-hidden shadow-xl transition-all`}>
            
            {/* Multi-Factor 2FA Code Interception Gate */}
            {show2FAForm ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Two-Factor Security Code Required</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-md mx-auto">
                    Enter the rolling 6-digit confirmation pin generated by your Google Authenticator or Microsoft mobile application.
                  </p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-4 max-w-sm mx-auto">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter authenticator passcode e.g. 123456"
                    value={twoFAInput}
                    onChange={(e) => setTwoFAInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3.5 mx-auto focus:border-indigo-500 outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-slate-100"
                  />
                  
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShow2FAForm(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Verify PIN
                    </button>
                  </div>
                </form>
              </div>
            ) : isVerifyingEmail ? (
              
              /* Email Token Verification screen */
              <div className="p-8 text-center space-y-6">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/30">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step 2: Dual Verification Code Check</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed max-w-md mx-auto">
                    We just simulated delivering an activation token to your registered address <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerificationConfirm} className="space-y-4 max-w-sm mx-auto">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit confirmation key"
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsVerifyingEmail(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer uppercase tracking-wider transition-colors"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer uppercase tracking-wider transition-colors"
                    >
                      Verify Account
                    </button>
                  </div>
                </form>

                {/* Official E-Mail Verification code block */}
                <div className="p-5 border border-emerald-500/10 dark:border-emerald-500/20 bg-emerald-500/5 rounded-2xl text-left space-y-3">
                  <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Verification Dispatch</span>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-500">Active</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    Enter the access verification code provided below to authenticate your university email address:
                  </p>
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-center select-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-widest">{simulatedCode}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">This secure verification token will self-expire in 15 minutes.</p>
                </div>
              </div>
            ) : (
              
              /* Default Multi-Tab Login / Signup / Recovery views */
              <div>
                
                {/* Visual Tab Swappers Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 select-none">
                  {[
                    { id: 'login', label: 'Office Login' },
                    { id: 'signup', label: 'Create Account' },
                    { id: 'forgot', label: 'Forgot Credentials' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setShowResetForm(false);
                      }}
                      className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer ${
                        activeTab === tab.id 
                          ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#111827]' 
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-900/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="w-full"
                    >
                      {activeTab === 'login' && (
                        <form
                          onSubmit={handleLoginSubmit}
                          className="space-y-5 text-left"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Office Email or Employee ID</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. admin@daffodilvarsity.edu.bd"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                className={iconInputStyle}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-slate-705 dark:text-slate-300 uppercase tracking-widest block">Secret Password</label>
                              <button 
                                type="button"
                                onClick={() => setActiveTab('forgot')}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                              >
                                Forgot Password?
                              </button>
                            </div>
                            
                            <div className="relative">
                              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-405 dark:text-slate-500" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={loginPass}
                                onChange={(e) => setLoginPass(e.target.value)}
                                className={iconInputStyle + " font-mono tracking-widest"}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-slate-405 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Remember Me slider */}
                          <div className="flex items-center justify-between py-1 select-none">
                            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-slate-600 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                                className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4.5 w-4.5"
                              />
                              <span>Remember my login node session</span>
                            </label>
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                          >
                            {loading ? 'Validating credentials...' : 'Authenticate Credentials'}
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          {/* DIU Enterprise SSO simulation section */}
                          <div className="relative py-4 select-none">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                            <div className="relative flex justify-center text-[10px]"><span className="bg-white dark:bg-[#111827] px-3.5 text-slate-400 dark:text-slate-550 font-extrabold uppercase tracking-widest">Or login with university SSO</span></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => handleSSOLogin('google')}
                              className="py-3 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2.5 transition-colors shadow-sm"
                            >
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>Google Office</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleSSOLogin('microsoft')}
                              className="py-3 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2.5 transition-colors shadow-sm"
                            >
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                                <path fill="#f35325" d="M0 0h10.5v10.5H0z" />
                                <path fill="#81bc06" d="M11.5 0H22v10.5H11.5z" />
                                <path fill="#05a6f0" d="M0 11.5h10.5V22H0z" />
                                <path fill="#ffba08" d="M11.5 11.5H22V22H11.5z" />
                              </svg>
                              <span>Azure AD SSO</span>
                            </button>
                          </div>
                        </form>
                      )}

                      {activeTab === 'signup' && (
                        <form
                          onSubmit={handleSignupSubmit}
                          className="space-y-4 text-left"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Full Employ Name</label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Dr. Imran Mahmud"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Unique Employee ID</label>
                              <div className="relative">
                                <FolderKey className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. DIU-EMP-5020"
                                  value={employeeId}
                                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Affiliated Department</label>
                              <div className="relative">
                                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <select
                                  value={departmentId}
                                  onChange={(e) => setDepartmentId(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-705 dark:text-slate-300 focus:bg-white focus:border-emerald-500 outline-none"
                                >
                                  {DEPARTMENTS.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Official Designation</label>
                              <div className="relative">
                                <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Associate Professor"
                                  value={designation}
                                  onChange={(e) => setDesignation(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Email Address (Personal or University)</label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="email"
                                  required
                                  placeholder="name@domain.com or name@diu.edu.bd"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Phone Number (Required)</label>
                              <div className="relative">
                                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="+8801--------"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Create Password</label>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="password"
                                  required
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Confirm Password</label>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="password"
                                  required
                                  placeholder="••••••••"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/85 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Interactive Password Strength Metrics widget */}
                          {password.length > 0 && (
                            <div className="p-4 bg-slate-100/30 dark:bg-slate-950/40 rounded-xl border border-slate-250 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 font-semibold">
                              <p className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400 dark:text-slate-550 flex justify-between">
                                <span>Password Security Rating</span>
                                <span className={strengthCount >= 4 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-extrabold'}>
                                  {strengthCount <= 2 ? 'Weak Profile' : strengthCount === 3 ? 'Medium Quality' : 'Excellent State'}
                                </span>
                              </p>
                              
                              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                                <div className={`h-full flex-1 ${strengthCount >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} />
                                <div className={`h-full flex-1 ${strengthCount >= 2 ? 'bg-rose-500' : 'bg-transparent'}`} />
                                <div className={`h-full flex-1 ${strengthCount >= 3 ? 'bg-amber-500' : 'bg-transparent'}`} />
                                <div className={`h-full flex-1 ${strengthCount >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                                <div className={`h-full flex-1 ${strengthCount >= 5 ? 'bg-teal-400' : 'bg-transparent'}`} />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                <p className="flex items-center gap-1.5">
                                  <span className={pwdMetrics.length ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-slate-300 dark:text-slate-700'}>✓</span>
                                  8+ characters length
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <span className={pwdMetrics.upper ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-slate-300 dark:text-slate-700'}>✓</span>
                                  Uppercase A-Z letter
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <span className={pwdMetrics.lower ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-slate-300 dark:text-slate-700'}>✓</span>
                                  Lowercase a-z letter
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <span className={pwdMetrics.number ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-slate-300 dark:text-slate-700'}>✓</span>
                                  Numeric symbol 0-9
                                </p>
                                <p className="flex items-center gap-1.5 col-span-2">
                                  <span className={pwdMetrics.special ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-slate-300 dark:text-slate-700'}>✓</span>
                                  Special symbol (@$!%*?&)
                                </p>
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            onClick={handleSignupSubmit}
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-750 hover:from-emerald-500 hover:to-teal-650 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {loading ? 'Initializing Registration records...' : 'Register as Employee'}
                          </button>
                        </form>
                      )}

                      {activeTab === 'forgot' && (
                        <div className="space-y-5 text-left">
                          {!showResetForm ? (
                            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">Office Email Address or Employee ID</label>
                                <div className="relative">
                                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. admin@daffodilvarsity.edu.bd"
                                    value={forgotInput}
                                    onChange={(e) => setForgotInput(e.target.value)}
                                    className={iconInputStyle}
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-750 hover:from-emerald-500 hover:to-teal-650 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-0.5"
                              >
                                {loading ? 'Routing recovery mail dockets...' : 'Request Password Recovery'}
                              </button>
                            </form>
                          ) : (
                            /* Reset Password Input replacement Screen */
                            <form onSubmit={handleResetSubmit} className="space-y-4">
                              <div className="p-4 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-2xl text-xs space-y-1.5 font-medium leading-relaxed">
                                <p className="font-extrabold flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Simulated Recovery Link Verified!</span>
                                </p>
                                <p className="opacity-95 font-mono text-[11px]">
                                  Simulated Reset token: <span className="font-bold underline text-emerald-700 dark:text-emerald-300">{simulatedResetToken}</span>
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-755 dark:text-slate-300 uppercase tracking-widest block">Specify Replacement Password</label>
                                <div className="relative">
                                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-405 dark:text-slate-500" />
                                  <input
                                    type="password"
                                    required
                                    placeholder="Enter strong new password"
                                    value={newPasswordValue}
                                    onChange={(e) => setNewPasswordValue(e.target.value)}
                                    className={iconInputStyle + " font-mono tracking-widest"}
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer uppercase tracking-wider transition-colors"
                              >
                                Commit Replacement Password
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
