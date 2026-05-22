import { LucideIcon } from 'lucide-react';

export interface Department {
  id: string;
  name: string;
  desc: string;
  short: string;
  iconName: string; // Stored as name to allow modular icon mapping
}

export interface Category {
  id: string;
  departmentId: string;
  name: string;
  desc: string;
}

export interface HardCopyDetails {
  cabinetNumber: string;
  shelfNumber: string;
  boxNumber: string;
  fileSerial: string;
  responsibleEmployee: string;
}

export interface UniversityFile {
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
  aiSummary?: string;
  fileVersion: number;
  qrData: string;
  storageHash: string;
  hardCopyDetails: HardCopyDetails;
  textContent: string;
}

export interface BulkUploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  feedback?: string;
  simulatedText: string;
}

export interface FileCheckout {
  id: string;
  fileId: string;
  fileName: string;
  department: string;
  borrowerName: string;
  borrowerId: string;
  takenDate: string;
  dueDate: string;
  returnedDate: string | null;
  status: 'Taken' | 'Returned';
  authorizedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  type: 'success' | 'info' | 'alert';
  title: string;
  message: string;
  read: boolean;
}

// Full admin employee interface
export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  role: 'Super Admin' | 'Department Admin' | 'Employee' | 'Viewer';
  email: string;
  phone: string;
  designation: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  profilePhoto?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ServerAccessLog {
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
