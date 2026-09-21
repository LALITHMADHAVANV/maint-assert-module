import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  Machine,
  SparePart,
  RepairTicket,
  PPMSchedule,
  FloorLine,
  PartRequisition,
  RequisitionStatus,
} from '@/types/cmms';
import {
  SEED_MACHINES,
  SEED_PARTS,
  SEED_REPAIRS,
  SEED_PPM_SCHEDULES,
  SEED_REQUISITIONS,
  SEED_USERS,
} from '@/lib/seedData';

// Local storage keys for offline/demo mode
const STORAGE_KEYS = {
  MACHINES: 'textech_machines',
  PARTS: 'textech_parts',
  REPAIRS: 'textech_repairs',
  PPM: 'textech_ppm',
  REQUISITIONS: 'textech_requisitions',
  SEEDED: 'textech_seeded',
};

// In-memory subscriber registry for reactive updates in demo mode
type Listener<T> = (data: T) => void;
const listeners = {
  machines: new Set<Listener<Machine[]>>(),
  parts: new Set<Listener<SparePart[]>>(),
  repairs: new Set<Listener<RepairTicket[]>>(),
  ppm: new Set<Listener<PPMSchedule[]>>(),
  requisitions: new Set<Listener<PartRequisition[]>>(),
};

function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

function notifyLocal<T>(channel: keyof typeof listeners, data: T) {
  listeners[channel].forEach((listener) => {
    try {
      (listener as Listener<T>)(data);
    } catch (e) {
      console.error(`Listener error on ${channel}:`, e);
    }
  });
}

/**
 * Initialize local storage state with seed data if not already present.
 */
export function initLocalSeedData(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.SEEDED)) {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(SEED_MACHINES));
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(SEED_PARTS));
    localStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(SEED_REPAIRS));
    localStorage.setItem(STORAGE_KEYS.PPM, JSON.stringify(SEED_PPM_SCHEDULES));
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(SEED_REQUISITIONS));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  } else if (!localStorage.getItem(STORAGE_KEYS.REQUISITIONS)) {
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(SEED_REQUISITIONS));
  }
}

/**
 * Reset local and/or Firestore database to initial realistic factory data
 */
export async function resetToSeedData(): Promise<void> {
  if (typeof window !== 'undefined') {
    setLocal(STORAGE_KEYS.MACHINES, SEED_MACHINES);
    setLocal(STORAGE_KEYS.PARTS, SEED_PARTS);
    setLocal(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
    setLocal(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES);
    setLocal(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS);
    setLocal(STORAGE_KEYS.SEEDED, 'true');

    notifyLocal('machines', SEED_MACHINES);
    notifyLocal('parts', SEED_PARTS);
    notifyLocal('repairs', SEED_REPAIRS);
    notifyLocal('ppm', SEED_PPM_SCHEDULES);
    notifyLocal('requisitions', SEED_REQUISITIONS);
  }

  if (isFirebaseConfigured) {
    try {
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'users', u.uid), u);
      }
      for (const m of SEED_MACHINES) {
        await setDoc(doc(db, 'machines', m.id), m);
      }
      for (const p of SEED_PARTS) {
        await setDoc(doc(db, 'parts', p.partId), p);
      }
      for (const r of SEED_REPAIRS) {
        await setDoc(doc(db, 'repairs', r.id), r);
      }
      for (const ppm of SEED_PPM_SCHEDULES) {
        await setDoc(doc(db, 'ppm_schedules', ppm.id), ppm);
      }
      for (const req of SEED_REQUISITIONS) {
        await setDoc(doc(db, 'requisitions', req.id), req);
      }
    } catch (err) {
      console.warn('Firebase batch seed warning:', err);
    }
  }
}

/* ======================================================================
   MACHINES SERVICE
   ====================================================================== */

export function subscribeMachines(callback: (machines: Machine[]) => void): () => void {
  if (isFirebaseConfigured) {
    const colRef = collection(db, 'machines');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Machine);
          callback(list);
        } else {
          // If Firestore is empty, fallback to seed
          callback(getLocal(STORAGE_KEYS.MACHINES, SEED_MACHINES));
        }
      },
      () => {
        callback(getLocal(STORAGE_KEYS.MACHINES, SEED_MACHINES));
      }
    );
    return unsubscribe;
  }

  initLocalSeedData();
  const current = getLocal<Machine[]>(STORAGE_KEYS.MACHINES, SEED_MACHINES);
  callback(current);
  listeners.machines.add(callback);
  return () => {
    listeners.machines.delete(callback);
  };
}

export async function createMachine(machine: Machine): Promise<void> {
  const current = getLocal<Machine[]>(STORAGE_KEYS.MACHINES, SEED_MACHINES);
  const existsIndex = current.findIndex((m) => m.id.toLowerCase() === machine.id.toLowerCase());
  let updated: Machine[];

  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = machine;
  } else {
    updated = [machine, ...current];
  }
  setLocal(STORAGE_KEYS.MACHINES, updated);
  notifyLocal('machines', updated);

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'machines', machine.id), machine);
    } catch (e) {
      console.error('Firestore createMachine error:', e);
    }
  }
}

export async function relocateMachine(
  machineId: string,
  targetLine: FloorLine,
  stationNo: string,
  reason: string = 'Line rebalancing',
  mechanicName: string = 'Ramesh Kumar'
): Promise<void> {
  const currentMachines = getLocal<Machine[]>(STORAGE_KEYS.MACHINES, SEED_MACHINES);
  const machine = currentMachines.find((m) => m.id === machineId);
  if (!machine) return;

  const oldLine = machine.currentLine;
  const newStatus = targetLine === 'Buffer Workshop' ? 'BUFFER' : targetLine === 'Scrap Bay' ? 'SCRAP' : 'ACTIVE';

  const updatedMachines = currentMachines.map((m) =>
    m.id === machineId
      ? { ...m, currentLine: targetLine, stationNo: stationNo || 'Station 01', status: newStatus }
      : m
  );
  setLocal(STORAGE_KEYS.MACHINES, updatedMachines);
  notifyLocal('machines', updatedMachines);

  // Log relocation event in repairs history ledger
  const relocationRecord: RepairTicket = {
    id: `HIST-${Date.now().toString().slice(-4)}`,
    machineId,
    machineType: machine.typeName || machine.type,
    line: targetLine,
    reportedAt: new Date().toISOString(),
    reportedBy: mechanicName,
    faultCategory: 'Line Rebalancing',
    faultDetails: `Relocation from ${oldLine} to ${targetLine} (${stationNo}). Reason: ${reason}`,
    urgency: 'WARNING',
    status: 'COMPLETED',
    attendedBy: mechanicName,
    resolvedAt: new Date().toISOString(),
    downtimeMinutes: 15,
    actionTaken: `Transferred machine to ${targetLine} ${stationNo}. Checked level and air supply.`,
    partsUsed: [],
  };

  const currentRepairs = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  const updatedRepairs = [relocationRecord, ...currentRepairs];
  setLocal(STORAGE_KEYS.REPAIRS, updatedRepairs);
  notifyLocal('repairs', updatedRepairs);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'machines', machineId), {
        currentLine: targetLine,
        stationNo: stationNo || 'Station 01',
        status: newStatus,
      });
      await setDoc(doc(db, 'repairs', relocationRecord.id), relocationRecord);
    } catch (e) {
      console.error('Firestore relocateMachine error:', e);
    }
  }
}

/* ======================================================================
   SPARE PARTS SERVICE
   ====================================================================== */

export function subscribeParts(callback: (parts: SparePart[]) => void): () => void {
  if (isFirebaseConfigured) {
    const colRef = collection(db, 'parts');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          callback(snapshot.docs.map((d) => d.data() as SparePart));
        } else {
          callback(getLocal(STORAGE_KEYS.PARTS, SEED_PARTS));
        }
      },
      () => {
        callback(getLocal(STORAGE_KEYS.PARTS, SEED_PARTS));
      }
    );
    return unsubscribe;
  }

  initLocalSeedData();
  const current = getLocal<SparePart[]>(STORAGE_KEYS.PARTS, SEED_PARTS);
  callback(current);
  listeners.parts.add(callback);
  return () => {
    listeners.parts.delete(callback);
  };
}

export async function adjustPartStock(partId: string, delta: number): Promise<void> {
  const currentParts = getLocal<SparePart[]>(STORAGE_KEYS.PARTS, SEED_PARTS);
  const target = currentParts.find((p) => p.partId === partId);
  if (!target) return;

  const newStock = Math.max(0, target.stock + delta);
  const updatedParts = currentParts.map((p) =>
    p.partId === partId ? { ...p, stock: newStock } : p
  );
  setLocal(STORAGE_KEYS.PARTS, updatedParts);
  notifyLocal('parts', updatedParts);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'parts', partId), { stock: newStock });
    } catch (e) {
      console.error('Firestore adjustPartStock error:', e);
    }
  }
}

export async function restockPart(partId: string, quantity: number, poRef?: string): Promise<void> {
  if (quantity <= 0) return;
  const currentParts = getLocal<SparePart[]>(STORAGE_KEYS.PARTS, SEED_PARTS);
  const target = currentParts.find((p) => p.partId === partId);
  if (!target) return;

  const newStock = target.stock + quantity;
  const updatedParts = currentParts.map((p) =>
    p.partId === partId ? { ...p, stock: newStock } : p
  );
  setLocal(STORAGE_KEYS.PARTS, updatedParts);
  notifyLocal('parts', updatedParts);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'parts', partId), { stock: newStock });
    } catch (e) {
      console.error('Firestore restockPart error:', e);
    }
  }
}

/* ======================================================================
   REPAIRS & WORK ORDERS SERVICE (WITH ATOMIC TRANSACTION)
   ====================================================================== */

export function subscribeRepairs(callback: (repairs: RepairTicket[]) => void): () => void {
  if (isFirebaseConfigured) {
    const colRef = collection(db, 'repairs');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          callback(snapshot.docs.map((d) => d.data() as RepairTicket));
        } else {
          callback(getLocal(STORAGE_KEYS.REPAIRS, SEED_REPAIRS));
        }
      },
      () => {
        callback(getLocal(STORAGE_KEYS.REPAIRS, SEED_REPAIRS));
      }
    );
    return unsubscribe;
  }

  initLocalSeedData();
  const current = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  callback(current);
  listeners.repairs.add(callback);
  return () => {
    listeners.repairs.delete(callback);
  };
}

export async function createBreakdownTicket(
  ticketData: Omit<
    RepairTicket,
    'id' | 'status' | 'resolvedAt' | 'downtimeMinutes' | 'actionTaken' | 'partsUsed' | 'attendedBy'
  > & { attendedBy?: string | null }
): Promise<string> {
  const ticketId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
  const newTicket: RepairTicket = {
    ...ticketData,
    id: ticketId,
    status: 'PENDING',
    attendedBy: ticketData.attendedBy ?? null,
    resolvedAt: null,
    downtimeMinutes: 0,
    actionTaken: '',
    partsUsed: [],
  };

  // 1. Update repairs list
  const currentRepairs = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  const updatedRepairs = [newTicket, ...currentRepairs];
  setLocal(STORAGE_KEYS.REPAIRS, updatedRepairs);
  notifyLocal('repairs', updatedRepairs);

  // 2. Set machine status to BREAKDOWN
  const currentMachines = getLocal<Machine[]>(STORAGE_KEYS.MACHINES, SEED_MACHINES);
  const updatedMachines = currentMachines.map((m) =>
    m.id === ticketData.machineId ? { ...m, status: 'BREAKDOWN' as const } : m
  );
  setLocal(STORAGE_KEYS.MACHINES, updatedMachines);
  notifyLocal('machines', updatedMachines);

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'repairs', ticketId), newTicket);
      await updateDoc(doc(db, 'machines', ticketData.machineId), {
        status: 'BREAKDOWN',
      });
    } catch (e) {
      console.error('Firestore createBreakdownTicket error:', e);
    }
  }

  return ticketId;
}

/**
 * CRITICAL ATOMIC TRANSACTION:
 * 1. Marks repair ticket as 'COMPLETED'
 * 2. Decrements used spare parts from parts inventory
 * 3. Sets machine status = 'ACTIVE'
 * 4. Increments machine totalDowntimeMinutes by repair downtime
 */
export async function resolveRepairTicket(
  ticketId: string,
  downtimeMinutes: number,
  actionTaken: string,
  attendedBy: string,
  partsUsedInputs: Array<{ partId: string; quantity: number }>
): Promise<void> {
  // Always update local memory/storage state atomically
  const currentRepairs = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  const currentParts = getLocal<SparePart[]>(STORAGE_KEYS.PARTS, SEED_PARTS);
  const currentMachines = getLocal<Machine[]>(STORAGE_KEYS.MACHINES, SEED_MACHINES);

  const ticket = currentRepairs.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

  // Build resolved parts usage list
  const resolvedPartsUsed = partsUsedInputs
    .filter((pu) => pu.partId && pu.quantity > 0)
    .map((pu) => {
      const part = currentParts.find((p) => p.partId === pu.partId);
      return {
        partId: pu.partId,
        sku: part?.sku || pu.partId,
        name: part?.name || 'Standard Spare Part',
        quantity: pu.quantity,
      };
    });

  // 1. Update repairs document
  const updatedRepairs = currentRepairs.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: 'COMPLETED' as const,
          resolvedAt: new Date().toISOString(),
          downtimeMinutes,
          actionTaken,
          attendedBy,
          partsUsed: resolvedPartsUsed,
        }
      : t
  );

  // 2. Decrement parts stock
  const updatedParts = currentParts.map((part) => {
    const used = resolvedPartsUsed.find((u) => u.partId === part.partId);
    if (!used) return part;
    return {
      ...part,
      stock: Math.max(0, part.stock - used.quantity),
    };
  });

  // 3. Set machine status to ACTIVE and increment totalDowntimeMinutes
  const updatedMachines = currentMachines.map((m) => {
    if (m.id !== ticket.machineId) return m;
    return {
      ...m,
      status: 'ACTIVE' as const,
      totalDowntimeMinutes: (m.totalDowntimeMinutes || 0) + downtimeMinutes,
    };
  });

  setLocal(STORAGE_KEYS.REPAIRS, updatedRepairs);
  setLocal(STORAGE_KEYS.PARTS, updatedParts);
  setLocal(STORAGE_KEYS.MACHINES, updatedMachines);

  notifyLocal('repairs', updatedRepairs);
  notifyLocal('parts', updatedParts);
  notifyLocal('machines', updatedMachines);

  // If live Firebase is configured, execute true Firestore runTransaction()
  if (isFirebaseConfigured) {
    try {
      await runTransaction(db, async (transaction) => {
        const repairRef = doc(db, 'repairs', ticketId);
        const machineRef = doc(db, 'machines', ticket.machineId);

        // Read phase
        const machineSnap = await transaction.get(machineRef);
        const partSnaps = await Promise.all(
          resolvedPartsUsed.map((p) => transaction.get(doc(db, 'parts', p.partId)))
        );

        // Compute new machine total downtime
        const currentMData = machineSnap.exists() ? (machineSnap.data() as Machine) : null;
        const currentDowntime = currentMData?.totalDowntimeMinutes || 0;

        // Write phase: Update repair ticket
        transaction.update(repairRef, {
          status: 'COMPLETED',
          resolvedAt: new Date().toISOString(),
          downtimeMinutes,
          actionTaken,
          attendedBy,
          partsUsed: resolvedPartsUsed,
        });

        // Write phase: Decrement parts
        resolvedPartsUsed.forEach((p, idx) => {
          const snap = partSnaps[idx];
          if (snap.exists()) {
            const currentStock = snap.data().stock || 0;
            transaction.update(doc(db, 'parts', p.partId), {
              stock: Math.max(0, currentStock - p.quantity),
            });
          }
        });

        // Write phase: Update machine status and downtime
        transaction.update(machineRef, {
          status: 'ACTIVE',
          totalDowntimeMinutes: currentDowntime + downtimeMinutes,
        });
      });
    } catch (firebaseErr) {
      console.error('Firestore runTransaction error:', firebaseErr);
    }
  }
}

export async function assignRepairTicket(
  ticketId: string,
  mechanicName: string
): Promise<void> {
  const currentRepairs = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  const updatedRepairs = currentRepairs.map((r) =>
    r.id === ticketId
      ? {
          ...r,
          attendedBy: mechanicName,
          status: (r.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS') as RepairTicket['status'],
        }
      : r
  );
  setLocal(STORAGE_KEYS.REPAIRS, updatedRepairs);
  notifyLocal('repairs', updatedRepairs);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'repairs', ticketId), {
        attendedBy: mechanicName,
        status: 'IN_PROGRESS',
      });
    } catch (e) {
      console.error('Firestore assignRepairTicket error:', e);
    }
  }
}

/* ======================================================================
   PREVENTIVE MAINTENANCE (PPM) SERVICE
   ====================================================================== */

export function subscribePPMSchedules(callback: (schedules: PPMSchedule[]) => void): () => void {
  if (isFirebaseConfigured) {
    const colRef = collection(db, 'ppm_schedules');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          callback(snapshot.docs.map((d) => d.data() as PPMSchedule));
        } else {
          callback(getLocal(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES));
        }
      },
      () => {
        callback(getLocal(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES));
      }
    );
    return unsubscribe;
  }

  initLocalSeedData();
  const current = getLocal<PPMSchedule[]>(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES);
  callback(current);
  listeners.ppm.add(callback);
  return () => {
    listeners.ppm.delete(callback);
  };
}

export async function completePPMTask(
  scheduleId: string,
  mechanicName: string = 'Ramesh Kumar'
): Promise<void> {
  const currentSchedules = getLocal<PPMSchedule[]>(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES);
  const target = currentSchedules.find((s) => s.id === scheduleId);
  if (!target) return;

  const today = new Date();
  const nextDueDate = new Date(today);
  nextDueDate.setDate(nextDueDate.getDate() + (target.intervalDays || 14));

  const updatedSchedules = currentSchedules.map((s) =>
    s.id === scheduleId
      ? {
          ...s,
          lastServiced: today.toISOString().slice(0, 10),
          nextDue: nextDueDate.toISOString().slice(0, 10),
          status: 'PENDING' as const,
        }
      : s
  );
  setLocal(STORAGE_KEYS.PPM, updatedSchedules);
  notifyLocal('ppm', updatedSchedules);

  // Append entry to repair/service history ledger
  const ppmHistoryEntry: RepairTicket = {
    id: `HIST-${Math.floor(1000 + Math.random() * 9000)}`,
    machineId: target.machineId,
    machineType: 'Sewing Machinery',
    line: 'Floor Maintenance',
    reportedAt: today.toISOString(),
    reportedBy: 'System Routine PPM',
    faultCategory: 'Preventive Overhaul',
    faultDetails: target.task,
    urgency: 'WARNING',
    status: 'COMPLETED',
    attendedBy: mechanicName,
    resolvedAt: today.toISOString(),
    downtimeMinutes: 15,
    actionTaken: `Executed scheduled PPM overhaul: ${target.task}. Cleaned blower lint, tested tension discs, checked oil wick siphon.`,
    partsUsed: [],
  };

  const currentRepairs = getLocal<RepairTicket[]>(STORAGE_KEYS.REPAIRS, SEED_REPAIRS);
  const updatedRepairs = [ppmHistoryEntry, ...currentRepairs];
  setLocal(STORAGE_KEYS.REPAIRS, updatedRepairs);
  notifyLocal('repairs', updatedRepairs);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'ppm_schedules', scheduleId), {
        lastServiced: today.toISOString().slice(0, 10),
        nextDue: nextDueDate.toISOString().slice(0, 10),
        status: 'PENDING',
      });
      await setDoc(doc(db, 'repairs', ppmHistoryEntry.id), ppmHistoryEntry);
    } catch (e) {
      console.error('Firestore completePPMTask error:', e);
    }
  }
}

export async function createPPMSchedule(schedule: PPMSchedule): Promise<void> {
  const currentSchedules = getLocal<PPMSchedule[]>(STORAGE_KEYS.PPM, SEED_PPM_SCHEDULES);
  const updatedSchedules = [schedule, ...currentSchedules];
  setLocal(STORAGE_KEYS.PPM, updatedSchedules);
  notifyLocal('ppm', updatedSchedules);

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'ppm_schedules', schedule.id), schedule);
    } catch (e) {
      console.error('Firestore createPPMSchedule error:', e);
    }
  }
}

/* ======================================================================
   MONTHLY INDENTS & CRITICAL CEO REQUISITIONS SERVICE
   ====================================================================== */

export function subscribeRequisitions(
  callback: (requisitions: PartRequisition[]) => void
): () => void {
  if (isFirebaseConfigured) {
    const colRef = collection(db, 'requisitions');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          callback(snapshot.docs.map((d) => d.data() as PartRequisition));
        } else {
          callback(getLocal(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS));
        }
      },
      () => {
        callback(getLocal(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS));
      }
    );
    return unsubscribe;
  }

  initLocalSeedData();
  const current = getLocal<PartRequisition[]>(
    STORAGE_KEYS.REQUISITIONS,
    SEED_REQUISITIONS
  );
  callback(current);
  listeners.requisitions.add(callback);
  return () => {
    listeners.requisitions.delete(callback);
  };
}

export async function createRequisition(
  reqData: Omit<PartRequisition, 'id' | 'createdAt' | 'status'> & {
    status?: PartRequisition['status'];
  }
): Promise<string> {
  const reqId = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const defaultStatus =
    reqData.status ||
    (reqData.type === 'CRITICAL_CEO'
      ? 'PENDING_CEO_APPROVAL'
      : reqData.type === 'URGENT_NEED'
      ? 'PENDING_MANAGER_APPROVAL'
      : 'PENDING_REVIEW');

  const newReq: PartRequisition = {
    ...reqData,
    id: reqId,
    status: defaultStatus,
    createdAt: new Date().toISOString(),
  };

  const currentReqs = getLocal<PartRequisition[]>(
    STORAGE_KEYS.REQUISITIONS,
    SEED_REQUISITIONS
  );
  const updated = [newReq, ...currentReqs];
  setLocal(STORAGE_KEYS.REQUISITIONS, updated);
  notifyLocal('requisitions', updated);

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'requisitions', reqId), newReq);
    } catch (err) {
      console.error('Firestore createRequisition error:', err);
    }
  }

  return reqId;
}

export async function approveRequisition(
  id: string,
  reviewerName: string = 'Executive Approver',
  reviewNotes: string = 'Authorized by Management',
  approvedStatus: 'APPROVED_BY_CEO' | 'APPROVED_BY_MANAGER' = 'APPROVED_BY_CEO'
): Promise<void> {
  const currentReqs = getLocal<PartRequisition[]>(
    STORAGE_KEYS.REQUISITIONS,
    SEED_REQUISITIONS
  );
  const updated = currentReqs.map((r) =>
    r.id === id
      ? {
          ...r,
          status: approvedStatus,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString(),
          reviewNotes,
        }
      : r
  );

  setLocal(STORAGE_KEYS.REQUISITIONS, updated);
  notifyLocal('requisitions', updated);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'requisitions', id), {
        status: approvedStatus,
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
        reviewNotes,
      });
    } catch (err) {
      console.error('Firestore approveRequisition error:', err);
    }
  }
}

export async function rejectRequisition(
  id: string,
  reviewerName: string = 'Plant CEO / General Manager',
  reviewNotes: string = 'Rejected: Request exceeds allocation or deferred'
): Promise<void> {
  const currentReqs = getLocal<PartRequisition[]>(
    STORAGE_KEYS.REQUISITIONS,
    SEED_REQUISITIONS
  );
  const updated = currentReqs.map((r) =>
    r.id === id
      ? {
          ...r,
          status: 'REJECTED' as const,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString(),
          reviewNotes,
        }
      : r
  );

  setLocal(STORAGE_KEYS.REQUISITIONS, updated);
  notifyLocal('requisitions', updated);

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'requisitions', id), {
        status: 'REJECTED',
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
        reviewNotes,
      });
    } catch (err) {
      console.error('Firestore rejectRequisition error:', err);
    }
  }
}

export async function fulfillMonthlyIndent(
  id: string,
  storePersonName: string = 'M. Arumugam (Stores In-Charge)',
  storeNotes: string = 'Inward shipment received into crib and verified against QC pass',
  actionType: 'RECEIVE_INTO_CRIB' | 'DISPATCH_TO_LINE' = 'RECEIVE_INTO_CRIB'
): Promise<void> {
  const currentReqs = getLocal<PartRequisition[]>(
    STORAGE_KEYS.REQUISITIONS,
    SEED_REQUISITIONS
  );

  const targetReq = currentReqs.find((r) => r.id === id);
  if (!targetReq) return;

  const newStatus = actionType === 'DISPATCH_TO_LINE' ? 'FULFILLED' : 'ORDERED';

  const updatedReqs = currentReqs.map((r) =>
    r.id === id
      ? {
          ...r,
          status: newStatus as RequisitionStatus,
          assignedStorePerson: storePersonName,
          fulfilledAt: new Date().toISOString(),
          storeNotes,
        }
      : r
  );

  setLocal(STORAGE_KEYS.REQUISITIONS, updatedReqs);
  notifyLocal('requisitions', updatedReqs);

  // If receiving into crib, update part stocks for each item in the indent
  if (actionType === 'RECEIVE_INTO_CRIB' && targetReq.items && targetReq.items.length > 0) {
    const currentParts = getLocal<SparePart[]>(STORAGE_KEYS.PARTS, SEED_PARTS);
    const updatedParts = currentParts.map((p) => {
      const match = targetReq.items?.find((item) => item.partId === p.partId);
      if (match) {
        return { ...p, stock: p.stock + match.quantity };
      }
      return p;
    });
    setLocal(STORAGE_KEYS.PARTS, updatedParts);
    notifyLocal('parts', updatedParts);

    if (isFirebaseConfigured) {
      try {
        for (const item of targetReq.items) {
          const partDoc = currentParts.find((p) => p.partId === item.partId);
          if (partDoc) {
            await updateDoc(doc(db, 'parts', item.partId), {
              stock: partDoc.stock + item.quantity,
            });
          }
        }
      } catch (err) {
        console.warn('Firestore stock intake warning:', err);
      }
    }
  }

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'requisitions', id), {
        status: newStatus,
        assignedStorePerson: storePersonName,
        fulfilledAt: new Date().toISOString(),
        storeNotes,
      });
    } catch (err) {
      console.error('Firestore fulfillMonthlyIndent error:', err);
    }
  }
}

