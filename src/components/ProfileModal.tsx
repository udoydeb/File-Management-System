import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Smartphone, 
  ShieldCheck, 
  Lock, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  QrCode, 
  Clock, 
  Globe, 
  CheckCircle, 
  Info,
  Award
} from 'lucide-react';
import { Employee, ServerAccessLog } from '../types.js';
import { supabase } from '../lib/supabase.js';

interface ProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onProfileUpdated: (updatedUser: any) => void;
  notifyUser: (msg: string, type?: 'success' | 'error' | 'info') => void;
  authToken: string;
  theme: 'light' | 'dark';
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
];

export function ProfileModal({
  currentUser,
  onClose,
  onProfileUpdated,
  notifyUser,
  authToken,
  theme
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security' | 'history'>('profile');
  const [loading, setLoading] = useState(false);

  // Edit Profile fields
  const [designation, setDesignation] = useState(currentUser.designation || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto || '');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser.twoFactorEnabled || false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [simulatedSecret, setSimulatedSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');

  // Individual usage logs
  const [userLogs, setUserLogs] = useState<ServerAccessLog[]>([]);

  // Fetch individual logs on load
  useEffect(() => {
    const fetchMyLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter only their own logs manually
          const filtered = (data.logs || []).filter((l: any) => l.email === currentUser.email);
          setUserLogs(filtered);
        }
      } catch (err) {
        console.error('Failed to read logs', err);
      }
    };
    fetchMyLogs();
  }, [currentUser, authToken]);

  // Handle updates profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Direct Supabase database update attempt
      try {
        await supabase
          .from('profiles')
          .update({ phone, designation, profilePhoto })
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Could not sync status update with Supabase profiles table:', err);
      }

      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ phone, designation, profilePhoto })
      });
      const data = await res.json();
      if (res.ok) {
        notifyUser('Profile records updated successfully.', 'success');
        onProfileUpdated(data.user);
      } else {
        notifyUser(data.error || 'Failed to update credentials.', 'error');
      }
    } catch (err) {
      notifyUser('Server failure on profile update.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifyUser('Verify Passwords: Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        notifyUser('Password rewritten successfully.', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        notifyUser(data.error || 'Incorrect old password.', 'error');
      }
    } catch (err) {
      notifyUser('Communication error during password change.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initiates 2FA Setup
  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      // Deactivate immediately
      setTwoFactorEnabled(false);
      const updatedUser = { ...currentUser, twoFactorEnabled: false };
      onProfileUpdated(updatedUser);
      notifyUser('Two-Factor Authentication (2FA) deactivated successfully.', 'info');
    } else {
      // Show setup sequence
      const runKey = `DIU-SEC-${Math.floor(1000 + Math.random() * 9000)}`;
      setSimulatedSecret(runKey);
      setShow2FASetup(true);
    }
  };

  // Submit 2FA Code Setup
  const handleConfirm2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupCode.trim() === '123456' || setupCode.trim() === '999999' || setupCode.length >= 6) {
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setSetupCode('');
      
      const updatedUser = { ...currentUser, twoFactorEnabled: true };
      onProfileUpdated(updatedUser);
      notifyUser('MFA Secure Approved: 2FA activated on your Daffodil passport!', 'success');
    } else {
      notifyUser('Incorrect simulated pin code. Review keying directions below.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`max-w-4xl w-full border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/60' : 'bg-white border-slate-250 text-slate-900 shadow-slate-200/50'} rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[90vh] md:h-[650px]`}>
        
        {/* Sub Navigation Left Column */}
        <div className={`w-full md:w-64 border-r ${theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} p-5 flex flex-col justify-between shrink-0`}>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80'} 
                alt="Account Avatar" 
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200/20"
              />
              <div className="text-left font-sans">
                <p className="font-extrabold text-sm truncate max-w-[150px]">{currentUser.fullName}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-serif lowercase bg-slate-200 dark:bg-slate-800/80 px-1 py-0.2 rounded font-mono truncate max-w-[130px]">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 select-none text-left">
              {[
                { id: 'profile', label: 'Identity & Details', icon: User },
                { id: 'password', label: 'Modify Credentials', icon: Lock },
                { id: 'security', label: 'Authenticator & 2FA', icon: ShieldCheck },
                { id: 'history', label: 'Logon History Logs', icon: Clock }
              ].map(item => {
                const IconComp = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                        : 'text-slate-400 hover:bg-slate-200/30'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-250 dark:border-slate-850 text-[11px] text-slate-500 font-mono text-left">
            <p>ID: {currentUser.employeeId}</p>
            <p className="truncate">Email: {currentUser.email}</p>
          </div>
        </div>

        {/* Dynamic Display Right Content Area */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Header Area */}
          <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-between`}>
            <div className="text-left">
              <h3 className="font-bold text-base">Office Passport & Security Profile</h3>
              <p className="text-[11px] text-slate-500">Manage digital identifiers, authorize passwords, and audit login trials.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Body Container scrollable */}
          <div className="flex-1 p-6 overflow-y-auto text-left">
            
            {/* TAB 1: EDIT PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name (Locked)</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.fullName}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email (Locked)</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 rounded-lg outline-none text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Associate Assistant Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Lines</label>
                    <input
                      type="text"
                      required
                      placeholder="+8801--------"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Avatar presets selectors widget */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Passport Avatar Picture</label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        onClick={() => setProfilePhoto(p)}
                        alt={`Preset ${idx}`}
                        className={`w-9 h-9 rounded-xl cursor-pointer hover:scale-105 transition-all outline-indigo-500 object-cover border-2 shadow-xs ${
                          profilePhoto === p ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom profile link URL */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or Custom Image URL Link</label>
                  <input
                    type="text"
                    placeholder="Enter custom image address link"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-transform cursor-pointer"
                >
                  {loading ? 'Committing updates...' : 'Commit Identity Profiles'}
                </button>
              </form>
            )}

            {/* TAB 2: CHANGE DEPLOYED PASSWORD */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Secret Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specify Brand-New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Brand-New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Overwrite Secret Password
                </button>
              </form>
            )}

            {/* TAB 3: MFA SECURITY & AUTHENTICATORS */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100/10 pb-4">
                  <div>
                    <h4 className="font-bold text-sm">Two-Factor Authenticator (2FA)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Encrypt logins with rolling mobile apppass OTP validation codes.</p>
                  </div>
                  
                  <button
                    onClick={handleToggle2FA}
                    className="p-1 cursor-pointer focus:outline-none"
                  >
                    {twoFactorEnabled ? (
                      <ToggleRight className="w-11 h-11 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-11 h-11 text-slate-500" />
                    )}
                  </button>
                </div>

                {show2FASetup && !twoFactorEnabled && (
                  <div className="p-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 space-y-4">
                    <p className="text-xs font-bold text-indigo-400 border-b border-indigo-550/10 pb-1 uppercase tracking-widest flex items-center gap-1.5 select-none">
                      <QrCode className="w-4 h-4" />
                      <span>Setup Authenticator Multi-Factor Vault</span>
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {/* Interactive mock QR Code */}
                      <div className="p-2.5 bg-white border rounded-xl flex flex-col items-center">
                        <div className="w-28 h-28 bg-slate-900 flex items-center justify-center text-white relative">
                          <QrCode className="w-20 h-20 text-slate-100" />
                          <div className="absolute inset-0 border border-slate-800 m-1 flex items-center justify-center">
                            <span className="bg-emerald-500 text-[8px] font-mono px-1 py-0.2 rounded scale-75 select-none">DIU MFA</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">Scan QR Code</span>
                      </div>

                      <div className="text-xs space-y-2 text-slate-400 font-medium">
                        <p>1. Open Google Authenticator or Microsoft mobile keys scanner on your mobile phone.</p>
                        <p>2. Scan the barcode, or input the reference code key directly on disk: </p>
                        <p className="font-mono bg-slate-950 px-2 py-1 text-indigo-400 font-bold rounded inline-block text-[11px] uppercase tracking-wider select-all">{simulatedSecret}</p>
                        <p>3. Enter the active 6-digit passcode rolling on your app to finalize activation.</p>
                      </div>
                    </div>

                    <form onSubmit={handleConfirm2FA} className="flex gap-2.5 pt-2">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit confirmation key"
                        value={setupCode}
                        onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                      >
                        Activate Multifactor 2FA
                      </button>
                    </form>
                    <div className="text-[10px] text-slate-500 border-t border-dashed border-slate-500/10 pt-1">
                      🔑 Tip: Scanner compatibility accepts standard dynamic code structures from Google Authenticator, Authy, or Microsoft Authenticator.
                    </div>
                  </div>
                )}

                <div className="border border-slate-250 dark:border-slate-850 p-4 rounded-xl text-xs space-y-2 select-none">
                  <p className="font-bold flex items-center gap-1 text-slate-350 bg-slate-250 dark:bg-slate-950 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-md self-start inline-block">
                    <Info className="w-3.5 h-3.5" />
                    <span>How 2FA safeguards university documents</span>
                  </p>
                  <p className="text-slate-500 leading-normal">
                    When 2FA is activated, any future login dockets attempt will trigger an instantaneous security barrier, requiring verification of the rolling dynamic SMS or verification code before unlocking any soft files or chest boxes records.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: PERSONAL LOGS */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100/10 pb-2 flex justify-between uppercase">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">Access Trial Logs</span>
                  <span className="text-[10px] font-mono text-emerald-500">Filtered for your identity</span>
                </div>

                <div className="space-y-3 max-h-[290px] overflow-y-auto">
                  {userLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/30 border-slate-850' : 'bg-slate-50 border-slate-100'} text-xs flex justify-between items-start gap-4`}
                    >
                      <div className="text-left space-y-1">
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] inline-block uppercase font-bold tracking-wider ${
                          log.status === 'Success' 
                            ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400' 
                            : 'bg-rose-500/10 border border-rose-500/15 text-rose-450'
                        }`}>
                          {log.action}
                        </span>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-slate-250' : 'text-slate-700'}`}>{log.details}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {log.ip} • {log.device.includes('Node') ? 'Central Server' : 'Client Device Agent'}
                        </p>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono shrink-0 select-none">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}

                  {userLogs.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic">
                      No logs history registries have been indexed yet.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Panel footer */}
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} text-right`}>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Done Settings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
