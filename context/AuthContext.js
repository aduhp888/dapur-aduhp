'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: 'admin',
  isSuperadmin: false,
  isAdmin: true,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(true);

  // Helper to sync role cookie for middleware
  const syncRoleCookie = (userRole) => {
    try {
      document.cookie = `sb-user-role=${userRole}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } catch (e) {}
  };

  const fetchProfileAndRole = useCallback(async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setRole('admin');
      setLoading(false);
      return;
    }

    setUser(currentUser);
    const email = (currentUser.email || '').toLowerCase().trim();
    const isDefaultSuperadmin = email === 'admin@aduhp.com';

    try {
      // 1. Try to fetch existing profile from dapur_users
      const { data, error } = await supabase
        .from('dapur_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        setProfile(data);
        const resolvedRole = data.role || (isDefaultSuperadmin ? 'superadmin' : 'admin');
        setRole(resolvedRole);
        syncRoleCookie(resolvedRole);
      } else {
        // 2. Profile record does not exist yet -> Seed profile automatically
        const newRole = isDefaultSuperadmin ? 'superadmin' : 'admin';
        const newProfile = {
          auth_id: currentUser.id,
          email: email,
          full_name: currentUser.user_metadata?.full_name || (isDefaultSuperadmin ? 'Superadmin Owner' : 'Staff Operasional'),
          role: newRole,
          status: 'aktif',
          created_at: new Date().toISOString(),
        };

        try {
          const { data: inserted } = await supabase
            .from('dapur_users')
            .upsert([newProfile], { onConflict: 'email' })
            .select()
            .maybeSingle();

          if (inserted) {
            setProfile(inserted);
            setRole(inserted.role);
            syncRoleCookie(inserted.role);
          } else {
            setProfile(newProfile);
            setRole(newRole);
            syncRoleCookie(newRole);
          }
        } catch (insertErr) {
          // Fallback if table doesn't exist yet
          setProfile(newProfile);
          setRole(newRole);
          syncRoleCookie(newRole);
        }
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
      const fallbackRole = isDefaultSuperadmin ? 'superadmin' : 'admin';
      setRole(fallbackRole);
      syncRoleCookie(fallbackRole);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            await fetchProfileAndRole(session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await fetchProfileAndRole(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole('admin');
          setLoading(false);
          syncRoleCookie('admin');
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      syncRoleCookie('admin');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/login';
    }
  };

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isSuperadmin,
        isAdmin,
        loading,
        logout,
        refreshProfile: () => user && fetchProfileAndRole(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
