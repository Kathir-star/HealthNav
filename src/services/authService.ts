import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const DEFAULT_GUEST_USER = {
  id: 'guest_user_healthnav',
  email: 'kathir.ven07@gmail.com',
  user_metadata: {
    display_name: 'Jaffer Rilwaan',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
  }
};

export const authService = {
  async signInWithGoogle() {
    if (!isSupabaseConfigured) {
      console.info('Supabase not configured; operating in guest mode.');
      return { provider: 'google', url: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Google sign-in bypassed or unavailable:', e);
      return { provider: 'google', url: null };
    }
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign-out ignored in bypass mode:', e);
    }
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return DEFAULT_GUEST_USER as any;
    }
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) return user;
    } catch (e) {
      // Ignored in bypass mode
    }
    return DEFAULT_GUEST_USER as any;
  },

  async updateProfile(updates: { display_name?: string; avatar_url?: string }) {
    if (!isSupabaseConfigured) {
      return { user: { ...DEFAULT_GUEST_USER, user_metadata: { ...DEFAULT_GUEST_USER.user_metadata, ...updates } } };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      if (!error && data) return data;
    } catch (e) {
      // Ignored
    }
    return { user: { ...DEFAULT_GUEST_USER, user_metadata: { ...DEFAULT_GUEST_USER.user_metadata, ...updates } } };
  },

  onAuthStateChange(callback: (user: any) => void) {
    // Provide immediate active user callback for instant dashboard loading
    callback(DEFAULT_GUEST_USER);

    if (!isSupabaseConfigured) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }

    try {
      return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? DEFAULT_GUEST_USER);
      });
    } catch (e) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },
};



