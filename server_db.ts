import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types definition
export interface User {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  role: 'Super Admin' | 'Department Admin' | 'Employee' | 'Viewer';
  email: string;
  phone: string;
  designation: string;
  passwordHash: string;
  salt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  profilePhoto?: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  fullName: string;
  employeeId: string;
  email: string;
  role: string;
  departmentId: string;
  action: string;
  details: string;
  ip: string;
  device: string;
  status: 'Success' | 'Failed';
}

export interface Category {
  id: string;
  departmentId: string;
  name: string;
  desc: string;
  slug: string;
  qr_url?: string;
}

export interface UniversityFile {
  id: string;
  name: string;
  type: string;
  department: string;
  category: string;
  studentId?: string | null;
  employeeId?: string | null;
  uploadDate: string;
  size: string;
  status: 'Active' | 'Archived' | 'Out' | 'Pending Review' | 'Confidential' | 'Approved';
  tags: string[];
  aiSummary?: string;
  fileVersion: number;
  qrData?: string;
  storageHash?: string;
  hardCopyDetails?: {
    cabinetNumber: string;
    shelfNumber: string;
    boxNumber: string;
    fileSerial: string;
    responsibleEmployee?: string;
  };
  textContent?: string;
  fileUrl?: string;
}

export interface DBStructure {
  users: User[];
  logs: AccessLog[];
  categories: Category[];
  files: UniversityFile[];
}

const DB_FILE = path.join(process.cwd(), 'server_db.json');

// Hashing helper
export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Initial seed data
const initialUsers: User[] = [];

function seedInitialData() {
  const seeds = [
    {
      fullName: 'Udoy Deb',
      employeeId: 'DIU-EMP-001',
      departmentId: 'registrar',
      role: 'Super Admin',
      email: 'admin@daffodilvarsity.edu.bd',
      phone: '+8801711223344',
      designation: 'Director of Central Registry',
      password: 'AdminPassword123!',
      status: 'Approved',
      emailVerified: true,
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80'
    },
    {
      fullName: 'Fahmida Chowdhury',
      employeeId: 'DIU-EMP-002',
      departmentId: 'hr',
      role: 'Department Admin',
      email: 'hr.admin@daffodilvarsity.edu.bd',
      phone: '+8801822334455',
      designation: 'Deputy HR Director',
      password: 'HRAdminPassword123!',
      status: 'Approved',
      emailVerified: true,
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    {
      fullName: 'Dr. Imran Mahmud',
      employeeId: 'DIU-EMP-1029',
      departmentId: 'cse',
      role: 'Employee',
      email: 'imran.cse@daffodilvarsity.edu.bd',
      phone: '+8801933445566',
      designation: 'Associate Professor & CSE Head',
      password: 'CSEEmployee123!',
      status: 'Approved',
      emailVerified: true,
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    },
    {
      fullName: 'Farhana Yasmin',
      employeeId: 'DIU-EMP-2022',
      departmentId: 'accounts',
      role: 'Viewer',
      email: 'yasmin.acc@daffodilvarsity.edu.bd',
      phone: '+8801644556677',
      designation: 'Accounts Auditor',
      password: 'ViewerPassword123!',
      status: 'Approved',
      emailVerified: true,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      fullName: 'Tanvir Rahman',
      employeeId: 'DIU-EMP-4029',
      departmentId: 'registrar',
      role: 'Employee',
      email: 'tanvir.reg@daffodilvarsity.edu.bd',
      phone: '+8801555667788',
      designation: 'Assistant Registrar Officer',
      password: 'TanvirPassword123!',
      status: 'Pending',
      emailVerified: false,
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  ];

  return seeds.map(s => {
    const salt = generateSalt();
    return {
      id: `usr-${s.employeeId.toLowerCase()}`,
      fullName: s.fullName,
      employeeId: s.employeeId,
      departmentId: s.departmentId,
      role: s.role as any,
      email: s.email,
      phone: s.phone,
      designation: s.designation,
      salt: salt,
      passwordHash: hashPassword(s.password, salt),
      status: s.status as any,
      profilePhoto: s.profilePhoto,
      emailVerified: s.emailVerified,
      createdAt: new Date().toISOString()
    };
  });
}

function seedCategories(): Category[] {
  const initial = [
    { id: 'cat-reg-1', departmentId: 'registrar', name: 'Student Records', desc: 'Main intake profiles and clearance registrations' },
    { id: 'cat-reg-2', departmentId: 'registrar', name: 'Transcripts', desc: 'Offices CGPA transcript sheets of academic runs' },
    { id: 'cat-reg-3', departmentId: 'registrar', name: 'Certificates', desc: 'Official graduation credentials and honors diplomas' },
    { id: 'cat-reg-4', departmentId: 'registrar', name: 'Clearance Files', desc: 'Library dues and accounts graduation clearance logs' },
    { id: 'cat-acc-1', departmentId: 'accounts', name: 'Accounts Audits', desc: 'External accounting clearance receipts' },
    { id: 'cat-acc-2', departmentId: 'accounts', name: 'Tuition Fee Logs', desc: 'Student enrollment payments and scholarship waivers' },
    { id: 'cat-hr-1', departmentId: 'hr', name: 'Employee Records', desc: 'Lecturer contracts, identity verifications, portfolios' },
    { id: 'cat-hr-2', departmentId: 'hr', name: 'Salary Files', desc: 'Faculty bonuses and payroll disbursements' },
    { id: 'cat-hr-3', departmentId: 'hr', name: 'Leave Applications', desc: 'Maternity, medical and casual dynamic leave dockets' },
    { id: 'cat-adm-1', departmentId: 'admission', name: 'Intake Applications', desc: 'New admissions registration dossiers' },
    { id: 'cat-ex-1', departmentId: 'exam', name: 'Exam Papers', desc: 'Final exams term questions and grade benchmarks' },
    { id: 'cat-ex-2', departmentId: 'exam', name: 'Syllabus Documents', desc: 'DIU standardized academic course syllabi lists' },
    { id: 'cat-cse-1', departmentId: 'cse', name: 'Research Publications', desc: 'CSE Faculty research journals, Springer contributions' },
    { id: 'cat-cse-2', departmentId: 'cse', name: 'Thesis Records', desc: 'DIU Undergrad final year defense transcripts' }
  ];

  return initial.map(c => {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      ...c,
      slug,
      qr_url: `https://archive.diu.edu.bd/category/${slug}?id=${c.id}`
    };
  });
}

function seedUniversityFiles(): UniversityFile[] {
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
      qrData: 'https://archive.diu.edu.bd/category/transcripts?id=cat-reg-2',
      storageHash: 'c3ab8e90e1a123ffb90988ccdedaa91a457a1b',
      hardCopyDetails: {
        cabinetNumber: 'CAB-A',
        shelfNumber: 'Shelf 2',
        boxNumber: 'Box 12',
        fileSerial: 'DIU-SRL-4809',
        responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff'
      },
      textContent: 'Transcript grades records verification.',
      fileUrl: 'https://archive.diu.edu.bd/files/file-01'
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
      qrData: 'https://archive.diu.edu.bd/category/salary-files?id=cat-hr-2',
      storageHash: 'a98f10ea5cd109fabcd091aa38cc911bcdafe23',
      hardCopyDetails: {
        cabinetNumber: 'CAB-C',
        shelfNumber: 'Shelf 3',
        boxNumber: 'Box 15',
        fileSerial: 'DIU-SRL-1029',
        responsibleEmployee: 'Tanveer Hasan / HR Officer'
      },
      textContent: 'Salary payroll transaction spreadsheet.',
      fileUrl: 'https://archive.diu.edu.bd/files/file-02'
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
      qrData: 'https://archive.diu.edu.bd/category/exam-papers?id=cat-ex-1',
      storageHash: '1e2e3ffba01a23eec780a1ccee89f9e0ab2ea01',
      hardCopyDetails: {
        cabinetNumber: 'CAB-E',
        shelfNumber: 'Shelf 1',
        boxNumber: 'Box 41',
        fileSerial: 'DIU-SRL-4130',
        responsibleEmployee: 'Dr. Imran Mahmud / CSE Controller'
      },
      textContent: 'Design patterns and multi-agent exams.',
      fileUrl: 'https://archive.diu.edu.bd/files/file-03'
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
      qrData: 'https://archive.diu.edu.bd/category/clearance-files?id=cat-reg-4',
      storageHash: '7a12bcde0ef45b911ee67a8ccd810a9fdeba40',
      hardCopyDetails: {
        cabinetNumber: 'CAB-B',
        shelfNumber: 'Shelf 4',
        boxNumber: 'Box 22',
        fileSerial: 'DIU-SRL-2015',
        responsibleEmployee: 'Fahmida Chowdhury / Registrar Staff'
      },
      textContent: 'Graduation clearance approvals.',
      fileUrl: 'https://archive.diu.edu.bd/files/file-04'
    }
  ];
}

// Read database
export function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Ensure users exists
      if (data && Array.isArray(data.users)) {
        if (!data.categories || !Array.isArray(data.categories)) {
          data.categories = seedCategories();
        }
        if (!data.files || !Array.isArray(data.files)) {
          data.files = seedUniversityFiles();
        }
        return data as DBStructure;
      }
    }
  } catch (err) {
    console.error('Failed to read DB file, using fallback', err);
  }
  
  // Create default db
  const defaultDB: DBStructure = {
    users: seedInitialData(),
    logs: [
      {
        id: 'log-seed-1',
        timestamp: new Date().toISOString(),
        fullName: 'System',
        employeeId: 'SYSTEM',
        email: 'sys@daffodilvarsity.edu.bd',
        role: 'Super Admin',
        departmentId: 'registrar',
        action: 'DB_INITIALIZATION',
        details: 'Initial seeded core university database launched successfully',
        ip: '127.0.0.1',
        device: 'Node.js Production Server',
        status: 'Success'
      }
    ],
    categories: seedCategories(),
    files: seedUniversityFiles()
  };

  writeDB(defaultDB);
  return defaultDB;
}

// Write database
export function writeDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write DB file', err);
  }
}

// Load DB helper
let dbCache: DBStructure = readDB();

export function getDB(): DBStructure {
  // Sync reading in case other processes updated it
  dbCache = readDB();
  return dbCache;
}

export function saveChanges(updated: DBStructure) {
  dbCache = updated;
  writeDB(updated);
}
