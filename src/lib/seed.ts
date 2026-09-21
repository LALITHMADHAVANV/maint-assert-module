import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  SEED_MACHINES,
  SEED_PARTS,
  SEED_REPAIRS,
  SEED_PPM_SCHEDULES,
  SEED_USERS,
  SEED_REQUISITIONS,
} from '@/lib/seedData';

/**
 * Seed Cloud Firestore database across all 6 collections:
 * users, machines, parts, repairs, ppm_schedules, requisitions
 */
export async function seedDatabase(force: boolean = false): Promise<{
  success: boolean;
  message: string;
  count: { machines: number; parts: number; repairs: number; requisitions?: number };
}> {
  try {
    const seedOperations = async () => {
      // 1. Seed Users (5 Roles)
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'users', u.uid), u);
      }

      // 2. Seed Machines (12 Machines)
      for (const m of SEED_MACHINES) {
        await setDoc(doc(db, 'machines', m.id), m);
      }

      // 3. Seed Spare Parts (10 Parts)
      for (const p of SEED_PARTS) {
        await setDoc(doc(db, 'parts', p.partId), p);
      }

      // 4. Seed Repairs (6 Tickets & Logs)
      for (const r of SEED_REPAIRS) {
        await setDoc(doc(db, 'repairs', r.id), r);
      }

      // 5. Seed PPM Schedules (5 Schedules)
      for (const ppm of SEED_PPM_SCHEDULES) {
        await setDoc(doc(db, 'ppm_schedules', ppm.id), ppm);
      }

      // 6. Seed Requisitions (Monthly Indents, Critical CEO needs, Urgent Manager needs)
      for (const req of SEED_REQUISITIONS) {
        await setDoc(doc(db, 'requisitions', req.id), req);
      }
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Firestore operation timed out after 10s. Check Firebase project rules & credentials.'
            )
          ),
        10000
      )
    );

    await Promise.race([seedOperations(), timeoutPromise]);

    return {
      success: true,
      message:
        'Successfully populated Cloud Firestore across all 6 separate collections: users, machines, parts, repairs, ppm_schedules, and requisitions!',
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
      message: `Failed to seed Cloud Firestore: ${message}`,
      count: { machines: 0, parts: 0, repairs: 0, requisitions: 0 },
    };
  }
}
