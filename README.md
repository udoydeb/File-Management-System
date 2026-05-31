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

This repository is optimized to perform seamlessly under two major architectural modes:
1. **Co-located Full-stack Application** (Default - easily hosted on **Render**, **Heroku**, or **Localhost**): The Express backend serves as the single unified web server, hosting APIs and serving production static react code.
2. **Decoupled Frontend & Backend** (Great performance - **Vite SPA on Vercel** and **Express APIs on Render**): Cross-Origin Resource Sharing (CORS) is enabled out-of-the-box (`*`), allowing the static frontend on Vercel to fetch from the back-end dynamically.

---

### 📦 GitHub Repository Preparation

To commit this project as a secure, optimized GitHub repository:
1. **Repository Init & Tracking**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of DIU Smart Archive"
   ```
2. **Review .gitignore Rules**: Ensure files containing mock DB caching (`server_db.json` is okay for default seeding) and local secrets (`.env`, `.env.local`) are excluded from pushes.
3. **Pristine Build Alignment**: Verify that no type check failures or code warnings persist before tracking:
   ```bash
   npm run lint
   npm run build
   ```

---

### 🌐 Decoupled Deployment Pathway: Frontend Static Client (Vercel)

Vercel provides blazing fast Edge-CDN delivery for the React static Single Page Application (SPA):
1. **Setup on Vercel Dashboard**:
   - Create a **New Project** and connect your GitHub Repository.
   - Set **Framework Preset** to **Vite** or **Other**.
   - **Root Directory**: `./` (Root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. **Configure Environment Variables on Vercel**:
   Add the following variables in the Project Settings:
   - `VITE_API_URL`: Your deployed Render Backend Server URL (e.g. `https://diu-archive-api.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your cloud Supabase project instance URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your cloud Supabase anonymous API key.
3. **Deployment Router (SPA Handlers)**:
   Our pre-configured `/vercel.json` ensures that page reloads on custom paths (like `/scanned-portal`) do not return a `404 Not Found` by cleanly routing fallbacks to `index.html`.

---

### 🛡️ Unified Server / Decoupled APi Deployment: Backend Server (Render)

Render hosts the continuous, full-time Node Express API engine seamlessly:
1. **Configure Web Service on Render**:
   - Log in to the Render Dashboard, click **New** -> **Web Service**.
   - Connect your GitHub Repository containing this project.
2. **Runtime Configurations**:
   - **Language**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` (Express starts on port `3000`)
3. **Environment Workspace Variable Setup**:
   Add these variable key-values in Render's configuration workspace:
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API cluster URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your high-privilege service key (keeps backend database synchronized in real-time).
   - `GEMINI_API_KEY`: Your Google GenAI key for OCR structuring parsing and smart searches.
   - `JWT_SECRET`: A secure private phrase for verifying logged-out tokens.
4. **Persistent Disk Sync (Optional)**:
   If you aren't using Supabase DB mirroring and wish to persist the offline server file-cache `server_db.json`, mount a **Persistent Disk** on Render formatted to `/app/` with a size of 1GB.

---

### 💻 Localhost Production Launch

To simulate the exact production state right on your development machine or intranet:
1. **Install Prerequisites**: Obtain Node.js LTS (v18+) and npm.
2. **Build the Entire Project**:
   ```bash
   npm run build
   ```
   This compiles the React modules to `dist/`, and bundles the TypeScript backend `server.ts` into a self-contained, light-weight execution node `/dist/server.cjs` via highly optimized `esbuild`.
3. **Set Production Mode**:
   ```bash
   export NODE_ENV=production
   # or on Windows PowerShell:
   # $env:NODE_ENV="production"
   ```
4. **Boot Up**:
   ```bash
   npm run start
   ```
   The site will load instantly via production assets on **`http://localhost:3000`**.

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
