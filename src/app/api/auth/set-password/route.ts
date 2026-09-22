import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const { auth, db } = getFirebase();
    const candidatePasswords = [
      password,
      'sewing123',
      'ceo123',
      'admin123',
      'senior123',
      'mechanic123',
      'stores123',
      'password123',
    ];

    let userCred = null;

    // Try candidate passwords to sign in and update
    for (const pwd of candidatePasswords) {
      try {
        userCred = await signInWithEmailAndPassword(auth, email.trim(), pwd);
        break;
      } catch {
        // continue trying
      }
    }

    if (userCred) {
      // User exists, update password
      await updatePassword(userCred.user, password.trim());
      if (name) {
        await updateProfile(userCred.user, { displayName: name });
      }

      // Sync Firestore profile
      const userDocRef = doc(db, 'users', userCred.user.uid);
      await setDoc(
        userDocRef,
        {
          uid: userCred.user.uid,
          email: email.trim(),
          ...(name && { name }),
          ...(role && { role }),
          defaultPassword: password.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: `Password for ${email} has been updated to '${password}' in Firebase Auth!`,
        uid: userCred.user.uid,
      });
    } else {
      // User does not exist, create new user with password
      try {
        const newCred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        if (name) {
          await updateProfile(newCred.user, { displayName: name });
        }

        const userDocRef = doc(db, 'users', newCred.user.uid);
        await setDoc(
          userDocRef,
          {
            uid: newCred.user.uid,
            email: email.trim(),
            name: name || email.split('@')[0],
            role: role || 'MECHANIC',
            defaultPassword: password.trim(),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        return NextResponse.json({
          success: true,
          message: `User ${email} created with password '${password}' in Firebase Auth!`,
          uid: newCred.user.uid,
        });
      } catch (createErr: unknown) {
        const fbErr = createErr as { code?: string; message?: string };
        return NextResponse.json(
          { error: fbErr.message || 'Failed to create user in Firebase Auth' },
          { status: 500 }
        );
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
