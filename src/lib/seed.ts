import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  SEED_MACHINES,
  SEED_PARTS,
  SEED_REPAIRS,
  SEED_PPM_SCHEDULES,
  SEED_USERS,
  SEED_REQUISITIONS,
} from '@/lib/seedData';
import { initLocalSeedData } from '@/lib/services/cmmsService';

/**
 * Seed Firestore database if collections are currently empty.
 * Also initializes local browser demo storage.
 */
export async function seedDatabase(force: boolean = false): Promise<{
  success: boolean;
  message: string;
  count: { machines: number; parts: number; repairs: number; requisitions?: number };
}> {
  // Always initialize local storage fallback
  initLocalSeedData();

  if (!isFirebaseConfigured) {
    return {
      success: true,
      message: 'Demo / Offline storage seeded across 6 collections: machines, parts, repairs, ppm, requisitions, and users.',
      count: {
        machines: SEED_MACHINES.length,
        parts: SEED_PARTS.length,
        repairs: SEED_REPAIRS.length,
        requisitions: SEED_REQUISITIONS.length,
      },
    };
  }

  try {
    const seedOperations = async () => {
      // Seed Users
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'users', u.uid), u);
      }

      // Seed Machines
      for (const m of SEED_MACHINES) {
        await setDoc(doc(db, 'machines', m.id), m);
      }

      // Seed Spare Parts
      for (const p of SEED_PARTS) {
        await setDoc(doc(db, 'parts', p.partId), p);
      }

      // Seed Repairs
      for (const r of SEED_REPAIRS) {
        await setDoc(doc(db, 'repairs', r.id), r);
      }

      // Seed PPM Schedules
      for (const ppm of SEED_PPM_SCHEDULES) {
        await setDoc(doc(db, 'ppm_schedules', ppm.id), ppm);
      }

      // Seed Requisitions (Monthly Indents, Critical CEO needs, Urgent Manager needs)
      for (const req of SEED_REQUISITIONS) {
        await setDoc(doc(db, 'requisitions', req.id), req);
      }
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out after 8s. Check Firebase project rules & credentials.')), 8000)
    );

    await Promise.race([seedOperations(), timeoutPromise]);

    return {
      success: true,
      message: 'Successfully populated Cloud Firestore across 6 separate collections: users, machines, parts, repairs, ppm_schedules, and requisitions!',
      count: {
        machines: SEED_MACHINES.length,
        parts: SEED_PARTS.length,
        repairs: SEED_REPAIRS.length,
        requisitions: SEED_REQUISITIONS.length,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Seeding error:', err);
    return {
      success: false,
      message: `Failed to seed Firestore: ${message}`,
      count: { machines: 0, parts: 0, repairs: 0, requisitions: 0 },
    };
  }
}
