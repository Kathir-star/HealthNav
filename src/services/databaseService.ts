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
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try update first (assuming trigger already created the row)
        const { data, error: updateError } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', userId)
          .select()
          .single();
        
        if (!updateError) return data;

        // If update fails because row doesn't exist (PGRST116), try upsert
        if (updateError.code === 'PGRST116') {
          const { data: upsertData, error: upsertError } = await supabase
            .from('users')
            .upsert({ id: userId, ...profileData })
            .select()
            .single();
          
          if (!upsertError) return upsertData;
          lastError = upsertError;
        } else {
          lastError = updateError;
        }
      } catch (err) {
        lastError = err;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }

    console.error('Database Service Error (upsertProfile) after retries:', lastError);
    throw lastError;
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
