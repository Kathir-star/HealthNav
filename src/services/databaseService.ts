import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_REMINDERS } from '../constants';

const GUEST_ID = 'guest_user_healthnav';

function getLocalReminders() {
  try {
    const saved = localStorage.getItem('healthnav_reminders');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // Ignore error
  }
  return MOCK_REMINDERS;
}

function saveLocalReminders(reminders: any[]) {
  try {
    localStorage.setItem('healthnav_reminders', JSON.stringify(reminders));
  } catch (e) {
    // Ignore error
  }
}

export const databaseService = {
  // Profile operations
  async getProfile(userId: string) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      try {
        const saved = localStorage.getItem('healthnav_profile');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // Ignore error
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        try {
          const saved = localStorage.getItem('healthnav_profile');
          if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
      }
      return data;
    } catch (err) {
      try {
        const saved = localStorage.getItem('healthnav_profile');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return null;
    }
  },

  async upsertProfile(userId: string, profileData: any) {
    const profileObject = { id: userId, ...profileData };
    try {
      localStorage.setItem('healthnav_profile', JSON.stringify(profileObject));
    } catch (e) {
      // Ignore error
    }

    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return profileObject;
    }

    const maxRetries = 2;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error: updateError } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', userId)
          .select()
          .single();
        
        if (!updateError && data) return data;

        if (updateError && updateError.code === 'PGRST116') {
          const { data: upsertData, error: upsertError } = await supabase
            .from('users')
            .upsert({ id: userId, ...profileData })
            .select()
            .single();
          
          if (!upsertError && upsertData) return upsertData;
        }
      } catch (err) {
        // Wait before retry
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return profileObject;
  },

  // Reminder operations
  async getReminders(userId?: string) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return getLocalReminders();
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (error || !data || data.length === 0) {
        return getLocalReminders();
      }
      return data;
    } catch (err) {
      return getLocalReminders();
    }
  },

  async addReminder(userId: string | undefined, reminder: { name: string; dosage: string; time: string; sound?: string }) {
    const local = getLocalReminders();
    const newEntry = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId || GUEST_ID,
      medicine_name: reminder.name,
      dosage: reminder.dosage,
      reminder_time: reminder.time,
      sound: reminder.sound || 'Zen',
      taken: false,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    const updated = [newEntry, ...local];
    saveLocalReminders(updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('reminders')
          .insert([newEntry]);
      } catch (err) {
        // Handled locally
      }
    }
    return newEntry;
  },

  async deleteReminder(reminderId: string) {
    const list = getLocalReminders();
    const updated = list.filter((r: any) => r.id !== reminderId);
    saveLocalReminders(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reminders')
          .update({ is_deleted: true })
          .eq('id', reminderId);
      } catch (err) {
        // Handled locally
      }
    }
    return true;
  },

  async toggleReminder(reminderId: string, currentStatus: boolean) {
    const list = getLocalReminders();
    const updated = list.map((r: any) => 
      r.id === reminderId 
        ? { ...r, taken: !currentStatus, last_taken_date: !currentStatus ? new Date().toISOString() : null } 
        : r
    );
    saveLocalReminders(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reminders')
          .update({ 
            taken: !currentStatus,
            last_taken_date: !currentStatus ? new Date().toISOString() : null
          })
          .eq('id', reminderId);
      } catch (err) {
        // Handled locally
      }
    }
    return updated.find((r: any) => r.id === reminderId);
  },

  async updateReminder(reminderId: string, updates: any) {
    const list = getLocalReminders();
    const updatedList = list.map((r: any) => r.id === reminderId ? { ...r, ...updates } : r);
    saveLocalReminders(updatedList);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .update(updates)
          .eq('id', reminderId)
          .select()
          .single();
        
        if (!error && data) return data;
      } catch (err) {
        // Ignore network errors in offline/guest mode
      }
    }
    return updatedList.find((r: any) => r.id === reminderId);
  },

  async subscribeToReminders(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return {
        unsubscribe: () => {}
      };
    }

    try {
      const channel = supabase.channel(`reminders:${userId}`);
      channel
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
      
      return channel;
    } catch (err) {
      return {
        unsubscribe: () => {}
      };
    }
  },

  // Feedback operations
  async createFeedback(feedbackData: any) {
    try {
      const savedFeedbacks = JSON.parse(localStorage.getItem('healthnav_feedbacks') || '[]');
      savedFeedbacks.push({ ...feedbackData, created_at: new Date().toISOString() });
      localStorage.setItem('healthnav_feedbacks', JSON.stringify(savedFeedbacks));
    } catch (e) {
      // Ignore error
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .insert(feedbackData)
          .select()
          .single();
        
        if (!error && data) return data;
      } catch (err) {
        // Handled locally
      }
    }
    return { status: 'success', ...feedbackData };
  },

  async subscribeToProfile(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return {
        unsubscribe: () => {}
      };
    }

    try {
      const channel = supabase.channel(`profile:${userId}`);
      channel
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

      return channel;
    } catch (err) {
      return {
        unsubscribe: () => {}
      };
    }
  },
};


