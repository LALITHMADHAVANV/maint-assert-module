export type MachineType =
  | 'SNLS' // Single Needle Lockstitch
  | 'DNLS' // Double Needle Lockstitch
  | 'OVERLOCK' // 4-Thread or 5-Thread Overlock
  | 'FLATLOCK' // Flatlock / Interlock (Coverstitch)
  | 'BUTTONHOLE' // Buttonhole Indexer
  | 'BARTACK' // Electronic Bartack
  | 'FEED_OFF_ARM'; // Feed-off-the-arm

export type MotorType = 'SERVO' | 'CLUTCH';

export type MachineStatus =
  | 'ACTIVE'
  | 'BUFFER'
  | 'BREAKDOWN'
  | 'UNDER_MAINTENANCE'
  | 'SCRAP';

export type FloorLine =
  | 'Line 01'
  | 'Line 02'
  | 'Line 03'
  | 'Line 04'
  | 'Buffer Workshop'
  | 'Scrap Bay';

export interface Machine {
  id: string; // e.g., "MC-SNLS-101"
  brand: string; // "Juki", "Brother", "Jack", "Pegasus", "Siruba", "Yamato"
  model: string; // "DDL-8700-7", "S-7200C"
  type: MachineType;
  typeName?: string; // e.g. "Single Needle Lockstitch (SNLS)"
  motorType: MotorType;
  purchaseDate: string; // ISO format or YYYY-MM-DD
  cost: number; // USD
  status: MachineStatus;
  currentLine: FloorLine;
  stationNo: string; // e.g. "Station 04"
  operator?: string;
  totalDowntimeMinutes: number;
  ageYears?: number;
}

export type PartCategory =
  | 'Needles'
  | 'Hooks & Loopers'
  | 'Feed & Plates'
  | 'Motors & Electrical'
  | 'Fluids & Consumables';

export interface SparePart {
  partId: string; // e.g., "PRT-01"
  sku: string; // e.g., "NDL-DBX1-14"
  name: string; // e.g., "Organ Needles DBx1 (#14/90)"
  category: PartCategory;
  compat: string; // description of compatibility
  stock: number;
  minStock: number; // threshold for low-stock warning
  monthlyAllowance: number;
  unitCost: number; // USD
  unit: string; // e.g., "pcs", "units", "jugs"
  compatibleTypes: MachineType[];
}

export type RepairUrgency = 'CRITICAL' | 'WARNING';
export type RepairStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface RepairPartUsage {
  partId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface RepairTicket {
  id: string; // e.g., "WO-1091"
  machineId: string;
  machineType: string;
  line: string;
  reportedAt: string; // ISO date string
  reportedBy: string;
  faultCategory: string; // e.g. "Skipping Stitches", "Needle Breakage", etc.
  faultDetails: string;
  urgency: RepairUrgency;
  status: RepairStatus;
  attendedBy: string | null;
  resolvedAt: string | null;
  downtimeMinutes: number;
  actionTaken: string;
  partsUsed: RepairPartUsage[];
}

export type PPMFrequency = 'Weekly' | 'Monthly' | '6-Month';
export type PPMStatus = 'PENDING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';

export interface PPMSchedule {
  id: string;
  machineId: string;
  task: string;
  intervalDays: number;
  frequency: PPMFrequency;
  lastServiced: string;
  nextDue: string;
  status: PPMStatus;
}

export type UserRole =
  | 'CEO'
  | 'ADMIN'
  | 'SENIOR_MECHANIC'
  | 'MECHANIC'
  | 'STORE_PERSON'
  | 'ASSET_MANAGER';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export type RequisitionType = 'MONTHLY_INDENT' | 'URGENT_NEED' | 'CRITICAL_CEO';
export type RequisitionUrgency = 'ROUTINE' | 'URGENT_MANAGER' | 'CRITICAL_CEO_APPROVAL';
export type RequisitionStatus =
  | 'PENDING_CEO_APPROVAL'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_REVIEW'
  | 'APPROVED_BY_CEO'
  | 'APPROVED_BY_MANAGER'
  | 'REJECTED'
  | 'ORDERED'
  | 'FULFILLED';

export interface RequisitionItem {
  partId: string;
  partName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface PartRequisition {
  id: string; // e.g. "REQ-2026-081"
  type: RequisitionType;
  // For single-part requests (Critical / Urgent)
  partId?: string;
  partName?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  // For monthly indent with multiple items
  items?: RequisitionItem[];
  itemCount: number;
  estimatedCost: number; // total USD
  urgency: RequisitionUrgency;
  requiresCeoApproval: boolean;
  requestedBy: string; // mechanic name
  requestedByRole: string;
  monthYear: string; // e.g. "October 2026"
  targetLine?: string; // e.g. "Line 02"
  targetMachineId?: string; // e.g. "MC-OVK-204"
  justification: string;
  status: RequisitionStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  // Store Person receipt and fulfillment tracking
  assignedStorePerson?: string; // e.g. "M. Arumugam (Stores In-Charge)"
  fulfilledAt?: string;
  storeNotes?: string;
}


