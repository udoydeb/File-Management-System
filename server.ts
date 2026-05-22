import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Instantiate Gemini SDK client if API key is present
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

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// GET Status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    university: 'Daffodil International University (DIU)',
    geminiConfigured: !!ai,
    message: 'DIU Smart Archive Production Server Active'
  });
});

// POST Analyze documents with Gemini
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { fileName, textContent, fileType } = req.body;
    
    if (!textContent) {
      return res.status(400).json({ error: 'No content provided for analysis' });
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
      } catch (err) {
        console.error('Gemini call failed, fallback to local', err);
        resJson = generateFallbackAnalysis(fileName, textContent, fileType);
      }
    } else {
      resJson = generateFallbackAnalysis(fileName, textContent, fileType);
    }

    return res.status(200).json(resJson);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'API Analysis error' });
  }
});

// POST Semantic File Smart Search with Gemini
app.post('/api/gemini/smart-search', async (req, res) => {
  try {
    const { filesList, query } = req.body;

    if (!query || !filesList) {
      return res.status(400).json({ error: 'Query and documents are required' });
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
        console.error('Semantic search failed, fallback to local', err);
        rankedFiles = localSemanticSearch(filesList, query);
      }
    } else {
      rankedFiles = localSemanticSearch(filesList, query);
    }

    return res.status(200).json({ results: rankedFiles });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Smart search error' });
  }
});

// Helper parsing fallback
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
  const cabCode = String.fromCharCode(65 + (codeSum % 6)); // A-F
  const shelfCode = (codeSum % 4) + 1; // 1-4
  const boxCode = (codeSum % 25) + 10; // Box 10-34
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

// Serve production client static build from /dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing, hand over non-matched routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Bind server on port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server starting robustly on http://0.0.0.0:${PORT}`);
});
