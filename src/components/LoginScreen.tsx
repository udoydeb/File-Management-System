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
  Info
} from 'lucide-react';
import { DEPARTMENTS } from '../data.js';

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
        const res = await fetch('/api/auth/login', {
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
      const res = await fetch('/api/auth/login', {
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
        // Check if user has 2FA activated to intercept logons
        if (data.user?.twoFactorEnabled) {
          setTwoFACelebrationData({ token: data.token, user: data.user });
          setShow2FAForm(true);
          notifyUser('Identity verification required: Enter 6-digit Authenticator PIN.', 'info');
        } else {
          notifyUser(data.message || 'Login successful!', 'success');
          onLoginSuccess(data.token, data.user);
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
      notifyUser('Invalid 2FA Authenticator code. Try 123456 as sandbox backup.', 'error');
    }
  };

  // Submit sign up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
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
        setPendingUserRecord(data.user);
        setIsVerifyingEmail(true);
        // Simulate a real SMS/Email OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedCode(code);
        notifyUser('Simulated Email Verification Dispatched', 'success');
      } else {
        notifyUser(data.error || 'Registration failed.', 'error');
      }
    } catch (err) {
      notifyUser('Backend server failed during transaction registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Complete Email Verification
  const handleVerificationConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationInput.trim() !== simulatedCode) {
      notifyUser('Incorrect verification token code! Check sandbox terminal below.', 'error');
      return;
    }

    notifyUser('Email verified! Your profile is queued for Admin Approval.', 'success');
    setIsVerifyingEmail(false);
    setActiveTab('login');
    setVerificationInput('');
    notifyUser(`Sandbox Notice: New profile "${employeeId}" registered! Please log in as "admin@daffodilvarsity.edu.bd" / "AdminPassword123!" to approve.`, 'info');
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
      const res = await fetch('/api/auth/reset-password-request', {
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
      const res = await fetch('/api/auth/reset-password', {
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center p-4 antialiased transition-colors duration-300`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-indigo-800" />
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Visual Brand Left Block */}
        <div className="lg:col-span-5 text-left space-y-6 hidden lg:block">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-indigo-700 rounded-2xl flex items-center justify-center border border-emerald-400/30 shadow-lg">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3.5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-700 bg-clip-text text-transparent">
              DIU Smart Archive
            </h1>
            <p className="text-slate-400 font-semibold text-sm mt-1">Daffodil International University</p>
          </div>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            Welcome to the centralized secure employees documents archive. Digitalize files classification dockets, verify shelf positions, print physical QR bindings, and audit checkouts securely using role-based access tokens.
          </p>

          <div className="border border-emerald-500/10 bg-emerald-500/5 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-400">Security Gate Guard Active</p>
              <p className="text-slate-400/80 leading-relaxed">
                Accounts signup is only valid for official domains (@daffodilvarsity.edu.bd, @diu.edu.bd). New accounts initiate as PENDING and require Admin verification before logging in.
              </p>
            </div>
          </div>
        </div>

        {/* Action Panel Mid Block */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Preset User Credentials Helper Sandbox Card */}
          <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/85'} p-4 shadow-sm text-left`}>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 select-none">
              <Sparkles className="w-4 h-4 fill-amber-500" />
              <span>Sandbox Testing Credentials</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'} space-y-1`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-500">Super Admin (Registrar)</span>
                  <button 
                    onClick={() => { setLoginId('admin@daffodilvarsity.edu.bd'); setLoginPass('AdminPassword123!'); }}
                    className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:opacity-80 cursor-pointer font-serif"
                  >
                    Auto Fill
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-500">ID: admin@daffodilvarsity.edu.bd</p>
                <p className="font-mono text-[11px] text-slate-500">PW: AdminPassword123!</p>
              </div>

              <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'} space-y-1`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-indigo-500">Dept Admin (HR Office)</span>
                  <button 
                    onClick={() => { setLoginId('hr.admin@daffodilvarsity.edu.bd'); setLoginPass('HRAdminPassword123!'); }}
                    className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 hover:opacity-80 cursor-pointer font-serif"
                  >
                    Auto Fill
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-500">ID: hr.admin@daffodilvarsity.edu.bd</p>
                <p className="font-mono text-[11px] text-slate-500">PW: HRAdminPassword123!</p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-850 shadow-slate-950/40' : 'bg-white border-slate-200/80 shadow-slate-200/20'} overflow-hidden shadow-xl transition-all`}>
            
            {/* Multi-Factor 2FA Code Interception Gate */}
            {show2FAForm ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Two-Factor Security Code Required</h3>
                  <p className="text-xs text-slate-500 mt-1">
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
                    className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mx-auto focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShow2FAForm(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:opacity-90 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Verify PIN
                    </button>
                  </div>
                </form>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-slate-400 font-mono text-left">
                  🔑 Sandbox Note: Any 6 digits are accepted. Testing helper code is <span className="text-indigo-400 font-bold underline">123456</span> or <span className="text-indigo-400 font-bold underline">999999</span>.
                </div>
              </div>
            ) : isVerifyingEmail ? (
              
              /* Email Token Verification screen */
              <div className="p-8 text-center space-y-6">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Step 2: Dual Verification Code Check</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    We just simulated delivering an activation token to your official Daffodil address <span className="font-semibold text-emerald-500">{email}</span>.
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
                    className="w-full text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsVerifyingEmail(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Verify Account
                    </button>
                  </div>
                </form>

                {/* Simulated E-Mail Terminal Output */}
                <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 text-left font-mono text-xs text-slate-400 space-y-2">
                  <p className="text-[10px] text-slate-500 border-b border-slate-850 pb-1 flex justify-between uppercase">
                    <span>⚡ Simulated DIU Mail Servers</span>
                    <span className="text-emerald-500">Dispatched OK</span>
                  </p>
                  <p className="text-indigo-400">To: {email}</p>
                  <p className="text-slate-300">Subject: Access Verification for DIU Smart Archive Portal</p>
                  <div className="p-2 border border-dashed border-emerald-500/20 bg-emerald-500/5 text-slate-100 rounded text-center my-2 select-all cursor-pointer" title="Double click to copy">
                    Verification Code: <span className="font-extrabold text-emerald-400 text-lg tracking-wider">{simulatedCode}</span>
                  </div>
                  <p className="text-[10px] text-slate-600">This token expires in 15 minutes. Secure sandbox testing only.</p>
                </div>
              </div>
            ) : (
              
              /* Default Multi-Tab Login / Signup / Recovery views */
              <div>
                
                {/* Visual Tab Swappers Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 select-none">
                  {[
                    { id: 'login', label: 'Office Login Secure' },
                    { id: 'signup', label: 'Create Account' },
                    { id: 'forgot', label: 'Forgot Credentials' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setShowResetForm(false);
                      }}
                      className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                        activeTab === tab.id 
                          ? 'border-emerald-500 text-emerald-500 bg-slate-100/10' 
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <AnimatePresence mode="wait">
                    
                    {/* VIEW A: LOGIN SECURE */}
                    {activeTab === 'login' && (
                      <motion.form
                        key="login"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onSubmit={handleLoginSubmit}
                        className="space-y-5 text-left"
                      >
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office Email or Employee ID</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. admin@daffodilvarsity.edu.bd"
                              value={loginId}
                              onChange={(e) => setLoginId(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:border-emerald-500/80 outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secret Password</label>
                            <button 
                              type="button"
                              onClick={() => setActiveTab('forgot')}
                              className="text-xs text-indigo-500 font-semibold hover:opacity-80"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          
                          <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              placeholder="••••••••"
                              value={loginPass}
                              onChange={(e) => setLoginPass(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3.5 text-sm focus:border-emerald-500/80 outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Remember Me slider */}
                        <div className="flex items-center justify-between py-1 select-none">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={() => setRememberMe(!rememberMe)}
                              className="rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                            />
                            <span>Remember my login node session</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {loading ? 'Validating credentials...' : 'Authenticate Credentials'}
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* DIU Enterprise SSO simulation section */}
                        <div className="relative py-4 select-none">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-850" /></div>
                          <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Or login with university SSO</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => handleSSOLogin('google')}
                            className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
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
                            className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
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
                      </motion.form>
                    )}

                    {/* VIEW B: SIGNUP SYSTEM */}
                    {activeTab === 'signup' && (
                      <motion.form
                        key="signup"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onSubmit={signupSubmitHook => {
                          signupSubmitHook.preventDefault();
                          handleSignupSubmit(signupSubmitHook);
                        }}
                        className="space-y-4 text-left"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Employ Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Dr. Imran Mahmud"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Employee ID</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. DIU-EMP-5020"
                              value={employeeId}
                              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affiliated Department</label>
                            <select
                              value={departmentId}
                              onChange={(e) => setDepartmentId(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none text-slate-400"
                            >
                              {DEPARTMENTS.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Designation</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Associate Professor"
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="name.dept@daffodilvarsity.edu.bd"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number (Required)</label>
                            <input
                              type="text"
                              required
                              placeholder="+8801--------"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Create Password</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Interactive Password Strength Metrics widget */}
                        {password.length > 0 && (
                          <div className="p-3 bg-slate-100/10 dark:bg-slate-950/40 rounded-lg border border-slate-200/80 dark:border-slate-850 text-xs text-slate-400 space-y-1.5 font-semibold">
                            <p className="font-bold uppercase tracking-wider text-[9px] text-slate-500 flex justify-between">
                              <span>Password Security Rating</span>
                              <span className={strengthCount >= 4 ? 'text-emerald-500' : 'text-amber-500'}>
                                {strengthCount <= 2 ? 'Weak' : strengthCount === 3 ? 'Medium' : 'Excellent State'}
                              </span>
                            </p>
                            
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                              <div className={`h-full flex-1 ${strengthCount >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${strengthCount >= 2 ? 'bg-rose-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${strengthCount >= 3 ? 'bg-amber-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${strengthCount >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${strengthCount >= 5 ? 'bg-teal-400' : 'bg-transparent'}`} />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-1 text-slate-400/85">
                              <p className="flex items-center gap-1">
                                <span className={pwdMetrics.length ? 'text-emerald-500 font-bold' : 'text-slate-600'}>✓</span>
                                8+ characters length
                              </p>
                              <p className="flex items-center gap-1">
                                <span className={pwdMetrics.upper ? 'text-emerald-500 font-bold' : 'text-slate-600'}>✓</span>
                                Uppercase A-Z letter
                              </p>
                              <p className="flex items-center gap-1">
                                <span className={pwdMetrics.lower ? 'text-emerald-500 font-bold' : 'text-slate-600'}>✓</span>
                                Lowercase a-z letter
                              </p>
                              <p className="flex items-center gap-1">
                                <span className={pwdMetrics.number ? 'text-emerald-500 font-bold' : 'text-slate-600'}>✓</span>
                                Numeric symbol 0-9
                              </p>
                              <p className="flex items-center gap-1">
                                <span className={pwdMetrics.special ? 'text-emerald-500 font-bold' : 'text-slate-600'}>✓</span>
                                Special symbol (@$!%*?&)
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-transform cursor-pointer"
                        >
                          {loading ? 'Initializing Registration records...' : 'Register as Employee'}
                        </button>
                      </motion.form>
                    )}

                    {/* VIEW C: FORGOT CREDENTIALS */}
                    {activeTab === 'forgot' && (
                      <motion.div
                        key="forgot"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-5 text-left"
                      >
                        {!showResetForm ? (
                          <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office Email Address or Employee ID</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. admin@daffodilvarsity.edu.bd"
                                  value={forgotInput}
                                  onChange={(e) => setForgotInput(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:border-indigo-500 outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              {loading ? 'Routing recovery mail dockets...' : 'Request Password Recovery'}
                            </button>
                          </form>
                        ) : (
                          
                          /* Reset Password Input replacement Screen */
                          <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div className="p-3 bg-indigo-500/5 text-indigo-400 border border-indigo-500/15 rounded-xl text-xs space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" />
                                <span>Simulated Recovery Link Verified!</span>
                              </p>
                              <p className="opacity-95 text-[10px]">
                                Simulated Reset token: <span className="font-mono">{simulatedResetToken}</span>
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-400">Specify Replacement Password</label>
                              <input
                                type="password"
                                required
                                placeholder="Enter strong new password"
                                value={newPasswordValue}
                                onChange={(e) => setNewPasswordValue(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                              Commit Replacement Password
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}

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
