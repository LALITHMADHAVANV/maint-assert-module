'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types/cmms';
import { SEED_USERS } from '@/lib/seedData';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const ROLE_PASSWORDS: Record<UserRole, string> = {
  CEO: 'ceo123',
  ADMIN: 'admin123',
  ASSET_MANAGER: 'admin123',
  SENIOR_MECHANIC: 'senior123',
  MECHANIC: 'mechanic123',
  STORE_PERSON: 'stores123',
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  supabaseUser: SupabaseUser | null;
  isSupabaseLive: boolean;
  isLoading: boolean;
  loginAsRole: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile document with Supabase users table
  const syncUserProfile = async (sbUser: SupabaseUser): Promise<UserProfile> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (data && !error) {
        setUser(data as UserProfile);
        return data as UserProfile;
      }

      // Check if email matches a known seed template
      const matchedTemplate = SEED_USERS.find(
        (u) => u.email.toLowerCase() === (sbUser.email || '').toLowerCase()
      );

      const determinedRole: UserRole = matchedTemplate
        ? matchedTemplate.role
        : resolveUserRole(sbUser.email || '');

      const newProfile: UserProfile = {
        uid: sbUser.id, // In Supabase, use Auth UID as the Profile ID
        name: matchedTemplate?.name || sbUser.email?.split('@')[0] || 'Factory Staff',
        email: sbUser.email || '',
        role: determinedRole,
        title: matchedTemplate?.title || resolveUserTitle(determinedRole),
      };

      // Create new user profile in the public.users table
      const { error: insertError } = await supabase.from('users').insert([{
        id: sbUser.id,
        uid: sbUser.id,
        name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
        title: newProfile.title
      }]);

      if (insertError) {
        console.warn('Supabase profile creation warning:', insertError);
      }

      setUser(newProfile);
      return newProfile;
    } catch (err) {
      console.warn('Supabase profile sync fallback:', err);
      // Fallback in case DB rules or network delay
      const matched = SEED_USERS.find(
        (u) => u.email.toLowerCase() === (sbUser.email || '').toLowerCase()
      );
      const role = matched ? matched.role : resolveUserRole(sbUser.email || '');
      const fallbackProfile: UserProfile = {
        uid: sbUser.id,
        name: matched?.name || sbUser.email?.split('@')[0] || 'Factory Staff',
        email: sbUser.email || '',
        role,
        title: matched?.title || resolveUserTitle(role),
      };
      setUser(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setSupabaseUser(user);
      if (user) syncUserProfile(user);
      else setIsLoading(false);
    });

    // Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user || null;
        setSupabaseUser(user);
        if (user) {
          await syncUserProfile(user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
      // 1. Attempt direct sign-in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        // If invalid password or user not found, try fallback passwords
        if (error.message.includes('Invalid login credentials')) {
          const determinedRole = resolveUserRole(email);
          const rolePass = ROLE_PASSWORDS[determinedRole] || 'sewing123';
          const tryPasses = [rolePass, 'sewing123'].filter((p) => p && p !== pass);

          // Try candidate passwords
          for (const candidate of tryPasses) {
            const { data: altData, error: altError } = await supabase.auth.signInWithPassword({
              email,
              password: candidate,
            });

            if (!altError && altData.user) {
               // Update password directly since we are now logged in
               await supabase.auth.updateUser({ password: pass });
               return;
            }
          }

          // If user does not exist in Supabase, auto-register them
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: pass,
          });

          if (signUpError) {
             throw new Error(`Incorrect password for ${email}. Default password for this role is: ${rolePass} (or sewing123)`);
          }

          if (signUpData.user) {
             return;
          }
        }
        throw error;
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
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

    const targetPass = ROLE_PASSWORDS[targetRole] || 'sewing123';
    await loginWithEmail(target.email, targetPass);
  };

  const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (!supabaseUser) {
      throw new Error('No user is currently authenticated.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'MECHANIC',
        supabaseUser,
        isSupabaseLive: true,
        isLoading,
        loginAsRole,
        loginWithEmail,
        updateUserPassword,
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
