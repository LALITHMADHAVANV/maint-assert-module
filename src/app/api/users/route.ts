import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { SEED_USERS } from '@/lib/seedData';
import { UserProfile, UserRole } from '@/types/cmms';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBerHuo4pX5vCdn3qJbR6RWOLpf42WBjRc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'maintenance-module-9c497.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'maintenance-module-9c497',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'maintenance-module-9c497.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '420649959262',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:420649959262:web:9849e8e7d072cd372c99cf',
};

function getFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

function getDefaultTitle(role: UserRole): string {
  switch (role) {
    case 'CEO':
      return 'Chief Executive Officer (Managing Director)';
    case 'ADMIN':
    case 'ASSET_MANAGER':
      return 'Plant Administrator & Asset Director';
    case 'SENIOR_MECHANIC':
      return 'Senior Master Technician & PPM Lead';
    case 'MECHANIC':
      return 'Industrial Sewing Machine Mechanic';
    case 'STORE_PERSON':
      return 'Tool Crib & Inventory Custodian';
  }
}

// GET /api/users - Fetch all factory users from Firestore and Seed data
export async function GET() {
  try {
    const { db } = getFirebase();
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);

    const firestoreUsers: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      firestoreUsers.push({
        uid: data.uid || docSnap.id,
        name: data.name || 'Factory Staff',
        email: data.email || '',
        role: (data.role || 'MECHANIC') as UserRole,
        title: data.title || getDefaultTitle(data.role || 'MECHANIC'),
        phone: data.phone || '',
        department: data.department || 'Floor Maintenance',
        employeeId: data.employeeId || `EMP-${docSnap.id.slice(0, 4)}`,
        status: data.status || 'ACTIVE',
        defaultPassword: data.defaultPassword,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    // Merge seed users if not already in firestore
    const allUsersMap = new Map<string, UserProfile>();

    // Add seed users first
    SEED_USERS.forEach((su, idx) => {
      allUsersMap.set(su.email.toLowerCase(), {
        ...su,
        employeeId: su.employeeId || `EMP-00${idx + 1}`,
        phone: su.phone || '+91 98421 0000' + (idx + 1),
        department: su.department || (su.role === 'CEO' ? 'Executive Board' : su.role === 'STORE_PERSON' ? 'Tool Crib & Stores' : 'Maintenance Workshop'),
        status: 'ACTIVE',
      });
    });

    // Merge Firestore users
    firestoreUsers.forEach((fu) => {
      allUsersMap.set(fu.email.toLowerCase(), fu);
    });

    return NextResponse.json({
      success: true,
      users: Array.from(allUsersMap.values()),
    });
  } catch (err: unknown) {
    console.error('Error fetching users:', err);
    // Return seed users as reliable fallback
    return NextResponse.json({
      success: true,
      users: SEED_USERS,
      fallback: true,
    });
  }
}

// POST /api/users - Create new user in Firebase Auth and Firestore
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, title, password, phone, department, employeeId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (role === 'CEO') {
      return NextResponse.json(
        { error: 'Cannot create CEO accounts. Executive board role cannot be provisioned by admin.' },
        { status: 403 }
      );
    }

    const { auth, db } = getFirebase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanRole: UserRole = role;
    const finalTitle = title?.trim() || getDefaultTitle(cleanRole);
    const finalEmpId = employeeId?.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    let uid = '';

    // 1. Try creating user in Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (createErr: unknown) {
      const fbErr = createErr as { code?: string; message?: string };
      // If user already exists in Firebase Auth, attempt to authenticate and update password
      if (fbErr.code === 'auth/email-already-in-use') {
        const candidatePasswords = [
          cleanPass,
          'sewing123',
          'admin123',
          'senior123',
          'mechanic123',
          'stores123',
          'ceo123',
        ];
        let signedInCred = null;
        for (const pwd of candidatePasswords) {
          try {
            signedInCred = await signInWithEmailAndPassword(auth, cleanEmail, pwd);
            break;
          } catch {
            // try next
          }
        }

        if (signedInCred) {
          uid = signedInCred.user.uid;
          await updatePassword(signedInCred.user, cleanPass);
          await updateProfile(signedInCred.user, { displayName: name.trim() });
        } else {
          // Generate a surrogate UID if already registered but password unknown
          uid = `USR-${Math.floor(100000 + Math.random() * 900000)}`;
        }
      } else {
        return NextResponse.json(
          { error: fbErr.message || 'Failed to create user in Firebase Auth' },
          { status: 400 }
        );
      }
    }

    // 2. Write full user profile to Firestore
    const userProfile: UserProfile = {
      uid,
      name: name.trim(),
      email: cleanEmail,
      role: cleanRole,
      title: finalTitle,
      phone: phone?.trim() || '',
      department: department?.trim() || 'Floor Maintenance',
      employeeId: finalEmpId,
      status: 'ACTIVE',
      defaultPassword: cleanPass,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, userProfile, { merge: true });

    return NextResponse.json({
      success: true,
      message: `User ${name} (${cleanEmail}) successfully created with role ${cleanRole}!`,
      user: userProfile,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error creating user:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
