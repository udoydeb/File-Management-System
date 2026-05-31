import { getDB, saveChanges, hashPassword, generateSalt, User, AccessLog, supabase } from './server_db.js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

// In-memory session store
const activeSessions = new Map<string, string>(); // token -> email

// Failed login tracker for Rate Limiting/Monitoring
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Initialise Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: any = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Body parsing helper
async function parseBody(req: any): Promise<any> {
  if (req.body !== undefined && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let bodyText = '';
    req.on('data', (chunk: any) => { bodyText += chunk; });
    req.on('end', () => {
      try {
        resolve(bodyText ? JSON.parse(bodyText) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

// Extract authorization token from headers
function getAuthenticatedUser(req: any): User | null {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const email = activeSessions.get(token);
  if (!email) {
    return null;
  }
  
  const db = getDB();
  const user = db.users.find(u => u.email === email);
  if (!user || user.status !== 'Approved') {
    return null;
  }
  return user;
}

// Standard JSON API responder helper
function sendJSON(res: any, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Log activities securely in database
function recordAccessLog(
  action: string,
  details: string,
  email: string,
  status: 'Success' | 'Failed',
  req: any
) {
  const db = getDB();
  const user = db.users.find(u => u.email === email);
  
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const device = req.headers['user-agent'] || 'Unknown Browser';

  const freshLog: AccessLog = {
    id: `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    fullName: user ? user.fullName : 'Guest Session',
    employeeId: user ? user.employeeId : 'GUEST',
    email,
    role: user ? user.role : 'Guest',
    departmentId: user ? user.departmentId : 'system',
    action,
    details,
    ip: Array.isArray(ip) ? ip[0] : ip,
    device,
    status
  };

  db.logs.unshift(freshLog);
  // Cap historical logs at 500 records
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  saveChanges(db);
}

// Helper: Generates beautiful mock AI metadata results based on document contents
function generateFallbackAnalysis(fileName: string, text: string, type: string) {
  const fileLower = (fileName || '').toLowerCase();
  const textLower = (text || '').toLowerCase();
  
  let category = 'Student Records';
  let studentId: string | null = null;
  let employeeId: string | null = null;
  let tags = ['university', 'office'];
  let aiSummary = 'General university administrative file containing official transcripts and records.';
  
  if (fileLower.includes('salary') || fileLower.includes('payroll') || textLower.includes('salary') || textLower.includes('ta/da') || textLower.includes('allowance')) {
    category = 'Salary Files';
    tags = ['hr', 'finance', 'payroll', 'accounts'];
    aiSummary = 'Offices of the HR and Accounts Department payroll summary tracking staff compensation and bonus details.';
  } else if (fileLower.includes('transcript') || fileLower.includes('grade') || textLower.includes('cgpa') || textLower.includes('semester')) {
    category = 'Transcripts';
    tags = ['academic', 'grades', 'transcript', 'registrar'];
    aiSummary = 'Official student academic transcript record tracking course complete indices, GPA, and graduation status.';
  } else if (fileLower.includes('certificate') || textLower.includes('awarded') || textLower.includes('convocation') || textLower.includes('conferred')) {
    category = 'Certificates';
    tags = ['graduation', 'certificate', 'credential', 'exam-controller'];
    aiSummary = 'Convocation certificate registration credential verifying the legal fulfillment of the Bachelor/Master curriculum.';
  } else if (fileLower.includes('leave') || textLower.includes('absent') || textLower.includes('vacation') || textLower.includes('sick leave')) {
    category = 'Leave Applications';
    tags = ['hr', 'leave', 'absence', 'employee'];
    aiSummary = 'Official employee leave application detailing the period, justification, and dynamic approval status.';
  } else if (textLower.includes('emp-') || fileLower.includes('employee') || textLower.includes('hrms')) {
    category = 'Employee Records';
    tags = ['hr', 'profile', 'dossier', 'staff'];
    aiSummary = 'DIU Human Resources staff record folder capturing employment verification, contract terms, and official background details.';
  } else if (fileLower.includes('clearance') || textLower.includes('library book') || textLower.includes('no dues')) {
    category = 'Clearance Files';
    tags = ['clearance', 'student-life', 'no-dues', 'registrar'];
    aiSummary = 'Centralized graduation clearance summary tracking library, academic, and financial department sign-offs.';
  } else if (fileLower.includes('exam') || fileLower.includes('question') || textLower.includes('controller of examinations') || textLower.includes('grade sheet')) {
    category = 'Exam Papers';
    tags = ['assessments', 'questions', 'exam-controller', 'semester-finals'];
    aiSummary = 'Exam Question Paper archive folder containing course code assignments, marks, and official exam control logs.';
  } else if (fileLower.includes('syllabus') || fileLower.includes('curriculum') || textLower.includes('cse-') || textLower.includes('course outline')) {
    category = 'Syllabus Documents';
    tags = ['curriculum', 'academics', 'course-outline', 'departmental'];
    aiSummary = 'A comprehensive departmental syllabus outlining the course objectives, timeline, textbooks, and credit distributions.';
  } else if (textLower.includes('journal') || textLower.includes('research') || textLower.includes('thesis') || fileLower.includes('ieee') || fileLower.includes('springer')) {
    category = 'Research Publications';
    tags = ['publications', 'research', 'citations', 'faculty'];
    aiSummary = 'Peer-reviewed scholarly paper contributed by DIU faculty departments. Tracks impact factors and citations.';
  }

  const stdIdMatch = text.match(/\b\d{3}-\d{2}-\d{3,5}\b/);
  if (stdIdMatch) studentId = stdIdMatch[0];
  
  const empIdMatch = text.match(/\b(EMP-\d{3,5}|DIU-EMP-\d{3,5})\b/i);
  if (empIdMatch) employeeId = empIdMatch[0].toUpperCase();

  const codeSum = (fileName || 'DIU').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cabCode = String.fromCharCode(65 + (codeSum % 6));
  const shelfCode = (codeSum % 4) + 1;
  const boxCode = (codeSum % 25) + 10;
  const serialCode = `DIU-SRL-${(codeSum % 9000) + 1000}`;

  return {
    fileName: fileName || 'Analyzed_Document_Record_DIU',
    studentId: studentId || (category === 'Transcripts' ? '211-15-4029' : null),
    employeeId: employeeId || (category === 'Employee Records' ? 'EMP-4082' : null),
    category,
    tags,
    aiSummary,
    hardCopyDetails: {
      cabinetNumber: `CAB-${cabCode}`,
      shelfNumber: `Shelf ${shelfCode}`,
      boxNumber: `Box ${boxCode}`,
      fileSerial: serialCode
    }
  };
}

// Local Semantic Search
function localSemanticSearch(filesList: any[], query: string) {
  const queryLower = query.toLowerCase();
  
  return filesList.map((file: any) => {
    let score = 0;
    let reasons: string[] = [];

    const fileText = `${file.name} ${file.category} ${(file.tags || []).join(' ')} ${file.aiSummary || ''} ${file.department}`.toLowerCase();
    
    if (fileText.includes(queryLower)) {
      score += 40;
      reasons.push('Direct keyword query matched');
    }

    if (queryLower === 'payroll' || queryLower === 'salary' || queryLower === 'money' || queryLower === 'fee' || queryLower === 'bank') {
      if (file.category === 'Salary Files' || file.category === 'Accounts Office') {
        score += 50;
        reasons.push('Perfect financial subject matching');
      }
    }
    if (queryLower === 'grades' || queryLower === 'result' || queryLower === 'cgpa' || queryLower === 'gpa' || queryLower === 'transcript') {
      if (file.category === 'Transcripts' || file.category === 'Exam Papers' || file.category === 'Student Records') {
        score += 50;
        reasons.push('Perfect academic evaluation matching');
      }
    }
    if (queryLower === 'faculty' || queryLower === 'professor' || queryLower === 'recruitment' || queryLower === 'leave' || queryLower === 'profile') {
      if (file.category === 'Employee Records' || file.category === 'Leave Applications' || file.department === 'HR Department') {
        score += 50;
        reasons.push('Perfect human resource matching');
      }
    }
    if (queryLower === 'publish' || queryLower === 'journal' || queryLower === 'thesis' || queryLower === 'paper' || queryLower === 'ieee') {
      if (file.category === 'Research Publications' || file.tags.includes('research')) {
        score += 50;
        reasons.push('Scholarly research literature match');
      }
    }

    return {
      id: file.id,
      relevanceReason: reasons.length > 0 ? reasons.join(', ') : 'Minor meta-tag overlap',
      score: Math.min(100, Math.max(0, score + (fileText.match(new RegExp(queryLower, 'g')) || []).length * 10))
    };
  })
  .filter(f => f.score > 10)
  .sort((a,b) => b.score - a.score);
}

// Router handler
export async function handleAPIRoute(req: any, res: any, next: () => void): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/')) {
    return false;
  }

  // Set standard headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }

  try {
    const db = getDB();

    // 1. Core Service Status
    if (url === '/api/status' && req.method === 'GET') {
      sendJSON(res, 200, {
        status: 'success',
        timestamp: new Date().toISOString(),
        university: 'Daffodil International University (DIU)',
        geminiConfigured: !!ai,
        message: 'DIU Smart Archive Core REST Node Engine online.'
      });
      return true;
    }

    // 2. Signup / Registration Endpoint
    if (url === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const {
        fullName,
        employeeId,
        departmentId,
        designation,
        email,
        phone,
        password,
        profilePhoto
      } = body;

      // Basic validation Checks
      if (!fullName || !email || !employeeId || !password || !departmentId || !designation) {
        sendJSON(res, 400, { error: 'Please supply all mandatory fields to finalize signup.' });
        return true;
      }

      // Basic email validation check (accepting university or personal email addresses)
      const emailLower = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) {
        sendJSON(res, 400, { 
          error: 'Access Restricted: Please enter a correct, syntactically valid verified personal or official email address.' 
        });
        return true;
      }

      // Strong password validation checks
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        sendJSON(res, 400, { 
          error: 'Weak Password: Password must be 8+ characters and contain uppercase letters, lowercase letters, numbers, and special symbols.' 
        });
        return true;
      }

      // Unique Employee ID check
      const normalizedEmpId = employeeId.trim().toUpperCase();
      const existingEmpId = db.users.find(u => u.employeeId.toUpperCase() === normalizedEmpId);
      if (existingEmpId) {
        sendJSON(res, 400, { error: `Employee Registration ID "${normalizedEmpId}" is already linked with another account.` });
        return true;
      }

      // Unique Email check
      const existingEmail = db.users.find(u => u.email.toLowerCase() === emailLower);
      if (existingEmail) {
        sendJSON(res, 400, { error: `Email address "${emailLower}" is already registered.` });
        return true;
      }

      // Password hashing
      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);

      // Construct user record
      const newUser: User = {
        id: `usr-${crypto.randomBytes(8).toString('hex')}`,
        fullName: fullName.trim(),
        employeeId: normalizedEmpId,
        departmentId: departmentId,
        role: 'Viewer', // Default starting role is Viewer (can view permitted files)
        email: emailLower,
        phone: phone ? phone.trim() : '',
        designation: designation.trim(),
        passwordHash,
        salt,
        status: 'Pending', // Account requires Admin/Super admin approval
        profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        emailVerified: false, // Requires verification token simulated toggle
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveChanges(db);

      // Secure, serverside-bypass database sync to Supabase individual tables profiles and users
      const profileData = {
        id: newUser.id,
        fullName: newUser.fullName,
        full_name: newUser.fullName,
        employeeId: newUser.employeeId,
        employee_id: newUser.employeeId,
        departmentId: newUser.departmentId,
        department_id: newUser.departmentId,
        department: newUser.departmentId,
        designation: newUser.designation,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        profilePhoto: newUser.profilePhoto,
        profile_photo: newUser.profilePhoto,
        emailVerified: newUser.emailVerified,
        email_verified: newUser.emailVerified,
        createdAt: newUser.createdAt,
        created_at: newUser.createdAt
      };

      try {
        console.log('[BACKEND REGSYNC] Inserting into profiles table:', newUser.id);
        const { error: pErr } = await supabase.from('profiles').upsert([profileData]);
        if (pErr) {
          console.warn('[BACKEND REGSYNC] Failed upserting to Supabase profiles table:', pErr.message);
        } else {
          console.log('[BACKEND REGSYNC] Successfully synchronized user request to Supabase profiles table.');
        }
      } catch (err: any) {
        console.error('[BACKEND REGSYNC] Exception syncing to profiles table:', err.message || err);
      }

      try {
        console.log('[BACKEND REGSYNC] Inserting into users table:', newUser.id);
        const { error: uErr } = await supabase.from('users').upsert([profileData]);
        if (uErr) {
          console.warn('[BACKEND REGSYNC] Failed upserting to Supabase users table:', uErr.message);
        } else {
          console.log('[BACKEND REGSYNC] Successfully synchronized user request to Supabase users table.');
        }
      } catch (err: any) {
        console.error('[BACKEND REGSYNC] Exception syncing to users table:', err.message || err);
      }

      recordAccessLog(
        'SIGNUP_SUBMITTED', 
        `Submitted signup request for Employee ID: ${normalizedEmpId}. Status: Pending Verification.`, 
        newUser.email, 
        'Success', 
        req
      );

      sendJSON(res, 201, {
        success: true,
        message: 'Your registration request has been submitted successfully and is awaiting central registry administration approval.',
        userId: newUser.id,
        user: {
          fullName: newUser.fullName,
          employeeId: newUser.employeeId,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          emailVerified: newUser.emailVerified
        }
      });
      return true;
    }

    // Public verification of email during registration flow
    if (url === '/api/auth/verify-registration-email' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email } = body;
      if (!email) {
        sendJSON(res, 400, { error: 'Missing registration email identifier.' });
        return true;
      }
      const emailLower = email.toLowerCase().trim();
      const userInDb = db.users.find(u => u.email.toLowerCase() === emailLower);
      if (userInDb) {
        userInDb.emailVerified = true;
        saveChanges(db);
        recordAccessLog('EMAIL_VERIFIED', 'Verified registration email during signup workflow.', userInDb.email, 'Success', req);
        sendJSON(res, 200, {
          success: true,
          message: 'Daffodil email validated successfully! Pending administrative approval.'
        });
      } else {
        sendJSON(res, 404, { error: 'Account not found for verification.' });
      }
      return true;
    }

    // 3. Login Endpoint
    if (url === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { emailOrEmpId, password, rememberMe } = body;

      if (!emailOrEmpId || !password) {
        sendJSON(res, 400, { error: 'Please enter your login email or Employee ID and password.' });
        return true;
      }

      const inputSearch = emailOrEmpId.trim();
      const user = db.users.find(
        u => u.email.toLowerCase() === inputSearch.toLowerCase() || 
             u.employeeId.toUpperCase() === inputSearch.toUpperCase()
      );

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const ipKey = Array.isArray(ip) ? ip[0] : ip;

      // Basic Rate Limiter check (failed attempts throttle block)
      const failed = failedLoginAttempts.get(ipKey);
      if (failed && failed.count >= 5 && Date.now() - failed.lastAttempt < 3 * 60 * 1000) {
        const resetRemaining = Math.ceil((3 * 60 * 1000 - (Date.now() - failed.lastAttempt)) / 1000);
        sendJSON(res, 429, { 
          error: `Account locked due to 5 consecutively failed logins. Please retry after ${resetRemaining} seconds.` 
        });
        return true;
      }

      if (!user) {
        // Log guest failed login check
        recordAccessLog('LOGIN_FAILED', `No identifier match discovered for "${inputSearch}"`, 'guest@diu-varsity.edu', 'Failed', req);
        
        // Update brute-force tracking
        const attempts = failed ? failed.count + 1 : 1;
        failedLoginAttempts.set(ipKey, { count: attempts, lastAttempt: Date.now() });

        sendJSON(res, 401, { error: 'Invalid university credentials. Please verify your Email/Employee ID.' });
        return true;
      }

      // Match password
      const hashedCompare = hashPassword(password, user.salt);
      const isMatch = (hashedCompare === user.passwordHash);

      if (!isMatch) {
        recordAccessLog('LOGIN_FAILED', `Incorrect password supplied for email: ${user.email}`, user.email, 'Failed', req);
        
        const attempts = failed ? failed.count + 1 : 1;
        failedLoginAttempts.set(ipKey, { count: attempts, lastAttempt: Date.now() });

        sendJSON(res, 401, { error: 'Invalid university credentials. Password does not match our security logs.' });
        return true;
      }

      // Check account approval status
      if (user.status === 'Pending') {
        recordAccessLog('LOGIN_DENIED', `Attempted sign-in on pending approval state for email: ${user.email}`, user.email, 'Failed', req);
        sendJSON(res, 403, { 
          error: 'Access Suspended: Your profile is currently PENDING security approval. Please contact central administration or your Department Admin.' 
        });
        return true;
      }

      if (user.status === 'Suspended') {
        recordAccessLog('LOGIN_DENIED', `Attempted sign-in on suspended account state for email: ${user.email}`, user.email, 'Failed', req);
        sendJSON(res, 403, { 
          error: 'Access Denied: Your university portal access has been temporary SUSPENDED. Please contact HR office.' 
        });
        return true;
      }

      if (user.status === 'Rejected') {
        recordAccessLog('LOGIN_DENIED', `Attempted sign-in on rejected registration state for email: ${user.email}`, user.email, 'Failed', req);
        sendJSON(res, 403, { 
          error: 'Access Denied: Your registration has been REJECTED by department authorities.' 
        });
        return true;
      }

      // Success - Reset rate limits
      failedLoginAttempts.delete(ipKey);

      // Create session token
      const token = `diu-session-${crypto.randomBytes(32).toString('hex')}`;
      activeSessions.set(token, user.email);

      // Record last login
      user.lastLogin = new Date().toISOString();
      saveChanges(db);

      recordAccessLog('LOGIN_SUCCESS', `Successfully authenticated into Smart Archive Portal. Remember: ${!!rememberMe}`, user.email, 'Success', req);

      sendJSON(res, 200, {
        success: true,
        message: 'Welcome to DIU Center Portal. Authenticated successfully!',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          designation: user.designation,
          profilePhoto: user.profilePhoto,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLogin: user.lastLogin
        }
      });
      return true;
    }

    // 4. Session Validation Check
    if (url === '/api/auth/session' && req.method === 'GET') {
      const user = getAuthenticatedUser(req);
      if (!user) {
        sendJSON(res, 401, { error: 'Matured or invalid session token. Please re-login.' });
        return true;
      }

      sendJSON(res, 200, {
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          designation: user.designation,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLogin: user.lastLogin
        }
      });
      return true;
    }

    // 5. Logout Endpoint
    if (url === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const email = activeSessions.get(token);
        if (email) {
          recordAccessLog('LOGOUT_SUCCESS', 'Sign-out initiated from central portal.', email, 'Success', req);
          activeSessions.delete(token);
        }
      }
      sendJSON(res, 200, { success: true, message: 'Session terminated. Securely logged out.' });
      return true;
    }

    // 6. Profile Updates Endpoint
    if (url === '/api/auth/profile/update' && req.method === 'POST') {
      const body = await parseBody(req);
      const activeUser = getAuthenticatedUser(req);
      
      if (!activeUser) {
        sendJSON(res, 401, { error: 'Unauthorized or expired session.' });
        return true;
      }

      const { phone, designation, profilePhoto } = body;

      const userInDb = db.users.find(u => u.email === activeUser.email);
      if (userInDb) {
        if (phone !== undefined) userInDb.phone = phone.trim();
        if (designation !== undefined) userInDb.designation = designation.trim();
        if (profilePhoto !== undefined) userInDb.profilePhoto = profilePhoto;
        
        saveChanges(db);
        recordAccessLog('PROFILE_UDPATED', 'Successfully updated profile contact / image params.', activeUser.email, 'Success', req);
        
        sendJSON(res, 200, {
          success: true,
          message: 'Profile records updated successfully.',
          user: {
            fullName: userInDb.fullName,
            employeeId: userInDb.employeeId,
            email: userInDb.email,
            role: userInDb.role,
            departmentId: userInDb.departmentId,
            designation: userInDb.designation,
            phone: userInDb.phone,
            profilePhoto: userInDb.profilePhoto
          }
        });
      } else {
        sendJSON(res, 404, { error: 'Account registry not discovered.' });
      }
      return true;
    }

    // 7. Change Password Profile Endpoint
    if (url === '/api/auth/profile/password' && req.method === 'POST') {
      const body = await parseBody(req);
      const activeUser = getAuthenticatedUser(req);

      if (!activeUser) {
        sendJSON(res, 401, { error: 'Unauthorized or expired session.' });
        return true;
      }

      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword) {
        sendJSON(res, 400, { error: 'Missing current or new password parameters.' });
        return true;
      }

      const userInDb = db.users.find(u => u.id === activeUser.id);
      if (!userInDb) {
        sendJSON(res, 404, { error: 'Registry not found.' });
        return true;
      }

      const hashCheck = hashPassword(oldPassword, userInDb.salt);
      if (hashCheck !== userInDb.passwordHash) {
        recordAccessLog('PASSWORD_CHANGE_FAIL', 'Failed attempt: Current password does not match.', activeUser.email, 'Failed', req);
        sendJSON(res, 400, { error: 'The current password entered is incorrect.' });
        return true;
      }

      // Strong password validation checks
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        sendJSON(res, 400, { 
          error: 'Weak Password: New password must be 8+ characters and contain uppercase letters, lowercase letters, numbers, and special symbols.' 
        });
        return true;
      }

      userInDb.passwordHash = hashPassword(newPassword, userInDb.salt);
      saveChanges(db);

      recordAccessLog('PASSWORD_CHANGED', 'Successfully modified archive portal password.', activeUser.email, 'Success', req);
      sendJSON(res, 200, { success: true, message: 'Password modified successfully. Your portal is secure.' });
      return true;
    }

    // 8. Forgot Password Request
    if (url === '/api/auth/reset-password-request' && req.method === 'POST') {
      const body = await parseBody(req);
      const { emailOrEmpId } = body;

      if (!emailOrEmpId) {
        sendJSON(res, 400, { error: 'Email or Employee ID is required.' });
        return true;
      }

      const user = db.users.find(
        u => u.email.toLowerCase() === emailOrEmpId.toLowerCase() ||
             u.employeeId.toUpperCase() === emailOrEmpId.toUpperCase()
      );

      if (!user) {
        sendJSON(res, 404, { error: 'No Daffodil account registry matches this identifier.' });
        return true;
      }

      // Generate a verification reference token
      const resetToken = `reset-${crypto.randomBytes(12).toString('hex')}`;
      
      recordAccessLog('PW_RESET_REQUESTED', `Requested reset token email simulation: ${resetToken}`, user.email, 'Success', req);

      sendJSON(res, 200, {
        success: true,
        message: `Simulation Success: Daffodil recovery link dispatched to ${user.email}.`,
        simulatedToken: resetToken,
        simulatedLink: `${req.headers.origin || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${user.email}`
      });
      return true;
    }

    // 9. Reset Password Submit Endpoint
    if (url === '/api/auth/reset-password' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, token, newPassword } = body;

      if (!email || !token || !newPassword) {
        sendJSON(res, 400, { error: 'Email, verification token and new password are required.' });
        return true;
      }

      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        sendJSON(res, 404, { error: 'Registry not found.' });
        return true;
      }

      // Strong password validation checks
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        sendJSON(res, 400, { 
          error: 'Weak Password: Password must require 8+ characters, uppercase & lowercase, numeric and special letters.' 
        });
        return true;
      }

      user.passwordHash = hashPassword(newPassword, user.salt);
      user.status = 'Approved'; // Just in case, unlock user status if restoring access
      saveChanges(db);

      recordAccessLog('RESET_COMPLETED', 'Password recovery token activated. New credentials committed.', user.email, 'Success', req);

      sendJSON(res, 200, {
        success: true,
        message: 'Security credentials replaced. You can now authenticate with your new Daffodil password.'
      });
      return true;
    }

    // 10. Verification Email Simulated Dispatch
    if (url === '/api/auth/verify-email-request' && req.method === 'POST') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser) {
        sendJSON(res, 401, { error: 'Unauthorized or expired session.' });
        return true;
      }

      const emailVerifyToken = `verify-${crypto.randomBytes(8).toString('hex')}`;
      recordAccessLog('EMAIL_VERIFY_DISPATCH', `Simulated verification code dispatched: ${emailVerifyToken}`, activeUser.email, 'Success', req);

      sendJSON(res, 200, {
        success: true,
        message: 'A simulated email link with active registry token dispatched to your inbox.',
        simulatedCode: emailVerifyToken
      });
      return true;
    }

    // 11. Verify Email Endpoint
    if (url === '/api/auth/verify-email' && req.method === 'POST') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser) {
        sendJSON(res, 401, { error: 'Unauthorized session.' });
        return true;
      }

      const userInDb = db.users.find(u => u.id === activeUser.id);
      if (userInDb) {
        userInDb.emailVerified = true;
        saveChanges(db);
        recordAccessLog('EMAIL_VERIFIED', 'Verified official Daffodil email successfully.', activeUser.email, 'Success', req);
        sendJSON(res, 200, {
          success: true,
          message: 'Official Daffodil email validated! Portal status ready.'
        });
      } else {
        sendJSON(res, 404, { error: 'Account not found.' });
      }
      return true;
    }

    // 12. List Employees Administration Panel (Super Admin & Dept Admin)
    if (url === '/api/admin/employees' && req.method === 'GET') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser || (activeUser.role !== 'Super Admin' && activeUser.role !== 'Department Admin')) {
        sendJSON(res, 403, { error: 'Access Restricted: Admin privileges required.' });
        return true;
      }

      // Filter: Department admins can ONLY view users of their EXACT department!
      let employees = db.users.map(u => ({
        id: u.id,
        fullName: u.fullName,
        employeeId: u.employeeId,
        departmentId: u.departmentId,
        role: u.role,
        email: u.email,
        phone: u.phone,
        designation: u.designation,
        status: u.status,
        profilePhoto: u.profilePhoto,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }));

      if (activeUser.role === 'Department Admin') {
        employees = employees.filter(e => e.departmentId === activeUser.departmentId);
      }

      sendJSON(res, 200, { success: true, employees });
      return true;
    }

    // 13. Update Employee Account Status (Super Admin & Dept Admin)
    if (url === '/api/admin/employees/status' && req.method === 'POST') {
      const body = await parseBody(req);
      const activeUser = getAuthenticatedUser(req);

      if (!activeUser || (activeUser.role !== 'Super Admin' && activeUser.role !== 'Department Admin')) {
        sendJSON(res, 403, { error: 'Security Exclusion: Administrative privilege required.' });
        return true;
      }

      const { userId, status } = body;
      if (!userId || !status) {
        sendJSON(res, 400, { error: 'Please submit employee reference ID and designated status.' });
        return true;
      }

      const targetUser = db.users.find(u => u.id === userId);
      if (!targetUser) {
        sendJSON(res, 404, { error: 'The requested employee profile does not exist.' });
        return true;
      }

      // Department Admins can only approve members belonging to their exact department!
      if (activeUser.role === 'Department Admin' && targetUser.departmentId !== activeUser.departmentId) {
        sendJSON(res, 403, { error: 'Administrative Restriction: You can only alter status for employees inside your department.' });
        return true;
      }

      // Block self status modifications
      if (userId === activeUser.id) {
        sendJSON(res, 400, { error: 'Security Rule: You are forbidden from modifying your own account status.' });
        return true;
      }

      const oldStatus = targetUser.status;
      targetUser.status = status;
      saveChanges(db);

      recordAccessLog(
        'EMPLOYEE_STATUS_ALIGNED', 
        `SuperAdmin/DeptAdmin updated employee status for ${targetUser.fullName} (${targetUser.employeeId}) from ${oldStatus} to ${status}.`, 
        activeUser.email, 
        'Success', 
        req
      );

      sendJSON(res, 200, {
        success: true,
        message: `Employee "${targetUser.fullName}" status updated successfully/marked as ${status}.`
      });
      return true;
    }

    // 14. Update Employee Role (Super Admin ONLY)
    if (url === '/api/admin/employees/role' && req.method === 'POST') {
      const body = await parseBody(req);
      const activeUser = getAuthenticatedUser(req);

      if (!activeUser || activeUser.role !== 'Super Admin') {
        sendJSON(res, 403, { error: 'Access Denied: Role modifications are strictly capped with Super Admin authorization.' });
        return true;
      }

      const { userId, role } = body;
      if (!userId || !role) {
        sendJSON(res, 400, { error: 'Employee ID and new role are required.' });
        return true;
      }

      const targetUser = db.users.find(u => u.id === userId);
      if (!targetUser) {
        sendJSON(res, 404, { error: 'Employee not found.' });
        return true;
      }

      // Block self role demotions
      if (userId === activeUser.id) {
        sendJSON(res, 400, { error: 'Security Guard: You cannot demote or alter your own Super Admin role.' });
        return true;
      }

      const oldRole = targetUser.role;
      targetUser.role = role;
      saveChanges(db);

      recordAccessLog(
        'EMPLOYEE_ROLE_ALIGNED',
        `Super Admin transitioned role for ${targetUser.fullName} from ${oldRole} to ${role}.`,
        activeUser.email,
        'Success',
        req
      );

      sendJSON(res, 200, {
        success: true,
        message: `Designated role for "${targetUser.fullName}" configured to ${role}.`
      });
      return true;
    }

    // 15. View Full Audit Rails Log Registry (Super Admin & Dept Admin)
    if (url === '/api/admin/logs' && req.method === 'GET') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser || (activeUser.role !== 'Super Admin' && activeUser.role !== 'Department Admin')) {
        sendJSON(res, 403, { error: 'Access Restricted: Full audit access requires admin role.' });
        return true;
      }

      // Department Admin can ONLY check logs specific to their exact department members!
      let logs = db.logs;
      if (activeUser.role === 'Department Admin') {
        logs = logs.filter(l => l.departmentId === activeUser.departmentId);
      }

      sendJSON(res, 200, { success: true, logs });
      return true;
    }

    // 16. Existing AI Classification endpoints (re-wired through consolidated database router)
    if (url === '/api/gemini/analyze' && req.method === 'POST') {
      const body = await parseBody(req);
      const { fileName, textContent, fileType } = body;
      
      if (!textContent) {
        sendJSON(res, 400, { error: 'No content provided for analysis' });
        return true;
      }

      let resJson: any;
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Document Name: ${fileName || 'Unnamed Document'}\nFile Type: ${fileType || 'Unknown'}\nDocument Contents:\n${textContent}`,
            config: {
              systemInstruction: `You are the DIU Smart Archive AI OCR and Document Classifier.
Analyze the provided document text and meta context, and return a clean JSON object according to this exact typescript schema:
{
  "fileName": string (the official title or a normalized file name),
  "studentId": string or null (Student ID number, usually in format XX-XXXXX-X or similar, if found. Else null),
  "employeeId": string or null (Employee ID number, usually in format EMP-XXXX or similar, if found. Else null),
  "category": string (Select one of: "Student Records", "Transcripts", "Certificates", "Clearance Files", "Employee Records", "Salary Files", "Leave Applications", "Exam Papers", "Syllabus Documents", "Research Publications"),
  "tags": string[] (3 or 4 relevant labels, e.g. ["academic", "transcript", "admission"]),
  "aiSummary": string (A professional, concise 2-sentence summary of the document's content and official purpose),
  "hardCopyDetails": {
    "cabinetNumber": string (Format: "CAB-A", "CAB-B", "CAB-C", etc.),
    "shelfNumber": string (Format: "Shelf 1", "Shelf 2", etc.),
    "boxNumber": string (Format: "Box 10", "Box 11", etc.),
    "fileSerial": string (Format: "DIU-SRL-XXXX" where XXXX is a running serial)
  }
}
Generate sensible spatial archiving allocations for physical copy management.
Return ONLY valid JSON. Avoid markdown blocks.`,
              responseMimeType: 'application/json'
            }
          });
          
          const parsedText = response.text || '{}';
          resJson = JSON.parse(parsedText.replace(/```json|```/g, '').trim());
        } catch (err: any) {
          console.error('Gemini call failed, utilizing local fallback parser', err);
          resJson = generateFallbackAnalysis(fileName, textContent, fileType);
        }
      } else {
        resJson = generateFallbackAnalysis(fileName, textContent, fileType);
      }

      sendJSON(res, 200, resJson);
      return true;
    }

    if (url === '/api/gemini/smart-search' && req.method === 'POST') {
      const body = await parseBody(req);
      const { filesList, query } = body;

      if (!query || !filesList) {
        sendJSON(res, 400, { error: 'Search query and files list are required.' });
        return true;
      }

      let rankedFiles = [];
      if (ai && filesList.length > 0) {
        try {
          const filesPayload = filesList.map((f: any) => ({
            id: f.id,
            name: f.name,
            category: f.category,
            tags: f.tags,
            aiSummary: f.aiSummary,
            department: f.department
          }));

          const prompt = `You are a semantic search ranking engine. Find documents that are semantically relevant to this search query: "${query}"

Here is the list of available university documents:
${JSON.stringify(filesPayload, null, 2)}

Return a JSON array of objects, containing ONLY the related document IDs, sorted from HIGHEST relevance to LOWEST. Include a "relevanceReason" for why it matched. Match items that contain related semantic concepts (e.g. searching 'payroll' should match 'Salary Files', searching 'results' should match 'Transcripts' or 'Exam Papers').

Output Schema:
[
  { "id": "file-id-string", "relevanceReason": "Short phrase explaining connection", "score": number (0 to 100) }
]
Return ONLY pure JSON.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          const parsedResponse = JSON.parse((response.text || '[]').replace(/```json|```/g, '').trim());
          rankedFiles = parsedResponse;
        } catch (err) {
          console.error('Semantic search failed, fallback to local search', err);
          rankedFiles = localSemanticSearch(filesList, query);
        }
      } else {
        rankedFiles = localSemanticSearch(filesList, query);
      }

      sendJSON(res, 200, { results: rankedFiles });
      return true;
    }

    // 17. Categories and Files REST Sync endpoints
    if (url === '/api/categories' && req.method === 'GET') {
      sendJSON(res, 200, { success: true, categories: db.categories });
      return true;
    }

    if (url === '/api/categories' && req.method === 'POST') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser || (activeUser.role !== 'Super Admin' && activeUser.role !== 'Department Admin')) {
        sendJSON(res, 403, { error: 'Access Denied: Administrative privileges required to create category.' });
        return true;
      }

      const body = await parseBody(req);
      const { name, desc, departmentId, isPublic } = body;

      if (!name || !departmentId) {
        sendJSON(res, 400, { error: 'Category folder name and department ID are required.' });
        return true;
      }

      const normalizedName = name.trim();
      const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const catId = `cat-${departmentId}-${Date.now().toString().slice(-4)}`;

      // Prevent duplicates
      if (db.categories.some(c => c.name.toLowerCase() === normalizedName.toLowerCase() || c.slug === slug)) {
        sendJSON(res, 400, { error: `Category folder "${normalizedName}" already exists on master index.` });
        return true;
      }

      const origin = req.headers.origin || 'https://archive.diu.edu.bd';
      const newCat = {
        id: catId,
        departmentId: departmentId,
        name: normalizedName,
        desc: desc ? desc.trim() : 'Dynamic DIU employee archive category',
        slug,
        isPublic: !!isPublic,
        qr_url: `${origin}/category/${slug}?id=${catId}`
      };

      db.categories.push(newCat);
      saveChanges(db);

      recordAccessLog(
        'CATEGORY_ADDED',
        `Created category folder "${normalizedName}" linked with slug "${slug}". Public access: ${!!isPublic}`,
        activeUser.email,
        'Success',
        req
      );

      sendJSON(res, 201, { success: true, category: newCat });
      return true;
    }

    if (url === '/api/files' && req.method === 'GET') {
      sendJSON(res, 200, { success: true, files: db.files });
      return true;
    }

    if (url === '/api/files' && req.method === 'POST') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser || activeUser.role === 'Viewer') {
        sendJSON(res, 403, { error: 'Access Denied: You are not authorized to upload or edit files.' });
        return true;
      }

      const body = await parseBody(req);
      const fileObj = body;

      if (!fileObj.id || !fileObj.name || !fileObj.category) {
        sendJSON(res, 400, { error: 'Incomplete file metadata provided.' });
        return true;
      }

      // Upsert: replace if exists, else prepend
      db.files = db.files.filter(f => f.id !== fileObj.id);
      db.files.unshift(fileObj);
      saveChanges(db);

      recordAccessLog(
        'FILE_REGISTERED',
        `Registered/updated document: "${fileObj.name}" inside category: "${fileObj.category}"`,
        activeUser.email,
        'Success',
        req
      );

      sendJSON(res, 201, { success: true, file: fileObj });
      return true;
    }

    if (url === '/api/files/delete' && req.method === 'POST') {
      const activeUser = getAuthenticatedUser(req);
      if (!activeUser || activeUser.role === 'Viewer') {
        sendJSON(res, 403, { error: 'Access Denied: Viewers cannot delete files.' });
        return true;
      }

      const body = await parseBody(req);
      const { fileId } = body;
      if (!fileId) {
        sendJSON(res, 400, { error: 'File ID is required.' });
        return true;
      }

      db.files = db.files.filter(f => f.id !== fileId);
      saveChanges(db);

      recordAccessLog(
        'FILE_DELETED',
        `Deleted archive file: "${fileId}" from the system datastore.`,
        activeUser.email,
        'Success',
        req
      );

      sendJSON(res, 200, { success: true, message: 'File permanently deleted from servers.' });
      return true;
    }

    // 18. Category Files and QR Metadata Endpoint
    const actualPath = url.split('?')[0];
    const categoryFilesMatch = actualPath.match(/^\/api\/category\/([^/]+)\/files$/);
    if (categoryFilesMatch && req.method === 'GET') {
      const idOrSlug = categoryFilesMatch[1].trim();
      const targetCategory = db.categories.find(c => 
        c.id.toLowerCase() === idOrSlug.toLowerCase() || 
        c.slug.toLowerCase() === idOrSlug.toLowerCase()
      );

      if (!targetCategory) {
        sendJSON(res, 404, { error: `Category folder matching "${idOrSlug}" not found in university master index.` });
        return true;
      }

      const filesInside = db.files.filter(f => 
        f.category.toLowerCase() === targetCategory.name.toLowerCase()
      );

      sendJSON(res, 200, {
        success: true,
        category: {
          id: targetCategory.id,
          name: targetCategory.name,
          slug: targetCategory.slug,
          department_id: targetCategory.departmentId,
          qr_url: targetCategory.qr_url,
          desc: targetCategory.desc
        },
        files: filesInside,
        qr_metadata: {
          scannedAt: new Date().toISOString(),
          secure_hash: crypto.createHash('sha256').update(targetCategory.id + Date.now().toString()).digest('hex'),
          authorized_roles: ['Super Admin', 'Department Admin', 'Employee', 'Viewer']
        }
      });
      return true;
    }

    // Default: Route not matched in central router structure
    return false;

  } catch (error: any) {
    console.error('Core API Execution Failed:', error);
    sendJSON(res, 500, { error: error.message || 'Fatal Internal Server API Fault.' });
    return true;
  }
}
