'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types/cmms';
import { SEED_USERS } from '@/lib/seedData';
import { isFirebaseConfigured, auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isFirebaseLive: boolean;
  isLoading: boolean;
  loginAsRole: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'textech_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in local storage first
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        // Default to Lead Mechanic for smooth instant demo
        setUser(SEED_USERS[0]);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(SEED_USERS[0]));
      }
    } catch {
      setUser(SEED_USERS[0]);
    }

    // If Firebase is configured with real auth, listen to auth state changes
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const matchedProfile = SEED_USERS.find((u) => u.email === fbUser.email);
          const activeUser: UserProfile = matchedProfile || {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Factory Staff',
            email: fbUser.email || '',
            role: 'MECHANIC',
            title: 'Maintenance Technician',
          };
          setUser(activeUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));
        }
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginAsRole = (targetRole: UserRole) => {
    const targetUser =
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
    setUser(targetUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(targetUser));
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Local fallback
      const found = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      } else {
        // Create demo user
        const isCeo = email.toLowerCase().includes('ceo');
        const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('mgr');
        const isStore = email.toLowerCase().includes('store');
        const isSenior = email.toLowerCase().includes('senior');

        const assignedRole: UserRole = isCeo
          ? 'CEO'
          : isAdmin
          ? 'ADMIN'
          : isStore
          ? 'STORE_PERSON'
          : isSenior
          ? 'SENIOR_MECHANIC'
          : 'MECHANIC';

        const customUser: UserProfile = {
          uid: `USR-${Date.now().toString().slice(-4)}`,
          name: email.split('@')[0],
          email,
          role: assignedRole,
          title: isCeo
            ? 'Chief Executive Officer'
            : isAdmin
            ? 'Plant Administrator'
            : isStore
            ? 'Tool Crib Storekeeper'
            : isSenior
            ? 'Senior Master Mechanic'
            : 'Sewing Floor Mechanic',
        };
        setUser(customUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(customUser));
      }
    }
  };

  const logout = () => {
    if (isFirebaseConfigured) {
      fbSignOut(auth).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'MECHANIC',
        isFirebaseLive: isFirebaseConfigured,
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
