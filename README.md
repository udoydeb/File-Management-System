# Daffodil International University (DIU) - Smart Archive System
### AI-Powered Centralized Document & Archive Management System with Dynamic QR Code Tracking

Welcome to the **Daffodil International University (DIU) Smart Archive System**—an enterprise-grade, full-stack, secure document archiving and physical record tracking platform. This repository is built to bridge physical storage spaces (Cabinets, Shelves, Boxes) with electronic registers using intelligent AI-assisted OCR metadata extraction, dynamic QR-code-to-folder bindings, and advanced audit trailing.

---

## 🏛️ System Core Architecture

The host application consists of a modern client-side Single Page Application (SPA) compiled through **Vite (TypeScript, React 19, Tailwind CSS v4, Motion Animation)** coupled with a dedicated backend API gateway hosted on **Express (Node.js)**. 

```
                                      DIU SMART ARCHIVE ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                                     │
 │   ┌───────────────────────┐          HTTPS (JSON) / Web Server           ┌────────────┐             │
 │   │                       ├─────────────────────────────────────────────>│            │             │
 │   │  Vite/React Client   │                                              │  Express   │             │
 │   │  - SPA UI Routing     │<─────────────────────────────────────────────┤  Backend   │             │
 │   │  - QR Scanner Feed    │            HTML5 Preview/Payloads            │            │             │
 │   │  - Drag-&-Drop Upload │                                              └─────┬──┬───┘             │
 │   │                       │                                                    │  │                 │
 │   └─────────▲─────────────┘                                                    │  │                 │
 │             │ LocalState Sync                                    REST API Gate │  │ Gemini SDK      │
 │             ▼                                                                  ▼  ▼                 │
 │   ┌───────────────────────┐                                              ┌────────────┐             │
 │   │                       │                                              │   Google   │             │
 │   │  Browser storage      │                                              │   Gemini   │             │
 │   │  (Theme, Tokens)      │                                              │   AI Node  │             │
 │   │                       │                                              └────────────┘             │
 │   └───────────────────────┘                                                                         │
 │                                                                                                     │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Feature Checklist

### 🔑 Advanced Authentication & Identity Gate
*   **Active Directory Simulation:** Restricts signup exclusively to official DIU domains (`@daffodilvarsity.edu.bd`, `@diu.edu.bd`).
*   **Approval Queue Workflow:** New employee signups are placed in a secure `'Pending'` state, restricting access until a **Super Admin** or **Department Admin** grants official authorization.
*   **Two-Factor Authentication (2FA):** Support for 6-digit Authenticator OTP interceptors to secure high-clearance accounts.
*   **Role-Based Access Control (RBAC):** Four rigid clearance levels:
    *   `Super Admin` (`Udoy Deb`): Unrestricted ledger access, role elevation, and system auditing registers.
    *   `Department Admin` (`Fahmida Chowdhury`): Manages department folder paths, registers employees, allocates cabinets.
    *   `Employee` (`Dr. Imran Mahmud`): Uploads files, generates QR codes, manages checkout/check-in dockets.
    *   `Viewer` (`Farhana Yasmin`): Securely reads files, runs queries, scans QR codes, and downloads OCR payloads without database alteration privileges.

### 📁 Intelligent Storage & Digital Filing Cabinets
*   **Physical Cabinet Hierarchy:** Dynamically design cabinets (`CAB-A` to `CAB-Z`), layout shelves (`Shelf 1-5`), and partition boxes (`Box 10-99`) for 1:1 real-world warehouse-to-ledger mapping.
*   **Advanced OCR OCR Uploads:** Upload physical documents (PDF, DOCX, XLSX, CSV, Images), let the browser preview the file with realistic paper-color render filters (Grayscale, High-Contrast, Sepia), and view dynamic OCR transcription blocks.
*   **Physical Custodian Checkouts:** Logs borrower details, employee IDs, taken dates, and return statuses to track physical folders currently removed from physical archives.

### 🖼️ Deep QR Code Asset Ledger System
*   **Dynamic Document QR Code Generation:** Instantly builds high-contrast SVG path QR indicators reflecting the unique directory pointer on daffodil domains.
*   **Printable Physical Labels:** Automatically generates styled 380px asset index card layouts with integrated custom badges, titles, descriptions, and dynamic borders, formatted to trigger the system printer directly on mobile or desktop devices.
*   **Universal Scan Portal:** Scanning folder QR codes routes users to a custom high-performance **External Scanner Portal** containing file search bars, statistics graphs, preview interfaces, and multi-factor secure inline access keys.

### 🧠 Gemini AI Coprocessor Engine
*   **Autoadaptive Analysis API:** Submitting a scanned text payload automatically triggers a server-side Gemini instruction request parsing raw text contents into a beautiful structural JSON mapping (Document classification category, Student/Employee ID extraction, tags, and 2-sentence executive summary).
*   **Semantic Intellectual Search:** Uses AI models to evaluate related conceptual keywords. Searching *"payroll"* automatically suggests documents in *"Salary Files"* or *"Accounts"* without requiring precise textual matches.
*   **Deterministic Safety Fallback:** Automatically switches to high-speed client-side regex heuristics and semantic matching if no Gemini API keys are configured, guaranteeing 100% uptime in local development sandbox nodes.

---

## 🛠️ Installation Guide (Local Network Setup)

Follow these instructions to clone, construct, compile, and run the DIU Smart Archive on your local computer or intranet environment.

### Prerequisites
-   **Node.js:** v18.0.0 or higher (LTS recommended)
-   **NPM / NPX:** v9.x or higher

### Phase 1: Environment Provisioning
Initialize local directories and clone repository files:
```bash
git clone https://github.com/your-organization/diu-smart-archive.git
cd diu-smart-archive
```

### Phase 2: Installing Node Dependencies
Install all required React, Express, Vite, and tailwind bundles:
```bash
npm install
```

### Phase 3: Setup Secret Keys
Duplicate the environment template file:
```bash
cp .env.example .env
```
Open `.env` in your text editor and add your secret credentials:
```env
# Google Gemini SDK access token
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Domain URL of DIU Web Host
APP_URL="http://localhost:3000"
```

### Phase 4: Executing Development Dev-Servers
Launch the concurrent full-stack sandbox dev-server (utilizing hot TypeScript execution):
```bash
npm run dev
```
Open your web browser and navigate to **`http://localhost:3000`** to view the live interface.

---

## 🔌 Core API Documentation

The backend server exposes the following highly secure, authenticated REST endpoints. All standard API calls must include the Header `Authorization: Bearer <your_session_token>` unless marked public.

### 🔐 Auth Gateway Endpoints

| Endpoint | Method | Public | Description |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | ✅ Yes | Queries web server operational states and checking Gemini connection. |
| `/api/auth/register` | `POST` | ✅ Yes | Signs up of new official DIU accounts. Checks active directory domain. |
| `/api/auth/login` | `POST` | ✅ Yes | Validates credentials, issues session tokens, checks 2FA status, increments rate limits on fail. |
| `/api/auth/session` | `GET` | ❌ No | Decodes authorization token header to retrieve active profile. |
| `/api/auth/logout` | `POST` | ❌ No | Destroys active user sessions and records logs. |
| `/api/auth/profile/update` | `POST`| ❌ No | Updates user details, email address, phone numbers, and profile photos. |
| `/api/auth/profile/password`| `POST`| ❌ No | Safely modifies crypt-hashes with new salt verification checks. |
| `/api/auth/reset-password-request` | `POST` | ✅ Yes | Simulates dispatching reset URLs with dynamic recovery hash tokens. |
| `/api/auth/reset-password` | `POST` | ✅ Yes | Consumes recovery tokens to overwrite user passwords. |

### 📁 Category & Cabinet Endpoints

| Endpoint | Method | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/categories` | `GET` | Viewer (or higher) | Lists all digital folder directories of DIU. |
| `/api/categories` | `POST` | Super / Dept Admin | Creates new active folder category structures on database. |
| `/api/category/:idOrSlug/files`| `GET` | ✅ Yes (Public Gate) | Scans dynamic QR target directories. Secure categories prompt for passwords. |

### 📄 Document & Files Endpoints

| Endpoint | Method | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/files` | `GET` | Viewer (or higher) | Queries overall physical documents registries. |
| `/api/files` | `POST` | Employee (or higher) | Inserts uploaded OCR structures or bulk scans into databases. |
| `/api/files/delete` | `POST`| Employee (or higher) | Permanently deletes documents from system. Viewers blocked. |

### 🤖 Gemini Cognitive Endpoints

| Endpoint | Method | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/gemini/analyze` | `POST` | Employee (or higher) | Sends document texts to Gemini to classify category, extract DIU IDs, tags, summaries. |
| `/api/gemini/smart-search` | `POST` | Viewer (or higher) | Evaluates search queries semantically against file data. |

---

## 🚀 Production Deployment Instructions

### 🌐 Deploying to Vercel (Front-end + API Routes Serverless)
Vercel supports serverless execution of server.ts.
1.  **Install Vercel CLI:** `npm i -g vercel`
2.  **Define Serverless configurations:** We bundle Vite builds inside `dist/`. Ensure our project uses the following `vercel.json` structure inside the root:
    ```json
    {
      "version": 2,
      "builds": [
        { "src": "dist/server.cjs", "use": "@vercel/node" },
        { "src": "dist/**/*", "use": "@vercel/static" }
      ],
      "routes": [
        { "src": "/api/(.*)", "dest": "dist/server.cjs" },
        { "src": "/(.*)", "dest": "dist/$1" }
      ]
    }
    ```
3.  **Deploy:** Run `vercel` and input environment variables matching `.env.example`.

### 🛡️ Deploying to Render (Host Platform as Web Service)
Render is perfect for continuous full-stack Node container hosting:
1.  **Create New Service:** Inside Render Dashboard, choose **`Web Service`** and connect your Github repository.
2.  **Select Runtimes:** Set Language to **`Node`**.
3.  **Define Scripts:**
    -   **Build Command:** `npm run build`
    -   **Start Command:** `npm start`
4.  **Configure Environment Variables:** Add `GEMINI_API_KEY` and `NODE_ENV=production` inside your Render dashboard settings workspace.
5.  **Enable Storage (Optional):** Define a persistent disk mounted to `/app/` if you want file registry changes on `server_db.json` to persist permanently across container cold-starts.

---

## 🔒 Security Auditing Standards

The system adheres to extreme enterprise standards, preventing data breaches or injection vulnerabilities inside university systems:
1.  **Failed-Login Tracker (Brute-Force Shield):** Monitored IP keys are tracked for consecutively failed logins. At 5 errors, the target IP is blocked from API authentication for 3 minutes.
2.  **Strict Token Serialization:** Authorization parameters are validated against internal memory stores to secure route requests against cookie-tampering.
3.  **Viewer-Class Security Barriers:** Viewers are strictly blocked from writing to databases (cabinet allocation edits, file deletion, and role mutations return instant HTTP 403 Forbidden).
4.  **XSS & Payload Protection:** URL slugs avoid script insertion using precise multi-step alphanumeric regex parameters (`/[^a-z0-9]+/g`).
5.  **Watermarked Files Grid:** Scanned OCR documents visualize persistent `DAFFODIL SECURE ARCHIVE` diagonal watermarks to block system screenshots.

---

## 👥 Seed & Demo Logins Testing Sandbox

We have preloaded five default test users representing different university access tiers so that sandbox testing can commence instantly. Use the credentials below to experience the system workflow:

| Full Name | Employee ID | Registered Official Email | Password | Role Tier | Clearance Privileges |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Udoy Deb** | `DIU-EMP-001` | `admin@daffodilvarsity.edu.bd` | `AdminPassword123!` | **Super Admin** | Unlimited, Log auditing, Employee role modification |
| **Fahmida Chowdhury** | `DIU-EMP-002` | `hr.admin@daffodilvarsity.edu.bd` | `HRAdminPassword123!` | **Department Admin** | Employee status approval, category adding |
| **Dr. Imran Mahmud** | `DIU-EMP-1029` | `imran.cse@daffodilvarsity.edu.bd` | `CSEEmployee123!` | **Employee** | File upload, Document checking, QR printing |
| **Farhana Yasmin** | `DIU-EMP-2022` | `yasmin.acc@daffodilvarsity.edu.bd` | `ViewerPassword123!` | **Viewer** | Document scanning, OCR viewing, Search queries |
| **Tanvir Rahman** | `DIU-EMP-4029` | `tanvir.reg@daffodilvarsity.edu.bd` | `TanvirPassword123!` | *Pending Appv.* | Blocked from login until Super Admin elevates status |

---

*Formulated by the Software Engineering and Academic Registry team of Daffodil International University (DIU). Open-source under MIT Standards.*
