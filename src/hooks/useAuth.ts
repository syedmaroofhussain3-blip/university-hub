import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, getCurrentUserRole, isProfileCompleted } from '@/lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profileCompleted: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    profileCompleted: false,
    isLoading: true
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null
        }));

        // Defer fetching role and profile status
        if (session?.user) {
          setTimeout(async () => {
            const [role, profileCompleted] = await Promise.all([
              getCurrentUserRole(),
              isProfileCompleted()
            ]);
            setAuthState(prev => ({
              ...prev,
              role,
              profileCompleted,
              isLoading: false
            }));
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            role: null,
            profileCompleted: false,
            isLoading: false
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const [role, profileCompleted] = await Promise.all([
          getCurrentUserRole(),
          isProfileCompleted()
        ]);
        setAuthState({
          session,
          user: session.user,
          role,
          profileCompleted,
          isLoading: false
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          role: null,
          profileCompleted: false,
          isLoading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshAuthState = async () => {
    if (authState.user) {
      const [role, profileCompleted] = await Promise.all([
        getCurrentUserRole(),
        isProfileCompleted()
      ]);
      setAuthState(prev => ({ ...prev, role, profileCompleted }));
    }
  };

  return { ...authState, refreshAuthState };
}
