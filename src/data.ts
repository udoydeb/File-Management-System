import {
  ShieldCheck,
  Database,
  User,
  Award,
  BookOpen,
  Terminal,
  Layers
} from 'lucide-react';

export const DEPARTMENTS = [
  { id: 'registrar', name: 'Registrar Office', icon: ShieldCheck, color: 'emerald', desc: 'DIU Administrative & graduation seals' },
  { id: 'accounts', name: 'Accounts Office', icon: Database, color: 'blue', desc: 'Student payroll, tuition ledger & audit logs' },
  { id: 'hr', name: 'HR Department', icon: User, color: 'violet', desc: 'Faculty profiles, leave audits & payroll clearances' },
  { id: 'admission', name: 'Admission Office', icon: Award, color: 'indigo', desc: 'DIU intake records, applications, enrollment registries' },
  { id: 'exam', name: 'Exam Controller Office', icon: BookOpen, color: 'rose', desc: 'Grades, exam scripts shelf & syllabus boards' },
  { id: 'cse', name: 'CSE Department', icon: Terminal, color: 'teal', desc: 'Computer Science thesis reports & syllabi logs' },
  { id: 'eee', name: 'EEE Department', icon: Layers, color: 'amber', desc: 'Electrical Engineering faculty dossiers' }
];

export const INITIAL_CATEGORIES = [
  // Registrar
  { id: 'cat-reg-1', departmentId: 'registrar', name: 'Student Records', desc: 'Main intake profiles and clearance registrations' },
  { id: 'cat-reg-2', departmentId: 'registrar', name: 'Transcripts', desc: 'Offices CGPA transcript sheets of academic runs' },
  { id: 'cat-reg-3', departmentId: 'registrar', name: 'Certificates', desc: 'Official graduation credentials and honors diplomas' },
  { id: 'cat-reg-4', departmentId: 'registrar', name: 'Clearance Files', desc: 'Library dues and accounts graduation clearance logs' },
  
  // Accounts
  { id: 'cat-acc-1', departmentId: 'accounts', name: 'Accounts Audits', desc: 'External accounting clearance receipts' },
  { id: 'cat-acc-2', departmentId: 'accounts', name: 'Tuition Fee Logs', desc: 'Student enrollment payments and scholarship waivers' },

  // HR
  { id: 'cat-hr-1', departmentId: 'hr', name: 'Employee Records', desc: 'Lecturer contracts, identity verifications, portfolios' },
  { id: 'cat-hr-2', departmentId: 'hr', name: 'Salary Files', desc: 'Faculty bonuses and payroll disbursements' },
  { id: 'cat-hr-3', departmentId: 'hr', name: 'Leave Applications', desc: 'Maternity, medical and casual dynamic leave dockets' },

  // Admission
  { id: 'cat-adm-1', departmentId: 'admission', name: 'Intake Applications', desc: 'New admissions registration dossiers' },

  // Exam Controller
  { id: 'cat-ex-1', departmentId: 'exam', name: 'Exam Papers', desc: 'Final exams term questions and grade benchmarks' },
  { id: 'cat-ex-2', departmentId: 'exam', name: 'Syllabus Documents', desc: 'DIU standardized academic course syllabi lists' },

  // CSE
  { id: 'cat-cse-1', departmentId: 'cse', name: 'Research Publications', desc: 'CSE Faculty research journals, Springer contributions' },
  { id: 'cat-cse-2', departmentId: 'cse', name: 'Thesis Records', desc: 'DIU Undergrad final year defense transcripts' }
];

export const TEST_DOCUMENT_TEMPLATES = [
  {
    name: "official_transcript_211-15-4029.txt",
    type: "TXT",
    textContent: `DAFFODIL INTERNATIONAL UNIVERSITY
TRANSCRIPT OF ACADEMIC RECORD
Student Name: MD. TANVIR RAHMAN
Student ID: 211-15-4029
Department: Computer Science and Engineering
CGPA: 3.84
Completed Credits: 148
Semester Completed: Fall 2025
Controller of Examinations Academic Verification Seal.`,
    category: "Transcripts",
    department: "registrar"
  },
  {
    name: "faculty_payroll_summary_MAY_2026.csv",
    type: "CSV",
    textContent: `DIU HR PAYROLL CLEARANCE SHEET
Period: May 2026
Employee Accounts Audit Ledger
Staff Ref: DIU-EMP-1029 (Dr. Touhid Bhuiyan)
Base Salary: 1,45,000 BDT
Research Grant Bonus: 15,000 BDT
Total Disbursed: 1,60,000 BDT
Accounts Audit Official Sign-off complete.`,
    category: "Salary Files",
    department: "hr"
  },
  {
    name: "cse_413_software_arch_syllabus.pdf",
    type: "PDF",
    textContent: `DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
Daffodil International University (DIU)
CSE 413: Software Architecture & Design Patterns
Prerequisite: CSE 221
Course outline: Multi-agent systems, client-server proxies, message bus, event drivers, domain design.
Responsible Teacher: Dr. Imran Mahmud`,
    category: "Syllabus Documents",
    department: "exam"
  },
  {
    name: "ieee_multi_agent_cloud_computing_diu.docx",
    type: "DOCX",
    textContent: `JOURNAL OF UNIVERSITY RESEARCH PAPERS
Title: Multi-Agent Cloud Sandboxes for Interactive Classrooms
Authors: Professor S. M. Aminul Islam, CSE Faculty DIU
Abstract: This paper presents real-time Node and React compilation setups designed on distributed server containers. It isolates API calls on isolated ports, enhancing AI student interfaces.
Status: Accepted in Springer Journal 2026`,
    category: "Research Publications",
    department: "cse"
  }
];

export function getDepartmentIcon(id: string) {
  switch (id) {
    case 'registrar': return ShieldCheck;
    case 'accounts': return Database;
    case 'hr': return User;
    case 'admission': return Award;
    case 'exam': return BookOpen;
    case 'cse': return Terminal;
    case 'eee': return Layers;
    default: return ShieldCheck;
  }
}
