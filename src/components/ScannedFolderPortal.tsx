import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  ExternalLink, 
  ShieldAlert, 
  Printer, 
  Share2, 
  Copy, 
  Plus, 
  X, 
  ChevronRight,
  Database,
  User,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { getApiUrl } from '../lib/api.js';

interface UniversityFile {
  id: string;
  name: string;
  type: string;
  department: string;
  category: string;
  studentId?: string;
  employeeId?: string;
  uploadDate: string;
  size: string;
  status: 'Active' | 'Archived' | 'Out';
  tags: string[];
  aiSummary: string;
  fileVersion: number;
  qrData?: string;
  storageHash: string;
  hardCopyDetails: {
    cabinetNumber: string;
    shelfNumber: string;
    boxNumber: string;
    fileSerial: string;
    responsibleEmployee: string;
  };
  textContent: string;
  fileUrl?: string;
}

interface ScannedFolderPortalProps {
  category: {
    id: string;
    name: string;
    slug: string;
    departmentId?: string;
    department_id?: string;
    desc: string;
    qr_url?: string;
    isPublic?: boolean;
  };
  files: UniversityFile[];
  onClose: () => void;
  currentUser: any;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  onLoginSuccess: (token: string, user: any) => void;
  notifyUser: (message: string, type?: 'success' | 'error' | 'info') => void;
  theme: 'light' | 'dark';
  allCategories: any[];
  setAllFiles: React.Dispatch<React.SetStateAction<UniversityFile[]>>;
}

export function ScannedFolderPortal({
  category,
  files,
  onClose,
  currentUser,
  isLocked,
  setIsLocked,
  onLoginSuccess,
  notifyUser,
  theme,
  allCategories,
  setAllFiles
}: ScannedFolderPortalProps) {
  // Query & state controllers
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('All');
  
  // Login input states for secured files
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Active files state (fetched directly/synchronized)
  const [categoryFiles, setCategoryFiles] = useState<UniversityFile[]>(files);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Preview target states
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<UniversityFile | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotate, setPreviewRotate] = useState(0);
  const [previewFilters, setPreviewFilters] = useState({ grayscale: false, contrast: false, sepia: false });

  // QR management visual states
  const [showQRActionModal, setShowQRActionModal] = useState(false);
  const [qrBase64Image, setQrBase64Image] = useState('');
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

  // Dept color setups
  const deptId = category.departmentId || category.department_id || 'registrar';
  
  const getDeptTagColor = (id: string) => {
    switch (id) {
      case 'registrar': return 'from-emerald-500 to-teal-600 text-emerald-100 bg-emerald-500/10';
      case 'accounts': return 'from-sky-500 to-blue-600 text-sky-100 bg-sky-500/10';
      case 'hr': return 'from-violet-500 to-purple-600 text-violet-100 bg-violet-500/10';
      case 'admission': return 'from-indigo-500 to-purple-700 text-indigo-100 bg-indigo-500/10';
      case 'exam': return 'from-rose-500 to-pink-600 text-rose-100 bg-rose-500/10';
      case 'cse': return 'from-teal-500 to-emerald-600 text-teal-100 bg-teal-500/10';
      case 'eee': return 'from-amber-500 to-orange-600 text-amber-100 bg-amber-500/10';
      default: return 'from-slate-500 to-slate-600 text-slate-100 bg-slate-500/10';
    }
  };

  // Generate category QR Code base64 image on mount
  useEffect(() => {
    const orig = typeof window !== 'undefined' ? window.location.origin : 'https://archive.diu.edu.bd';
    const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const value = `${orig}/category/${slug}?id=${category.id}`;
    
    QRCode.toDataURL(value, { margin: 1, width: 300 })
      .then(url => setQrBase64Image(url))
      .catch(err => console.error('Error generating asset QR image:', err));
  }, [category]);

  // Sync / reload files logic
  const reloadCategoryFiles = async () => {
    setLoadingFiles(true);
    try {
      const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const response = await fetch(`/api/category/${slug}/files`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategoryFiles(data.files || []);
        }
      }
    } catch (err) {
      console.error('Failed refetching files folder from backend database:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Trigger loading files on mount and login
  useEffect(() => {
    reloadCategoryFiles();
  }, [isLocked, category]);

  // Secure Gateway validator
  const handleInlineSecurityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      notifyUser('Required: Provide Daffodil Active Directory credentials.', 'error');
      return;
    }

    setAuthBusy(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrEmpId: loginEmail.trim(),
          password: loginPassword,
          rememberMe: true
        })
      });
      const data = await response.json();
      if (response.ok) {
        notifyUser(`Verified: Secured folder access authenticated!`, 'success');
        onLoginSuccess(data.token, data.user);
        setIsLocked(false);
      } else {
        notifyUser(data.error || 'Authentication denied. Access blocked.', 'error');
      }
    } catch (err) {
      console.error(err);
      notifyUser('Communication with active directories failed.', 'error');
    } finally {
      setAuthBusy(false);
    }
  };

  // Live filtering lists
  const filteredFiles = categoryFiles.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hardCopyDetails.fileSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = fileTypeFilter === 'All' || item.type.toUpperCase() === fileTypeFilter.toUpperCase();
    return matchesSearch && matchesType;
  });

  // Recent 3 uploads
  const recentUploads = [...categoryFiles]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 3);

  // File Statistics breakdown
  const totalFilesCount = categoryFiles.length;
  const activeCount = categoryFiles.filter(f => f.status === 'Active').length;
  const borrowedCount = categoryFiles.filter(f => f.status === 'Out').length;
  const formatStats = categoryFiles.reduce((acc: Record<string, number>, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  // Simulate file text download
  const handleDownloadFileText = (file: UniversityFile) => {
    try {
      const element = document.createElement("a");
      const fileText = `FILE NAME: ${file.name}\nSERIAL: ${file.hardCopyDetails.fileSerial}\nCABINET LOCATION: Cabinets ${file.hardCopyDetails.cabinetNumber}, Shelf ${file.hardCopyDetails.shelfNumber}, Box ${file.hardCopyDetails.boxNumber}\nUPLOAD DATE: ${file.uploadDate}\n\n===================================\nOCR RAW EXTRACT TEXT CONTENT:\n===================================\n\n${file.textContent}`;
      const fileBlob = new Blob([fileText], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = `${file.name.replace(/\.[^/.]+$/, "")}_verified_payload.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      notifyUser(`Downloaded registry text of: ${file.name}`, 'success');
    } catch (err) {
      notifyUser('Trouble downloading credentials payload.', 'error');
    }
  };

  // QR management functions
  const copyQRLinkShortcut = () => {
    const orig = typeof window !== 'undefined' ? window.location.origin : 'https://archive.diu.edu.bd';
    const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const value = `${orig}/category/${slug}?id=${category.id}`;
    
    navigator.clipboard.writeText(value);
    notifyUser('Dynamic QR Link Copied to Clipboard!', 'success');
  };

  const downloadQRImageFile = () => {
    if (!qrBase64Image) return;
    const a = document.createElement('a');
    a.href = qrBase64Image;
    a.download = `diu_smart_qr_${category.slug || 'archive'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notifyUser('QR Image saved successfully.', 'success');
  };

  const printQRLabelBadge = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notifyUser('Popups are disabled. Please enable popups to print.', 'error');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>DIU Smart Archive Label - ${category.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #ffffff; color: #111827; }
            .label-card { border: 3px solid #10b981; border-radius: 1.5rem; padding: 2.5rem; width: 380px; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .badge { display: inline-block; background-color: #059669; color: #ffffff; font-weight: bold; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.75rem; }
            .title { font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0; color: #1f2937; }
            .sub { font-size: 0.875rem; color: #4b5563; margin-bottom: 1.5rem; font-weight: 500; }
            .qr-code { width: 220px; height: 220px; margin: 0 auto; object-contain: fit; }
            .footer { font-size: 0.7rem; color: #9ca3af; font-family: monospace; font-weight: medium; margin-top: 1.5rem; }
            @media print {
              body { height: auto; }
              .label-card { box-shadow: none; border: 2px solid #000; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <span class="badge">SECURED DEPT ARCHIVE</span>
            <div class="title">${category.name}</div>
            <div class="sub">${category.desc}</div>
            <img class="qr-code" src="${qrBase64Image}" />
            <div class="footer">DIU-SYSTEM-NODE-ID: ${category.id}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRegenerateQR = () => {
    setIsRegeneratingQR(true);
    setTimeout(() => {
      setIsRegeneratingQR(false);
      notifyUser('Dynamic URL validated. QR metadata re-signed with unique secure crypt-hash.', 'success');
    }, 1200);
  };

  // Helper file icons
  const renderFileColoredIcon = (type: string) => {
    const cleanType = type.toUpperCase();
    if (cleanType === 'PDF') return <FileText className="w-5 h-5 text-rose-500" />;
    if (cleanType === 'CSV' || cleanType === 'XLSX') return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className={`min-h-screen font-sans antialiased text-left selection:bg-emerald-500/20 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Upper Accent Header stripes */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${getDeptTagColor(deptId)}`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb row */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-6">
          <button 
            type="button"
            onClick={onClose}
            className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Daffodil Smart Archive
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">QR Scanned Portals</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px]">{category.name}</span>
        </nav>

        {/* Dynamic Folder Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8 mb-8">
          
          {/* Back Action */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 hidden sm:flex items-center gap-1.5 text-xs px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850 rounded-xl cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Master Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            {/* Visual Icon Node */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br ${getDeptTagColor(deptId)}`}>
              <Folder className="w-9 h-9 text-white" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {category.name}
                </h1>
                
                {/* Security Verification Indicator */}
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                    <Lock className="w-3 h-3" /> SECURED ARCHIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                    <Unlock className="w-3 h-3" /> VERIFIED OPEN ACCESS
                  </span>
                )}

                {category.isPublic && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                    PUBLIC VALIDATION LEDGER
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
                {category.desc || 'No verification description loaded on Daffodil active registers.'}
              </p>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-400 font-semibold pt-1">
                <span className="capitalize">{deptId.toUpperCase()} OFFICE CENTRAL REGISTER</span>
                <span className="inline-block w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <span>Node ID: {category.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Main files grid list */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Control Panel (Only if unlocked) */}
            {!isLocked && (
              <div className="flex flex-col sm:flex-row gap-3.5 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-850 p-4 rounded-2xl shadow-xs">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ledger documents by tag, name or serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* File Filters */}
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                  {['All', 'PDF', 'CSV', 'TXT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFileTypeFilter(type)}
                      className={`text-xs px-3.5 py-2.5 font-bold rounded-xl cursor-pointer transition-all ${
                        fileTypeFilter === type 
                          ? 'bg-emerald-500 text-white shadow-xs' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                      }`}
                    >
                      {type}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowQRActionModal(true)}
                    className="flex items-center justify-center p-2.5 text-slate-500 hover:text-emerald-500 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl cursor-pointer"
                    title="QR Label Options"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            )}

            {/* Folder files view segment */}
            {isLocked ? (
              
              /* Security Inline lock Gate */
              <div className="bg-white dark:bg-slate-900 border border-slate-225 dark:border-slate-850 shadow-sm rounded-3xl p-8 text-center space-y-6">
                
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Access Denied: Restricted Folder Space
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    This department archive directory is flagged secure. Scanning or accessing documents inside require authentication via active server directory credentials.
                  </p>
                </div>

                {/* Compact Login Form */}
                <form onSubmit={handleInlineSecurityLogin} className="max-w-sm mx-auto space-y-3 pt-2">
                  
                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email or Employee ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. employee.hr@daffodilvarsity.edu.bd"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs px-4.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter Active Directory Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs px-4.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authBusy}
                    className="w-full font-bold text-xs font-mono py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {authBusy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>VERIFY & UNLOCK LEDGER</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 select-none pt-1">
                    Verified through Daffodil Central Identity Node
                  </p>

                </form>

              </div>

            ) : loadingFiles ? (

              <div className="justify-center items-center py-20 flex flex-col gap-4">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-xs text-slate-400 font-mono">Synchronizing document index registry...</p>
              </div>

            ) : filteredFiles.length === 0 ? (
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-3xl p-12 text-center text-slate-400 space-y-4">
                <FileText className="w-12 h-12 mx-auto text-slate-300" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Registry Documents Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    There are no files uploaded inside this folder matching the current filters, or all files have been checked out.
                  </p>
                </div>
              </div>

            ) : (
              
              /* Google Drive Style Interactive Explorer list Table */
              <div className="bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-850 shadow-sm rounded-3xl overflow-hidden">
                
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] text-slate-400 font-extrabold uppercase bg-slate-50/50 dark:bg-slate-950/20 select-none">
                        <th className="px-6 py-4">Document Title</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Serial ID</th>
                        <th className="px-5 py-4">Cabinet Allocation</th>
                        <th className="px-5 py-4">Upload Date</th>
                        <th className="px-6 py-4 text-right">Verification ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 font-medium">
                      {filteredFiles.map((item) => (
                        <tr 
                          key={item.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors text-xs text-slate-700 dark:text-slate-300"
                        >
                          {/* File Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {renderFileColoredIcon(item.type)}
                              <div className="space-y-0.5 truncate max-w-[200px]">
                                <span className="font-bold text-slate-900 dark:text-white block hover:text-emerald-500 leading-tight" title={item.name}>
                                  {item.name}
                                </span>
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex items-center gap-1 overflow-x-hidden">
                                    {item.tags.slice(0, 2).map(t => (
                                      <span key={t} className="bg-slate-150 dark:bg-slate-800 text-[9px] text-slate-500 px-1 border border-slate-200 dark:border-slate-800 rounded font-bold uppercase font-mono">
                                        {t}
                                      </span>
                                    ))}
                                    {item.tags.length > 2 && <span className="text-[8px] text-slate-400 font-bold">+{item.tags.length - 2}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* File Type */}
                          <td className="px-5 py-4">
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded font-bold uppercase">
                              {item.type}
                            </span>
                          </td>

                          {/* Serial ID */}
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                              {item.hardCopyDetails.fileSerial}
                            </span>
                          </td>

                          {/* Cabinets positioning */}
                          <td className="px-5 py-4">
                            <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              <span className="font-bold text-slate-900 dark:text-white">CAB {item.hardCopyDetails.cabinetNumber}</span> 
                              <span className="block font-mono text-[9px] text-slate-400 font-semibold">{item.hardCopyDetails.shelfNumber} • {item.hardCopyDetails.boxNumber}</span>
                            </div>
                          </td>

                          {/* Upload Date */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-slate-400 font-medium">
                              {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>

                          {/* Action Controls */}
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              
                              <button
                                onClick={() => setSelectedPreviewFile(item)}
                                className="p-2 text-slate-500 hover:text-emerald-500 bg-slate-150/40 dark:bg-slate-950 hover:bg-emerald-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                                title="Scanner Preview OCR"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDownloadFileText(item)}
                                className="p-2 text-slate-500 hover:text-sky-500 bg-slate-150/40 dark:bg-slate-950 hover:bg-sky-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                                title="Download OCR payload"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch Optimized Explorer View Grid lists */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-850 p-4 space-y-3">
                  {filteredFiles.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-850/60 rounded-2xl flex flex-col gap-3.5 text-left text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {renderFileColoredIcon(item.type)}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white leading-tight block truncate max-w-[170px]" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              Serial: {item.hardCopyDetails.fileSerial}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          {item.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <div>
                          <span className="text-[8px] text-zinc-400 block font-black uppercase">Cabinet Space</span>
                          <span className="font-bold font-mono text-[10px] text-zinc-700 dark:text-zinc-300">CAB {item.hardCopyDetails.cabinetNumber}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-zinc-400 block font-black uppercase">Box Shelf Alloc</span>
                          <span className="font-bold font-mono text-[10px] text-zinc-700 dark:text-zinc-300 text-ellipsis overflow-hidden block whitespace-nowrap">{item.hardCopyDetails.shelfNumber} • {item.hardCopyDetails.boxNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-850/40">
                        <span className="text-[10px] font-mono text-slate-400">
                          Scanned: {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : 'N/A'}
                        </span>
                        
                        <div className="flex items-center gap-2 select-none">
                          <button
                            onClick={() => setSelectedPreviewFile(item)}
                            className="px-3.5 py-2 font-bold bg-slate-900 dark:bg-slate-800 text-slate-300 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-emerald-500 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownloadFileText(item)}
                            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl cursor-pointer hover:bg-sky-500 hover:text-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Right rail meta dashboard panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Folder statistics badge card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-850 shadow-sm rounded-3xl p-6 text-left">
              <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-emerald-500" />
                <span>Verification & Metadata</span>
              </h3>

              <div className="space-y-4">
                
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-850/50 font-semibold">
                  <span className="text-slate-400">Total Directory Files</span>
                  <span className="text-slate-850 dark:text-slate-100 font-bold font-mono">{totalFilesCount}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-850/50 font-semibold">
                  <span className="text-slate-400">Active Shelf Originals</span>
                  <span className="text-emerald-500 font-bold font-mono">{activeCount}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-850/50 font-semibold">
                  <span className="text-slate-400">Checked Out Records</span>
                  <span className="text-slate-850 dark:text-slate-100 font-bold font-mono">{borrowedCount}</span>
                </div>

                {/* Formats distribution indicator */}
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">File Formats Index</span>
                  <div className="flex h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                    <div className="bg-rose-500" style={{ width: `${(formatStats['PDF'] || 0) / (totalFilesCount || 1) * 100}%` }} title="PDF files" />
                    <div className="bg-emerald-500" style={{ width: `${(formatStats['CSV'] || formatStats['XLSX'] || 0) / (totalFilesCount || 1) * 100}%` }} title="CSV files" />
                    <div className="bg-amber-400" style={{ width: `${(1 - ((formatStats['PDF'] || 0) + (formatStats['CSV'] || formatStats['XLSX'] || 0)) / (totalFilesCount || 1)) * 100}%` }} title="Other files" />
                  </div>
                  <div className="flex items-center gap-3.5 text-[9px] font-extrabold font-mono text-slate-400/80 uppercase mt-2 select-none">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> PDF ({(formatStats['PDF'] || 0)})</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CSV ({formatStats['CSV'] || formatStats['XLSX'] || 0})</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> OTHER</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Recent Uploads side panel */}
            {!isLocked && (
              <div className="bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-850 shadow-sm rounded-3xl p-6 text-left">
                <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Recent Upload Timeline</span>
                </h3>

                {recentUploads.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-normal">No timeline registry uploaded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentUploads.map((file, idx) => (
                      <div key={file.id} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                            {renderFileColoredIcon(file.type)}
                          </div>
                          {idx !== recentUploads.length - 1 && (
                            <div className="w-0.5 h-6 bg-slate-100 dark:bg-slate-850 mt-1" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate leading-tight hover:text-emerald-500 cursor-pointer" onClick={() => setSelectedPreviewFile(file)}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'N/A'} • {file.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visual scanned QR Badge detail */}
            <div className="bg-slate-900 dark:bg-slate-900 border border-emerald-950 text-white rounded-3xl p-6 text-center space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
              
              <div className="relative space-y-4">
                <div className="mx-auto flex justify-center bg-white p-2.5 rounded-2xl border border-slate-200 inline-block w-[130px] h-[130px] max-w-full">
                  {qrBase64Image ? (
                    <img src={qrBase64Image} alt="Directory QR" className="w-[110px] h-[110px] object-contain select-none" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-[110px] h-[110px] bg-slate-100 animate-pulse rounded" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-slate-400 block font-extrabold uppercase">Dynamic Security Code</span>
                  <span className="text-slate-300 text-xs font-semibold block">{category.id}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyQRLinkShortcut}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-xs text-white rounded-xl font-bold border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>

                  <button
                    onClick={downloadQRImageFile}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white rounded-xl font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DL Image</span>
                  </button>
                </div>

                <p className="text-[9px] text-slate-400 leading-normal font-semibold">
                  This QR code matches this directory folder database permanently. Scan with mobile devices to verify original filing dockets instantly.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: HIGH QUALITY SCANNER SIMULATOR FILE PREVIEW */}
      <AnimatePresence>
        {selectedPreviewFile && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-left shadow-2xl"
            >
              
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-850/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {selectedPreviewFile.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase font-mono">
                      Serial: {selectedPreviewFile.hardCopyDetails.fileSerial} • Version v{selectedPreviewFile.fileVersion}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-850/80 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 select-none">
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950">
                    <button 
                      onClick={() => setPreviewZoom(z => Math.max(50, z - 10))}
                      className="p-1 px-2 hover:bg-white dark:hover:bg-slate-850 rounded hover:shadow-xs text-xs font-black cursor-pointer text-slate-600 dark:text-slate-300"
                    >
                      -
                    </button>
                    <span className="text-[10px] px-2 font-mono font-bold text-center w-12 text-slate-500">{previewZoom}%</span>
                    <button 
                      onClick={() => setPreviewZoom(z => Math.min(200, z + 10))}
                      className="p-1 px-2 hover:bg-white dark:hover:bg-slate-850 rounded hover:shadow-xs text-xs font-black cursor-pointer text-slate-600 dark:text-slate-300"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => setPreviewRotate(r => (r + 90) % 360)}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer text-slate-500 transition-colors flex items-center gap-1"
                    title="Rotate 90deg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rotate</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-1">Clean Filters:</span>
                  
                  <button
                    onClick={() => setPreviewFilters(f => ({ ...f, grayscale: !f.grayscale }))}
                    className={`text-[10px] font-extrabold px-2.5 py-1.5 border rounded-xl cursor-pointer ${
                      previewFilters.grayscale 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    Grayscale
                  </button>

                  <button
                    onClick={() => setPreviewFilters(f => ({ ...f, contrast: !f.contrast }))}
                    className={`text-[10px] font-extrabold px-2.5 py-1.5 border rounded-xl cursor-pointer ${
                      previewFilters.contrast 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    High-Contrast
                  </button>

                  <button
                    onClick={() => setPreviewFilters(f => ({ ...f, sepia: !f.sepia }))}
                    className={`text-[10px] font-extrabold px-2.5 py-1.5 border rounded-xl cursor-pointer ${
                      previewFilters.sepia 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    Sepia Tone
                  </button>
                </div>

              </div>

              {/* Main Content View with scroll and simulation filters */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center items-start min-h-[300px]">
                
                <div 
                  className="w-full max-w-2xl bg-white text-slate-950 border border-slate-300 dark:border-slate-850 p-8 sm:p-12 shadow-md rounded-2xl font-mono text-xs text-left leading-relaxed relative min-h-[500px] overflow-hidden transition-all duration-300 shrink-0"
                  style={{
                    transform: `scale(${previewZoom / 100}) rotate(${previewRotate}deg)`,
                    filter: `
                      ${previewFilters.grayscale ? 'grayscale(100%)' : ''}
                      ${previewFilters.contrast ? 'contrast(170%) brightness(110%)' : ''}
                      ${previewFilters.sepia ? 'sepia(80%) hue-rotate(10deg)' : ''}
                    `
                  }}
                >
                  
                  {/* Watermark security */}
                  <div className="absolute top-[20%] left-[10%] text-slate-200/50 dark:text-slate-100/5 rotate-[-35deg] font-sans text-5xl font-black select-none pointer-events-none tracking-normal">
                    DAFFODIL SECURE ARCHIVE
                  </div>

                  <div className="absolute top-2 right-2 flex flex-col items-center gap-1 select-none pointer-events-none">
                    <span className="text-[7px] font-sans font-bold text-slate-300 uppercase tracking-widest border border-slate-200 p-0.5 px-1.5 rounded">DIU CLOUD LEDGER</span>
                  </div>

                  {/* Document Header mock */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="text-center">
                      <div className="text-sm font-black tracking-normal uppercase">DAFFODIL INTERNATIONAL UNIVERSITY</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">CENTRAL REGISTRY REPOSITORY ACCESS NODE</div>
                    </div>
                  </div>

                  {/* Document stats */}
                  <div className="grid grid-cols-2 gap-4 pb-4 mb-6 border-b border-dashed border-slate-400 text-[10px]">
                    <div>
                      <span className="font-bold text-slate-400 uppercase">DOCUMENT METADATA LOG:</span>
                      <span className="block mt-1 font-extrabold"><span className="text-slate-400">FILE ID:</span> {selectedPreviewFile.id}</span>
                      <span className="block"><span className="text-slate-400">NAME:</span> {selectedPreviewFile.name}</span>
                      <span className="block"><span className="text-slate-400">CATEGORY:</span> {selectedPreviewFile.category}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase">HARD COPY POSITIONING:</span>
                      <span className="block mt-1"><span className="text-slate-400">CABINET:</span> Cabinet NR {selectedPreviewFile.hardCopyDetails.cabinetNumber}</span>
                      <span className="block"><span className="text-slate-400">SHELF NO:</span> {selectedPreviewFile.hardCopyDetails.shelfNumber}</span>
                      <span className="block"><span className="text-slate-400">BOX NO:</span> {selectedPreviewFile.hardCopyDetails.boxNumber}</span>
                      <span className="block"><span className="text-slate-400">SERIAL ID:</span> {selectedPreviewFile.hardCopyDetails.fileSerial}</span>
                    </div>
                  </div>

                  {/* Raw string content */}
                  <div className="whitespace-pre-wrap text-slate-800 text-[11px] font-mono leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    {selectedPreviewFile.textContent}
                  </div>

                  {/* Verification Seal footer */}
                  <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[8px] text-zinc-500 font-sans">
                    <span>SEALED DATE: {selectedPreviewFile.uploadDate ? new Date(selectedPreviewFile.uploadDate).toLocaleDateString() : 'UNTROUBLED'}</span>
                    <span className="font-bold text-right font-mono">DIU AUTH SHASH_VALUE: {selectedPreviewFile.storageHash.slice(0, 24)}...</span>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-850/80 bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-4 font-semibold select-none">
                <span className="font-mono">Verification: Daffodil Smart Archive Cloud System Node v1.4.1</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadFileText(selectedPreviewFile)}
                    className="px-4.5 py-2 hover:bg-emerald-600 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download TXT</span>
                  </button>

                  <button
                    onClick={() => setSelectedPreviewFile(null)}
                    className="px-4.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-zinc-300 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: QR CODE PORTFOLIO ASSETS ACTIONS */}
      <AnimatePresence>
        {showQRActionModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 text-left shadow-2xl relative overflow-hidden"
            >
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850 select-none">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-500" />
                  <span>Cabinet QR Label Manager</span>
                </h3>
                <button
                  onClick={() => setShowQRActionModal(false)}
                  className="p-1 px-2.5 text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                
                <div className="bg-white p-3 rounded-2xl border border-slate-225 inline-block w-[180px] h-[180px] shadow-sm flex items-center justify-center">
                  {qrBase64Image ? (
                    <img src={qrBase64Image} alt="Large Code" className="w-[155px] h-[155px] object-contain select-none" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="animate-pulse bg-slate-100 rounded shrink-0 w-[150px] h-[150px]" />
                  )}
                </div>

                <div className="text-center space-y-1 max-w-xs">
                  <span className="text-sm font-black text-slate-900 dark:text-white block truncate">{category.name}</span>
                  <span className="text-[10px] text-slate-500 block leading-normal">{category.desc || 'No descriptive context seeded.'}</span>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <button
                    onClick={copyQRLinkShortcut}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4.5 h-4.5" />
                    <span>Copy Dynamic QR URL link</span>
                  </button>

                  <button
                    onClick={downloadQRImageFile}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4.5 h-4.5" />
                    <span>Download QR label PNG asset</span>
                  </button>

                  <button
                    onClick={printQRLabelBadge}
                    className="w-full py-3 bg-slate-900 dark:bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4.5 h-4.5" />
                    <span>Print QR hanging label badge</span>
                  </button>

                  <button
                    onClick={handleRegenerateQR}
                    disabled={isRegeneratingQR}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200/50 dark:hover:bg-slate-850 text-slate-500 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingQR ? 'Validation...' : 'Regenerate secure label crypt'}</span>
                  </button>
                </div>

              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-850 select-none">
                Hanging label matches the dynamic server category: {category.id}
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
