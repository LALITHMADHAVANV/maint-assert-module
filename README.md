# TexTech CMMS — Garment Factory Maintenance & Asset Management Suite

A modern, production-grade Computerized Maintenance Management System (CMMS) designed for apparel manufacturing sewing floors. Built with **Next.js 16 (App Router, React 19, TypeScript)**, **Tailwind CSS v4**, **Lucide Icons**, and **Firebase (Cloud Firestore & Authentication)** with a zero-configuration reactive offline demo fallback.

---

## Key Features & Modules

### 1. Machine Entry & Asset Registry (`/dashboard/machines`)
- **Apparel Machinery Support**: Pre-configured specs for SNLS, Overlock (4-thread/5-thread), Flatlock/Interlock, Bartack, Buttonhole Indexers, and Feed-off-the-arm (FOTA) units.
- **Dynamic QR Asset Tags**: Generates high-contrast thermal printable QR tags (`@media print` optimized for Zebra/TSC thermal label printers) with machine ID, brand, model, line, and floor station.
- **Downtime & Machine Age Tracker**: Live calculation of machine age (years from purchase date) and MTBF/cumulative downtime minutes.

### 2. Spare Parts Crib & Requisitions (`/dashboard/inventory`)
- **Tool Crib Inventory**: Real-time stock counts, minimum buffer thresholds, SKU tracking, unit costs, and quick `[-]` / `[+]` bin adjustments.
- **Separated Requisition Workflows**:
  - **Critical Needs (Requires CEO Approval)**: For catastrophic breakdowns and capital-intensive components (e.g., servo driver PCBs) that halt production lines.
  - **Urgent Needs (Manager Fast-Track)**: For high-priority shift repairs (e.g., damaged loopers or broken cutters) requiring immediate line supervisor sign-off.
  - **Monthly Indent Builder**: Multi-item part list builder allowing mechanics to compile bulk monthly supply requests with dynamic item additions, quantity controls, and automated OPEX calculations.

### 3. Machine History Dossier & PPM Sign-off (`/dashboard/history`)
- **Full Dossier View**: Machine specifications, health badge, operator assignment, and chronological maintenance audit trail.
- **Key Metrics**: MTTR (Mean Time to Repair), total breakdown incidents, and total plant downtime.
- **PPM Sign-off**: One-click preventive maintenance compliance verification with date stamps and technician notes.

### 4. Mechanic Shift Calendar & Breakdown Queue (`/dashboard/calendar`)
- **7-Day Shift Strip**: Interactive date navigation with active ticket counter badges.
- **Breakdown Queue**: Live critical, warning, and pending work orders.
- **Atomic "Attend & Fix" Workflow**: Modal dialog allowing mechanics to record root cause, log downtime minutes, and select replacement parts with atomic inventory stock deduction.

### 5. Floor Asset & Line Tracker (`/dashboard/floor-tracker`)
- **Visual Factory Floor Grid**: Interactive floor overview spanning **Line 01, Line 02, Line 03, Line 04, Buffer Workshop, and Scrap Bay**.
- **Line Rebalancing**: One-click machine relocation between production lines, buffer standby, and decommissioned scrap storage with automatic relocation ledger entries.

### 6. Mobile Floor Scanner Terminal (`/scan/[id]`)
- **Direct QR Scan Target**: Mobile-first responsive view accessed by scanning machine QR codes on the shop floor.
- **Instant Actions**: Report immediate breakdown with fault category and urgency, or execute floor machine relocation.

---

## Tech Stack

- **Framework:** Next.js 16.3.5 (Turbopack, App Router)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend / Database:** Firebase JS SDK v12 (Cloud Firestore, Firebase Authentication)
- **QR Code Tooling:** `qrcode.react` (generation) & `html5-qrcode` (camera scanning)
- **Date Utilities:** `date-fns`

---

## Database Architecture (6 Separate Firestore Collections)

| Table / Collection | Description | Primary Document ID |
|---|---|---|
| `users` | Mechanics, Plant Managers, System Admins | User UID (`MEC-08`, `MGR-01`) |
| `machines` | 12 factory sewing machines across production lines | Machine Tag (`MC-SNLS-101`) |
| `parts` | 10 tool crib garment spare parts & consumables | Part SKU (`PRT-01` to `PRT-10`) |
| `repairs` | Breakdown tickets & chronological repair ledger | Work Order ID (`WO-1091`, `HIST-902`) |
| `ppm_schedules` | Weekly, monthly, and 6-month preventive tasks | Schedule ID (`SCH-01`) |
| `requisitions` | Monthly Indents, Urgent Shift Needs, Critical CEO Needs | Requisition ID (`REQ-2026-091`) |

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/LALITHMADHAVANV/maint-assert-module.git
cd maint-assert-module
npm install --ignore-scripts
```

### 2. Configure Firebase Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your Firebase credentials from **Firebase Console > Project Settings > General > Web App**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

> **Note:** If real Firebase credentials are not provided, the system automatically falls back to an offline reactive local storage mode so all features can be tested immediately without database setup.

### 3. Populate Firestore Tables
To seed all 6 collections directly into your Cloud Firestore database:
```bash
npm run seed:firebase
```
Or open [http://localhost:3000/api/seed](http://localhost:3000/api/seed) in your browser.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Credentials

Click the quick role login buttons on the homepage, or use:
- **Lead Sewing Mechanic:** `mechanic@textech.garments` (Ramesh Kumar)
- **Asset & Maintenance Manager:** `manager@textech.garments` (V. Sundaram)

---

## License
Proprietary — TexTech Garments Maintenance Division.
