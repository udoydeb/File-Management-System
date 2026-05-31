import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderPlus,
  UploadCloud,
  QrCode,
  Search,
  Plus,
  Grid,
  List,
  ChevronRight,
  Home,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Eye,
  Download,
  X,
  Trash2,
  Calendar,
  Lock,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Tag,
  Check,
  User,
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileSpreadsheet,
  FileArchive,
  Image,
  ArrowUpDown
} from 'lucide-react';
import { UniversityFile, HardCopyDetails } from '../types.js';
import { DEPARTMENTS, TEST_DOCUMENT_TEMPLATES } from '../data.js';
import QRCode from 'qrcode';

// Reusable QRCode QR Component
function QRCodeView({ value, size = 130 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = React.useState('');
  React.useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size })
      .then(url => setDataUrl(url))
      .catch(err => console.error(err));
  }, [value, size]);
  
  return dataUrl ? (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-sm inline-block shrink-0">
      <img src={dataUrl} alt="Archive QR Code" className="w-[110px] h-[110px] object-contain select-none opacity-90 hover:opacity-100" />
      <span className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-[110px]">DIU Security Node</span>
    </div>
  ) : (
    <div className="animate-pulse bg-slate-105 rounded border border-slate-200 shrink-0" style={{ width: size, height: size }} />
  );
}

export function getCategoryQRUrlLocal(catName: string, catList: any[]) {
  const cat = catList?.find(c => c.name.toLowerCase() === catName.toLowerCase()) || { id: 'SAL-001', name: catName, departmentId: 'hr' };
  const slug = catName.toLowerCase().replace(/[^a-z0-str0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://archive.diu.edu.bd';
  return `${origin}/category/${slug}?id=${cat.id}`;
}

interface DocumentSystemProps {
  files: UniversityFile[];
  setFiles: React.Dispatch<React.SetStateAction<UniversityFile[]>>;
  currentUser: any;
  theme: 'light' | 'dark';
  activeDeptId: string;
  setSelectedDeptId: (id: string) => void;
  selectedCategorValue: string;
  setSelectedCategoryValue: (val: string) => void;
  categories: any[];
  addLog: (action: string, details: string) => void;
  notifyUser: (msg: string, type?: 'success' | 'error' | 'info') => void;
  themeClass: string;
}

export function DocumentSystem({
  files,
  setFiles,
  currentUser,
  theme,
  activeDeptId,
  setSelectedDeptId,
  selectedCategorValue,
  setSelectedCategoryValue,
  categories,
  addLog,
  notifyUser
}: DocumentSystemProps) {
  // UI preferences
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'version'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal and wizard states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<'single' | 'bulk'>('single');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  // Single Upload Form values
  const [formFileName, setFormFileName] = useState('');
  const [formFileType, setFormFileType] = useState('PDF');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formConfidentiality, setFormConfidentiality] = useState<'Active' | 'Archived' | 'Pending Review' | 'Confidential' | 'Approved'>('Active');
  const [formCabinet, setFormCabinet] = useState('CAB-A');
  const [formShelf, setFormShelf] = useState('Shelf 1');
  const [formBox, setFormBox] = useState('Box 10');
  const [formSerial, setFormSerial] = useState('');
  const [formDocYear, setFormDocYear] = useState('2526');
  const [formStudentId, setFormStudentId] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formRefNo, setFormRefNo] = useState('');
  const [formText, setFormText] = useState('');

  // Drag over detection states
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Upload/scanning wizard progress status
  const [scanSteps, setScanSteps] = useState<Array<{ id: number; label: string; status: 'pending' | 'active' | 'done' | 'failed' }>>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Bulk uploads queue list
  const [bulkQueue, setBulkQueue] = useState<Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    progress: number;
    status: 'pending' | 'scanning' | 'ocr' | 'ready' | 'failed';
    simulatedText: string;
    tags: string[];
    category: string;
    studentId?: string;
    employeeId?: string;
  }>>([]);

  // File Previewer states
  const [activePreviewFile, setActivePreviewFile] = useState<UniversityFile | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotate, setPreviewRotate] = useState(0);
  const [previewFilters, setPreviewFilters] = useState<{ grayscale: boolean; contrast: boolean; sepia: boolean }>({
    grayscale: false,
    contrast: false,
    sepia: false
  });
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewQuery, setPreviewQuery] = useState('');

  // Version uploads state
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');
  const [isUploadingNewVersion, setIsUploadingNewVersion] = useState(false);

  // Simulated QR Code Scan (Visitor/Public Hub Drawer) Modal
  const [showQrPublicHub, setShowQrPublicHub] = useState(false);
  const [publicHubCategory, setPublicHubCategory] = useState<string | null>(null);
  const [publicHubSearch, setPublicHubSearch] = useState('');

  // Auto-generate serial when showing single form
  useEffect(() => {
    if (showUploadModal && !formSerial) {
      setFormSerial(`DIU-SRL-${Math.floor(1000 + Math.random() * 9000)}-${formDocYear}`);
    }
  }, [showUploadModal, formDocYear, formSerial]);

  // Set responsible employee defaults
  const currentEmployeeName = currentUser?.fullName || 'Registry Official';

  // Format Helper for Icons
  const getFileIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'PDF') return <FileText className="w-5 h-5 text-rose-500" />;
    if (t === 'DOC' || t === 'DOCX') return <FileText className="w-5 h-5 text-blue-500" />;
    if (t === 'XLS' || t === 'XLSX' || t === 'CSV') return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (t === 'ZIP' || t === 'RAR') return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (t === 'JPG' || t === 'JPEG' || t === 'PNG') return <Image className="w-5 h-5 text-indigo-500" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  // Drag & drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const filesList = e.dataTransfer.files;
    if (filesList && filesList.length > 0) {
      if (uploadTab === 'single') {
        const file = filesList[0];
        triggerSingleFileScanMock(file.name, file.size);
      } else {
        triggerBulkFilesScanMock(Array.from(filesList));
      }
    }
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      if (uploadTab === 'single') {
        const file = selectedFiles[0];
        triggerSingleFileScanMock(file.name, file.size);
      } else {
        triggerBulkFilesScanMock(Array.from(selectedFiles));
      }
    }
  };

  // single scan mock pipeline
  const triggerSingleFileScanMock = (fileName: string, fileSize: number) => {
    const sizeStr = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
    const extension = fileName.split('.').pop()?.toUpperCase() || 'PDF';
    
    setFormFileName(fileName);
    setFormFileType(extension);
    
    // Simulate steps progress
    setIsScanning(true);
    setScanProgress(0);
    setScanSteps([
      { id: 1, label: 'Reading physical signature structure', status: 'active' },
      { id: 2, label: 'Signature malware/virus compliance check', status: 'pending' },
      { id: 3, label: 'Creating decentralized system storage key hash', status: 'pending' },
      { id: 4, label: 'Invoking AI Gemini OCR line recognizer', status: 'pending' }
    ]);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setScanProgress(currentProgress);
      
      if (currentProgress === 25) {
        setScanSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'done' } : s.id === 2 ? { ...s, status: 'active' } : s));
      } else if (currentProgress === 50) {
        setScanSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'done' } : s.id === 3 ? { ...s, status: 'active' } : s));
      } else if (currentProgress === 75) {
        setScanSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'done' } : s.id === 4 ? { ...s, status: 'active' } : s));
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        setScanSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'done' } : s));
        setIsScanning(false);
        
        // Auto-generate some simulated content based on the filename
        const normalizedName = fileName.toLowerCase();
        let content = `DAFFODIL INTERNATIONAL UNIVERSITY (DIU) ARCHIVE SYSTEM\n`;
        content += `File Reference: ${fileName}\n`;
        content += `Scanned Size: ${sizeStr}\n`;
        content += `Access Node Code: MD5-${Math.random().toString(16).substring(2, 10)}\n\n`;

        if (normalizedName.includes('transcript') || normalizedName.includes('grade')) {
          content += `Academic Division Verification:\nStudent Tanvir Rahman - ID: 211-15-4029\nCourse grades verify Controller of Exams signatures. CGPA of 3.84 was approved.`;
          setFormTags('transcript, grades, academic');
          setFormConfidentiality('Approved');
          setFormDesc('Simulated automated scan of student transcript ledger.');
          setFormStudentId('211-15-4029');
        } else if (normalizedName.includes('salary') || normalizedName.includes('payroll')) {
          content += `DIU Human Resources & Accounts Division:\nEmployee compensation clearance for year 2026. Approved by central board and financial audit. Base Allowance: 1,45,000 BDT. Code: DIU-EMP-1029.`;
          setFormTags('salary, payroll, finance');
          setFormConfidentiality('Confidential');
          setFormDesc('Scanned physical payment ledger from accounts filing cabinet.');
          setFormEmployeeId('EMP-1029');
        } else {
          content += `DIU Document Registry index entry:\nGeneral academic and administrative records archived for long range safety compliance.\nYear: 2026. Department: ${activeDeptId.toUpperCase()}`;
          setFormTags('scanned, archived, soft-copy');
          setFormConfidentiality('Active');
          setFormDesc('Daffodil central administrative softcopy filing index.');
        }
        
        setFormText(content);
        notifyUser('Scan Analyzer complete! Extracted OCR metadata auto-filled.', 'success');
      }
    }, 150);
  };

  // bulk scan queue mock handler
  const triggerBulkFilesScanMock = (filesList: File[]) => {
    const mapQueue = filesList.map((f, i) => {
      const ext = f.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeStr = `${(f.size / (1024 * 1024)).toFixed(2)} MB`;
      return {
        id: `bulk-${Date.now()}-${i}`,
        name: f.name,
        size: sizeStr,
        type: ext,
        progress: 0,
        status: 'pending' as const,
        simulatedText: `DAFFODIL INTERNATIONAL UNIVERSITY BATCH SCAN PROCESSOR\nDocument: ${f.name}\nSize: ${sizeStr}\nMalware clear signature code confirmed. Index registry generated.`,
        tags: ['batch-upload', 'scanned', 'digitized'],
        category: selectedCategorValue
      };
    });

    setBulkQueue(prev => [...prev, ...mapQueue]);
    notifyUser(`Added ${filesList.length} files to digitization bulk queue.`, 'info');
  };

  // Run consecutive queue simulated upload
  const handleStartBulkProcessing = () => {
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewers cannot trigger bulk transactions.', 'error');
      return;
    }
    
    if (bulkQueue.length === 0) {
      notifyUser('Queue Empty: Select multiple files to trigger bulk queue.', 'error');
      return;
    }

    notifyUser('Triggering conveyor pipeline for batch upload.', 'info');
    
    let index = 0;
    const processNext = () => {
      if (index >= bulkQueue.length) {
        notifyUser('Successfully finalized all bulk uploads!', 'success');
        addLog('BULK_FILE_UPLOAD', `Digitized block of ${bulkQueue.length} files inside category: ${selectedCategorValue}`);
        return;
      }

      const item = bulkQueue[index];
      if (item.status === 'ready') {
        index++;
        processNext();
        return;
      }

      setBulkQueue(prev => prev.map(qi => qi.id === item.id ? { ...qi, status: 'scanning', progress: 20 } : qi));

      setTimeout(() => {
        setBulkQueue(prev => prev.map(qi => qi.id === item.id ? { ...qi, status: 'ocr', progress: 60 } : qi));
        
        setTimeout(() => {
          // Construct University File Record
          const randomSerialPart = Math.floor(1000 + Math.random() * 9000);
          const cabCode = String.fromCharCode(65 + (randomSerialPart % 4));
          const shelfCode = (randomSerialPart % 3) + 1;
          const boxCode = (randomSerialPart % 15) + 10;
          
          const newFile: UniversityFile = {
            id: `file-bulk-${Date.now()}-${index}`,
            name: item.name,
            type: item.type,
            department: activeDeptId,
            category: selectedCategorValue,
            uploadDate: new Date().toISOString(),
            size: item.size,
            status: 'Active',
            tags: item.tags,
            aiSummary: `Batch scanned copy of physical folder record. Assigned to physical Cabinet ${cabCode}, Shelf ${shelfCode}.`,
            fileVersion: 1,
            qrData: getCategoryQRUrlLocal(selectedCategorValue, categories),
            storageHash: Math.random().toString(16).substring(2, 42),
            hardCopyDetails: {
              cabinetNumber: `CAB-${cabCode}`,
              shelfNumber: `Shelf ${shelfCode}`,
              boxNumber: `Box ${boxCode}`,
              fileSerial: `DIU-SRL-${randomSerialPart}-2026`,
              responsibleEmployee: currentEmployeeName
            },
            textContent: item.simulatedText
          };

          setFiles(prev => [newFile, ...prev]);
          setBulkQueue(prev => prev.map(qi => qi.id === item.id ? { ...qi, status: 'ready', progress: 100 } : qi));
          
          index++;
          processNext();
        }, 800);
      }, 700);
    };

    processNext();
  };

  // Template select trigger
  const handleLoadTemplateIndex = (idx: number) => {
    setSelectedTemplateIndex(idx);
    const tmpl = TEST_DOCUMENT_TEMPLATES[idx];
    setFormFileName(tmpl.name);
    setFormFileType(tmpl.type);
    setFormText(tmpl.textContent);
    
    // Auto populate meta
    if (tmpl.name.includes('transcript')) {
      setFormStudentId('211-15-4029');
      setFormTags('transcript, grades, academic, tanvir');
      setFormConfidentiality('Approved');
      setFormDesc('Official CGPA transcript sheets of academic runs.');
    } else if (tmpl.name.includes('payroll')) {
      setFormEmployeeId('EMP-1029');
      setFormTags('salary, finance, payroll, auditing');
      setFormConfidentiality('Confidential');
      setFormDesc('Faculty salaries ledger record May 2026.');
    } else if (tmpl.name.includes('syllabus')) {
      setFormTags('curriculum, academic, course-outline, syllabus');
      setFormConfidentiality('Active');
      setFormDesc('DIU standardized academic course syllabus list.');
    } else if (tmpl.name.includes('ieee')) {
      setFormTags('research, journal, publications, springer');
      setFormConfidentiality('Approved');
      setFormDesc('Academic research review contributions 2026.');
    }
    notifyUser(`Preconfigured DIU document template loaded!`, 'info');
  };

  // Submit complete file archive record
  const handleConfirmSingleArchive = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Restricted: Viewer users cannot register or upload files.', 'error');
      return;
    }

    if (!formFileName || !formText) {
      notifyUser('File contents or upload files are mandatory to digitize indices.', 'error');
      return;
    }

    // Verify department locking restrictions
    const isLocked = currentUser.role !== 'Super Admin' && currentUser.departmentId !== activeDeptId;
    if (isLocked) {
      notifyUser(`Boundary Exclusion: You are only authorized to upload inside the ${currentUser.departmentId.toUpperCase()} workspace.`, 'error');
      return;
    }

    const nextFile: UniversityFile = {
      id: `file-${Date.now()}`,
      name: formFileName,
      type: formFileType,
      department: activeDeptId,
      category: selectedCategorValue,
      studentId: formStudentId || undefined,
      employeeId: formEmployeeId || undefined,
      uploadDate: new Date().toISOString(),
      size: `${(formText.length / 1024 + 1.2).toFixed(1)} KB`,
      status: formConfidentiality,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : ['scanned', 'soft-copy'],
      aiSummary: formDesc || `Scanned soft copy of physical document records managed under folder: ${selectedCategorValue}.`,
      fileVersion: 1,
      qrData: getCategoryQRUrlLocal(selectedCategorValue, categories),
      storageHash: Math.random().toString(16).substring(2, 42),
      hardCopyDetails: {
        cabinetNumber: formCabinet,
        shelfNumber: formShelf,
        boxNumber: formBox,
        fileSerial: formSerial,
        responsibleEmployee: currentEmployeeName
      },
      textContent: formText,
      versionHistory: [
        {
          version: 1,
          uploadDate: new Date().toISOString(),
          size: `${(formText.length / 1024 + 1.2).toFixed(1)} KB`,
          changedBy: currentEmployeeName,
          hash: Math.random().toString(16).substring(2, 20),
          note: 'Initial digitization scan index creation.'
        }
      ]
    };

    setFiles(prev => [nextFile, ...prev]);
    addLog('SOFT_COPY_DIGITIZED', `Digitized physical copy secure checkout serial: ${nextFile.hardCopyDetails.fileSerial} name: ${nextFile.name}`);
    notifyUser(`Success! "${formFileName}" is secure inside category "${selectedCategorValue}"`, 'success');
    
    // Reset forms
    setShowUploadModal(false);
    setFormFileName('');
    setFormText('');
    setFormStudentId('');
    setFormEmployeeId('');
    setFormTags('');
    setFormDesc('');
    setSelectedTemplateIndex(null);
    setFormSerial('');
  };

  // Delete file
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.role !== 'Super Admin' && currentUser?.role !== 'Department Admin') {
      notifyUser('Access Locked: Admin grade level is required to clear entries.', 'error');
      return;
    }
    
    const originalFile = files.find(f => f.id === id);
    if (!originalFile) return;

    if (confirm(`Clear index and permanently delete virtual copy of file "${originalFile.name}"? This action is irreversible.`)) {
      setFiles(prev => prev.filter(f => f.id !== id));
      addLog('DOCUMENT_DELETED', `Deleted soft copy and cleared visual metadata: ${originalFile.name}`);
      notifyUser(`File "${originalFile.name}" removed from digital catalog.`, 'success');
      if (activePreviewFile?.id === id) {
        setActivePreviewFile(null);
      }
    }
  };

  // Increment version tracking
  const handleAddNewVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePreviewFile) return;

    if (currentUser?.role === 'Viewer') {
      notifyUser('Access Blocked: Viewer cannot edit archives.', 'error');
      return;
    }

    setIsUploadingNewVersion(true);
    
    setTimeout(() => {
      const nextVer = activePreviewFile.fileVersion + 1;
      const cleanSize = `${(Math.random() * 2 + 1.5).toFixed(1)} MB`;
      const freshHash = Math.random().toString(16).substring(2, 42);
      
      const updatedHistory = activePreviewFile.versionHistory ? [...activePreviewFile.versionHistory] : [];
      updatedHistory.unshift({
        version: nextVer,
        uploadDate: new Date().toISOString(),
        size: cleanSize,
        changedBy: currentEmployeeName,
        hash: freshHash.substring(0, 18),
        note: versionNote || `Uploaded version revision sequence update.`
      });

      const updatedFile: UniversityFile = {
        ...activePreviewFile,
        fileVersion: nextVer,
        uploadDate: new Date().toISOString(),
        size: cleanSize,
        storageHash: freshHash,
        versionHistory: updatedHistory
      };

      setFiles(prev => prev.map(f => f.id === activePreviewFile.id ? updatedFile : f));
      setActivePreviewFile(updatedFile);
      
      addLog('VERSION_CONTROL_UPDATED', `Committed version #${nextVer} for document ${activePreviewFile.name}`);
      notifyUser(`File Version incremented to v${nextVer} successfully!`, 'success');
      
      setIsUploadingNewVersion(false);
      setVersionNote('');
      setNewVersionFile(null);
    }, 1200);
  };

  // Simulated download
  const handleDownloadMock = (file: UniversityFile) => {
    const blob = new Blob([file.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('FILE_DOWNLOAD', `Downloaded digital copy soft archive reference "${file.name}"`);
    notifyUser(`Downloading digitized file copy: ${file.name}`, 'success');
  };

  // Filters logic
  const filteredFiles = files.filter(f => {
    const belongsToDept = f.department === activeDeptId;
    const belongsToCategory = f.category === selectedCategorValue;
    
    // Quick search match
    const matchesSearch = searchQuery === '' || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.textContent && f.textContent.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.studentId && f.studentId.includes(searchQuery)) ||
      (f.employeeId && f.employeeId.includes(searchQuery)) ||
      (f.hardCopyDetails?.fileSerial && f.hardCopyDetails.fileSerial.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Format filter match
    const typeLower = f.type.toUpperCase();
    let matchesFormat = true;
    if (formatFilter !== 'All') {
      if (formatFilter === 'PDF') matchesFormat = typeLower === 'PDF';
      else if (formatFilter === 'DOCX') matchesFormat = typeLower === 'DOCX' || typeLower === 'DOC';
      else if (formatFilter === 'XLSX') matchesFormat = typeLower === 'XLSX' || typeLower === 'XLS' || typeLower === 'CSV';
      else if (formatFilter === 'Images') matchesFormat = typeLower === 'PNG' || typeLower === 'JPG' || typeLower === 'JPEG';
      else if (formatFilter === 'ZIP') matchesFormat = typeLower === 'ZIP' || typeLower === 'RAR';
    }

    // Status filter match
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = f.status === statusFilter;
    }

    return belongsToDept && belongsToCategory && matchesSearch && matchesFormat && matchesStatus;
  });

  // Sort files logic
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let result = 0;
    if (sortBy === 'date') {
      result = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
    } else if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      result = parseFloat(a.size) - parseFloat(b.size);
    } else if (sortBy === 'version') {
      result = a.fileVersion - b.fileVersion;
    }
    return sortOrder === 'desc' ? -result : result;
  });

  const toggleSort = (type: 'date' | 'name' | 'size' | 'version') => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  // Open visitor portal simulation
  const handleSimulateQrScan = (catName: string) => {
    const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (matchedCat) {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const simulatedUrl = `/category/${slug}?id=${matchedCat.id}`;
      
      // Update browser pushState to make it feel like a real native URL redirect!
      window.history.pushState({}, '', simulatedUrl);
      
      setSelectedDeptId(matchedCat.departmentId);
      setSelectedCategoryValue(matchedCat.name);
      addLog('QR_CODE_SCANNED', `Accessed category folder cabinet through simulated QR Scanner matching: ${catName}`);
      notifyUser(`QR code read success! Redirecting dynamically to verified cabinet folder.`, 'success');
    } else {
      setPublicHubCategory(catName);
      setShowQrPublicHub(true);
      addLog('QR_CODE_SCANNED', `Accessed public folder cabinet through simulated camera barcode match: ${catName}`);
      notifyUser(`QR code read success! Accessing category Cabinet Portal.`, 'success');
    }
  };

  const activeCategoryObject = categories.find(c => c.name === selectedCategorValue);

  return (
    <div className="space-y-6">
      
      {/* 1. BREADCRUMBS & FOLDER CARDS INTEGRATION */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Dynamic breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono">
          <button 
            onClick={() => setSelectedDeptId('registrar')}
            className="hover:text-emerald-500 cursor-pointer flex items-center gap-1 font-bold text-slate-400"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>DIU Archive</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">{DEPARTMENTS.find(d => d.id === activeDeptId)?.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
            <Folder className="w-3.5 h-3.5" />
            {selectedCategorValue} Folder
          </span>
        </div>

        {/* Info stats */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-500">
          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
            📄 Cabinet Total: <strong className="text-indigo-400">{files.filter(f => f.department === activeDeptId).length} Soft Copies</strong>
          </span>
          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
            🔒 Secure Hashes: <strong className="text-emerald-500">AES-256 Compliant</strong>
          </span>
        </div>
      </div>

      {/* Modern Google Drive / OneDrive Style Folder cards */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          📂 Department Cabinet Directory (Folder Cards)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.filter(c => c.departmentId === activeDeptId).map(cat => {
            const isSelected = selectedCategorValue === cat.name;
            const fileCount = files.filter(f => f.department === activeDeptId && f.category === cat.name).length;
            const hasConfidential = files.some(f => f.department === activeDeptId && f.category === cat.name && f.status === 'Confidential');
            
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryValue(cat.name)}
                className={`relative group border p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-emerald-500/5 to-teal-500/10 border-emerald-400 dark:border-emerald-600 shadow-md shadow-emerald-500/5' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-xl ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-emerald-500 group-hover:bg-emerald-500/10'
                  }`}>
                    <Folder className="w-5 h-5" />
                  </div>
                  {hasConfidential && (
                    <span className="text-[8px] font-mono bg-rose-500/10 text-rose-500 px-1.5 py-0.2 rounded font-bold border border-rose-500/20">
                      SECURE
                    </span>
                  )}
                </div>

                <h4 className={`text-xs font-extrabold truncate ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {cat.name}
                </h4>
                
                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">
                    {fileCount} soft-file{fileCount !== 1 ? 's' : ''}
                  </span>
                  
                  {/* Miniature scan button that simulates public access */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSimulateQrScan(cat.name);
                    }}
                    title="Simulate Barcode Scanner Scan"
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg cursor-pointer transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CATEGORY ACTIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column (QR code indicator & Upload activation button) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-4 shadow-sm">
            
            {/* Folder Identification */}
            <div className="space-y-1">
              <span className="bg-emerald-500/10 text-emerald-500 font-mono font-bold text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                Cabinet Anchor Code
              </span>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {selectedCategorValue}
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[190px] mx-auto italic">
                "{activeCategoryObject?.desc || 'Cabinet folder containing digitised university files.'}"
              </p>
            </div>

            {/* Cabinet Category QR Code representation */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-2.5">
              <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Digital cabinet binding QR
              </p>
              
              <div className="flex justify-center select-all cursor-pointer" onClick={() => handleSimulateQrScan(selectedCategorValue)} title="Click to Simulate Scan">
                <QRCodeView value={getCategoryQRUrlLocal(selectedCategorValue, categories)} size={110} />
              </div>

              <div className="text-center">
                <a 
                  href={getCategoryQRUrlLocal(selectedCategorValue, categories)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSimulateQrScan(selectedCategorValue);
                  }}
                  className="text-[9px] text-[#4f46e5] dark:text-[#a5b4fc] hover:underline font-mono truncate max-w-[170px] inline-block"
                  title="Click to simulate camera QR scan"
                >
                  Simulate QR Scanner Link
                </a>
              </div>

              <button
                onClick={() => handleSimulateQrScan(selectedCategorValue)}
                className="w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 animate-bounce" />
                <span>Simulate Phone Scan</span>
              </button>
            </div>

            {/* Primary digitization button */}
            {currentUser?.role !== 'Viewer' ? (
              <button
                onClick={() => {
                  setUploadTab('single');
                  setShowUploadModal(true);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
              >
                <UploadCloud className="w-4 h-4 animate-pulse" />
                <span>Upload Secure Soft Copy</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-center">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">
                  Viewer Mode Locked
                </p>
                <p className="text-[9px] text-slate-500 leading-normal mt-1">
                  You do not possess edit clearance to digitize physical records in this cabinet.
                </p>
              </div>
            )}

            {/* Quick Bulk Access */}
            {currentUser?.role !== 'Viewer' && (
              <button
                onClick={() => {
                  setUploadTab('bulk');
                  setShowUploadModal(true);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bulk Scanning Queue</span>
              </button>
            )}

          </div>
        </div>

        {/* Right workspace listing catalog */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left">
            
            {/* Index control bar search filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 select-none">
              
              {/* Left group search boxes */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Instant secure serial or filename search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-250 transition-all font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Right group filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Format Filter selector */}
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 outline-none text-slate-600 dark:text-slate-300 font-semibold"
                >
                  <option value="All">All Formats</option>
                  <option value="PDF">PDF</option>
                  <option value="DOCX">Word Document</option>
                  <option value="XLSX">Spreadsheets</option>
                  <option value="Images">Images Scans</option>
                  <option value="ZIP">ZIP Bundles</option>
                </select>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 outline-none text-slate-600 dark:text-slate-300 font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Archived">Archived</option>
                </select>

                {/* Grid vs Table view toggle */}
                <span className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-850">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* List Table mode vs Grid view layout */}
            {sortedFiles.length > 0 ? (
              viewMode === 'table' ? (
                /* Tabular audit sheet */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono select-none">
                        <th className="py-3 px-3 cursor-pointer hover:text-emerald-500" onClick={() => toggleSort('name')}>
                          <div className="flex items-center gap-1">
                            <span>Document Name</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:text-emerald-500" onClick={() => toggleSort('date')}>
                          <div className="flex items-center gap-1">
                            <span>Scanned Date</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </th>
                        <th className="py-3 px-3 cursor-pointer hover:text-emerald-500 text-center" onClick={() => toggleSort('version')}>
                          <div className="flex items-center justify-center gap-1">
                            <span>Ver</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </th>
                        <th className="py-3 px-3">Physical Drawer Serial</th>
                        <th className="py-3 px-3">Clearance Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-805/40 text-xs">
                      {sortedFiles.map(file => (
                        <tr 
                          key={file.id}
                          onClick={() => setActivePreviewFile(file)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(file.type)}
                              <div className="truncate max-w-[200px] md:max-w-xs">
                                <p className="truncate block pr-2" title={file.name}>{file.name}</p>
                                <span className="text-[10px] text-slate-400 font-mono block">Size: {file.size}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-450 dark:text-slate-400 font-mono whitespace-nowrap">
                            {new Date(file.uploadDate).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-1.5 py-0.5 bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-705/30 text-[9px] font-mono font-bold rounded">
                              v{file.fileVersion}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-350 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{file.hardCopyDetails.fileSerial}</span>
                              <span className="text-[9px] text-indigo-400 font-medium">Cabinet: {file.hardCopyDetails.cabinetNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider inline-block ${
                              file.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                                : file.status === 'Approved'
                                ? 'bg-sky-500/10 text-sky-500 border border-sky-500/10'
                                : file.status === 'Confidential'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10 font-black'
                                : file.status === 'Pending Review'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10 font-bold'
                                : file.status === 'Archived'
                                ? 'bg-slate-500/10 text-slate-500 border border-slate-500/10'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {file.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setActivePreviewFile(file); }}
                                className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                title="Analyse Document & Preview OCR"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadMock(file); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                title="Download soft backup file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Department Admin') && (
                                <button
                                  onClick={(e) => handleDeleteFile(file.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                                  title="Clear record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Google Drive style Grid of soft files cards */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setActivePreviewFile(file)}
                      className="group border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 p-4 rounded-2xl cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="font-mono text-[9px] font-bold bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {file.type}
                          </span>
                        </div>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                          file.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                          file.status === 'Approved' ? 'bg-sky-500/10 text-sky-500' :
                          file.status === 'Confidential' ? 'bg-rose-500/10 text-rose-500 font-bold' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {file.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-[13px] text-slate-800 dark:text-slate-100 truncate mb-1" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {file.aiSummary || 'Physical audit record soft-copy digitized index.'}
                      </p>

                      <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <div>
                          <p className="text-[9px]">Physical Serial:</p>
                          <p className="font-bold text-slate-600 dark:text-slate-300">{file.hardCopyDetails.fileSerial}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadMock(file); }}
                            className="p-1 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Department Admin') && (
                            <button
                              onClick={(e) => handleDeleteFile(file.id, e)}
                              className="p-1 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="p-12 text-center text-slate-500 italic space-y-2">
                <Folder className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <p>No document indices discoverable inside this catalog folder.</p>
                <p className="text-[11px] font-sans text-slate-400 non-italic">
                  Use "Upload Secure Soft Copy" above to scan and ingest PDF/Word/Image records.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 3. POPUP MODAL: SMART UPLOADER WORKBENCH */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              {/* Modal header */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-4 justify-between items-center border-b border-slate-250 dark:border-slate-800 select-none">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      Smart File Digitizer & Cabinet Sync
                    </h3>
                    <p className="text-[10px] text-slate-500">Category: {selectedCategorValue}</p>
                  </div>
                </div>

                {/* Tab switchers */}
                <div className="flex gap-1.5 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-800">
                  <button 
                    onClick={() => setUploadTab('single')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${uploadTab === 'single' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400'}`}
                  >
                    Scanned File Upload
                  </button>
                  <button 
                    onClick={() => setUploadTab('bulk')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${uploadTab === 'bulk' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400'}`}
                  >
                    Batch Upload
                  </button>
                </div>

                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-805 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable container content */}
              <div className="overflow-y-auto p-5 space-y-6 flex-1 text-left">
                
                {uploadTab === 'single' ? (
                  /* Single Digitization Setup */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Drag n drop Column */}
                    <div className="lg:col-span-4 space-y-4">
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                          isDraggingOver 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                            : 'border-slate-300 dark:border-slate-800 hover:border-emerald-400 text-slate-400'
                        }`}
                      >
                        <UploadCloud className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-200">
                          Drag scanned file copy here
                        </p>
                        <p className="text-[10px] mt-1 select-none text-slate-500">
                          Accepts PDF, DOCX, XLSX, JPG, PNG, ZIP (Max 25MB)
                        </p>
                        <input 
                          type="file" 
                          id="file-scanner" 
                          className="hidden" 
                          onChange={handleManualFileChange} 
                          accept=".pdf,.docx,.xlsx,.jpg,.png,.zip" 
                        />
                        <label 
                          htmlFor="file-scanner"
                          className="mt-3.5 inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-lg cursor-pointer"
                        >
                          Manual Browse
                        </label>
                      </div>

                      {/* Load simulator templates */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                            Sample Document Scans
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          {TEST_DOCUMENT_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleLoadTemplateIndex(idx)}
                              className={`w-full text-left text-[9px] px-2.5 py-1.5 border rounded-lg truncate block cursor-pointer text-slate-600 dark:text-slate-400 ${
                                selectedTemplateIndex === idx 
                                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-600' 
                                  : 'border-slate-200 dark:border-slate-850 hover:bg-slate-200/50'
                              }`}
                            >
                              📄 {tmpl.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Progress checklist scanner */}
                      {isScanning && (
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl p-3 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold text-indigo-400 animate-pulse">Scanning Physical Copy...</span>
                            <span>{scanProgress}%</span>
                          </div>
                          
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                          </div>

                          <div className="space-y-1.5">
                            {scanSteps.map(step => (
                              <div key={step.id} className="flex items-center gap-2 text-[9px] font-mono select-none">
                                {step.status === 'done' ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : step.status === 'active' ? (
                                  <RefreshCw className="w-3 h-3 text-indigo-500 shrink-0 animate-spin" />
                                ) : (
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className={step.status === 'done' ? 'text-slate-400 line-through' : step.status === 'active' ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Metadata Smart Form Fields */}
                    <div className="lg:col-span-8">
                      <form onSubmit={handleConfirmSingleArchive} className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Document Name *</label>
                            <input
                              type="text"
                              required
                              value={formFileName}
                              onChange={(e) => setFormFileName(e.target.value)}
                              placeholder="e.g. Accounts_Receipt_2026.pdf"
                              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Format</label>
                            <select
                              value={formFileType}
                              onChange={(e) => setFormFileType(e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-700 dark:text-slate-200"
                            >
                              <option value="PDF">PDF Scanned Portfolio</option>
                              <option value="DOCX">Microsoft Word Document</option>
                              <option value="XLSX">Spreadsheet Registry File</option>
                              <option value="JPG">JPG Print Photo</option>
                              <option value="PNG">PNG Image Scan</option>
                              <option value="ZIP">Enveloped ZIP Package</option>
                            </select>
                          </div>
                        </div>

                        {/* OCR Content Block */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center select-none">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>AI Extracted OCR Raw Transcript *</span>
                            </label>
                            <span className="text-[9px] font-mono text-slate-400">Searchable Database Index Content</span>
                          </div>
                          <textarea
                            required
                            rows={4}
                            value={formText}
                            onChange={(e) => setFormText(e.target.value)}
                            placeholder="Digitized text from hard-copy print lines. Select template or drag files to trigger automatic scanners..."
                            className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-500"
                          />
                        </div>

                        {/* Optional references */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Student ID (Optional)</label>
                            <input
                              type="text"
                              value={formStudentId}
                              onChange={(e) => setFormStudentId(e.target.value)}
                              placeholder="e.g. 211-15-4029"
                              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Employee ID (Optional)</label>
                            <input
                              type="text"
                              value={formEmployeeId}
                              onChange={(e) => setFormEmployeeId(e.target.value)}
                              placeholder="e.g. EMP-1029"
                              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Reference No. (Opt)</label>
                            <input
                              type="text"
                              value={formRefNo}
                              onChange={(e) => setFormRefNo(e.target.value)}
                              placeholder="e.g. REG-REF-09"
                              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none"
                            />
                          </div>
                        </div>

                        {/* Document details */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Confidential Safety</label>
                            <select
                              value={formConfidentiality}
                              onChange={(e: any) => setFormConfidentiality(e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 outline-none font-bold"
                            >
                              <option value="Active">Active</option>
                              <option value="Approved">Approved</option>
                              <option value="Pending Review">Pending Review</option>
                              <option value="Confidential">Confidential SEC</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Document Year</label>
                            <input
                              type="number"
                              value={formDocYear}
                              onChange={(e) => setFormDocYear(e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Security Tag Labels</label>
                            <input
                              type="text"
                              value={formTags}
                              onChange={(e) => setFormTags(e.target.value)}
                              placeholder="e.g. finance, auditing, receipt"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Document Brief Description</label>
                          <input
                            type="text"
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            placeholder="Internal memo explanation for physical cabinet operators."
                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none"
                          />
                        </div>

                        {/* Cabinet coordinates */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl select-none">
                          <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Physical Copy Secure Tracking Coordinates</span>
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400">Cabinet No.</span>
                              <input type="text" value={formCabinet} onChange={(e) => setFormCabinet(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400">Shelf No.</span>
                              <input type="text" value={formShelf} onChange={(e) => setFormShelf(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400">Box No.</span>
                              <input type="text" value={formBox} onChange={(e) => setFormBox(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400">Running Serial No.</span>
                              <input type="text" value={formSerial} onChange={(e) => setFormSerial(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold text-emerald-500 font-extrabold" />
                            </div>
                          </div>
                        </div>

                        {/* Confirmation actions */}
                        <div className="flex justify-end gap-3 pt-4 select-none border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                          >
                            Commit Digitize Index
                          </button>
                        </div>

                      </form>
                    </div>

                  </div>
                ) : (
                  /* Bulk Upload Conveyor setup */
                  <div className="space-y-5">
                    
                    {/* Queue file loading drops */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                        isDraggingOver ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'border-slate-300 dark:border-slate-800 hover:border-indigo-400 text-slate-400 bg-slate-50/10'
                      }`}
                    >
                      <UploadCloud className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-ping" />
                      <p className="text-xs font-black text-slate-700 dark:text-slate-100 uppercase tracking-widest font-mono">
                        Stream Ingest Multiple Scanning Registries
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 select-none">
                        Drag & Drop multiple files or click Manual Select to enqueue multiple documents (Max size 25MB each).
                      </p>
                      <input 
                        type="file" 
                        id="bulk-scanner-input" 
                        className="hidden" 
                        multiple 
                        onChange={handleManualFileChange} 
                        accept=".pdf,.docx,.xlsx,.jpg,.png,.zip" 
                      />
                      <label 
                        htmlFor="bulk-scanner-input"
                        className="mt-4 inline-block px-4 py-2 bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer"
                      >
                        Enlist Files Block
                      </label>
                    </div>

                    {/* Pending queues listed */}
                    <div className="space-y-2 select-none">
                      <div className="flex justify-between items-center text-xs border-b border-slate-150 dark:border-slate-850 pb-2">
                        <span className="font-mono font-bold text-slate-400 uppercase tracking-wider">Ingress List Queue ({bulkQueue.length})</span>
                        {bulkQueue.length > 0 && (
                          <button 
                            onClick={() => setBulkQueue([])} 
                            className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                          >
                            Clear Pipeline Queue
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {bulkQueue.map(item => (
                          <div 
                            key={item.id}
                            className="bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-805/40 rounded-xl flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2.5 truncate flex-1 text-xs">
                              {getFileIcon(item.type)}
                              <div className="truncate">
                                <p className="font-bold text-slate-705 dark:text-slate-200 truncate">{item.name}</p>
                                <span className="font-mono text-[9px] text-slate-400">Size: {item.size} • Format: {item.type}</span>
                              </div>
                            </div>

                            <div className="w-1/3 flex items-center gap-3">
                              {/* progress bars */}
                              <div className="flex-1">
                                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8 text-right">
                                {item.progress}%
                              </span>
                            </div>

                            <div className="shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                item.status === 'pending' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                item.status === 'scanning' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-400/20' :
                                item.status === 'ocr' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' :
                                'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}

                        {bulkQueue.length === 0 && (
                          <p className="p-8 text-center text-xs text-slate-500 italic">No files enqueues have been selected yet. Add files to stream ingestion.</p>
                        )}
                      </div>
                    </div>

                    {/* Bulk controls actions */}
                    {bulkQueue.length > 0 && (
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 select-none">
                        <button
                          onClick={() => setShowUploadModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleStartBulkProcessing}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Trigger Batch Digitize Ingest</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. POPUP MODAL: DEEP COMPREHENSIVE INTERACTIVE PREVIEW PANEL */}
      <AnimatePresence>
        {activePreviewFile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
                isFullscreenPreview ? 'h-full max-h-screen max-w-full rounded-none' : 'max-h-[92vh] max-w-6xl'
              }`}
            >
              
              {/* Previewer Header control */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-4 justify-between items-center border-b border-slate-250 dark:border-slate-805 select-none">
                <div className="flex items-center gap-2">
                  {getFileIcon(activePreviewFile.type)}
                  <div>
                    <h3 className="font-extrabold text-[13px] text-slate-800 dark:text-slate-100">
                      Archive Document: {activePreviewFile.name}
                    </h3>
                    <p className="text-[10px] text-slate-450 font-mono font-bold uppercase tracking-wider">
                      Physical cabinet registry serial: {activePreviewFile.hardCopyDetails.fileSerial}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-800">
                  {/* Zoom controls */}
                  <button 
                    onClick={() => setPreviewZoom(z => Math.max(50, z - 25))} 
                    className="p-1 px-2 hover:bg-white dark:hover:bg-slate-800 rounded font-bold text-xs"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-[10px] px-1.5 font-bold font-mono">{previewZoom}%</span>
                  <button 
                    onClick={() => setPreviewZoom(z => Math.min(200, z + 25))} 
                    className="p-1 px-2 hover:bg-white dark:hover:bg-slate-805 rounded font-bold text-xs"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>

                {/* Grid utility actions */}
                <div className="flex items-center gap-2 select-none text-slate-500">
                  <button
                    onClick={() => setPreviewRotate(r => (r + 90) % 360)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Rotate Scanned Document Image"
                  >
                    <RotateCcw className="w-4 h-4 rotate-180" />
                  </button>
                  <button 
                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setActivePreviewFile(null)}
                    className="p-1.5 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-955 text-slate-400 rounded-lg cursor-pointer transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Core container splitter */}
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
                
                {/* Left Side: Visual simulation container */}
                <div className="lg:col-span-7 bg-slate-200 dark:bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto relative min-h-[350px]">
                  
                  {/* Visual Filter board for scans */}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10 opacity-70 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewFilters(pf => ({ ...pf, grayscale: !pf.grayscale }))}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all border ${
                        previewFilters.grayscale 
                          ? 'bg-slate-800 border-slate-705 text-white' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      B&W Scan Filter
                    </button>
                    <button
                      onClick={() => setPreviewFilters(pf => ({ ...pf, contrast: !pf.contrast }))}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all border ${
                        previewFilters.contrast 
                          ? 'bg-slate-800 border-slate-755 text-white' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Contrast Enhance
                    </button>
                  </div>

                  {/* Scanned copies representations based on types */}
                  <div className="flex-1 flex items-center justify-center p-3">
                    <div 
                      className="bg-white text-slate-900 border border-slate-350 dark:border-slate-800 w-full max-w-lg p-6 rounded-lg relative shadow-inner text-left overflow-y-auto aspect-[1/1.4] transition-all duration-200"
                      style={{
                        transform: `scale(${previewZoom / 100}) rotate(${previewRotate}deg)`,
                        transformOrigin: 'center center',
                        filter: `
                          ${previewFilters.grayscale ? 'grayscale(100%)' : ''}
                          ${previewFilters.contrast ? 'contrast(170%) brightness(110%)' : ''}
                        `
                      }}
                    >
                      {/* Authenticity DIU Seal Watermark inside PDF/JPG */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-7 pointer-events-none select-none">
                        <div className="border-[8px] border-emerald-500/25 p-4 rounded-full text-center rotate-12 flex flex-col items-center">
                          <p className="text-[11px] font-black tracking-widest text-emerald-500 font-mono">DIU REGISTRY SEAL</p>
                          <p className="text-[9px] font-bold text-emerald-500 font-mono">DIGITAL ARCHIVE SECURE</p>
                        </div>
                      </div>

                      {/* Header standard layout */}
                      <div className="border-b-2 border-double border-slate-300 pb-3 mb-4 text-center">
                        <h4 className="text-[13px] font-black uppercase text-slate-800 font-sans tracking-wide">
                          Daffodil International University (DIU)
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 font-sans tracking-wide uppercase">
                          Central Filing Repository & Scanned Soft Archives
                        </p>
                        <p className="text-[8px] text-slate-400 font-mono mt-1">
                          Node: SERVER-WEST-L1 • AuthToken: SYS-A989C
                        </p>
                      </div>

                      {/* Decoded/extracted representation based on document category */}
                      <div className="space-y-4 font-serif text-[11px] leading-relaxed text-slate-750">
                        {activePreviewFile.textContent ? (
                          activePreviewFile.textContent.split('\n').map((line, lIdx) => (
                            <p key={lIdx} className="indent-4">{line}</p>
                          ))
                        ) : (
                          <div className="italic text-slate-500 pt-6 text-center">
                            Scanning physical ledger... No OCR index lines committed.
                          </div>
                        )}
                      </div>

                      {/* Signature layout at the bottom */}
                      <div className="mt-8 pt-4 border-t border-dashed border-slate-250 flex justify-between font-mono text-[9px] select-none">
                        <div>
                          <p className="text-slate-400">Responsible Official:</p>
                          <p className="font-bold text-slate-700">{activePreviewFile.hardCopyDetails.responsibleEmployee}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Archived Date:</p>
                          <p className="font-bold text-slate-700">2026-05-22 UTC</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Page indexes control */}
                  <div className="flex justify-between items-center bg-slate-900/10 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs font-mono select-none">
                    <button className="px-2 py-1 bg-white/70 hover:bg-white dark:bg-slate-800 rounded font-bold" onClick={() => setPreviewPage(p => Math.max(1, p - 1))}>
                      Prev
                    </button>
                    <span>Page {previewPage} of 1 (Scanned Ledger Single Portfolio)</span>
                    <button className="px-2 py-1 bg-white/70 hover:bg-white dark:bg-slate-800 rounded font-bold" onClick={() => setPreviewPage(p => p)}>
                      Next
                    </button>
                  </div>

                </div>

                {/* Right Side: Deep Metadata Audit logs & Version Ingestion tab */}
                <div className="lg:col-span-5 p-5 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 overflow-y-auto space-y-6">
                  
                  {/* Fast facts metadata panel */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none">Document Specifications</p>
                    
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-250 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-450 block">Ingress File Size</span>
                        <strong className="text-slate-700 dark:text-slate-300">{activePreviewFile.size}</strong>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-250 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-450 block">Ingress Revision</span>
                        <strong className="text-slate-700 dark:text-slate-300">v{activePreviewFile.fileVersion}</strong>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-250 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-450 block">Cabinet Coordinates</span>
                        <strong className="text-indigo-400 font-extrabold text-[11px] block">{activePreviewFile.hardCopyDetails.cabinetNumber} • {activePreviewFile.hardCopyDetails.boxNumber}</strong>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-250 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] text-slate-450 block">Cabinet Shelf Location</span>
                        <strong className="text-indigo-400 font-extrabold text-[11px] block">{activePreviewFile.hardCopyDetails.shelfNumber}</strong>
                      </div>
                    </div>

                    {/* Tags matching */}
                    <div className="flex flex-wrap items-center gap-1.5 select-none pt-1">
                      <span className="text-slate-450 font-mono text-[9px] font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Tags:
                      </span>
                      {activePreviewFile.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 px-2 py-0.2 rounded-md font-mono font-bold text-[9px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* QR details & download button */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                    <QRCodeView value={activePreviewFile.qrData} size={90} />
                    <div className="space-y-2 text-xs">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Phone Camera Link QR</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Physical folder binders QR. Scan with phone to inspect catalog directory lists instantly.
                      </p>
                      
                      <button
                        onClick={() => handleDownloadMock(activePreviewFile)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Soft Copy</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. MULTI VERSION CONTROL HUB TRIGGER PANEL */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-950/20 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>Document File Version Control Hub</span>
                    </p>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto">
                      {activePreviewFile.versionHistory && activePreviewFile.versionHistory.map((v, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1 font-mono text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-500">Version v{v.version}</span>
                            <span className="text-[9px] text-slate-400">{new Date(v.uploadDate).toLocaleDateString()}</span>
                          </div>
                          <p className="font-sans text-[11px] text-slate-600 dark:text-slate-300">
                            {v.note || 'Scanned revision ingest.'}
                          </p>
                          <div className="flex justify-between items-center select-none text-[8px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
                            <span>By: {v.changedBy}</span>
                            <span>SHA: {v.hash}</span>
                          </div>
                        </div>
                      ))}

                      {(!activePreviewFile.versionHistory || activePreviewFile.versionHistory.length === 0) && (
                        <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-850 rounded-xl text-center space-y-1 text-[11px]">
                          <p className="font-bold">v1 Digitized Copy Online</p>
                          <p className="text-[9px] text-slate-500">No older version history has been ingested for this document folder yet.</p>
                        </div>
                      )}
                    </div>

                    {/* Check-in custom new version form */}
                    {currentUser?.role !== 'Viewer' ? (
                      <form onSubmit={handleAddNewVersionSubmit} className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Ingest Newer Document Version Revision</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Reason for revision (e.g., corrected errors...)"
                            value={versionNote}
                            onChange={(e) => setVersionNote(e.target.value)}
                            className="flex-1 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isUploadingNewVersion}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-[11px] rounded-xl cursor-pointer transition-all shrink-0"
                          >
                            {isUploadingNewVersion ? 'Checking-in...' : 'Check-in vNext'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-[9px] text-slate-500 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        * Version Modification disabled: login with Super Admin or Employee rights to checkout and update.
                      </p>
                    )}

                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. POPUP SCREEN: SIMULATED PUBLIC RETRIEVAL HUB DRAWER (QR TARGET GATEWAY) */}
      <AnimatePresence>
        {showQrPublicHub && publicHubCategory && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 50, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border-t-4 border-emerald-500 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left"
            >
              
              {/* Public branding header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-[#0c1322] flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 rounded-2xl text-white">
                    <Smartphone className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      DIU QR Public Access Hub
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest">
                      Matched Category: {publicHubCategory}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowQrPublicHub(false)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close Scanned Session
                </button>
              </div>

              {/* Public list contents */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                
                {/* Search input inside simulated phone portal */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search files in scanned drawer..."
                    value={publicHubSearch}
                    onChange={(e) => setPublicHubSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-slate-750"
                  />
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2 pt-1 border-b border-slate-100/10 pb-1">
                    📂 Digitized Soft Copies in scanned Folder Locker
                  </p>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-850/30 max-h-[350px] overflow-y-auto">
                    {files
                      .filter(f => f.category === publicHubCategory)
                      .filter(f => publicHubSearch === '' || f.name.toLowerCase().includes(publicHubSearch.toLowerCase()))
                      .map(file => (
                        <div 
                          key={file.id} 
                          className="p-3 hover:bg-slate-100/30 dark:hover:bg-slate-950/30 transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-2.5 truncate text-xs flex-1">
                            {getFileIcon(file.type)}
                            <div className="truncate">
                              <p className="font-bold text-slate-705 dark:text-slate-200 truncate pr-2" title={file.name}>
                                {file.name}
                              </p>
                              <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                                Scanned: {new Date(file.uploadDate).toLocaleDateString()} • Ingress Version: v{file.fileVersion}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 select-none">
                            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 px-1.5 py-0.5 rounded font-extrabold uppercase">
                              {file.hardCopyDetails.fileSerial}
                            </span>
                            <button
                              onClick={() => handleDownloadMock(file)}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {files.filter(f => f.category === publicHubCategory).length === 0 && (
                      <p className="p-8 text-center text-xs text-slate-500 italic">No soft files have been digitized inside this locker category yet.</p>
                    )}
                  </div>
                </div>

                <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl flex items-start gap-3 select-none">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Authenticated Scan Tunnel active</p>
                    <p className="text-slate-500 leading-normal">
                      This retrieval gateway allows certified quick verification. Keep barcodes attached to physical files for automated security ledger inspections.
                    </p>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
