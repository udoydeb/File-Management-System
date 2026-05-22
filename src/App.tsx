import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Folder,
  UploadCloud,
  QrCode,
  Search,
  BookOpen,
  User,
  LayoutDashboard,
  Bell,
  CheckCircle,
  FileText,
  Clock,
  LogOut,
  Sliders,
  Sparkles,
  HelpCircle,
  Hash,
  ArrowRight,
  Database,
  Printer,
  Calendar,
  Layers,
  FileCheck,
  RotateCw,
  Plus,
  Trash2,
  Eye,
  Download,
  Terminal,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  Share2,
  AlertCircle,
  X,
  Scan,
  TrendingUp,
  Award,
  Lock,
  Sun,
  Moon,
  Users
} from 'lucide-react';

import { 
  UniversityFile, 
  BulkUploadedFile, 
  FileCheckout, 
  ActivityLog, 
  SystemNotification,
  Employee,
  ServerAccessLog
} from './types.js';

import { 
  DEPARTMENTS, 
  INITIAL_CATEGORIES, 
  TEST_DOCUMENT_TEMPLATES, 
  getDepartmentIcon 
} from './data.js';

import { LoginScreen } from './components/LoginScreen.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ProfileModal } from './components/ProfileModal.js';

// Safe sandbox-friendly localStorage helper
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }
};

// Reusable QRCode QR Component
function QRCodeView({ value, size = 130 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size })
      .then(url => setDataUrl(url))
      .catch(err => console.error(err));
  }, [value, size]);
  
  return dataUrl ? (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-sm inline-block shrink-0">
      <img src={dataUrl} alt="Archive QR Code" className="w-[110px] h-[110px] object-contain select-none" />
      <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-[110px]">DIU Security Node</span>
    </div>
  ) : (
    <div className="animate-pulse bg-slate-100 rounded border border-slate-200 shrink-0" style={{ width: size, height: size }} />
  );
}

export default function App() {
  // --- AUTH STATES ---
  const [authToken, setAuthToken] = useState<string | null>(() => safeStorage.getItem('diu_auth_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Theme Settings state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeStorage.getItem('diu_theme') as 'light' | 'dark') || 'light';
  });

  // App tabs: 'dashboard' | 'explorer' | 'search' | 'movement' | 'qr-depot' | 'logs' | 'employee-mgmt'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Alert message banner
  const [systemAlert, setSystemAlert] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Profile modal toggle
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Administrative databases
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [adminLogs, setAdminLogs] = useState<ServerAccessLog[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Department Filters (Explorer View)
  const [selectedDeptId, setSelectedDeptId] = useState<string>('registrar');
  const [selectedCategorValue, setSelectedCategoryValue] = useState<string>('Student Records');
  
  // Custom states databases
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  // University files database
  const [files, setFiles] = useState<UniversityFile[]>(() => {
    const saved = safeStorage.getItem('diu_archive_files');
    if (saved) {
      try { return JSON.parse(saved); } catch(_) {}
    }
    // High-quality Initial seed database
    return [
      {
        id: 'file-01',
        name: 'MD. TANVIR RAHMAN Transcript S25.pdf',
        type: 'PDF',
        department: 'registrar',
        category: 'Transcripts',
        studentId: '211-15-4029',
        uploadDate: '2026-04-12T10:30:00Z',
        size: '1.4 MB',
        status: 'Active',
        tags: ['academic', 'grades', 'transcript', 'tanvir'],
        aiSummary: 'Official Spring 2025 student academic transcript for MD. Tanvir Rahman verifying absolute GPA completion (3.84) across 148 credits.',
        fileVersion: 1,
        qrData: 'diu-archive://category/Transcripts',
        storageHash: 'c3ab8e90e1a123ffb90988ccdedaa91a457a1b',
        hardCopyDetails: {
          cabinetNumber: 'CAB-A',
          shelfNumber: 'Shelf 2',
          boxNumber: 'Box 12',
          fileSerial: 'DIU-SRL-4809',
          responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff'
        },
        textContent: 'Transcript grades records verification.'
      },
      {
        id: 'file-02',
        name: 'Dr. Touhid Bhuiyan Salary Clear May26.xlsx',
        type: 'XLSX',
        department: 'hr',
        category: 'Salary Files',
        employeeId: 'EMP-1029',
        uploadDate: '2026-05-18T14:22:00Z',
        size: '640 KB',
        status: 'Active',
        tags: ['hr', 'finance', 'payroll'],
        aiSummary: 'Disbursed salary ledger for Dr. Touhid Bhuiyan noting base allowance and supplementary university teaching research grants.',
        fileVersion: 2,
        qrData: 'diu-archive://category/Salary Files',
        storageHash: 'a98f10ea5cd109fabcd091aa38cc911bcdafe23',
        hardCopyDetails: {
          cabinetNumber: 'CAB-C',
          shelfNumber: 'Shelf 3',
          boxNumber: 'Box 15',
          fileSerial: 'DIU-SRL-1029',
          responsibleEmployee: 'Tanveer Hasan / HR Officer'
        },
        textContent: 'Salary payroll transaction spreadsheet.'
      },
      {
        id: 'file-03',
        name: 'Exam Question CSE_413 Midterm final.docx',
        type: 'DOCX',
        department: 'exam',
        category: 'Exam Papers',
        uploadDate: '2026-05-10T09:00:00Z',
        size: '220 KB',
        status: 'Archived',
        tags: ['questions', 'midterms', 'cse413', 'exam-controller'],
        aiSummary: 'Officially vetted physical exam script paper for Software Architecture course outlining core structural design diagrams evaluation markers.',
        fileVersion: 1,
        qrData: 'diu-archive://category/Exam Papers',
        storageHash: '1e2e3ffba01a23eec780a1ccee89f9e0ab2ea01',
        hardCopyDetails: {
          cabinetNumber: 'CAB-E',
          shelfNumber: 'Shelf 1',
          boxNumber: 'Box 41',
          fileSerial: 'DIU-SRL-4130',
          responsibleEmployee: 'Dr. Imran Mahmud / CSE Controller'
        },
        textContent: 'Design patterns and multi-agent exams.'
      },
      {
        id: 'file-04',
        name: 'Graduation Clearance Ledger R2026.pdf',
        type: 'PDF',
        department: 'registrar',
        category: 'Clearance Files',
        studentId: '181-15-2015',
        uploadDate: '2026-03-22T11:45:00Z',
        size: '1.8 MB',
        status: 'Out',
        tags: ['clearance', 'library-dues', 'graduation'],
        aiSummary: 'Central register of accounts, library and hostel sign-offs ensuring eligibility of student 181-15-2015 for Convocation issuance.',
        fileVersion: 1,
        qrData: 'diu-archive://category/Clearance Files',
        storageHash: '7a12bcde0ef45b911ee67a8ccd810a9fdeba40',
        hardCopyDetails: {
          cabinetNumber: 'CAB-B',
          shelfNumber: 'Shelf 4',
          boxNumber: 'Box 22',
          fileSerial: 'DIU-SRL-2015',
          responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff'
        },
        textContent: 'Graduation clearance approvals.'
      }
    ];
  });

  // Save files to localStorage
  useEffect(() => {
    safeStorage.setItem('diu_archive_files', JSON.stringify(files));
  }, [files]);

  // File Checkouts DB
  const [checkouts, setCheckouts] = useState<FileCheckout[]>(() => {
    const saved = safeStorage.getItem('diu_checkouts');
    return saved ? JSON.parse(saved) : [
      {
        id: 'chk-01',
        fileId: 'file-04',
        fileName: 'Graduation Clearance Ledger R2026.pdf',
        department: 'registrar',
        borrowerName: 'Md. Shofiqul Islam',
        borrowerId: 'DIU-OFF-519',
        takenDate: '2026-05-10',
        dueDate: '2026-05-24',
        returnedDate: null,
        status: 'Taken',
        authorizedBy: 'Udoy Deb'
      }
    ];
  });

  useEffect(() => {
    safeStorage.setItem('diu_checkouts', JSON.stringify(checkouts));
  }, [checkouts]);

  // System Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    { id: 'not-01', timestamp: new Date().toISOString(), type: 'success', title: 'Archive Initialization', message: 'Daffodil International University Smart Sync Database Online.', read: false },
    { id: 'not-02', timestamp: new Date().toISOString(), type: 'alert', title: 'File Overdue Alert', message: 'Physical File DIU-SRL-2015 borrows period ends in 2 days.', read: false }
  ]);

  // Audit Rails activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: 'log-01', timestamp: '2026-05-22T08:15:00Z', user: 'admin@daffodilvarsity.edu.bd', role: 'Super Admin', action: 'DATABASE_ONLINE', details: 'Initialized central files schemas' },
    { id: 'log-02', timestamp: '2026-05-22T10:10:00Z', user: 'admin@daffodilvarsity.edu.bd', role: 'Super Admin', action: 'QR_PRINTED', details: 'Generated high-resolution category barcodes for physical cabinets' }
  ]);

  const addLog = (action: string, details: string) => {
    const userName = currentUser ? currentUser.email : 'system-node';
    const userRole = currentUser ? currentUser.role : 'System';
    const freshLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: userName,
      role: userRole,
      action,
      details
    };
    setActivityLogs(prev => [freshLog, ...prev]);
  };

  const triggerNotification = (type: 'success' | 'info' | 'alert', title: string, message: string) => {
    const newNot: SystemNotification = {
      id: `not-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      read: false
    };
    setNotifications(prev => [newNot, ...prev]);
  };

  const notifyUser = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSystemAlert({ message, type });
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Check login states on load
  useEffect(() => {
    const verifyPortalSession = async () => {
      if (!authToken) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          // Set department locks if not Super Admin
          if (data.user.role !== 'Super Admin') {
            setSelectedDeptId(data.user.departmentId);
            // Select first category
            const firstCat = categories.find(c => c.departmentId === data.user.departmentId);
            if (firstCat) setSelectedCategoryValue(firstCat.name);
          }
        } else {
          safeStorage.removeItem('diu_auth_token');
          setAuthToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Core Portal verification timeout', err);
      } finally {
        setAuthLoading(false);
      }
    };
    verifyPortalSession();
  }, [authToken]);

  // Fetch administrator panel lists
  const fetchAdminDirectory = async () => {
    if (!currentUser || (currentUser.role !== 'Super Admin' && currentUser.role !== 'Department Admin')) {
      return;
    }
    setLoadingAdmin(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${authToken}` };
      
      const employeesRes = await fetch('/api/admin/employees', { headers: authHeader });
      const logsRes = await fetch('/api/admin/logs', { headers: authHeader });

      if (employeesRes.ok && logsRes.ok) {
        const empData = await employeesRes.json();
        const logsData = await logsRes.json();
        setEmployeesList(empData.employees || []);
        setAdminLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Directory sync failed:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (currentUser && (activeTab === 'employee-mgmt' || showProfileModal)) {
      fetchAdminDirectory();
    }
  }, [currentUser, activeTab, showProfileModal]);

  // Login Callback success
  const handleLoginSuccess = (token: string, user: any) => {
    safeStorage.setItem('diu_auth_token', token);
    setAuthToken(token);
    setCurrentUser(user);
    if (user.role !== 'Super Admin') {
      setSelectedDeptId(user.departmentId);
      const firstCat = categories.find(c => c.departmentId === user.departmentId);
      if (firstCat) setSelectedCategoryValue(firstCat.name);
    }
    setActiveTab('dashboard');
  };

  // Perform Log Out
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (_) {}
    safeStorage.removeItem('diu_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
    notifyUser('Secure session terminated successfully.', 'info');
  };

  // Administrative actions
  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/employees/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId, status })
      });
      const data = await res.json();
      if (res.ok) {
        notifyUser(data.message, 'success');
        fetchAdminDirectory();
      } else {
        notifyUser(data.error, 'error');
      }
    } catch (err) {
      notifyUser('Administrative adjustment failed.', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/employees/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId, role })
      });
      const data = await res.json();
      if (res.ok) {
        notifyUser(data.message, 'success');
        fetchAdminDirectory();
      } else {
        notifyUser(data.error, 'error');
      }
    } catch (err) {
      notifyUser('Role modification failed.', 'error');
    }
  };

  const handleAddCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    // Viewer lock check
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Restricted: Viewers cannot create archive folders.', 'error');
      return;
    }

    const catId = `cat-${selectedDeptId}-${Date.now().toString().slice(-4)}`;
    const newCat = {
      id: catId,
      departmentId: selectedDeptId,
      name: newCatName.trim(),
      desc: newCatDesc.trim() || 'Dynamic DIU employee archive category'
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    setShowAddCatModal(false);
    addLog('ADD_CATEGORY', `Created category "${newCat.name}" under ${DEPARTMENTS.find(d => d.id === selectedDeptId)?.name}`);
    notifyUser(`Successfully added Category: ${newCat.name}`, 'success');
  };

  // Single file scanned register UI States
  const [dragActive, setDragActive] = useState(false);
  const [selectedUploadTemplate, setSelectedUploadTemplate] = useState<number | null>(null);
  const [customUploadName, setCustomUploadName] = useState('');
  const [customUploadText, setCustomUploadText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedUploadFileIndex, setSelectedUploadFileIndex] = useState<number>(0);

  // Bulk Upload state variables
  const [activeUploadMode, setActiveUploadMode] = useState<'single' | 'bulk'>('single');
  const [bulkQueue, setBulkQueue] = useState<BulkUploadedFile[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Physical Placement UI settings
  const [customCabinet, setCustomCabinet] = useState('CAB-A');
  const [customShelf, setCustomShelf] = useState('Shelf 1');
  const [customBox, setCustomBox] = useState('Box 15');
  const [customResponsible, setCustomResponsible] = useState('');

  useEffect(() => {
    if (currentUser) {
      setCustomResponsible(currentUser.fullName);
    }
  }, [currentUser]);

  // Core file upload scanner (Single Attachment)
  const handleAIScanAnalysis = async () => {
    // Check Viewer lock
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Restricted: Viewer users cannot register or upload files.', 'error');
      return;
    }

    let activeName = customUploadName;
    let activeText = customUploadText;
    let activeType = "TXT";

    if (selectedUploadTemplate !== null) {
      const template = TEST_DOCUMENT_TEMPLATES[selectedUploadTemplate];
      activeName = template.name;
      activeText = template.textContent;
      activeType = template.type;
    }

    if (!activeText) {
      notifyUser('Please supply some document text or choose a template first!', 'error');
      return;
    }

    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 15;
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 15;
      });
    }, 250);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: activeName,
          textContent: activeText,
          fileType: activeType
        })
      });

      if (!res.ok) throw new Error('API processing error');
      const data = await res.json();
      
      setUploadProgress(105);
      
      const nextFile: UniversityFile = {
        id: `file-${Date.now()}`,
        name: data.fileName || activeName || 'DIU_Scanned_Record.pdf',
        type: activeType,
        department: selectedDeptId,
        category: data.category || selectedCategorValue,
        studentId: data.studentId || undefined,
        employeeId: data.employeeId || undefined,
        uploadDate: new Date().toISOString(),
        size: '1.2 MB',
        status: 'Active',
        tags: data.tags || ['scanned', 'ocr', 'ai-analyzed'],
        aiSummary: data.aiSummary || 'Analyzed DIU file classification complete.',
        fileVersion: 1,
        qrData: `diu-archive://category/${data.category || selectedCategorValue}`,
        storageHash: Math.random().toString(16).substring(2, 42),
        hardCopyDetails: {
          cabinetNumber: data.hardCopyDetails?.cabinetNumber || customCabinet,
          shelfNumber: data.hardCopyDetails?.shelfNumber || customShelf,
          boxNumber: data.hardCopyDetails?.boxNumber || customBox,
          fileSerial: data.hardCopyDetails?.fileSerial || `DIU-SRL-${Math.floor(1000 + Math.random() * 9000)}`,
          responsibleEmployee: customResponsible
        },
        textContent: activeText
      };

      setFiles(prev => [nextFile, ...prev]);
      addLog('DOCUMENT_UPLOAD_AI', `Uploaded & AI-analyzed: ${nextFile.name}`);
      triggerNotification('success', 'AI OCR Complete', `Classified: "${nextFile.name}" into "${nextFile.category}"`);
      notifyUser(`Success! Classified into folder: ${nextFile.category}`, 'success');

      setTimeout(() => {
        setUploadProgress(null);
        setSelectedUploadTemplate(null);
        setCustomUploadName('');
        setCustomUploadText('');
      }, 800);

    } catch (err) {
      console.error(err);
      notifyUser('Failed to analysis document metrics.', 'error');
      setUploadProgress(null);
    }
  };

  // Bulk parser queue generator
  const triggerBulkScanRegister = async () => {
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewers cannot trigger bulk transactions.', 'error');
      return;
    }
    if (bulkQueue.length === 0) {
      notifyUser('Queue Empty: Select multiple files to trigger bulk queue.', 'error');
      return;
    }

    setIsBulkProcessing(true);
    notifyUser(`Triggering bulk register pipeline for ${bulkQueue.length} documents.`, 'info');

    try {
      const tempQueue = [...bulkQueue];
      for (let i = 0; i < tempQueue.length; i++) {
        const item = tempQueue[i];
        if (item.status === 'done') continue;

        // Mark item as processing
        setBulkQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 35 } : f));
        
        const res = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: item.name,
            textContent: item.simulatedText,
            fileType: 'PDF'
          })
        });

        if (!res.ok) throw new Error();
        const data = await res.json();

        // Create standard record
        const nextFile: UniversityFile = {
          id: `file-bulk-${Date.now()}-${i}`,
          name: data.fileName || item.name,
          type: 'PDF',
          department: selectedDeptId,
          category: data.category || selectedCategorValue,
          studentId: data.studentId || undefined,
          employeeId: data.employeeId || undefined,
          uploadDate: new Date().toISOString(),
          size: item.size,
          status: 'Active',
          tags: data.tags || ['bulk', 'ocr-indexing'],
          aiSummary: data.aiSummary,
          fileVersion: 1,
          qrData: `diu-archive://category/${data.category || selectedCategorValue}`,
          storageHash: Math.random().toString(16).substring(2, 42),
          hardCopyDetails: {
            cabinetNumber: data.hardCopyDetails?.cabinetNumber || 'CAB-H',
            shelfNumber: data.hardCopyDetails?.shelfNumber || 'Shelf 1',
            boxNumber: data.hardCopyDetails?.boxNumber || 'Box 50',
            fileSerial: data.hardCopyDetails?.fileSerial || `DIU-SRL-${Math.floor(1000 + Math.random() * 9000)}`,
            responsibleEmployee: customResponsible
          },
          textContent: item.simulatedText
        };

        setFiles(prev => [nextFile, ...prev]);
        setBulkQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100, feedback: `Classified: ${nextFile.category}` } : f));
        addLog('BULK_AUTO_REGISTER', `Bulk Upload & OCR parsed: ${nextFile.name}`);
      }

      notifyUser('Successfully finalized bulk registry queue!', 'success');
      triggerNotification('success', 'Bulk Pipeline Complete', `Indexed ${tempQueue.length} files successfully.`);
    } catch (e) {
      console.error(e);
      notifyUser('One or more items failed bulk OCR compilation.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const addSimulatedBulkFile = (idx: number) => {
    const templates = [
      {
        name: 'student_admission_tanvir_2025.pdf',
        size: '1.4 MB',
        text: 'DIU ADMISSION OFFICE REGISTRY.\nApplicant name: Tanvir Rahman\nStudent Phone: +8801555667788\nDepartment: CSE\nEnrollment Fee clearance verified.'
      },
      {
        name: 'faculty_research_grant_touhid.pdf',
        size: '2.1 MB',
        text: 'DIU CSE RESEARCH JOURNAL PROPOSAL.\nTitle: Deep Cloud VM compilation environments\nAuthor: Dr. Touhid Bhuiyan\nGrants: Springer 2026.'
      },
      {
        name: 'exam_board_syllabus_curriculum_eee.pdf',
        size: '890 KB',
        text: 'DIU EXAM CONTROLLER BOARD SYLLABUS.\nCurriculum Ref: EEE-402\nCourse Title: High voltage electronics arrays.\nSyllabus boards authorized and approved.'
      }
    ];

    const pick = templates[idx % templates.length];
    const fresh: BulkUploadedFile = {
      id: `bulk-${Date.now()}-${idx}`,
      name: `${pick.name.split('.')[0]}_${Math.floor(100 + Math.random() * 900)}.pdf`,
      size: pick.size,
      progress: 0,
      status: 'pending',
      simulatedText: pick.text
    };

    setBulkQueue(prev => [...prev, fresh]);
  };

  // Search API States
  const [semanticQuery, setSemanticQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string, reason: string, score: number }[]>([]);

  const handleSmartSearchQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;

    setIsSearchingAI(true);
    try {
      // Filter list of files belonging to their department if they are not Super Admin
      const visibleFiles = currentUser.role === 'Super Admin' 
        ? files 
        : files.filter(f => f.department === currentUser.departmentId);

      const res = await fetch('/api/gemini/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: semanticQuery,
          filesList: visibleFiles.map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            tags: f.tags,
            aiSummary: f.aiSummary,
            department: f.department
          }))
        })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const parsedResults = (data.results || []).map((r: any) => ({
        id: r.id,
        reason: r.relevanceReason,
        score: r.score
      }));
      
      setSearchResults(parsedResults);
      addLog('SEMANTIC_SEARCH', `Parsed database for query: "${semanticQuery}"`);
      notifyUser(`Smart search complete. Found ${parsedResults.length} index matches.`, 'success');

    } catch (err) {
      console.error(err);
      notifyUser('Smart semantic query triggered. Search services offline.', 'info');
    } finally {
      setIsSearchingAI(false);
    }
  };

  // Borrowing checkout form states
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [checkoutFileId, setCheckoutFileId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!borrowerName || !borrowerId || !checkoutFileId || !dueDate) {
      notifyUser('Please supply checkout record details.', 'error');
      return;
    }
    
    // Viewer lock
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Restricted: Viewers cannot authorize borrowings.', 'error');
      return;
    }

    const linkedFile = files.find(f => f.id === checkoutFileId);
    if (!linkedFile) {
      notifyUser('Specified physical copy document not found.', 'error');
      return;
    }

    if (linkedFile.status === 'Out') {
      notifyUser('This folder is already checked out by another employee.', 'error');
      return;
    }

    // Process checkout
    const freshCheckout: FileCheckout = {
      id: `chk-${Date.now()}`,
      fileId: checkoutFileId,
      fileName: linkedFile.name,
      department: linkedFile.department,
      borrowerName,
      borrowerId,
      takenDate: new Date().toISOString().split('T')[0],
      dueDate,
      returnedDate: null,
      status: 'Taken',
      authorizedBy: currentUser ? currentUser.fullName : 'Registrar staffer'
    };

    setCheckouts(prev => [freshCheckout, ...prev]);
    setFiles(prev => prev.map(f => f.id === linkedFile.id ? { ...f, status: 'Out' } : f));
    
    setBorrowerName('');
    setBorrowerId('');
    setCheckoutFileId('');
    setDueDate('');

    addLog('FILE_CHECKOUT', `Loaned copy "${linkedFile.name}" to borrower: ${borrowerId}`);
    notifyUser(`Successfully Loaned Physical Copy! Assigned to Box: ${linkedFile.hardCopyDetails.boxNumber}`, 'success');
  };

  const handleFileReturnSubmit = (chkId: string) => {
    // Viewer lock
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewers cannot verify returns.', 'error');
      return;
    }

    const linkedChk = checkouts.find(c => c.id === chkId);
    if (!linkedChk) return;

    setCheckouts(prev => prev.map(c => c.id === chkId ? { ...c, returnedDate: new Date().toISOString().split('T')[0], status: 'Returned' } : c));
    setFiles(prev => prev.map(f => f.id === linkedChk.fileId ? { ...f, status: 'Active' } : f));
    
    addLog('FILE_RETURNED', `Physical file copy returned: ${linkedChk.fileName}`);
    notifyUser('File returned! Logged and cabinet allocation index re-secured.', 'success');
  };

  // Session loader spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 antialiased">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Verifying Daffodil Active Directory credentials...</p>
      </div>
    );
  }

  // Identity Gate Rerouting
  if (!currentUser) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        notifyUser={notifyUser}
        theme={theme}
      />
    );
  }

  // Safe checks: Department Isolation locks for non Super-Admins
  const activeDeptId = currentUser.role === 'Super Admin' ? selectedDeptId : currentUser.departmentId;

  // Filter lists details
  const totalFilesCount = files.length;
  const activeLogsCount = files.filter(f => f.status === 'Active').length;
  const archivedCount = files.filter(f => f.status === 'Archived').length;
  const checkedOutCount = files.filter(f => f.status === 'Out').length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col antialiased transition-colors duration-300`}>
      
      {/* Upper DIU branded header banner */}
      <header className={`border-b ${theme === 'dark' ? 'bg-slate-900 border-sky-950/30' : 'bg-slate-900 border-slate-200'} text-white relative overflow-hidden shrink-0`}>
        {/* Daffodil Color Stripes */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-indigo-800" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-indigo-700 rounded-xl flex items-center justify-center border-2 border-emerald-400/30 shadow-md">
              <Folder className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-sky-300 bg-clip-text text-transparent">
                  DIU Smart Archive
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono rounded font-medium">RE-SECURED</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Centralized File & Registry Management Platform • Daffodil International University
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Quick theme toggler widget */}
            <button
              onClick={() => {
                const toggled = theme === 'light' ? 'dark' : 'light';
                setTheme(toggled);
                safeStorage.setItem('diu_theme', toggled);
              }}
              title={`Switch to ${theme === 'light' ? 'Cosmic Dark' : 'Bright Light'} Mode`}
              className="p-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-750 text-amber-400 hover:text-amber-300 rounded-xl transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 fill-amber-400" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Quick user role settings widget */}
            <div 
              onClick={() => setShowProfileModal(true)}
              className="bg-slate-800/80 hover:bg-slate-800 hover:border-indigo-505 border border-slate-705 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              title="Configure Personal Passport Security details"
            >
              <img 
                src={currentUser.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80'} 
                alt="Mini Profile Avatar" 
                className="w-7 h-7 rounded-lg object-cover border border-slate-700"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-100">{currentUser.fullName}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-mono font-medium">
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {currentUser.departmentId.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Secure Logout Toggle */}
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-455 border border-slate-700/80 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="Secure Logout from Passport Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Workspace Panel Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Navigations Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          
          <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} p-4 shadow-sm`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left px-2 mb-2">Core Navigation</p>
            <nav className="flex flex-col gap-1">
              {[
                { id: 'dashboard', label: 'Dashboard Center', icon: LayoutDashboard },
                { id: 'explorer', label: 'Department Archive', icon: Folder },
                { id: 'search', label: 'Smart Search AI', icon: Search },
                { id: 'movement', label: 'Folder Checkouts', icon: Clock },
                { id: 'qr-depot', label: 'Printed QR Badges', icon: QrCode },
                { id: 'logs', label: 'Audit Trail Logs', icon: FileCheck }
              ].map(item => {
                const IconComp = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSystemAlert(null);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                        : 'text-slate-500 hover:bg-slate-200/30'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ml-auto shrink-0 transition-all ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}

              {/* Secure Admin section tab */}
              {(currentUser.role === 'Super Admin' || currentUser.role === 'Department Admin') && (
                <button
                  onClick={() => {
                    setActiveTab('employee-mgmt');
                    setSystemAlert(null);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 mt-2.5 border-t border-slate-250 dark:border-slate-850 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                    activeTab === 'employee-mgmt' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-indigo-400 hover:bg-slate-200/30'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Access Control ID</span>
                  {employeesList.filter(e => e.status === 'Pending').length > 0 && (
                    <span className="w-2 h-2 rounded bg-amber-500 shrink-0 ml-auto animate-pulse" />
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Quick AI status helper */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex flex-col justify-between hidden lg:flex text-left">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                <span>DIU AI Integration</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                This Smart Sync platform evaluate cabinet mappings and generates OCR dockets back by our fullstack AI endpoints securely.
              </p>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-slate-800 text-xs text-slate-400 font-mono">
              <div className="flex justify-between py-1"><span>OCR Engine:</span><span className="text-emerald-400 font-bold">ONLINE</span></div>
              <div className="flex justify-between py-1"><span>Model:</span><span>Gemini 3.5</span></div>
              <div className="flex justify-between py-1"><span>SSO Status:</span><span className="text-indigo-400 font-bold">ACTIVE</span></div>
            </div>
          </div>

        </aside>

        {/* Dynamic Display Area */}
        <main className="flex-1 min-w-0">
          
          {/* Global Alert System Widget */}
          <AnimatePresence>
            {systemAlert && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-3 border shadow-sm text-left ${
                  systemAlert.type === 'error' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/35 dark:text-rose-400' 
                    : systemAlert.type === 'info'
                    ? 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/20 dark:border-sky-900/35 dark:text-sky-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/35 dark:text-emerald-400'
                }`}
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold leading-normal">{systemAlert.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VIEW 1: DASHBOARD CENTER */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Analytics Summary Header Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-2xl border p-4 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total File Units</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{totalFilesCount}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">100% cataloged</p>
                </div>

                <div className={`rounded-2xl border p-4 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Soft Copies</span>
                  <p className="text-2xl font-black text-indigo-500 mt-1">
                    {files.filter(f => f.type !== 'Physical Only').length}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-1">Digitized attachments</p>
                </div>

                <div className={`rounded-2xl border p-4 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Out to Borrowers</span>
                  <p className="text-2xl font-black text-amber-500 mt-1">{checkedOutCount}</p>
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">Physical loans</p>
                </div>

                <div className={`rounded-2xl border p-4 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Archived Offsite</span>
                  <p className="text-2xl font-black mt-1">{archivedCount}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Secured permanent</p>
                </div>
              </div>

              {/* Department Workspaces isolator control display */}
              <div className={`border rounded-2xl p-5 shadow-sm space-y-4 text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold">DIU Department Workspaces</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentUser.role === 'Super Admin' 
                        ? 'Select any secure office file index below.' 
                        : `Your access is locked exclusively to ${DEPARTMENTS.find(d => d.id === currentUser.departmentId)?.name} directory.`}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">7 Registered Offices</span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DEPARTMENTS.map(dept => {
                    const DeptIcon = getDepartmentIcon(dept.id);
                    const count = files.filter(f => f.department === dept.id).length;
                    
                    // Enforce department lockdowns
                    const isLocked = currentUser.role !== 'Super Admin' && currentUser.departmentId !== dept.id;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => {
                          if (isLocked) {
                            notifyUser(`Access Restricted: Your portal is lock with ${currentUser.departmentId.toUpperCase()} only.`, 'error');
                            return;
                          }
                          setSelectedDeptId(dept.id);
                          const firstCat = categories.find(c => c.departmentId === dept.id);
                          if (firstCat) setSelectedCategoryValue(firstCat.name);
                          setActiveTab('explorer');
                        }}
                        className={`group border rounded-xl p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                          isLocked 
                            ? 'opacity-60 border-slate-200 dark:border-slate-850 cursor-not-allowed bg-slate-50/10' 
                            : 'border-slate-200 dark:border-slate-850 hover:border-emerald-300 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`p-1.5 rounded-lg transition-colors ${
                              isLocked ? 'bg-slate-200/50 text-slate-450' : 'bg-slate-100 dark:bg-slate-800 text-slate-705 group-hover:bg-emerald-500/15 group-hover:text-emerald-500'
                            }`}>
                              {isLocked ? <Lock className="w-4 h-4" /> : <DeptIcon className="w-4 h-4" />}
                            </div>
                            <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-400 rounded">
                              {isLocked ? 'Locked' : `${count} File${count !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          
                          <h4 className={`text-xs font-bold transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-500'}`}>
                            {dept.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 select-none leading-relaxed line-clamp-2">
                            {dept.desc}
                          </p>
                        </div>

                        {!isLocked && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all mt-4">
                            <span>Open Cabinet Portfolio</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DEPARTMENT ARCHIVE (EXPLORER) */}
          {activeTab === 'explorer' && (
            <div className="space-y-6 text-left">
              
              {/* Folder explorer header */}
              <div className={`border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Folder className="w-5 h-5 text-emerald-500" />
                    <span>{DEPARTMENTS.find(d => d.id === activeDeptId)?.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cabinet folder indices filtered exclusively for physical audit operations.</p>
                </div>
                
                {/* Add Category Trigger */}
                {currentUser?.role !== 'Viewer' ? (
                  <button 
                    onClick={() => setShowAddCatModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/5 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Category</span>
                  </button>
                ) : (
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/25 font-bold font-mono">
                    Viewer Mode: Creation Restricted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Category selectors Left Column */}
                <div className="lg:col-span-4 space-y-3">
                  <div className={`rounded-2xl border p-4 shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100/10 pb-1.5 font-mono">Catalog Folders</p>
                    <div className="space-y-1 max-h-[350px] overflow-y-auto">
                      {categories.filter(c => c.departmentId === activeDeptId).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryValue(cat.name)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            selectedCategorValue === cat.name 
                              ? 'bg-slate-100 dark:bg-slate-950 text-emerald-500 border border-emerald-500/20' 
                              : 'text-slate-400 hover:bg-slate-100/30'
                          }`}
                        >
                          <span className="truncate max-w-[160px]">{cat.name}</span>
                          <span className="px-1.5 bg-slate-200 dark:bg-slate-800 text-[9px] font-mono rounded-md font-bold">
                            {files.filter(f => f.department === activeDeptId && f.category === cat.name).length}
                          </span>
                        </button>
                      ))}

                      {categories.filter(c => c.departmentId === activeDeptId).length === 0 && (
                        <p className="text-xs text-slate-500 italic py-4">No active categories. Create one above.</p>
                      )}
                    </div>
                  </div>

                  {/* Attachment Scanning Registry Form (Single) */}
                  {currentUser?.role !== 'Viewer' && (
                    <div className={`rounded-2xl border p-4 shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} text-left space-y-3`}>
                      <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">AI Scanners Registry</p>
                        
                        {/* Preset templates selector */}
                        <select
                          value={selectedUploadTemplate !== null ? selectedUploadTemplate : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setSelectedUploadTemplate(null);
                              setCustomUploadName('');
                              setCustomUploadText('');
                            } else {
                              const num = parseInt(val);
                              setSelectedUploadTemplate(num);
                              setCustomUploadName(TEST_DOCUMENT_TEMPLATES[num].name);
                              setCustomUploadText(TEST_DOCUMENT_TEMPLATES[num].textContent);
                            }
                          }}
                          className="text-[10px] border border-slate-200 dark:border-slate-850 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-550 outline-none"
                        >
                          <option value="">Load DIU Template</option>
                          {TEST_DOCUMENT_TEMPLATES.map((t, i) => (
                            <option key={i} value={i}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Attachment Ref Name (e.g. thesis.pdf)"
                          value={customUploadName}
                          onChange={(e) => setCustomUploadName(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-1.5 outline-none text-slate-400"
                        />
                        
                        <textarea
                          required
                          rows={4}
                          placeholder="OCR Extracted raw text transcripts..."
                          value={customUploadText}
                          onChange={(e) => setCustomUploadText(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-1.5 outline-none text-slate-400"
                        />
                      </div>

                      {/* Display loading progress if active */}
                      {uploadProgress !== null && (
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 animate-pulse" style={{ width: `${Math.min(100, uploadProgress)}%` }} />
                        </div>
                      )}

                      <button
                        onClick={handleAIScanAnalysis}
                        disabled={uploadProgress !== null}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 border-sky-950 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        {uploadProgress !== null ? 'AI Categorizing...' : 'Trigger AI Registration Scan'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Files index list Right Column */}
                <div className="lg:col-span-8 space-y-4">
                  <div className={`rounded-2xl border p-5 shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} min-h-[400px]`}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono select-none">
                      📂 File Cataloging: {selectedCategorValue}
                    </p>

                    <div className="space-y-4">
                      {files.filter(f => f.department === activeDeptId && f.category === selectedCategorValue).map(file => (
                        <div 
                          key={file.id}
                          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'} flex flex-col md:flex-row justify-between gap-4`}
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase tracking-wider">
                                {file.type}
                              </span>
                              <h4 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-150">{file.name}</h4>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-normal">{file.aiSummary || 'Document indexed.'}</p>
                            
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-slate-500 pt-1">
                              {file.studentId && <span>Student ID: <span className="font-bold text-slate-400">{file.studentId}</span></span>}
                              {file.employeeId && <span>Employee ID: <span className="font-bold text-slate-400">{file.employeeId}</span></span>}
                              <span>Cabinet: <span className="font-bold text-indigo-400">{file.hardCopyDetails.cabinetNumber}</span> • Box: <span className="font-bold text-indigo-400">{file.hardCopyDetails.boxNumber}</span> • Serial: <span className="font-bold text-emerald-500">{file.hardCopyDetails.fileSerial}</span></span>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 shrink-0">
                            {/* QR badge printing renderer */}
                            <QRCodeView value={file.qrData} size={90} />
                            
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase inline-block ${
                              file.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : file.status === 'Out'
                                ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {file.status === 'Active' ? 'Cabinet Secured' : 'Checked Out'}
                            </span>
                          </div>

                        </div>
                      ))}

                      {files.filter(f => f.department === activeDeptId && f.category === selectedCategorValue).length === 0 && (
                        <div className="p-12 text-center text-slate-500 italic">
                          No document index registries have been cataloged in this folder yet. Use templates or scans to index item.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 3: SMART SEMANTIC SEARCH (GEMINI) */}
          {activeTab === 'search' && (
            <div className={`border rounded-2xl p-6 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} space-y-6`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>AI Semantic Query Explorer</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Avoid literal matching limitations. Query natural terms (e.g. searching "remuneration" or "allowances" will map correctly to "Faculty Salary Files").
                </p>
              </div>

              <form onSubmit={handleSmartSearchQuery} className="flex gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Ask and seek (e.g. 'find student transcript clearances or semester question sheets')"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 outline-none"
                />
                
                <button
                  type="submit"
                  disabled={isSearchingAI}
                  className="px-5 py-3 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                >
                  {isSearchingAI ? 'Ranking...' : 'Rank Indices'}
                </button>
              </form>

              {/* Display Search results */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none">Ranked query matches</p>
                
                {searchResults.map(res => {
                  const matchedFile = files.find(f => f.id === res.id);
                  if (!matchedFile) return null;

                  return (
                    <div 
                      key={res.id}
                      className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'} text-xs space-y-1`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 px-1.5 py-0.2 rounded-md">
                            {matchedFile.category}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{matchedFile.name}</h4>
                        </div>
                        
                        <span className="font-mono text-emerald-500 text-xs font-black">
                          {res.score}% Match
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-550 italic mt-1 font-semibold leading-normal">
                        🔍 Reason: {res.reason}
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans leading-normal pt-0.5">
                        {matchedFile.aiSummary}
                      </p>
                    </div>
                  );
                })}

                {searchResults.length === 0 && (
                  <div className="p-8 text-center text-slate-500 italic">
                    Type a query or trigger ranking maps above. Only files on your permitted departments can be indexed.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW 4: CREDIT AND CHECKOUT LOANS (MOVEMENT) */}
          {activeTab === 'movement' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start animate-fadeIn">
              
              {/* Checkout loan register Left Column */}
              <div className={`lg:col-span-5 rounded-2xl border p-5 shadow-sm space-y-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <span>Physical Loan Registry</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Lend copy of safe chests files to verified staff. This replaces checkout ledgers on cabinets.</p>
                </div>

                {currentUser?.role !== 'Viewer' ? (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 font-semibold text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Target file document selection</label>
                      <select
                        required
                        value={checkoutFileId}
                        onChange={(e) => setCheckoutFileId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none text-slate-400"
                      >
                        <option value="">Select Cabinet File</option>
                        {files.filter(f => f.status === 'Active' && (currentUser.role === 'Super Admin' || f.department === currentUser.departmentId)).map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.hardCopyDetails.fileSerial})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Recipient Employee Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Md. Shofiqul Islam"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Borrower Employee ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DIU-OFF-519"
                        value={borrowerId}
                        onChange={(e) => setBorrowerId(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Scheduled Due Date</label>
                      <input
                        type="date"
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Authorize Cabinet Loan Slip
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-amber-500/5 text-amber-500 border border-amber-500/10 rounded-xl text-xs space-y-2 select-none">
                    <p className="font-bold flex items-center gap-1.5 uppercase font-mono text-[9px]">
                      <Lock className="w-4 h-4" />
                      <span>Viewer Access Confined</span>
                    </p>
                    <p className="text-slate-550 leading-relaxed">
                      Borrowing transaction authorizations are limited to administrative dockets and verified registrars.
                    </p>
                  </div>
                )}
              </div>

              {/* Active checkouts list Right Column */}
              <div className={`lg:col-span-7 rounded-2xl border p-5 shadow-sm space-y-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono select-none border-b border-slate-100/10 pb-1.5">
                  📁 Checked out loan ledgers
                </p>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
                  {checkouts.filter(c => currentUser.role === 'Super Admin' || c.department === currentUser.departmentId).map(chk => (
                    <div 
                      key={chk.id}
                      className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-105'} text-xs space-y-2 text-left`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase tracking-wider ${
                            chk.status === 'Returned' 
                              ? 'bg-slate-350/15 text-slate-400' 
                              : 'bg-amber-500/15 text-amber-600 animate-pulse'
                          }`}>
                            {chk.status}
                          </span>
                          <h4 className="font-bold text-[13px] text-slate-900 dark:text-slate-100">{chk.fileName}</h4>
                        </div>
                        
                        {chk.returnedDate === null ? (
                          <button
                            onClick={() => handleFileReturnSubmit(chk.id)}
                            className="px-2.5 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-600 hover:text-white rounded font-bold transition-all text-[10px] cursor-pointer"
                          >
                            Verify Return Secure
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">Ret: {chk.returnedDate}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-semibold text-[10px] text-slate-500 border-t border-slate-100/10 pt-2 leading-relaxed">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase font-mono">Borrower</p>
                          <p className="text-slate-300">{chk.borrowerName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase font-mono">Employee ID</p>
                          <p className="text-slate-300 font-mono">{chk.borrowerId}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase font-mono">Out Date</p>
                          <p className="text-slate-450 font-mono">{chk.takenDate}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase font-mono">Due Date</p>
                          <p className={`font-mono font-black ${chk.status === 'Taken' ? 'text-amber-500' : 'text-slate-300'}`}>{chk.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {checkouts.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic">No historical loan slip registries found.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW 5: SECURITY QR CODE BINDINGS DEPOT (QR-DEPOT) */}
          {activeTab === 'qr-depot' && (
            <div className={`border rounded-2xl p-6 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} space-y-6 animate-fadeIn`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-1.5">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                  <span>Interactive High-Resolution QR depot</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bind these QR codes directly with physical archive folders and locker drawers. Scanning redirects instantly to the document portfolio directory.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categories.filter(c => currentUser.role === 'Super Admin' || c.departmentId === currentUser.departmentId).map(cat => (
                  <div 
                    key={cat.id}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-between text-center gap-2.5 hover:shadow-md transition-all ${
                      theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <QRCodeView value={`diu-archive://category/${cat.name}`} size={105} />
                    
                    <div>
                      <h4 className="font-extrabold text-[11px] truncate max-w-[120px]" title={cat.name}>
                        {cat.name}
                      </h4>
                      <p className="text-[9px] text-indigo-400 font-bold uppercase mt-0.5">{cat.departmentId}</p>
                    </div>

                    <button
                      onClick={() => {
                        notifyUser(`Printing QR envelope badge layout for category folder: ${cat.name}`, 'success');
                        window.print();
                      }}
                      className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:opacity-95 text-slate-400 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-semibold cursor-pointer select-none"
                    >
                      Print Envelope Key
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 6: GENERAL AUDIT LOGS TRAIL (LOGS) */}
          {activeTab === 'logs' && (
            <div className={`border rounded-2xl p-6 shadow-sm text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} space-y-4`}>
              <div className="flex border-b border-slate-100/10 pb-3 justify-between items-center text-xs select-none border-b text-slate-500">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Historical Logs activity lists</span>
                <span className="font-mono text-emerald-500">Secured with Active Session Tokens</span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {activityLogs.map(log => (
                  <div 
                    key={log.id}
                    className={`p-3 rounded-lg border flex justify-between gap-4 text-xs ${
                      theme === 'dark' ? 'bg-slate-950/40 border-slate-855' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="space-y-1 text-left">
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-emerald-500/10 border border-emerald-500/15 text-emerald-450 font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{log.details}</p>
                      <p className="text-[10px] text-slate-500">
                        Authorized: <span className="font-bold text-indigo-400">{log.user}</span> ({log.role})
                      </p>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 7: COMPREHENSIVE ACCESS DIRECTORY ADMIN (EMPLOYEE-MGMT) */}
          {activeTab === 'employee-mgmt' && (
            <AdminPanel
              currentUser={currentUser}
              employees={employeesList}
              logs={adminLogs}
              onUpdateStatus={handleUpdateStatus}
              onUpdateRole={handleUpdateRole}
              onRefresh={fetchAdminDirectory}
              loading={loadingAdmin}
              theme={theme}
            />
          )}

        </main>
      </div>

      {/* MODAL 1: ADD CATEGORIES FORM DRAWERS */}
      <AnimatePresence>
        {showAddCatModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl p-6 shadow-xl text-left`}
            >
              <div className="flex justify-between items-center border-b border-slate-100/10 pb-3">
                <h3 className="font-bold text-sm uppercase">Add Physical Archive Folder</h3>
                <button 
                  onClick={() => setShowAddCatModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs font-semibold pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Interactive Folder Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clearance Audits"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Brief Purpose Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide description of cabinet items..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-transform"
                >
                  Create Category Directory
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: USER PROFILE & CONFIG DETAILS (PROFILE-MODAL) */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            currentUser={currentUser}
            onClose={() => setShowProfileModal(false)}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              fetchAdminDirectory();
            }}
            notifyUser={notifyUser}
            authToken={authToken!}
            theme={theme}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
