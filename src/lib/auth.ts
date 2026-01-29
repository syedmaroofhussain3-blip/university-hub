import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'president' | 'student';

// Detect role from email domain
export function getRoleFromEmail(email: string): AppRole {
  if (email.endsWith('@iul.ac.in')) {
    return 'admin';
  }
  // Students use @student.iul.ac.in
  return 'student';
}

// Sign up with automatic role assignment
export async function signUp(email: string, password: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });

  if (error) throw error;

  // If user was created, assign role based on email domain
  if (data.user) {
    const role = getRoleFromEmail(email);
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        profile_completed: false
      });

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
    }

    // Assign role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.user.id,
        role: role
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Role assignment error:', roleError);
    }
  }

  return data;
}

// Sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current user's role
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching role:', error);
    return null;
  }

  return data?.role as AppRole || null;
}

// Check if profile is completed
export async function isProfileCompleted(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('profile_completed')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking profile:', error);
    return false;
  }

  return data?.profile_completed ?? false;
}
