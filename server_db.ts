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

interface DBStructure {
  users: User[];
  logs: AccessLog[];
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

// Read database
export function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Ensure users exists
      if (data && Array.isArray(data.users)) {
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
    ]
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
