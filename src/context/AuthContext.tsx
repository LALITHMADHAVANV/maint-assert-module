'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types/cmms';
import { SEED_USERS } from '@/lib/seedData';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  firebaseUser: FirebaseUser | null;
  isFirebaseLive: boolean;
  isLoading: boolean;
  loginAsRole: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to determine role from email or profile
function resolveUserRole(email: string): UserRole {
  const lower = email.toLowerCase();
  if (lower.includes('ceo')) return 'CEO';
  if (lower.includes('admin') || lower.includes('mgr') || lower.includes('manager')) return 'ADMIN';
  if (lower.includes('senior')) return 'SENIOR_MECHANIC';
  if (lower.includes('store')) return 'STORE_PERSON';
  return 'MECHANIC';
}

function resolveUserTitle(role: UserRole): string {
  switch (role) {
    case 'CEO':
      return 'Chief Executive Officer (Managing Director)';
    case 'ADMIN':
    case 'ASSET_MANAGER':
      return 'Plant Administrator & Asset Director';
    case 'SENIOR_MECHANIC':
      return 'Senior Sewing Master Mechanic';
    case 'STORE_PERSON':
      return 'Tool Crib & Store In-Charge';
    case 'MECHANIC':
      return 'Line Sewing Mechanic';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile document with Firestore users table
  const syncUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUser(data);
        return data;
      }

      // Check if email matches a known seed template
      const matchedTemplate = SEED_USERS.find(
        (u) => u.email.toLowerCase() === (fbUser.email || '').toLowerCase()
      );

      const determinedRole: UserRole = matchedTemplate
        ? matchedTemplate.role
        : resolveUserRole(fbUser.email || '');

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        name: matchedTemplate?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Factory Staff',
        email: fbUser.email || '',
        role: determinedRole,
        title: matchedTemplate?.title || resolveUserTitle(determinedRole),
      };

      await setDoc(userDocRef, newProfile);
      setUser(newProfile);
      return newProfile;
    } catch (err) {
      console.warn('Firestore profile sync fallback:', err);
      // Fallback in case Firestore rules or network delay
      const matched = SEED_USERS.find(
        (u) => u.email.toLowerCase() === (fbUser.email || '').toLowerCase()
      );
      const role = matched ? matched.role : resolveUserRole(fbUser.email || '');
      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        name: matched?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Factory Staff',
        email: fbUser.email || '',
        role,
        title: matched?.title || resolveUserTitle(role),
      };
      setUser(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    // Pure Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncUserProfile(fbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (rawEmail: string, rawPass: string): Promise<void> => {
    setIsLoading(true);
    const email = (rawEmail || '').trim();
    const pass = (rawPass || '').trim();

    if (!email) {
      setIsLoading(false);
      throw new Error('Please enter your email or employee ID');
    }
    if (!pass) {
      setIsLoading(false);
      throw new Error('Please enter your password');
    }

    try {
      // 1. Attempt sign-in with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(cred.user);
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };

      // If user typed wrong password, or user doesn't exist
      if (
        fbError.code === 'auth/user-not-found' ||
        fbError.code === 'auth/invalid-credential' ||
        fbError.code === 'auth/invalid-login-credentials'
      ) {
        try {
          // Attempt automatic account creation if truly a new user
          const newCred = await createUserWithEmailAndPassword(auth, email, pass);

          const matched = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
          const role = matched ? matched.role : resolveUserRole(email);
          const name = matched ? matched.name : email.split('@')[0];

          await updateProfile(newCred.user, { displayName: name });
          await syncUserProfile(newCred.user);
          return;
        } catch (createErr: unknown) {
          const createFbErr = createErr as { code?: string; message?: string };
          // If email is already in use, the account DOES exist, but the password provided was wrong!
          if (createFbErr.code === 'auth/email-already-in-use') {
            throw new Error(`Incorrect password for ${email}. Note: Default password is: sewing123 (all lowercase, no spaces)`);
          }
          console.error('Firebase user registration failed:', createErr);
          throw createErr;
        }
      }

      if (fbError.code === 'auth/wrong-password') {
        throw new Error(`Incorrect password for ${email}. Note: Default password is: sewing123 (all lowercase, no spaces)`);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsRole = async (targetRole: UserRole): Promise<void> => {
    const target =
      SEED_USERS.find((u) => u.role === targetRole) ||
      (targetRole === 'CEO'
        ? SEED_USERS[0]
        : targetRole === 'ADMIN'
        ? SEED_USERS[1]
        : targetRole === 'SENIOR_MECHANIC'
        ? SEED_USERS[2]
        : targetRole === 'STORE_PERSON'
        ? SEED_USERS[4]
        : SEED_USERS[3]);

    await loginWithEmail(target.email, 'sewing123');
  };

  const logout = async (): Promise<void> => {
    await fbSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'MECHANIC',
        firebaseUser,
        isFirebaseLive: true,
        isLoading,
        loginAsRole,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
