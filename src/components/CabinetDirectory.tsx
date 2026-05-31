import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  Plus,
  QrCode,
  Search,
  Grid,
  List,
  ChevronRight,
  Eye,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  Lock,
  Layers,
  Inbox,
  Clock,
  ArrowLeft,
  Smartphone,
  CheckCircle,
  FileText,
  User,
  Activity,
  UserCheck,
  Building,
  Settings,
  HelpCircle,
  TrendingUp,
  Download,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { Cabinet, Shelf, Box, UniversityFile, FileCheckout } from '../types.js';
import { DEPARTMENTS } from '../data.js';
import QRCode from 'qrcode';

// Reusable QRCode QR Component matching DocumentSystem
function QRCodeView({ value, size = 110, label = 'Security Node' }: { value: string; size?: number; label?: string }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size })
      .then(url => setDataUrl(url))
      .catch(err => console.error(err));
  }, [value, size]);
  
  return dataUrl ? (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm inline-block shrink-0">
      <img src={dataUrl} alt="Archive QR Code" className="w-[100px] h-[100px] object-contain select-none" />
      <span className="text-[8px] font-mono text-slate-500 mt-1 truncate max-w-[100px]">{label}</span>
    </div>
  ) : (
    <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 shrink-0" style={{ width: size, height: size }} />
  );
}

const STORAGE_KEY = 'diu_physical_cabinets';
const SHELF_CAPACITY_LIMIT = 15;

// Initial fallback database of Cabinets matched to seeded files
const INITIAL_CABINETS: Cabinet[] = [
  {
    id: 'cab-01',
    name: 'Registrar Student Records Chest',
    code: 'CAB-A',
    departmentId: 'registrar',
    description: 'Central fireproof vault containing administrative student identities, grade clearances, and ledger archives.',
    shelfCount: 5,
    status: 'Active',
    createdBy: 'Fahmida Chowdhury',
    createdAt: '2026-04-01T08:00:00Z',
    responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff',
    cabinetType: 'Fireproof Safe',
    accessLevel: 'Staff-Only',
    color: 'emerald',
    lastUpdated: '2026-05-22T10:30:00Z',
    shelves: [
      {
        id: 'shelf-01-1',
        cabinetId: 'cab-01',
        name: 'Shelf 1',
        boxes: [
          { id: 'box-01-1-1', shelfId: 'shelf-01-1', name: 'Box 10' },
          { id: 'box-01-1-2', shelfId: 'shelf-01-1', name: 'Box 11' }
        ]
      },
      {
        id: 'shelf-01-2',
        cabinetId: 'cab-01',
        name: 'Shelf 2',
        boxes: [
          { id: 'box-01-2-1', shelfId: 'shelf-01-2', name: 'Box 12' },
          { id: 'box-01-2-2', shelfId: 'shelf-01-2', name: 'Box 13' }
        ]
      },
      {
        id: 'shelf-01-3',
        cabinetId: 'cab-01',
        name: 'Shelf 3',
        boxes: [
          { id: 'box-01-3-1', shelfId: 'shelf-01-3', name: 'Box 14' }
        ]
      },
      {
        id: 'shelf-01-4',
        cabinetId: 'cab-01',
        name: 'Shelf 4',
        boxes: [
          { id: 'box-01-4-1', shelfId: 'shelf-01-4', name: 'Box 15' }
        ]
      },
      {
        id: 'shelf-01-5',
        cabinetId: 'cab-01',
        name: 'Shelf 5',
        boxes: [
          { id: 'box-01-5-1', shelfId: 'shelf-01-5', name: 'Box 16' }
        ]
      }
    ]
  },
  {
    id: 'cab-02',
    name: 'Graduation & Clearance Archive',
    code: 'CAB-B',
    departmentId: 'registrar',
    description: 'Filing drawers with active graduation credential certifications, physical diploma transcripts, and library clearance registers.',
    shelfCount: 4,
    status: 'Active',
    createdBy: 'Fahmida Chowdhury',
    createdAt: '2026-04-05T09:15:00Z',
    responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff',
    cabinetType: 'Steel Drawer',
    accessLevel: 'Confidential',
    color: 'teal',
    lastUpdated: '2026-05-22T11:45:00Z',
    shelves: [
      {
        id: 'shelf-02-1',
        cabinetId: 'cab-02',
        name: 'Shelf 1',
        boxes: [{ id: 'box-02-1-1', shelfId: 'shelf-02-1', name: 'Box 20' }]
      },
      {
        id: 'shelf-02-2',
        cabinetId: 'cab-02',
        name: 'Shelf 2',
        boxes: [{ id: 'box-02-2-1', shelfId: 'shelf-02-2', name: 'Box 21' }]
      },
      {
        id: 'shelf-02-3',
        cabinetId: 'cab-02',
        name: 'Shelf 3',
        boxes: [{ id: 'box-02-3-1', shelfId: 'shelf-02-3', name: 'Box 22' }]
      },
      {
        id: 'shelf-02-4',
        cabinetId: 'cab-02',
        name: 'Shelf 4',
        boxes: [{ id: 'box-02-4-1', shelfId: 'shelf-02-4', name: 'Box 23' }]
      }
    ]
  },
  {
    id: 'cab-03',
    name: 'HR Employee Ledger Safe',
    code: 'CAB-C',
    departmentId: 'hr',
    description: 'Combination wall vault containing original employment agreements, tenure clearances, salary structures, and audit reports.',
    shelfCount: 4,
    status: 'Active',
    createdBy: 'Tanveer Hasan',
    createdAt: '2026-04-10T11:00:00Z',
    responsibleEmployee: 'Tanveer Hasan / HR Officer',
    cabinetType: 'Electronic Combination Vault',
    accessLevel: 'Restricted-Admin',
    color: 'violet',
    lastUpdated: '2026-05-22T14:22:00Z',
    shelves: [
      {
        id: 'shelf-03-1',
        cabinetId: 'cab-03',
        name: 'Shelf 1',
        boxes: [{ id: 'box-03-1-1', shelfId: 'shelf-03-1', name: 'Box 30' }]
      },
      {
        id: 'shelf-03-2',
        cabinetId: 'cab-03',
        name: 'Shelf 2',
        boxes: [{ id: 'box-03-2-1', shelfId: 'shelf-03-2', name: 'Box 31' }]
      },
      {
        id: 'shelf-03-3',
        cabinetId: 'cab-03',
        name: 'Shelf 3',
        boxes: [{ id: 'box-03-3-1', shelfId: 'shelf-03-3', name: 'Box 15' }]
      },
      {
        id: 'shelf-03-4',
        cabinetId: 'cab-03',
        name: 'Shelf 4',
        boxes: [{ id: 'box-03-4-1', shelfId: 'shelf-03-4', name: 'Box 32' }]
      }
    ]
  },
  {
    id: 'cab-04',
    name: 'Admissions Enrollment Locker',
    code: 'CAB-D',
    departmentId: 'admission',
    description: 'Rotating steel carousel for batch applicant dossiers, high school grade equivalence validations, and intake logs.',
    shelfCount: 3,
    status: 'Full',
    createdBy: 'Dilara Yasmin',
    createdAt: '2026-04-12T14:20:00Z',
    responsibleEmployee: 'Dilara Yasmin / Admission Lead',
    cabinetType: 'Steel Carousel',
    accessLevel: 'Public-Viewable',
    color: 'indigo',
    lastUpdated: '2026-05-15T09:00:00Z',
    shelves: [
      {
        id: 'shelf-04-1',
        cabinetId: 'cab-04',
        name: 'Shelf 1',
        boxes: [{ id: 'box-04-1-1', shelfId: 'shelf-04-1', name: 'Box A1' }]
      },
      {
        id: 'shelf-04-2',
        cabinetId: 'cab-04',
        name: 'Shelf 2',
        boxes: [{ id: 'box-04-2-1', shelfId: 'shelf-04-2', name: 'Box A2' }]
      },
      {
        id: 'shelf-04-3',
        cabinetId: 'cab-04',
        name: 'Shelf 3',
        boxes: [{ id: 'box-04-3-1', shelfId: 'shelf-04-3', name: 'Box A3' }]
      }
    ]
  },
  {
    id: 'cab-05',
    name: 'Exam Scripts Vault',
    code: 'CAB-E',
    departmentId: 'exam',
    description: 'Double-locked security room cabinet holding mid-semester script duplicates, final exam question benches, and vetted sheets.',
    shelfCount: 3,
    status: 'Restricted',
    createdBy: 'Dr. Imran Mahmud',
    createdAt: '2026-04-15T15:00:00Z',
    responsibleEmployee: 'Dr. Imran Mahmud / CSE Controller',
    cabinetType: 'Reinforced Dual-Lock Cabinet',
    accessLevel: 'Confidential',
    color: 'rose',
    lastUpdated: '2026-05-22T09:00:00Z',
    shelves: [
      {
        id: 'shelf-05-1',
        cabinetId: 'cab-05',
        name: 'Shelf 1',
        boxes: [
          { id: 'box-05-1-1', shelfId: 'shelf-05-1', name: 'Box 41' },
          { id: 'box-05-1-2', shelfId: 'shelf-05-1', name: 'Box 42' }
        ]
      },
      {
        id: 'shelf-05-2',
        cabinetId: 'cab-05',
        name: 'Shelf 2',
        boxes: [
          { id: 'box-05-2-1', shelfId: 'shelf-05-2', name: 'Box 43' },
          { id: 'box-05-2-2', shelfId: 'shelf-05-2', name: 'Box 44' }
        ]
      },
      {
        id: 'shelf-05-3',
        cabinetId: 'cab-05',
        name: 'Shelf 3',
        boxes: [
          { id: 'box-05-3-1', shelfId: 'shelf-05-3', name: 'Box 45' }
        ]
      }
    ]
  }
];

interface CabinetDirectoryProps {
  files: UniversityFile[];
  setFiles: React.Dispatch<React.SetStateAction<UniversityFile[]>>;
  currentUser: any;
  addLog: (action: string, details: string) => void;
  notifyUser: (msg: string, type?: 'success' | 'error' | 'info') => void;
  checkouts: FileCheckout[];
  setCheckouts: React.Dispatch<React.SetStateAction<FileCheckout[]>>;
  theme: 'light' | 'dark';
}

export function CabinetDirectory({
  files,
  setFiles,
  currentUser,
  addLog,
  notifyUser,
  checkouts,
  setCheckouts,
  theme
}: CabinetDirectoryProps) {
  // --- STATE ---
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return INITIAL_CABINETS;
      }
    }
    return INITIAL_CABINETS;
  });

  // Save Cabinets
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cabinets));
  }, [cabinets]);

  // View settings
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accessFilter, setAccessFilter] = useState('All');

  // Selected cabinet for deep visual dashboard
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(null);

  // Active shelf & box selected inside the dashboard
  const [activeShelfId, setActiveShelfId] = useState<string | null>(null);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDept, setFormDept] = useState('registrar');
  const [formShelves, setFormShelves] = useState(4);
  const [formDesc, setFormDesc] = useState('');
  const [formEmployee, setFormEmployee] = useState('');
  const [formType, setFormType] = useState('Fireproof Safe');
  const [formAccess, setFormAccess] = useState<'Restricted-Admin' | 'Staff-Only' | 'Public-Viewable' | 'Confidential'>('Staff-Only');
  const [formColor, setFormColor] = useState('emerald');

  // Quick scan camera simulation
  const [simulatedScanCode, setSimulatedScanCode] = useState<string | null>(null);

  // Interactive Drag State
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);

  // Search filter query inside a single cabinet dashboard
  const [innerFileQuery, setInnerFileQuery] = useState('');

  // Sorting state for files inside active drawer
  const [drawerFileSort, setDrawerFileSort] = useState<'name' | 'serial'>('name');

  // Manual box/shelf creation triggers
  const [showAddShelfInput, setShowAddShelfInput] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [showAddBoxInput, setShowAddBoxInput] = useState<string | null>(null); // shelfId
  const [newBoxName, setNewBoxName] = useState('');

  // File lending/checkout modal triggered inside cabinet
  const [selectedLendFile, setSelectedLendFile] = useState<UniversityFile | null>(null);
  const [lendBorrowerName, setLendBorrowerName] = useState('');
  const [lendBorrowerId, setLendBorrowerId] = useState('');
  const [lendDueDate, setLendDueDate] = useState('');

  // Active cabinet object
  const activeCabinet = cabinets.find(c => c.id === selectedCabinetId);

  // Auto-set form values
  useEffect(() => {
    if (showCreateModal) {
      const codePart = Math.floor(100 + Math.random() * 900);
      setFormCode(`${formDept.toUpperCase()}-CAB-${codePart}`);
      setFormEmployee(currentUser?.fullName || 'Registry Administrator');
      
      // select color label based on department
      const deptItem = DEPARTMENTS.find(d => d.id === formDept);
      setFormColor(deptItem?.color || 'emerald');
    }
  }, [showCreateModal, formDept]);

  // Access check
  const hasEditAccess = (cabinet: Cabinet) => {
    if (currentUser?.role === 'Super Admin') return true;
    if (currentUser?.role === 'Department Admin' && currentUser?.departmentId === cabinet.departmentId) return true;
    return false;
  };

  const handlesOpenCabinet = (cab: Cabinet) => {
    // Check viewer or access constraints
    if (currentUser?.role === 'Viewer' && cab.accessLevel === 'Confidential' && currentUser?.departmentId !== cab.departmentId) {
      notifyUser(`Access Restricted: "${cab.name}" contains Grade-Confidential archives. You do not hold view permissions.`, 'error');
      return;
    }
    setSelectedCabinetId(cab.id);
    setActiveShelfId(cab.shelves[0]?.id || null);
    setActiveBoxId(cab.shelves[0]?.boxes[0]?.id || null);
    setInnerFileQuery('');
  };

  // Create Cabinet handler
  const handleCreateCabinetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewers are unauthorized from creating storage units.', 'error');
      return;
    }

    if (!formName || !formCode) {
      notifyUser('Cabinet name and storage code keys cannot be empty.', 'error');
      return;
    }

    const isCodeDup = cabinets.some(c => c.code.toUpperCase() === formCode.toUpperCase());
    if (isCodeDup) {
      notifyUser(`Error: Cabinet Code "${formCode.toUpperCase()}" is already assigned inside another node registry.`, 'error');
      return;
    }

    const shelvesArray: Shelf[] = [];
    const cabId = `cab-${Date.now()}`;
    for (let i = 1; i <= formShelves; i++) {
      const shelfId = `${cabId}-shelf-${i}`;
      shelvesArray.push({
        id: shelfId,
        cabinetId: cabId,
        name: `Shelf ${i}`,
        boxes: [
          { id: `${shelfId}-box-1`, shelfId: shelfId, name: 'Box 1' },
          { id: `${shelfId}-box-2`, shelfId: shelfId, name: 'Box 2' }
        ]
      });
    }

    const newCabinet: Cabinet = {
      id: cabId,
      name: formName,
      code: formCode.toUpperCase(),
      departmentId: formDept,
      description: formDesc || 'Secure modular cabinet unit compiled on Active Directory.',
      shelfCount: formShelves,
      status: 'Active',
      createdBy: currentUser?.fullName || 'DIU Staff',
      createdAt: new Date().toISOString(),
      responsibleEmployee: formEmployee || currentUser?.fullName || 'DIU Officer',
      cabinetType: formType,
      accessLevel: formAccess,
      color: formColor,
      shelves: shelvesArray,
      lastUpdated: new Date().toISOString()
    };

    setCabinets(prev => [newCabinet, ...prev]);
    addLog('CABINET_CREATED', `Provisioned physical cabinet storage module: ${newCabinet.name} (${newCabinet.code})`);
    notifyUser(`Successfully added Cabinet Folder Card "${newCabinet.name}"!`, 'success');
    setShowCreateModal(false);
    
    // reset
    setFormName('');
    setFormDesc('');
  };

  // Delete storage directory
  const handleDeleteCabinet = (cab: Cabinet, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.role !== 'Super Admin') {
      notifyUser('System Lockdown: Super Administrative clearances are mandatory to wipe cabinets.', 'error');
      return;
    }

    const subFiles = files.filter(f => f.hardCopyDetails?.cabinetNumber === cab.code).length;
    if (subFiles > 0) {
      notifyUser(`Action Blocked: Cannot wipe storage folder. ${subFiles} files are physically registered inside (${cab.code}). Move files first.`, 'error');
      return;
    }

    if (confirm(`Are you absolutely sure you want to permanently decommission Cabinet: ${cab.name} (${cab.code})? This will dissolve all physical shelf/box metadata.`)) {
      setCabinets(prev => prev.filter(c => c.id !== cab.id));
      addLog('CABINET_DECOMMISSIONED', `Purged cabinet layout index: ${cab.name} (${cab.code})`);
      notifyUser(`Cabinet directory "${cab.name}" dissolved.`, 'success');
    }
  };

  // Add Custom Shelf to active cabinet
  const handleAddShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCabinet || !newShelfName) return;

    if (!hasEditAccess(activeCabinet)) {
      notifyUser('Access Blocked: You do not carry permissions to customize this department chest.', 'error');
      return;
    }

    const isDup = activeCabinet.shelves.some(s => s.name.toLowerCase() === newShelfName.toLowerCase());
    if (isDup) {
      notifyUser(`Folder structure collision: "${newShelfName}" is already defined.`, 'error');
      return;
    }

    const shelfId = `${activeCabinet.id}-shelf-${Date.now()}`;
    const freshShelf: Shelf = {
      id: shelfId,
      cabinetId: activeCabinet.id,
      name: newShelfName,
      boxes: [{ id: `${shelfId}-box-1`, shelfId: shelfId, name: 'Box 1' }]
    };

    const updatedShelves = [...activeCabinet.shelves, freshShelf];
    const updatedCab: Cabinet = {
      ...activeCabinet,
      shelves: updatedShelves,
      shelfCount: updatedShelves.length,
      lastUpdated: new Date().toISOString()
    };

    setCabinets(prev => prev.map(c => c.id === activeCabinet.id ? updatedCab : c));
    setNewShelfName('');
    setShowAddShelfInput(false);
    setActiveShelfId(shelfId);
    setActiveBoxId(`${shelfId}-box-1`);

    addLog('CABINET_SHELF_ADDED', `Welded physical layout shelf "${newShelfName}" in cabinet "${activeCabinet.code}"`);
    notifyUser(`Shelf "${newShelfName}" successfully built!`, 'success');
  };

  // Add Custom Box to Shelf
  const handleAddBox = (shelfId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCabinet || !newBoxName) return;

    if (!hasEditAccess(activeCabinet)) {
      notifyUser('Unauthorized modifications restricted.', 'error');
      return;
    }

    const updatedShelves = activeCabinet.shelves.map(s => {
      if (s.id !== shelfId) return s;
      const isDup = s.boxes.some(b => b.name.toLowerCase() === newBoxName.toLowerCase());
      if (isDup) {
        notifyUser(`Box collision: "${newBoxName}" already exists on this shelf.`, 'error');
        return s;
      }
      return {
        ...s,
        boxes: [...s.boxes, { id: `${s.id}-box-${Date.now()}`, shelfId: s.id, name: newBoxName }]
      };
    });

    const updatedCab: Cabinet = {
      ...activeCabinet,
      shelves: updatedShelves,
      lastUpdated: new Date().toISOString()
    };

    setCabinets(prev => prev.map(c => c.id === activeCabinet.id ? updatedCab : c));
    setNewBoxName('');
    setShowAddBoxInput(null);
    notifyUser(`Physical filing container "${newBoxName}" secured!`, 'success');
  };

  // Drag-and-Drop Simulated shelf re-assignment
  const handleDragStart = (fileId: string) => {
    setDraggingFileId(fileId);
  };

  const handleDropOnFileTargetBox = (shelfName: string, boxName: string) => {
    if (!draggingFileId || !activeCabinet) return;

    if (!hasEditAccess(activeCabinet)) {
      notifyUser('Access Blocked: You do not possess clearance to move folders inside this vault.', 'error');
      setDraggingFileId(null);
      return;
    }

    const targetFile = files.find(f => f.id === draggingFileId);
    if (!targetFile) return;

    const originalSerial = targetFile.hardCopyDetails.fileSerial;

    const updatedFiles = files.map(f => {
      if (f.id === draggingFileId) {
        return {
          ...f,
          hardCopyDetails: {
            ...f.hardCopyDetails,
            cabinetNumber: activeCabinet.code,
            shelfNumber: shelfName,
            boxNumber: boxName
          }
        };
      }
      return f;
    });

    setFiles(updatedFiles);
    localStorage.setItem('diu_archive_files', JSON.stringify(updatedFiles));
    
    addLog('PHYSICAL_FILE_REORGANIZED', `Visual drag transfer: file ${targetFile.name} (${originalSerial}) moved to Shelf: "${shelfName}", Box: "${boxName}"`);
    notifyUser(`Successfully relocated physical copy to ${activeCabinet.code} → ${shelfName} → ${boxName}`, 'success');
    
    setDraggingFileId(null);
  };

  // Lending helper inside dashboard
  const handleLendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLendFile || !activeCabinet) return;

    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewer accounts cannot authorize lended loans.', 'error');
      return;
    }

    if (!lendBorrowerName || !lendBorrowerId || !lendDueDate) {
      notifyUser('Lending profiles require borrower ID, borrower name, and return due date.', 'error');
      return;
    }

    const freshCheckout: FileCheckout = {
      id: `chk-${Date.now()}`,
      fileId: selectedLendFile.id,
      fileName: selectedLendFile.name,
      department: selectedLendFile.department,
      borrowerName: lendBorrowerName,
      borrowerId: lendBorrowerId,
      takenDate: new Date().toISOString().split('T')[0],
      dueDate: lendDueDate,
      returnedDate: null,
      status: 'Taken',
      authorizedBy: currentUser?.fullName || 'Cabinet Admin'
    };

    setCheckouts(prev => [freshCheckout, ...prev]);
    setFiles(prev => prev.map(f => f.id === selectedLendFile.id ? { ...f, status: 'Out' } : f));

    addLog('FILE_CHECKOUT', `Loaned copy "${selectedLendFile.name}" to borrower: ${lendBorrowerId}`);
    notifyUser(`Physical copies Checked out from Cabinet ${activeCabinet.code}! Secure Serial: ${selectedLendFile.hardCopyDetails.fileSerial}`, 'success');

    setSelectedLendFile(null);
    setLendBorrowerName('');
    setLendBorrowerId('');
    setLendDueDate('');
  };

  // Return helper inside dashboard
  const handleReturnDirectlyInput = (fileId: string) => {
    const linkedChk = checkouts.find(c => c.fileId === fileId && c.status === 'Taken');
    if (!linkedChk) return;

    setCheckouts(prev => prev.map(c => c.id === linkedChk.id ? { ...c, returnedDate: new Date().toISOString().split('T')[0], status: 'Returned' } : c));
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'Active' } : f));
    
    addLog('FILE_RETURNED', `Physical folder returned: ${linkedChk.fileName} checked back in to storage.`);
    notifyUser('File checked back in! Re-secured inside dedicated cabinet box drawer.', 'success');
  };

  // Simulate Barcode Scanner Code Reads
  const handleTriggerMockScanCamera = (cabCode: string) => {
    setSimulatedScanCode(cabCode);
    const linkedCab = cabinets.find(c => c.code === cabCode);
    if (linkedCab) {
      addLog('BARCODE_SCANNER_CONNECTED', `Triggered laser scan. Connected with physical vault: "${linkedCab.name}" (${cabCode})`);
      notifyUser(`Hardware laser scan hit: Connected to Storage node ${cabCode}!`, 'success');
      setTimeout(() => {
        handlesOpenCabinet(linkedCab);
        setSimulatedScanCode(null);
      }, 700);
    } else {
      notifyUser('Scan Error: Barcode label code mismatch or corrupted registry key.', 'error');
      setSimulatedScanCode(null);
    }
  };

  // Update Cabinet Status
  const handleUpdateCabinetStatus = (cabId: string, status: 'Active' | 'Full' | 'Archived' | 'Restricted' | 'Maintenance') => {
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewer cannot alter cabinet states.', 'error');
      return;
    }
    setCabinets(prev => prev.map(c => c.id === cabId ? { ...c, status, lastUpdated: new Date().toISOString() } : c));
    addLog('CABINET_STATUS_ADJUST_STAFF', `Adjusted storage state of ${cabId} to: "${status}"`);
    notifyUser(`Cabinet status updated: "${status}"`, 'success');
  };

  // --- FILTERED CABINET LISTS ---
  const filteredCabinets = cabinets.filter(cab => {
    const matchesQuery = 
      cab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cab.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cab.responsibleEmployee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cab.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'All' || cab.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'All' || cab.status === statusFilter;
    const matchesAccess = accessFilter === 'All' || cab.accessLevel === accessFilter;

    return matchesQuery && matchesDept && matchesStatus && matchesAccess;
  });

  // Calculate statistics summary values
  const totalCabinets = cabinets.length;
  const occupiedShelvesCount = cabinets.reduce((acc, c) => acc + c.shelves.length, 0);
  const archivedCabinetsCount = cabinets.filter(c => c.status === 'Archived').length;
  const restrictedCabinetsCount = cabinets.filter(c => c.status === 'Restricted').length;
  
  // Total hardcopy files in the catalog files database
  const totalVaultedFiles = files.reduce((acc, file) => {
    const cabinetCode = file.hardCopyDetails?.cabinetNumber;
    const match = cabinets.some(c => c.code === cabinetCode);
    return match ? acc + 1 : acc;
  }, 0);

  const getCabinetStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/10';
      case 'Full': return 'bg-amber-500/15 text-amber-500 border-amber-500/10 font-bold animate-pulse';
      case 'Archived': return 'bg-slate-500/15 text-slate-550 border-slate-500/10';
      case 'Restricted': return 'bg-rose-500/15 text-rose-500 border-rose-500/10 font-black';
      case 'Maintenance': return 'bg-indigo-500/15 text-indigo-500 border-indigo-500/10 font-medium';
      default: return 'bg-slate-550/15 text-slate-500';
    }
  };

  const getAccessBadgeClass = (level: string) => {
    switch (level) {
      case 'Confidential': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Restricted-Admin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Staff-Only': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Public-Viewable': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. COMPREHENSIVE STATISTICS BAR */}
      {!selectedCabinetId && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Cabinets</p>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">{totalCabinets}</h3>
              <p className="text-[9px] text-slate-500">Registered locations</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Storage Shelves</p>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">{occupiedShelvesCount}</h3>
              <p className="text-[9px] text-slate-500">Divided physical tiers</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Hard Copy Files</p>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">{totalVaultedFiles}</h3>
              <p className="text-[9px] text-slate-500">Active checked mappings</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs font-mono">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Restricted Vaults</p>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{restrictedCabinetsCount}</h3>
              <p className="text-[9px] text-slate-500">Confidential-locks</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 col-span-2 lg:col-span-1 shadow-xs">
            <div className="flex justify-between items-center mb-1 select-none">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Archived Shelf Capacity</span>
              <span className="text-xs font-mono font-bold text-slate-500">{archivedCabinetsCount} unit{archivedCabinetsCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (archivedCabinetsCount / totalCabinets) * 100 || 0)}%` }} 
              />
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-1 text-right">
              {((archivedCabinetsCount / totalCabinets) * 100 || 0).toFixed(0)}% storage decom
            </p>
          </div>

        </div>
      )}

      {/* 2. CABINET ROOT DIRECTORY VIEWS */}
      {!selectedCabinetId ? (
        <div className="space-y-6">
          
          {/* HEADER OPTIONS */}
          <div className={`p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} shadow-sm`}>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-500" />
                <span>Physical Cabinet Directory</span>
              </h3>
              <p className="text-xs text-slate-550 mt-1">
                Visual structure mapping physical university folders directly to online decentralized ledger indices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Trigger Barcode Scans Simulation */}
              <button 
                onClick={() => {
                  const pickCode = prompt("Simulate physical Barcode Reader gun sweep. Type registered serial (e.g. CAB-A, CAB-B, CAB-C, CAB-E):", "CAB-A");
                  if (pickCode) handleTriggerMockScanCamera(pickCode);
                }}
                className="px-3.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Smartphone className="w-4 h-4 animate-bounce" />
                <span>Trigger Laser Barcode</span>
              </button>

              {currentUser?.role !== 'Viewer' ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Create Cabinet</span>
                </button>
              ) : (
                <span className="text-[10px] text-amber-500 font-mono bg-amber-550/10 border border-amber-500/15 px-3 py-2 rounded-xl font-bold uppercase tracking-wider">
                  Viewer Mode Only
                </span>
              )}
            </div>
          </div>

          {/* CRITICAL WEB-ONLY BARCODE LOADING ANIMATION SEEN WHEN MOCK TRIGGERED */}
          {simulatedScanCode && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 text-indigo-500 text-xs font-mono font-bold animate-pulse rounded-xl text-center">
              🎥 LASER EMITTED: Scanning physical QR barcode sticker reference ID key ... (Match verified: {simulatedScanCode})
            </div>
          )}

          {/* SEARCH FILTERS BLOCK */}
          <div className={`p-4 border rounded-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-150'} grid grid-cols-1 md:grid-cols-12 gap-3.5`}>
            
            <div className="relative md:col-span-5">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search folders by name, code series, custodian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-300 font-mono"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-2.5 font-bold text-slate-400 hover:text-slate-600">×</button>
              )}
            </div>

            <div className="md:col-span-7 flex flex-wrap gap-2 justify-end">
              
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 outline-none text-slate-600 dark:text-slate-400 font-bold"
              >
                <option value="All">All Offices</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 outline-none text-slate-600 dark:text-slate-400 font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Full">Full</option>
                <option value="Archived">Archived</option>
                <option value="Restricted">Restricted</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 outline-none text-slate-600 dark:text-slate-400 font-bold"
              >
                <option value="All">All Clearances</option>
                <option value="Staff-Only">Staff-Only</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted-Admin">Restricted-Admin</option>
                <option value="Public-Viewable">Public-Viewable</option>
              </select>

              {/* Grid / List controls */}
              <div className="bg-white dark:bg-slate-950 p-0.5 rounded-xl flex gap-1 border border-slate-200/60 dark:border-slate-850">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-500 shadow-xs' : 'text-slate-450'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-500 shadow-xs' : 'text-slate-450'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* MAIN CATALOG */}
          {filteredCabinets.length > 0 ? (
            viewMode === 'grid' ? (
              /* Google Drive Style Folder Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCabinets.map(cab => {
                  const cabFiles = files.filter(f => f.hardCopyDetails?.cabinetNumber === cab.code);
                  const totalFilesCount = cabFiles.length;
                  const deptInfo = DEPARTMENTS.find(d => d.id === cab.departmentId);

                  return (
                    <div
                      key={cab.id}
                      onClick={() => handlesOpenCabinet(cab)}
                      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-md cursor-pointer text-left flex flex-col justify-between"
                    >
                      {/* Folder card styled accent header */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          {/* Folder graphic with category colors */}
                          <div className={`p-2.5 rounded-xl shadow-xs text-white bg-${cab.color}-500/80`}>
                            <Folder className="w-6 h-6 animate-pulse" />
                          </div>

                          <div className="flex items-center gap-1.5 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getCabinetStatusBadgeClass(cab.status)}`}>
                              {cab.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getAccessBadgeClass(cab.accessLevel)}`}>
                              {cab.accessLevel}
                            </span>
                          </div>
                        </div>

                        {/* Folder Info */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                            {cab.code} • {deptInfo?.name || cab.departmentId.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-emerald-500 transition-colors">
                            {cab.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {cab.description}
                          </p>
                        </div>
                      </div>

                      {/* Folder visual metrics footer */}
                      <div className="border-t border-slate-150 dark:border-slate-800/50 pt-3.5 mt-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-slate-450 font-mono">Capacity details:</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            🏢 {cab.shelfCount} Shelves • <strong className="text-emerald-500">{totalFilesCount} Files</strong>
                          </p>
                        </div>

                        {/* Interactive scan QR button */}
                        <div className="flex gap-1.5 shrink-0 select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const code = prompt("Print high-resolution adhesive chest sticker serial QR code?", cab.code);
                              if (code) {
                                notifyUser(`Successfully routed high-resolution cabinet drawer labels: ${cab.code}`, 'success');
                              }
                            }}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg cursor-pointer"
                            title="Print Secure Label"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          
                          {currentUser?.role === 'Super Admin' && (
                            <button
                              onClick={(e) => handleDeleteCabinet(cab, e)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                              title="Dissolve Cabinet Store"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subtle folder shadow effect */}
                      <div className="absolute right-4 top-4 text-[10px] text-slate-200 dark:text-slate-800 font-black tracking-widest pointer-events-none select-none font-mono">
                        DIU-DIR
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Linear Directory Rows */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">Cabinet Card Module</th>
                      <th className="py-3 px-3">Unique Code</th>
                      <th className="py-3 px-3">Office Unit</th>
                      <th className="py-3 px-3 text-center">Tiers</th>
                      <th className="py-3 px-3 text-center">Folders</th>
                      <th className="py-3 px-3">Security Level</th>
                      <th className="py-3 px-3">Cabinet State</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-805/40 text-xs">
                    {filteredCabinets.map(cab => {
                      const totalFilesCount = files.filter(f => f.hardCopyDetails?.cabinetNumber === cab.code).length;
                      const deptInfo = DEPARTMENTS.find(d => d.id === cab.departmentId);

                      return (
                        <tr
                          key={cab.id}
                          onClick={() => handlesOpenCabinet(cab)}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-150">
                            <div className="flex items-center gap-2.5">
                              <Folder className="w-4.5 h-4.5 text-slate-400 group-hover:text-emerald-500" />
                              <div>
                                <p>{cab.name}</p>
                                <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[200px]">{cab.cabinetType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-indigo-400">{cab.code}</td>
                          <td className="py-3 px-3 font-semibold text-slate-650">{deptInfo?.name || cab.departmentId}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-350">{cab.shelfCount} shelves</td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] rounded font-extrabold">
                              {totalFilesCount} files
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] border font-bold ${getAccessBadgeClass(cab.accessLevel)}`}>
                              {cab.accessLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] border font-bold ${getCabinetStatusBadgeClass(cab.status)}`}>
                              {cab.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handlesOpenCabinet(cab)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 rounded text-[10px] font-bold"
                              >
                                Browse Tiers
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className={`p-12 text-center rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'} italic text-slate-500`}>
              No physical cabinet cards found matching filter scopes. Add a new cabinet module above to begin.
            </div>
          )}

        </div>
      ) : (
        /* 3. CABINET INTERACTIVE DASHBOARD VIEW (SHELVES & BOXES DEEP BROWSER) */
        <div className="space-y-6">
          
          {/* DASHBOARD BAR HEADER */}
          <div className={`p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'} shadow-sm text-left`}>
            
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCabinetId(null)}
                className="hover:text-emerald-500 cursor-pointer text-xs font-bold text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return To Cabinets</span>
              </button>
              
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Folder className="w-6 h-6 text-emerald-500 animate-pulse" />
                  <span>{activeCabinet?.name}</span>
                </h3>
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black border border-slate-200 text-slate-600 dark:text-slate-300">
                  {activeCabinet?.code}
                </span>
                {activeCabinet && (
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border shrink-0 ${getCabinetStatusBadgeClass(activeCabinet.status)}`}>
                    {activeCabinet.status}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 leading-normal max-w-xl">
                {activeCabinet?.description}
              </p>
            </div>

            {/* Quick Status and Admin tools info */}
            {activeCabinet && (
              <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Status Control:</span>
                  <select
                    value={activeCabinet.status}
                    onChange={(e) => handleUpdateCabinetStatus(activeCabinet.id, e.target.value as any)}
                    className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 outline-none font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Full">Full</option>
                    <option value="Archived">Archived</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <p className="text-[10px] font-mono text-slate-400">
                  Responsible: <strong className="text-indigo-400">{activeCabinet.responsibleEmployee}</strong>
                </p>
              </div>
            )}
          </div>

          {/* MAIN DEEP GRID VISUALIZERS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT TIER ACCORDION: CUSTOM NESTED PHYSICAL STRUCTURE (HIERARCHY ACCORDION) */}
            <div className="lg:col-span-4 space-y-4">
              
              <div className={`p-4 border rounded-2xl shadow-xs text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-250/80'}`}>
                
                {/* Header title */}
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2.5 mb-3.5 select-none">
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                      📁 Nested Drawers Hierarchy
                    </h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">Cabinet → Tiers → Containers</p>
                  </div>

                  {activeCabinet && hasEditAccess(activeCabinet) && (
                    <button
                      onClick={() => setShowAddShelfInput(prev => !prev)}
                      className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                      title="Weld custom shelf tier"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* Add Shelf Form */}
                {showAddShelfInput && (
                  <form onSubmit={handleAddShelf} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 mb-3.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Shelf name (e.g. Shelf 6)"
                      value={newShelfName}
                      onChange={(e) => setNewShelfName(e.target.value)}
                      required
                      className="flex-1 text-xs px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-mono"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </form>
                )}

                {/* Shelf-Boxes nested loops accordions */}
                <div className="space-y-2.5">
                  {activeCabinet?.shelves.map((shelf) => {
                    const isShelfActive = activeShelfId === shelf.id;
                    const nestedFilesCount = files.filter(
                      f => f.hardCopyDetails?.cabinetNumber === activeCabinet.code && f.hardCopyDetails?.shelfNumber === shelf.name
                    ).length;
                    const capacityPercent = Math.min(100, Math.round((nestedFilesCount / SHELF_CAPACITY_LIMIT) * 100));

                    return (
                      <div 
                        key={shelf.id}
                        className={`rounded-xl border transition-all ${
                          isShelfActive
                            ? 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-350 dark:border-slate-750 shadow-xs' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Shelf row */}
                        <div 
                          onClick={() => {
                            setActiveShelfId(shelf.id);
                            // Auto select the first box
                            if (shelf.boxes.length > 0) setActiveBoxId(shelf.boxes[0].id);
                          }}
                          className="p-3 flex items-center justify-between cursor-pointer select-none gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Layers className={`w-4 h-4 shrink-0 ${isShelfActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span className={`text-xs font-bold truncate ${isShelfActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                                {shelf.name}
                              </span>
                            </div>
                            
                            {/* Capacity progress bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    capacityPercent >= 90 
                                      ? 'bg-rose-500' 
                                      : capacityPercent >= 75 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${capacityPercent}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-mono font-medium text-slate-400 dark:text-slate-500 shrink-0">
                                {capacityPercent}% Capacity ({nestedFilesCount}/{SHELF_CAPACITY_LIMIT})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 text-[9px] font-mono bg-slate-200 dark:bg-slate-800 font-bold rounded">
                              {nestedFilesCount} copy{nestedFilesCount !== 1 ? 'ies' : ''}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isShelfActive ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Shelf Expand: Sub Boxes list */}
                        {isShelfActive && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-850 space-y-1.5">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Storage Boxes Containers:</span>
                              {hasEditAccess(activeCabinet) && (
                                <button
                                  onClick={() => setShowAddBoxInput(prev => prev === shelf.id ? null : shelf.id)}
                                  className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                                  title="Rig custom box storage slot"
                                >
                                  + Create Box
                                </button>
                              )}
                            </div>

                            {showAddBoxInput === shelf.id && (
                              <form onSubmit={(e) => handleAddBox(shelf.id, e)} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 mb-2 flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Box Name (e.g. Box 14)"
                                  value={newBoxName}
                                  onChange={(e) => setNewBoxName(e.target.value)}
                                  required
                                  className="flex-1 text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded outline-none"
                                />
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] rounded-md font-bold cursor-pointer"
                                >
                                  Weld
                                </button>
                              </form>
                            )}

                            {/* List Boxes */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {shelf.boxes.map((box) => {
                                const isBoxActive = activeBoxId === box.id;
                                const filesCountInBox = files.filter(
                                  f => f.hardCopyDetails?.cabinetNumber === activeCabinet.code && 
                                       f.hardCopyDetails?.shelfNumber === shelf.name && 
                                       f.hardCopyDetails?.boxNumber === box.name
                                ).length;

                                return (
                                  <div
                                    key={box.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveBoxId(box.id);
                                    }}
                                    className={`p-2 rounded-lg border font-mono text-left cursor-pointer transition-all flex flex-col justify-between ${
                                      isBoxActive
                                        ? 'bg-emerald-500/5 border-emerald-400 text-emerald-500'
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:border-slate-350 text-slate-500'
                                    }`}
                                  >
                                    <span className="text-[10px] font-bold truncate">{box.name}</span>
                                    <span className="text-[8px] font-medium text-slate-400 mt-1 block">
                                      📦 {filesCountInBox} mapped file{filesCountInBox !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CABINET ACCESS CODE QR PREVIEW CONTAINER */}
              <div className={`p-4 border rounded-2xl text-center space-y-3.5 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-205/85'}`}>
                <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest text-left">
                  QR Secure Identity Anchor
                </h5>
                
                <div className="flex justify-center select-all cursor-pointer">
                  {activeCabinet && (
                    <QRCodeView 
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://archive.diu.edu.bd'}/cabinet/${activeCabinet.code.toLowerCase()}`} 
                      size={110} 
                      label={`${activeCabinet.code} QR Badge`} 
                    />
                  )}
                </div>

                <div className="text-left bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] font-mono text-slate-500 leading-normal">
                  <p className="font-bold uppercase text-slate-400 mb-0.5">Cabinet URL Binding:</p>
                  <p className="truncate text-indigo-500 select-all border-b border-dashed border-slate-200 pb-1 cursor-copy" title="Copy metadata route">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://archive.diu.edu.bd'}/cabinet/{activeCabinet?.code.toLowerCase()}
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400 font-sans">
                    Mounting this adhesive labels key physically to the locker face triggers direct visual indexes directories on smart scanner queries.
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT WORKSPACE FILE BROWSER FOR THE SELECTED ACTIVE BOX DRAWER */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Box status details description header bar */}
              <div className={`p-4 border rounded-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                {(() => {
                  const currentShelfObj = activeCabinet?.shelves.find(s => s.id === activeShelfId);
                  const currentBoxObj = currentShelfObj?.boxes.find(b => b.id === activeBoxId);
                  
                  // Compute files registered in this physical node
                  const mappedFiles = files.filter(
                    f => f.hardCopyDetails?.cabinetNumber === activeCabinet?.code && 
                         f.hardCopyDetails?.shelfNumber === currentShelfObj?.name && 
                         f.hardCopyDetails?.boxNumber === currentBoxObj?.name
                  );

                  return (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        {currentShelfObj && currentBoxObj ? (
                          <>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                              🗄️ Location Drawer: {activeCabinet?.code} → <strong className="text-emerald-500">{currentShelfObj.name}</strong> → <strong className="text-indigo-400">{currentBoxObj.name}</strong>
                            </h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Showing indices mapped directly inside this visual envelope chest drawer box.
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-505 italic">Choose a nested physical drawer structure on the Accordion list.</span>
                        )}
                      </div>

                      {/* Search & Sort Controls */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {/* Search box filters query within files inside this cabinet */}
                        <div className="relative flex-1 md:flex-none">
                          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search files inside crate..."
                            value={innerFileQuery}
                            onChange={(e) => setInnerFileQuery(e.target.value)}
                            className="pl-7 pr-3 py-1.5 text-[10px] w-full md:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-600 dark:text-slate-200 font-mono"
                          />
                        </div>

                        {/* File Sort Toggle */}
                        {currentShelfObj && currentBoxObj && (
                          <button
                            onClick={() => {
                              const nextOrder = drawerFileSort === 'name' ? 'serial' : 'name';
                              setDrawerFileSort(nextOrder);
                              notifyUser(`Sorted files inside drawer by: ${nextOrder === 'name' ? 'Alphabetical Order' : 'File Serial Number'}`, 'info');
                            }}
                            className="px-2.5 py-1.5 border border-slate-205 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-350 rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-all"
                            title="Toggle between Alphabetical and Serial number sorting"
                          >
                            <ArrowUpDown className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Sort: {drawerFileSort === 'name' ? 'A-Z Name' : 'Serial No.'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* INTERACTIVE DRAG-OVER FILE REORGANIZER EXPLANATOR */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-dashed border-slate-250 dark:border-slate-800 text-[11px] text-slate-500 font-sans leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">Smart Storage Organizer Enabled</p>
                  <p>
                    Reassemble structural files simply by dragging individual documents from the list card using the drag grip, and hovering directly over any drawer target shelf-box triggers above! Relocates physical metadata pointers instantly.
                  </p>
                </div>
              </div>

              {/* RE-SECURED FILES INNER CONTAINER LISTINGS */}
              <div className={`p-5 border rounded-2xl min-h-[300px] text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-150'}`}>
                {(() => {
                  const currentShelfObj = activeCabinet?.shelves.find(s => s.id === activeShelfId);
                  const currentBoxObj = currentShelfObj?.boxes.find(b => b.id === activeBoxId);
                  
                  if (!currentShelfObj || !currentBoxObj) {
                    return <p className="italic text-slate-500 text-xs text-center py-12">Please select shelf tier accordion container to scan stored archives.</p>;
                  }

                  const matchedFilingList = files.filter(
                    f => f.hardCopyDetails?.cabinetNumber === activeCabinet?.code && 
                         f.hardCopyDetails?.shelfNumber === currentShelfObj.name && 
                         f.hardCopyDetails?.boxNumber === currentBoxObj.name &&
                         (innerFileQuery === '' || f.name.toLowerCase().includes(innerFileQuery.toLowerCase()) || f.hardCopyDetails?.fileSerial.toLowerCase().includes(innerFileQuery.toLowerCase()))
                  );

                  // Sort according to user preference (either alphabetical by name or by file serial number order)
                  const sortedFilingList = [...matchedFilingList].sort((a, b) => {
                    if (drawerFileSort === 'name') {
                      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                    } else if (drawerFileSort === 'serial') {
                      const serialA = a.hardCopyDetails?.fileSerial || '';
                      const serialB = b.hardCopyDetails?.fileSerial || '';
                      return serialA.localeCompare(serialB, undefined, { numeric: true, sensitivity: 'base' });
                    }
                    return 0;
                  });

                  return (
                    <div className="space-y-4">
                      
                      {sortedFilingList.length > 0 ? (
                        sortedFilingList.map(file => {
                          const isCheckout = file.status === 'Out';
                          const activeCheckout = checkouts.find(c => c.fileId === file.id && c.status === 'Taken');

                          return (
                            <div
                              key={file.id}
                              draggable
                              onDragStart={() => handleDragStart(file.id)}
                              className={`p-4 rounded-xl border transition-all relative ${
                                theme === 'dark' 
                                  ? 'bg-slate-950/40 border-slate-850 hover:border-emerald-500' 
                                  : 'bg-slate-50 border-slate-150 hover:bg-slate-50/80 hover:border-emerald-300'
                              } flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-grab`}
                            >
                              <div className="space-y-1.5 flex-1 select-none">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase tracking-wider">
                                    {file.type}
                                  </span>
                                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-150 truncate max-w-[220px] md:max-w-md">
                                    {file.name}
                                  </h4>
                                </div>

                                <p className="text-[11px] text-slate-550 leading-relaxed font-sans line-clamp-1">
                                  {file.aiSummary || 'Physical audit record soft-copy digitized index.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-slate-400">
                                  <span>Serial Code: <strong className="text-emerald-500">{file.hardCopyDetails?.fileSerial}</strong></span>
                                  <span>•</span>
                                  <span>Responsible custodian: <strong className="text-slate-500">{file.hardCopyDetails?.responsibleEmployee}</strong></span>
                                </div>
                              </div>

                              {/* Lending Action Details right panel */}
                              <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-2.5 shrink-0 select-none">
                                
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase inline-block ${
                                  !isCheckout 
                                    ? 'bg-emerald-500/10 text-emerald-501 border border-emerald-500/10' 
                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse font-extrabold'
                                }`}>
                                  {!isCheckout ? 'In Locker Secured' : 'Out Loaned'}
                                </span>

                                {!isCheckout ? (
                                  <button
                                    onClick={() => setSelectedLendFile(file)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Lend Physical Copy
                                  </button>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <button
                                      onClick={() => handleReturnDirectlyInput(file.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      Verify Return
                                    </button>
                                    {activeCheckout && (
                                      <span className="text-[8px] font-mono text-rose-400 mt-1 block max-w-[120px] truncate">
                                        Holder: {activeCheckout.borrowerName}
                                      </span>
                                    )}
                                  </div>
                                )}

                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-12 text-center text-slate-500 italic text-xs">
                          No indices are currently secured inside drawer envelope "{currentBoxObj?.name}". Use files dragging or catalog forms to bind files in this locker node directory.
                        </div>
                      )}

                      {/* EXTRA INTERACTION: Drag Over relocation target helper box */}
                      {draggingFileId && (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropOnFileTargetBox(currentShelfObj.name, currentBoxObj.name)}
                          className="p-8 border-2 border-dashed border-emerald-500/55 rounded-xl text-center bg-emerald-500/5 hover:bg-emerald-100/10 text-xs font-mono font-black text-emerald-500 animate-pulse cursor-pointer shadow-xs select-none"
                        >
                          📥 DETECTED GRIP RELEASE: Hover & release here to relocate mapping to Drawer "{currentShelfObj.name} → {currentBoxObj.name}"!
                        </div>
                      )}

                    </div>
                  );
                })()}
              </div>

              {/* CABINET RECENT ACTIVITY LOGS & FILE MOVEMENT HISTORY */}
              <div className={`p-4 border rounded-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200/80'}`}>
                <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
                  📜 Cabinet Access logs & movement trail
                </h5>
                {(() => {
                  const filteredLendingAudit = checkouts.filter(c => {
                    const linkedFile = files.find(f => f.id === c.fileId);
                    return linkedFile && linkedFile.hardCopyDetails?.cabinetNumber === activeCabinet?.code;
                  });

                  return (
                    <div className="space-y-2">
                      {filteredLendingAudit.length > 0 ? (
                        filteredLendingAudit.slice(0, 5).map(chk => (
                          <div key={chk.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs flex justify-between gap-4 font-mono font-medium">
                            <div>
                              <p className="font-bold text-slate-750 dark:text-slate-350">{chk.fileName}</p>
                              <p className="text-[10px] text-slate-450">
                                Borrower ID: <span>{chk.borrowerId} ({chk.borrowerName})</span>
                              </p>
                              <p className="text-[9px] text-slate-400">Authorized: {chk.authorizedBy}</p>
                            </div>

                            <div className="text-right text-[10px]">
                              <p className="font-bold text-slate-500">Taken: {chk.takenDate}</p>
                              <p className={`text-[9px] ${chk.status === 'Returned' ? 'text-emerald-500 font-bold' : 'text-amber-500 animate-pulse'}`}>
                                {chk.status === 'Returned' ? `Returned ${chk.returnedDate}` : `Due: ${chk.dueDate}`}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="italic text-slate-500 text-[11px] text-center py-4">No lended loan file handshakes recorded under this storage unit chest.</p>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* --- POPUPS / MODALS MODULATORS --- */}
      
      {/* 1. CREATE CABINET MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className={`w-full max-w-lg border p-5 rounded-2xl max-h-[85vh] overflow-y-auto ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-80 */ text-left shadow-2xl'
              }`}
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 select-none">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />
                  <span>Create New Physical Cabinet Storage Series</span>
                </h4>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCabinetSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cabinet Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HR Employee Records"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Department / Office *</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cabinet Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HR-CAB-001"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Number of Tiers / Shelves *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={8}
                      value={formShelves}
                      onChange={(e) => setFormShelves(parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cabinet Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="Fireproof Safe">Fireproof Safe Vault</option>
                      <option value="Steel Drawer">Steel Drawer Drawer</option>
                      <option value="Wood Cabinet">Wooden Filing Locker</option>
                      <option value="Reinforced Cabinet">Reinforced Dual-Lock Cabinet</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Access Level Level</label>
                    <select
                      value={formAccess}
                      onChange={(e) => setFormAccess(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl outline-none"
                    >
                      <option value="Staff-Only">Staff-Only Access</option>
                      <option value="Confidential">Grade Confidential Vault</option>
                      <option value="Restricted-Admin">Restricted-Admin Clearance</option>
                      <option value="Public-Viewable">Public-Viewable Shelf</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Responsible Employee Guardian</label>
                  <input
                    type="text"
                    required
                    placeholder="Custodian staff member"
                    value={formEmployee}
                    onChange={(e) => setFormEmployee(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Description / Cabinet Location notes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe lockers storage contents or specific physical room numbers..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  Secure Vault & Instantiate Layout
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. LEND FILE POPUP MODAL */}
      <AnimatePresence>
        {selectedLendFile && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md border p-5 rounded-2xl ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
              } text-left`}
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 select-none">
                <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span>Physical File Handshake checkout</span>
                </h4>
                <button
                  onClick={() => setSelectedLendFile(null)}
                  className="p-1 text-slate-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 font-mono">
                <p className="font-black text-slate-705">Scanning mapped file details:</p>
                <p className="mt-1 truncate">Title: {selectedLendFile.name}</p>
                <p>Location: Cabinet {selectedLendFile.hardCopyDetails?.cabinetNumber}</p>
                <p>Cabinet Serial: {selectedLendFile.hardCopyDetails?.fileSerial}</p>
              </div>

              <form onSubmit={handleLendSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Borrower Student/Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Munirul Islam"
                    value={lendBorrowerName}
                    onChange={(e) => setLendBorrowerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Borrower Unique ID (Student ID / Staff ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-2201 / 211-15-4029"
                    value={lendBorrowerId}
                    onChange={(e) => setLendBorrowerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Return Due Date *</label>
                  <input
                    type="date"
                    required
                    value={lendDueDate}
                    onChange={(e) => setLendDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Execute Checkout Token Handshake
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
