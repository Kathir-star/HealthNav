import { supabase } from '../lib/supabase';

export const databaseService = {
  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  async upsertProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, ...profileData })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Reminder operations
  async getReminders(userId: string) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async updateReminder(reminderId: string, updates: any) {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async subscribeToReminders(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`reminders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },

  // Feedback operations
  async createFeedback(feedbackData: any) {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async subscribeToProfile(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },
};
