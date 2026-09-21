import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load env variables from .env and .env.local
function loadEnv() {
  const envVars = {};
  const files = ['.env', '.env.local'];
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valParts] = trimmed.split('=');
          if (key && valParts.length > 0) {
            envVars[key.trim()] = valParts.join('=').trim();
          }
        }
      });
    }
  }
  return envVars;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('\n================================================================');
console.log('  TexTech CMMS: Cloud Firestore Multi-Table Seeder');
console.log('================================================================');
console.log(`📁 Project ID  : ${firebaseConfig.projectId || 'NOT SET'}`);
console.log(`🌐 Auth Domain : ${firebaseConfig.authDomain || 'NOT SET'}`);
console.log(`🔑 API Key     : ${firebaseConfig.apiKey ? (firebaseConfig.apiKey.substring(0, 8) + '...') : 'NOT SET'}`);

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('ReplaceWithYourOwn')) {
  console.error('\n❌ Warning: .env or .env.local contains placeholder credentials.');
  console.error('To write directly to your cloud Firebase database:');
  console.error('1. Open .env or .env.local');
  console.error('2. Paste your real Firebase Web App configuration credentials.');
  console.error('3. Run "npm run seed:firebase" again.\n');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----------------------------------------------------------------------
// TABLE 1: users (Lead Mechanics, Plant Managers, System Admins)
// ----------------------------------------------------------------------
const SEED_USERS = [
  {
    uid: 'MEC-08',
    name: 'Ramesh Kumar',
    email: 'mechanic@textech.garments',
    role: 'MECHANIC',
    title: 'Lead Sewing Mechanic',
  },
  {
    uid: 'MGR-01',
    name: 'V. Sundaram',
    email: 'manager@textech.garments',
    role: 'ASSET_MANAGER',
    title: 'Asset & Plant Maintenance Manager',
  },
];

// ----------------------------------------------------------------------
// TABLE 2: machines (Complete 12-Machine Production Fleet)
// ----------------------------------------------------------------------
const SEED_MACHINES = [
  {
    id: 'MC-SNLS-101',
    brand: 'Juki',
    model: 'DDL-8700-7',
    type: 'SNLS',
    typeName: 'Single Needle Lockstitch (SNLS)',
    motorType: 'SERVO',
    purchaseDate: '2023-04-12',
    cost: 750,
    status: 'ACTIVE',
    currentLine: 'Line 01',
    stationNo: 'Station 04',
    operator: 'K. Kavitha',
    totalDowntimeMinutes: 118,
    ageYears: 3.4,
  },
  {
    id: 'MC-OVK-204',
    brand: 'Pegasus',
    model: 'M900-52-233',
    type: 'OVERLOCK',
    typeName: '4-Thread Overlock / Safety Stitch',
    motorType: 'SERVO',
    purchaseDate: '2022-09-18',
    cost: 980,
    status: 'BREAKDOWN',
    currentLine: 'Line 02',
    stationNo: 'Station 03',
    operator: 'S. Murugan',
    totalDowntimeMinutes: 145,
    ageYears: 4.0,
  },
  {
    id: 'MC-SNLS-102',
    brand: 'Brother',
    model: 'S-7200C-403',
    type: 'SNLS',
    typeName: 'Single Needle Lockstitch (SNLS)',
    motorType: 'SERVO',
    purchaseDate: '2024-02-10',
    cost: 820,
    status: 'ACTIVE',
    currentLine: 'Line 01',
    stationNo: 'Station 07',
    operator: 'P. Rajeshwari',
    totalDowntimeMinutes: 40,
    ageYears: 2.6,
  },
  {
    id: 'MC-FLK-301',
    brand: 'Yamato',
    model: 'VG2700',
    type: 'FLATLOCK',
    typeName: 'Flatlock / Interlock (Coverstitch)',
    motorType: 'SERVO',
    purchaseDate: '2021-11-05',
    cost: 1450,
    status: 'ACTIVE',
    currentLine: 'Line 02',
    stationNo: 'Station 09',
    operator: 'D. Anitha',
    totalDowntimeMinutes: 65,
    ageYears: 4.9,
  },
  {
    id: 'MC-BTK-501',
    brand: 'Juki',
    model: 'LK-1900BN',
    type: 'BARTACK',
    typeName: 'Electronic Bartack Machine',
    motorType: 'SERVO',
    purchaseDate: '2023-08-20',
    cost: 1650,
    status: 'ACTIVE',
    currentLine: 'Line 03',
    stationNo: 'Station 02',
    operator: 'V. Selvam',
    totalDowntimeMinutes: 20,
    ageYears: 3.1,
  },
  {
    id: 'MC-BTH-601',
    brand: 'Brother',
    model: 'HE-800B',
    type: 'BUTTONHOLE',
    typeName: 'Buttonhole Indexer',
    motorType: 'SERVO',
    purchaseDate: '2020-03-14',
    cost: 2100,
    status: 'ACTIVE',
    currentLine: 'Line 03',
    stationNo: 'Station 08',
    operator: 'A. Mary',
    totalDowntimeMinutes: 190,
    ageYears: 6.5,
  },
  {
    id: 'MC-OVK-209',
    brand: 'Siruba',
    model: '757K-516M2',
    type: 'OVERLOCK',
    typeName: '5-Thread Heavy Overlock',
    motorType: 'SERVO',
    purchaseDate: '2024-06-11',
    cost: 890,
    status: 'BUFFER',
    currentLine: 'Buffer Workshop',
    stationNo: 'Bay B-02',
    operator: 'Standby Buffer',
    totalDowntimeMinutes: 10,
    ageYears: 2.3,
  },
  {
    id: 'MC-FOTA-701',
    brand: 'Jack',
    model: 'MS-335',
    type: 'FEED_OFF_ARM',
    typeName: 'Feed-off-the-arm (FOTA)',
    motorType: 'CLUTCH',
    purchaseDate: '2022-01-20',
    cost: 1350,
    status: 'ACTIVE',
    currentLine: 'Line 04',
    stationNo: 'Station 05',
    operator: 'T. Ganesan',
    totalDowntimeMinutes: 95,
    ageYears: 4.7,
  },
  {
    id: 'MC-SNLS-109',
    brand: 'Juki',
    model: 'DDL-9000C-FMS',
    type: 'SNLS',
    typeName: 'Digital Direct-Drive Lockstitch',
    motorType: 'SERVO',
    purchaseDate: '2025-01-10',
    cost: 1100,
    status: 'ACTIVE',
    currentLine: 'Line 01',
    stationNo: 'Station 02',
    operator: 'M. Lakshmi',
    totalDowntimeMinutes: 0,
    ageYears: 1.7,
  },
  {
    id: 'MC-DNLS-401',
    brand: 'Brother',
    model: 'T-8420C',
    type: 'DNLS',
    typeName: 'Double Needle Lockstitch (DNLS)',
    motorType: 'SERVO',
    purchaseDate: '2023-05-15',
    cost: 1250,
    status: 'ACTIVE',
    currentLine: 'Line 04',
    stationNo: 'Station 02',
    operator: 'R. Balamurugan',
    totalDowntimeMinutes: 45,
    ageYears: 3.3,
  },
  {
    id: 'MC-OVK-215',
    brand: 'Siruba',
    model: '747K-514M2-24',
    type: 'OVERLOCK',
    typeName: '4-Thread High-Speed Overlock',
    motorType: 'SERVO',
    purchaseDate: '2024-03-25',
    cost: 920,
    status: 'ACTIVE',
    currentLine: 'Line 02',
    stationNo: 'Station 06',
    operator: 'C. Meena',
    totalDowntimeMinutes: 30,
    ageYears: 2.5,
  },
  {
    id: 'MC-SCRAP-99',
    brand: 'Jack',
    model: 'JK-8569',
    type: 'FLATLOCK',
    typeName: 'Flatlock (Cannibalized)',
    motorType: 'CLUTCH',
    purchaseDate: '2018-02-14',
    cost: 1200,
    status: 'SCRAP',
    currentLine: 'Scrap Bay',
    stationNo: 'Salvage Rack 01',
    operator: 'Decommissioned',
    totalDowntimeMinutes: 480,
    ageYears: 8.6,
  },
];

// ----------------------------------------------------------------------
// TABLE 3: parts (10 Garment Industry Spare Parts Inventory)
// ----------------------------------------------------------------------
const SEED_PARTS = [
  {
    partId: 'PRT-01',
    sku: 'NDL-DBX1-14',
    name: 'Organ Needles DBx1 (#14/90) Knit & Woven',
    category: 'Needles',
    compat: 'Single Needle Lockstitch, Double Needle',
    stock: 380,
    minStock: 150,
    monthlyAllowance: 500,
    unitCost: 0.35,
    unit: 'pcs',
    compatibleTypes: ['SNLS', 'DNLS'],
  },
  {
    partId: 'PRT-02',
    sku: 'HK-KOB-794',
    name: 'Rotary Hook Hirose Koban HSH-7.94BTR',
    category: 'Hooks & Loopers',
    compat: 'Single Needle Lockstitch (Juki / Brother)',
    stock: 8,
    minStock: 5,
    monthlyAllowance: 12,
    unitCost: 28.5,
    unit: 'units',
    compatibleTypes: ['SNLS'],
  },
  {
    partId: 'PRT-03',
    sku: 'LP-PEG-M900',
    name: 'Upper Looper (Pegasus M900 Series)',
    category: 'Hooks & Loopers',
    compat: '4-Thread Overlock, 5-Thread Overlock',
    stock: 4,
    minStock: 8,
    monthlyAllowance: 15,
    unitCost: 14.2,
    unit: 'units',
    compatibleTypes: ['OVERLOCK'],
  },
  {
    partId: 'PRT-04',
    sku: 'BC-TOWA-BC1',
    name: 'Bobbin Case Towa BC-DB1-NBL6 with Anti-Spin Spring',
    category: 'Hooks & Loopers',
    compat: 'Single Needle Lockstitch, Bartack',
    stock: 26,
    minStock: 15,
    monthlyAllowance: 40,
    unitCost: 7.8,
    unit: 'units',
    compatibleTypes: ['SNLS', 'BARTACK'],
  },
  {
    partId: 'PRT-05',
    sku: 'FD-4ROW-JUK',
    name: 'Differential Feed Dog (4-Row Fine Pitch)',
    category: 'Feed & Plates',
    compat: 'Single Needle Lockstitch',
    stock: 3,
    minStock: 6,
    monthlyAllowance: 10,
    unitCost: 6.4,
    unit: 'units',
    compatibleTypes: ['SNLS'],
  },
  {
    partId: 'PRT-06',
    sku: 'TP-OVK-E18',
    name: 'Overlock Throat / Needle Plate E18 Gauge',
    category: 'Feed & Plates',
    compat: '4-Thread Overlock (Pegasus / Siruba)',
    stock: 12,
    minStock: 8,
    monthlyAllowance: 16,
    unitCost: 9.6,
    unit: 'units',
    compatibleTypes: ['OVERLOCK'],
  },
  {
    partId: 'PRT-07',
    sku: 'MOT-DD-PCB',
    name: 'Direct-Drive Servo Main Driver Board PCB',
    category: 'Motors & Electrical',
    compat: 'All Direct-Drive Servo Machines',
    stock: 2,
    minStock: 2,
    monthlyAllowance: 4,
    unitCost: 110.0,
    unit: 'units',
    compatibleTypes: ['SNLS', 'OVERLOCK', 'FLATLOCK', 'BARTACK'],
  },
  {
    partId: 'PRT-08',
    sku: 'OIL-VG10-5L',
    name: 'High Purity White Sewing Mineral Oil (ISO VG 10, 5L)',
    category: 'Fluids & Consumables',
    compat: 'Universal Lubrication for all Sewing Heads',
    stock: 16,
    minStock: 8,
    monthlyAllowance: 24,
    unitCost: 22.5,
    unit: 'jugs',
    compatibleTypes: ['SNLS', 'DNLS', 'OVERLOCK', 'FLATLOCK', 'BUTTONHOLE', 'BARTACK', 'FEED_OFF_ARM'],
  },
  {
    partId: 'PRT-09',
    sku: 'FT-TEFLON-T35',
    name: 'Non-Stick Teflon Hinged Presser Foot T350',
    category: 'Feed & Plates',
    compat: 'Single Needle Lockstitch (Knit & Coated fabrics)',
    stock: 19,
    minStock: 10,
    monthlyAllowance: 25,
    unitCost: 4.2,
    unit: 'pcs',
    compatibleTypes: ['SNLS'],
  },
  {
    partId: 'PRT-10',
    sku: 'KNF-OVK-LWR',
    name: 'Carbide Lower Stationary Trimming Knife',
    category: 'Feed & Plates',
    compat: 'Overlock Trimmer Unit',
    stock: 7,
    minStock: 8,
    monthlyAllowance: 14,
    unitCost: 8.75,
    unit: 'pcs',
    compatibleTypes: ['OVERLOCK'],
  },
];

// ----------------------------------------------------------------------
// TABLE 4: repairs (Maintenance Work Orders & Historical Ledger)
// ----------------------------------------------------------------------
const SEED_REPAIRS = [
  {
    id: 'WO-1091',
    machineId: 'MC-OVK-204',
    machineType: '4-Thread Overlock',
    line: 'Line 02',
    reportedAt: '2026-09-21T08:30:00Z',
    reportedBy: 'S. Murugan (Supervisor)',
    faultCategory: 'Looper / Timing Misalignment',
    faultDetails: 'Skipping stitches on 4-thread knit poly t-shirt seam. Upper looper clashing with needle tip on high speed.',
    urgency: 'CRITICAL',
    status: 'IN_PROGRESS',
    attendedBy: 'Ramesh Kumar',
    resolvedAt: null,
    downtimeMinutes: 45,
    actionTaken: '',
    partsUsed: [],
  },
  {
    id: 'WO-1085',
    machineId: 'MC-SNLS-102',
    machineType: 'Single Needle Lockstitch',
    line: 'Line 01',
    reportedAt: '2026-09-20T16:15:00Z',
    reportedBy: 'P. Rajeshwari (Operator)',
    faultCategory: 'Thread Tension / Skipping',
    faultDetails: 'Birdnesting and uneven tension on under-thread seam. Tension release disc sluggish.',
    urgency: 'WARNING',
    status: 'PENDING',
    attendedBy: null,
    resolvedAt: null,
    downtimeMinutes: 0,
    actionTaken: '',
    partsUsed: [],
  },
  {
    id: 'HIST-902',
    machineId: 'MC-SNLS-101',
    machineType: 'Single Needle Lockstitch',
    line: 'Line 01',
    reportedAt: '2026-09-12T10:00:00Z',
    reportedBy: 'K. Kavitha (Operator)',
    faultCategory: 'Needle Breakage',
    faultDetails: 'Needle bar height slippage causing frequent needle strikes against bobbin case.',
    urgency: 'CRITICAL',
    status: 'COMPLETED',
    attendedBy: 'Ramesh Kumar',
    resolvedAt: '2026-09-12T10:25:00Z',
    downtimeMinutes: 25,
    actionTaken: 'Calibrated needle bar timing mark to 1.8mm above hook point. Polished burrs from hook tip.',
    partsUsed: [
      {
        partId: 'PRT-01',
        sku: 'NDL-DBX1-14',
        name: 'Organ Needles DBx1 (#14/90)',
        quantity: 1,
      },
    ],
  },
  {
    id: 'HIST-879',
    machineId: 'MC-SNLS-101',
    machineType: 'Single Needle Lockstitch',
    line: 'Line 01',
    reportedAt: '2026-08-20T14:00:00Z',
    reportedBy: 'System Routine',
    faultCategory: 'Oil Leakage',
    faultDetails: 'Oil reservoir filter clogged with fabric lint and wick dried.',
    urgency: 'WARNING',
    status: 'COMPLETED',
    attendedBy: 'Ramesh Kumar',
    resolvedAt: '2026-08-20T14:15:00Z',
    downtimeMinutes: 15,
    actionTaken: 'Purged lint beneath feed dog plate. Refilled reservoir with 0.5L ISO VG 10 sewing oil.',
    partsUsed: [
      {
        partId: 'PRT-08',
        sku: 'OIL-VG10-5L',
        name: 'High Purity White Sewing Mineral Oil (ISO VG 10, 5L)',
        quantity: 1,
      },
    ],
  },
  {
    id: 'HIST-840',
    machineId: 'MC-SNLS-101',
    machineType: 'Single Needle Lockstitch',
    line: 'Line 01',
    reportedAt: '2026-07-04T09:30:00Z',
    reportedBy: 'K. Kavitha (Operator)',
    faultCategory: 'Motor / Drive Error',
    faultDetails: 'Under-bed Thread Trimmer (UTT) jam and solenoid stroke error.',
    urgency: 'CRITICAL',
    status: 'COMPLETED',
    attendedBy: 'Ramesh Kumar',
    resolvedAt: '2026-07-04T10:15:00Z',
    downtimeMinutes: 45,
    actionTaken: 'Replaced movable thread cutter blade and reset solenoid stroke and safety interlock.',
    partsUsed: [
      {
        partId: 'PRT-04',
        sku: 'BC-TOWA-BC1',
        name: 'Bobbin Case Towa BC-DB1-NBL6',
        quantity: 1,
      },
    ],
  },
  {
    id: 'HIST-790',
    machineId: 'MC-OVK-204',
    machineType: '4-Thread Overlock',
    line: 'Line 02',
    reportedAt: '2026-08-29T11:20:00Z',
    reportedBy: 'S. Murugan (Supervisor)',
    faultCategory: 'Needle Breakage',
    faultDetails: 'Differential feed dog slipping and needle plate burr cutting thread.',
    urgency: 'WARNING',
    status: 'COMPLETED',
    attendedBy: 'Ramesh Kumar',
    resolvedAt: '2026-08-29T11:55:00Z',
    downtimeMinutes: 35,
    actionTaken: 'Re-torqued eccentric feed cam screw, deburred plate throat, and honed upper knife edge.',
    partsUsed: [
      {
        partId: 'PRT-06',
        sku: 'TP-OVK-E18',
        name: 'Overlock Throat / Needle Plate E18 Gauge',
        quantity: 1,
      },
    ],
  },
];

// ----------------------------------------------------------------------
// TABLE 5: ppm_schedules (Preventive Maintenance Calendar Tasks)
// ----------------------------------------------------------------------
const SEED_PPM = [
  {
    id: 'SCH-01',
    machineId: 'MC-SNLS-101',
    task: 'Weekly Blower Lint Purge & Tension Washer Check',
    intervalDays: 7,
    frequency: 'Weekly',
    lastServiced: '2026-09-17',
    nextDue: '2026-09-24',
    status: 'PENDING',
  },
  {
    id: 'SCH-02',
    machineId: 'MC-SNLS-101',
    task: 'Monthly Oil Filter Screen Cleaning & Wick Flush',
    intervalDays: 30,
    frequency: 'Monthly',
    lastServiced: '2026-08-23',
    nextDue: '2026-09-22',
    status: 'DUE_SOON',
  },
  {
    id: 'SCH-03',
    machineId: 'MC-SNLS-101',
    task: 'Semi-Annual Hook Timing & Needle Bar Clearance Audit',
    intervalDays: 180,
    frequency: '6-Month',
    lastServiced: '2026-04-15',
    nextDue: '2026-10-15',
    status: 'PENDING',
  },
  {
    id: 'SCH-04',
    machineId: 'MC-OVK-204',
    task: 'Bi-Weekly Looper Clearance & Differential Feed Calibration',
    intervalDays: 14,
    frequency: 'Weekly',
    lastServiced: '2026-09-10',
    nextDue: '2026-09-24',
    status: 'PENDING',
  },
  {
    id: 'SCH-05',
    machineId: 'MC-BTK-501',
    task: 'Monthly Oil Reservoir Flush & Wick Check',
    intervalDays: 30,
    frequency: 'Monthly',
    lastServiced: '2026-08-21',
    nextDue: '2026-09-21',
    status: 'DUE_SOON',
  },
];

// ----------------------------------------------------------------------
// TABLE 6: requisitions (Indents, Critical CEO needs, Urgent Manager needs)
// ----------------------------------------------------------------------
const SEED_REQS = [
  {
    id: 'REQ-2026-091',
    type: 'CRITICAL_CEO',
    partId: 'PRT-07',
    partName: 'Direct-Drive Servo Main Driver Board PCB',
    sku: 'MOT-DD-PCB',
    quantity: 2,
    unit: 'units',
    itemCount: 1,
    estimatedCost: 220.0,
    urgency: 'CRITICAL_CEO_APPROVAL',
    requiresCeoApproval: true,
    requestedBy: 'Ramesh Kumar',
    requestedByRole: 'Lead Sewing Mechanic',
    monthYear: 'September 2026',
    targetLine: 'Line 02',
    targetMachineId: 'MC-OVK-204',
    justification: 'CRITICAL LINE STOPPAGE: High-voltage surge blew controller circuit on Line 02 Pegasus overlock. Zero backup boards in tool crib. Entire polo tee batch halted. Requires immediate CEO budget sign-off.',
    status: 'PENDING_CEO_APPROVAL',
    createdAt: '2026-09-21T09:15:00Z',
  },
  {
    id: 'REQ-2026-095',
    type: 'URGENT_NEED',
    partId: 'PRT-03',
    partName: 'Upper Looper (Pegasus M900 Series)',
    sku: 'LP-PEG-M900',
    quantity: 6,
    unit: 'units',
    itemCount: 1,
    estimatedCost: 85.2,
    urgency: 'URGENT_MANAGER',
    requiresCeoApproval: false,
    requestedBy: 'Ramesh Kumar',
    requestedByRole: 'Lead Sewing Mechanic',
    monthYear: 'September 2026',
    targetLine: 'Line 02',
    targetMachineId: 'MC-OVK-204',
    justification: 'URGENT SHIFT DEFECT: Frequent needle-looper clash causing burrs. Stock down to 4 loopers across entire plant. Requires fast-track maintenance manager authorization.',
    status: 'PENDING_MANAGER_APPROVAL',
    createdAt: '2026-09-21T10:30:00Z',
  },
  {
    id: 'REQ-2026-088',
    type: 'MONTHLY_INDENT',
    items: [
      {
        partId: 'PRT-01',
        partName: 'Organ Needles DBx1 (#14/90) Knit & Woven',
        sku: 'NDL-DBX1-14',
        quantity: 500,
        unit: 'pcs',
        unitCost: 0.35,
        totalCost: 175.0,
      },
      {
        partId: 'PRT-08',
        partName: 'High Purity White Sewing Mineral Oil (ISO VG 10, 5L)',
        sku: 'OIL-VG10-5L',
        quantity: 10,
        unit: 'jugs',
        unitCost: 22.5,
        totalCost: 225.0,
      },
      {
        partId: 'PRT-04',
        partName: 'Bobbin Case Towa BC-DB1-NBL6',
        sku: 'BC-TOWA-BC1',
        quantity: 15,
        unit: 'units',
        unitCost: 7.8,
        totalCost: 117.0,
      },
      {
        partId: 'PRT-05',
        partName: 'Differential Feed Dog (4-Row Fine Pitch)',
        sku: 'FD-4ROW-JUK',
        quantity: 8,
        unit: 'units',
        unitCost: 6.4,
        totalCost: 51.2,
      },
    ],
    itemCount: 4,
    estimatedCost: 568.2,
    urgency: 'ROUTINE',
    requiresCeoApproval: false,
    requestedBy: 'Ramesh Kumar',
    requestedByRole: 'Lead Sewing Mechanic',
    monthYear: 'October 2026',
    targetLine: 'Line 01 & Line 03',
    justification: 'Planned monthly spare parts requirement for upcoming 50,000 unit export order on Line 01 and Line 03.',
    status: 'APPROVED_BY_MANAGER',
    createdAt: '2026-09-18T11:30:00Z',
    reviewedBy: 'V. Sundaram (Asset Manager)',
    reviewedAt: '2026-09-19T08:45:00Z',
    reviewNotes: 'Standard quota approved within monthly maintenance OPEX allocation.',
  },
  {
    id: 'REQ-2026-089',
    type: 'MONTHLY_INDENT',
    items: [
      {
        partId: 'PRT-06',
        partName: 'Overlock Throat Plate E18 Gauge',
        sku: 'TP-OVK-E18',
        quantity: 10,
        unit: 'units',
        unitCost: 9.6,
        totalCost: 96.0,
      },
      {
        partId: 'PRT-10',
        partName: 'Carbide Lower Stationary Trimming Knife',
        sku: 'KNF-OVK-LWR',
        quantity: 12,
        unit: 'pcs',
        unitCost: 8.75,
        totalCost: 105.0,
      },
      {
        partId: 'PRT-09',
        partName: 'Non-Stick Teflon Hinged Presser Foot T350',
        sku: 'FT-TEFLON-T35',
        quantity: 15,
        unit: 'pcs',
        unitCost: 4.2,
        totalCost: 63.0,
      },
    ],
    itemCount: 3,
    estimatedCost: 264.0,
    urgency: 'ROUTINE',
    requiresCeoApproval: false,
    requestedBy: 'Ramesh Kumar',
    requestedByRole: 'Lead Sewing Mechanic',
    monthYear: 'October 2026',
    targetLine: 'Universal Plant',
    justification: 'Monthly overhaul batch: Trimming knives, needle plates and teflon feet for sheer fabric run.',
    status: 'PENDING_REVIEW',
    createdAt: '2026-09-20T14:20:00Z',
  },
];

async function seed() {
  try {
    console.log('\n[1/6] Writing to Collection "users"...');
    for (const u of SEED_USERS) {
      await setDoc(doc(db, 'users', u.uid), u);
    }
    console.log(`  ✓ Seeded ${SEED_USERS.length} users`);

    console.log('[2/6] Writing to Collection "machines"...');
    for (const m of SEED_MACHINES) {
      await setDoc(doc(db, 'machines', m.id), m);
    }
    console.log(`  ✓ Seeded ${SEED_MACHINES.length} sewing machines across lines`);

    console.log('[3/6] Writing to Collection "parts"...');
    for (const p of SEED_PARTS) {
      await setDoc(doc(db, 'parts', p.partId), p);
    }
    console.log(`  ✓ Seeded ${SEED_PARTS.length} tool crib spare parts`);

    console.log('[4/6] Writing to Collection "repairs"...');
    for (const r of SEED_REPAIRS) {
      await setDoc(doc(db, 'repairs', r.id), r);
    }
    console.log(`  ✓ Seeded ${SEED_REPAIRS.length} repair tickets and historical ledger`);

    console.log('[5/6] Writing to Collection "ppm_schedules"...');
    for (const ppm of SEED_PPM) {
      await setDoc(doc(db, 'ppm_schedules', ppm.id), ppm);
    }
    console.log(`  ✓ Seeded ${SEED_PPM.length} preventive maintenance tasks`);

    console.log('[6/6] Writing to Collection "requisitions"...');
    for (const req of SEED_REQS) {
      await setDoc(doc(db, 'requisitions', req.id), req);
    }
    console.log(`  ✓ Seeded ${SEED_REQS.length} requisitions (Critical CEO, Urgent Shift, Monthly Indents)`);

    console.log('\n================================================================');
    console.log('✅ ALL 6 SEPARATE TABLES (COLLECTIONS) SUCCESSFULLY CREATED!');
    console.log('================================================================');
    console.log('Tables populated in Firebase Firestore:');
    console.log('  1. users         -> ' + SEED_USERS.length + ' documents');
    console.log('  2. machines      -> ' + SEED_MACHINES.length + ' documents');
    console.log('  3. parts         -> ' + SEED_PARTS.length + ' documents');
    console.log('  4. repairs       -> ' + SEED_REPAIRS.length + ' documents');
    console.log('  5. ppm_schedules -> ' + SEED_PPM.length + ' documents');
    console.log('  6. requisitions  -> ' + SEED_REQS.length + ' documents');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Cloud Firestore population failed:', err);
    process.exit(1);
  }
}

seed();
