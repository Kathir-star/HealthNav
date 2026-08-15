import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  MOCK_REMINDERS, 
  MOCK_HEALTH_RECORDS, 
  MOCK_TIMELINE_EVENTS, 
  MOCK_APPOINTMENTS, 
  MOCK_VITALS,
  MOCK_DONORS 
} from '../constants';
import { 
  HealthRecord, 
  TimelineEvent, 
  Appointment, 
  VitalsLogEntry, 
  VitalsData, 
  DonorRecord,
  EmergencyContact,
  HealthProfile 
} from '../types';

const GUEST_ID = 'guest_user_healthnav';

// Helper storage functions
function getStorageItem<T>(key: string, defaultVal: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}:`, e);
  }
  return defaultVal;
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing localStorage key ${key}:`, e);
  }
}

// Initial default vitals logs
const DEFAULT_VITALS_LOGS: VitalsLogEntry[] = [
  {
    id: 'vlog-1',
    metricType: 'bloodPressure',
    label: 'Blood Pressure',
    value: '120/80',
    unit: 'mmHg',
    date: 'Aug 14, 2026',
    time: '08:30 AM',
    status: 'Normal',
    notes: 'Morning resting reading. Optimal range.'
  },
  {
    id: 'vlog-2',
    metricType: 'heartRate',
    label: 'Resting Heart Rate',
    value: 72,
    unit: 'bpm',
    date: 'Aug 14, 2026',
    time: '08:30 AM',
    status: 'Optimal',
    notes: 'Standard resting pulse.'
  },
  {
    id: 'vlog-3',
    metricType: 'spO2',
    label: 'Blood Oxygen (SpO2)',
    value: 98,
    unit: '%',
    date: 'Aug 13, 2026',
    time: '09:00 PM',
    status: 'Optimal',
    notes: 'Ambient room air.'
  },
  {
    id: 'vlog-4',
    metricType: 'bloodGlucose',
    label: 'Fasting Blood Glucose',
    value: 94,
    unit: 'mg/dL',
    date: 'Aug 12, 2026',
    time: '07:45 AM',
    status: 'Normal',
    notes: '12-hour fasting panel.'
  }
];

export const databaseService = {
  // ==========================================
  // 1. HEALTH PROFILE & PERSONAL INFO
  // ==========================================
  async getProfile(userId: string) {
    if (!userId) userId = GUEST_ID;

    if (!isSupabaseConfigured || userId === GUEST_ID) {
      return getStorageItem('healthnav_profile', null);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return getStorageItem('healthnav_profile', null);
      }
      return data || getStorageItem('healthnav_profile', null);
    } catch (err) {
      return getStorageItem('healthnav_profile', null);
    }
  },

  async upsertProfile(userId: string, profileData: any) {
    if (!userId) userId = GUEST_ID;
    const profileObject = { id: userId, ...profileData, updated_at: new Date().toISOString() };
    setStorageItem('healthnav_profile', profileObject);

    if (isSupabaseConfigured && userId !== GUEST_ID) {
      try {
        const { data, error } = await supabase
          .from('users')
          .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
          .select()
          .single();
        
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase profile upsert error:', err);
      }
    }

    return profileObject;
  },

  async updateHealthProfileFields(userId: string, updates: Partial<HealthProfile>) {
    if (!userId) userId = GUEST_ID;
    const current = (await this.getProfile(userId)) || {};
    const merged = {
      ...current,
      ...updates,
      profile: { ...(current.profile || {}), ...(updates.profile || {}) },
      health: { ...(current.health || {}), ...(updates.health || {}) },
      pregnancy: { ...(current.pregnancy || {}), ...(updates.pregnancy || {}) },
      emergency: { ...(current.emergency || {}), ...(updates.emergency || {}) },
      updated_at: new Date().toISOString()
    };
    return await this.upsertProfile(userId, merged);
  },

  // ==========================================
  // 2. HEALTH RECORDS / MEDICAL DOCUMENTS (CRUD)
  // ==========================================
  async getRecords(userId?: string): Promise<HealthRecord[]> {
    const defaultRecords = MOCK_HEALTH_RECORDS as HealthRecord[];
    const local = getStorageItem<HealthRecord[]>('healthnav_records', defaultRecords);

    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        date: d.date || new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fileName: d.file_name || d.fileName || `${(d.title || 'record').toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSize: d.file_size || d.fileSize || '1.2 MB',
        status: d.status || 'Verified',
        provider: d.provider || 'Personal Health Entry',
        summary: d.summary || '',
        notes: d.notes || '',
        tags: Array.isArray(d.tags) ? d.tags : [d.category],
        fileUrl: d.file_url,
        isDemo: d.is_demo || false
      }));
    } catch (err) {
      return local;
    }
  },

  async createRecord(userId: string | undefined, record: Partial<HealthRecord>): Promise<HealthRecord> {
    if (!record.title?.trim()) {
      throw new Error("Document title is required.");
    }

    const newId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: HealthRecord = {
      id: newId,
      title: record.title.trim(),
      category: record.category || 'Lab Reports',
      date: record.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      fileName: record.fileName || `${(record.title?.trim() || 'record').toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: record.fileSize || '1.2 MB',
      status: record.status || 'Verified',
      provider: record.provider?.trim() || 'Uploaded by Patient',
      summary: record.summary?.trim() || 'Patient uploaded medical document.',
      notes: record.notes?.trim() || '',
      tags: record.tags || [record.category || 'Lab Reports', 'User Document'],
      fileUrl: record.fileUrl,
      isDemo: false
    };

    const current = await this.getRecords(userId);
    const updated = [newRecord, ...current];
    setStorageItem('healthnav_records', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase.from('health_records').insert([{
          id: newId,
          user_id: userId,
          title: newRecord.title,
          category: newRecord.category,
          date: newRecord.date,
          file_name: newRecord.fileName,
          file_size: newRecord.fileSize,
          status: newRecord.status,
          provider: newRecord.provider,
          summary: newRecord.summary,
          notes: newRecord.notes,
          tags: newRecord.tags,
          file_url: newRecord.fileUrl,
          is_deleted: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Supabase record insert error:", e);
      }
    }

    return newRecord;
  },

  async updateRecord(recordId: string, updates: Partial<HealthRecord>, userId?: string): Promise<HealthRecord> {
    if (!recordId) throw new Error("Record ID is required.");
    const current = await this.getRecords(userId);
    const index = current.findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error("Record not found.");
    }

    const updatedRecord: HealthRecord = {
      ...current[index],
      ...updates,
      id: recordId, // protect ID
      title: updates.title !== undefined ? updates.title.trim() : current[index].title,
      summary: updates.summary !== undefined ? updates.summary.trim() : current[index].summary,
      notes: updates.notes !== undefined ? updates.notes.trim() : current[index].notes,
      provider: updates.provider !== undefined ? updates.provider.trim() : current[index].provider,
    };

    current[index] = updatedRecord;
    setStorageItem('healthnav_records', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('health_records')
          .update({
            title: updatedRecord.title,
            category: updatedRecord.category,
            date: updatedRecord.date,
            file_name: updatedRecord.fileName,
            file_size: updatedRecord.fileSize,
            status: updatedRecord.status,
            provider: updatedRecord.provider,
            summary: updatedRecord.summary,
            notes: updatedRecord.notes,
            tags: updatedRecord.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase record update error:", e);
      }
    }

    return updatedRecord;
  },

  async deleteRecord(recordId: string, userId?: string): Promise<boolean> {
    if (!recordId) throw new Error("Record ID is required.");
    const current = await this.getRecords(userId);
    const updated = current.filter(r => r.id !== recordId);
    setStorageItem('healthnav_records', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('health_records')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', recordId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase record delete error:", e);
      }
    }

    return true;
  },

  // ==========================================
  // 3. TIMELINE EVENTS (CRUD)
  // ==========================================
  async getTimelineEvents(userId?: string): Promise<TimelineEvent[]> {
    const defaultEvents = MOCK_TIMELINE_EVENTS as TimelineEvent[];
    const local = getStorageItem<TimelineEvent[]>('healthnav_timeline', defaultEvents);

    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        date: d.date,
        time: d.time,
        type: d.type,
        description: d.description,
        details: d.details,
        provider: d.provider,
        status: d.status || 'completed',
        tags: Array.isArray(d.tags) ? d.tags : [],
        isDemo: d.is_demo || false
      }));
    } catch (err) {
      return local;
    }
  },

  async createTimelineEvent(userId: string | undefined, event: Partial<TimelineEvent>): Promise<TimelineEvent> {
    if (!event.title?.trim()) {
      throw new Error("Event title is required.");
    }

    const newId = `tl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEvent: TimelineEvent = {
      id: newId,
      title: event.title.trim(),
      type: event.type || 'report',
      date: event.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: event.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: event.provider?.trim() || 'Personal Health Entry',
      description: event.description?.trim() || 'Health record entry added by user.',
      details: event.details?.trim() || '',
      status: event.status || 'completed',
      tags: event.tags || ['Personal Log', (event.type || 'report').toUpperCase()],
      isDemo: false
    };

    const current = await this.getTimelineEvents(userId);
    const updated = [newEvent, ...current];
    setStorageItem('healthnav_timeline', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase.from('timeline_events').insert([{
          id: newId,
          user_id: userId,
          title: newEvent.title,
          type: newEvent.type,
          date: newEvent.date,
          time: newEvent.time,
          provider: newEvent.provider,
          description: newEvent.description,
          details: newEvent.details,
          status: newEvent.status,
          tags: newEvent.tags,
          is_deleted: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Supabase timeline insert error:", e);
      }
    }

    return newEvent;
  },

  async updateTimelineEvent(eventId: string, updates: Partial<TimelineEvent>, userId?: string): Promise<TimelineEvent> {
    if (!eventId) throw new Error("Event ID is required.");
    const current = await this.getTimelineEvents(userId);
    const index = current.findIndex(e => e.id === eventId);
    if (index === -1) {
      throw new Error("Timeline event not found.");
    }

    const updatedEvent: TimelineEvent = {
      ...current[index],
      ...updates,
      id: eventId,
      title: updates.title !== undefined ? updates.title.trim() : current[index].title,
      description: updates.description !== undefined ? updates.description.trim() : current[index].description,
      details: updates.details !== undefined ? updates.details.trim() : current[index].details,
      provider: updates.provider !== undefined ? updates.provider.trim() : current[index].provider,
    };

    current[index] = updatedEvent;
    setStorageItem('healthnav_timeline', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('timeline_events')
          .update({
            title: updatedEvent.title,
            type: updatedEvent.type,
            date: updatedEvent.date,
            time: updatedEvent.time,
            provider: updatedEvent.provider,
            description: updatedEvent.description,
            details: updatedEvent.details,
            status: updatedEvent.status,
            tags: updatedEvent.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase timeline update error:", e);
      }
    }

    return updatedEvent;
  },

  async deleteTimelineEvent(eventId: string, userId?: string): Promise<boolean> {
    if (!eventId) throw new Error("Event ID is required.");
    const current = await this.getTimelineEvents(userId);
    const updated = current.filter(e => e.id !== eventId);
    setStorageItem('healthnav_timeline', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('timeline_events')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', eventId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase timeline delete error:", e);
      }
    }

    return true;
  },

  // ==========================================
  // 4. MEDICATIONS & REMINDERS (CRUD)
  // ==========================================
  async getReminders(userId?: string): Promise<any[]> {
    const local = getStorageItem<any[]>('healthnav_reminders', MOCK_REMINDERS.map(m => ({
      id: m.id,
      medicine_name: m.medicineName,
      dosage: '1 tablet (500mg)',
      reminder_time: m.time,
      sound: 'Zen',
      taken: m.taken,
      is_deleted: false,
      created_at: new Date().toISOString()
    })));

    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (error || !data || data.length === 0) {
        return local;
      }
      return data;
    } catch (err) {
      return local;
    }
  },

  async addReminder(userId: string | undefined, reminder: { name: string; dosage: string; time: string; sound?: string; notes?: string }) {
    if (!reminder.name?.trim()) {
      throw new Error("Medicine name is required.");
    }

    const newId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry = {
      id: newId,
      user_id: userId || GUEST_ID,
      medicine_name: reminder.name.trim(),
      dosage: reminder.dosage?.trim() || '1 tablet',
      reminder_time: reminder.time,
      sound: reminder.sound || 'Zen',
      notes: reminder.notes?.trim() || '',
      taken: false,
      is_deleted: false,
      created_at: new Date().toISOString()
    };

    const current = await this.getReminders(userId);
    const updated = [newEntry, ...current];
    setStorageItem('healthnav_reminders', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('reminders')
          .insert([newEntry]);
      } catch (err) {
        console.warn("Supabase reminder insert error:", err);
      }
    }
    return newEntry;
  },

  async updateReminder(reminderId: string, updates: any, userId?: string) {
    if (!reminderId) throw new Error("Reminder ID is required.");
    const current = await this.getReminders(userId);
    const index = current.findIndex(r => r.id === reminderId);
    if (index === -1) throw new Error("Reminder not found.");

    const updatedEntry = {
      ...current[index],
      ...updates,
      id: reminderId,
      medicine_name: updates.medicine_name || updates.name || current[index].medicine_name,
      dosage: updates.dosage || current[index].dosage,
      reminder_time: updates.reminder_time || updates.time || current[index].reminder_time,
      sound: updates.sound || current[index].sound,
      notes: updates.notes !== undefined ? updates.notes : current[index].notes,
      updated_at: new Date().toISOString()
    };

    current[index] = updatedEntry;
    setStorageItem('healthnav_reminders', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('reminders')
          .update({
            medicine_name: updatedEntry.medicine_name,
            dosage: updatedEntry.dosage,
            reminder_time: updatedEntry.reminder_time,
            sound: updatedEntry.sound,
            notes: updatedEntry.notes,
            taken: updatedEntry.taken,
            updated_at: new Date().toISOString()
          })
          .eq('id', reminderId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn("Supabase reminder update error:", err);
      }
    }
    return updatedEntry;
  },

  async deleteReminder(reminderId: string, userId?: string): Promise<boolean> {
    if (!reminderId) throw new Error("Reminder ID is required.");
    const current = await this.getReminders(userId);
    const updated = current.filter((r: any) => r.id !== reminderId);
    setStorageItem('healthnav_reminders', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('reminders')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', reminderId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn("Supabase reminder delete error:", err);
      }
    }
    return true;
  },

  async toggleReminder(reminderId: string, currentStatus: boolean, userId?: string) {
    if (!reminderId) throw new Error("Reminder ID is required.");
    const current = await this.getReminders(userId);
    const index = current.findIndex(r => r.id === reminderId);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      taken: !currentStatus,
      last_taken_date: !currentStatus ? new Date().toISOString() : null
    };
    setStorageItem('healthnav_reminders', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('reminders')
          .update({ 
            taken: !currentStatus,
            last_taken_date: !currentStatus ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', reminderId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn("Supabase toggle reminder error:", err);
      }
    }
    return current[index];
  },

  // ==========================================
  // 5. VITALS TELEMETRY & LOG ENTRIES (CRUD)
  // ==========================================
  async getVitals(userId?: string): Promise<VitalsData> {
    const local = getStorageItem<VitalsData>('healthnav_vitals', MOCK_VITALS);
    return local;
  },

  async updateVitalsSummary(userId: string | undefined, vitals: Partial<VitalsData>): Promise<VitalsData> {
    const current = await this.getVitals(userId);
    const updated: VitalsData = {
      ...current,
      ...vitals,
      timestamp: 'Just now'
    };
    setStorageItem('healthnav_vitals', updated);
    return updated;
  },

  async getVitalsLogs(userId?: string): Promise<VitalsLogEntry[]> {
    const local = getStorageItem<VitalsLogEntry[]>('healthnav_vitals_logs', DEFAULT_VITALS_LOGS);
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('vitals_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }
      return data;
    } catch (e) {
      return local;
    }
  },

  async addVitalsLog(userId: string | undefined, log: Partial<VitalsLogEntry>): Promise<VitalsLogEntry> {
    if (!log.label?.trim() || log.value === undefined || log.value === '') {
      throw new Error("Metric label and value are required.");
    }

    const newId = `vlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: VitalsLogEntry = {
      id: newId,
      metricType: log.metricType || 'heartRate',
      label: log.label.trim(),
      value: log.value,
      unit: log.unit || 'bpm',
      date: log.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: log.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: log.status || 'Normal',
      notes: log.notes?.trim() || ''
    };

    const current = await this.getVitalsLogs(userId);
    const updated = [newEntry, ...current];
    setStorageItem('healthnav_vitals_logs', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase.from('vitals_logs').insert([{
          id: newId,
          user_id: userId,
          metric_type: newEntry.metricType,
          label: newEntry.label,
          value: String(newEntry.value),
          unit: newEntry.unit,
          date: newEntry.date,
          time: newEntry.time,
          status: newEntry.status,
          notes: newEntry.notes,
          is_deleted: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Supabase vitals log insert error:", e);
      }
    }

    return newEntry;
  },

  async updateVitalsLog(logId: string, updates: Partial<VitalsLogEntry>, userId?: string): Promise<VitalsLogEntry> {
    if (!logId) throw new Error("Log ID is required.");
    const current = await this.getVitalsLogs(userId);
    const index = current.findIndex(v => v.id === logId);
    if (index === -1) throw new Error("Vitals log not found.");

    const updatedEntry: VitalsLogEntry = {
      ...current[index],
      ...updates,
      id: logId,
      label: updates.label !== undefined ? updates.label.trim() : current[index].label,
      value: updates.value !== undefined ? updates.value : current[index].value,
      notes: updates.notes !== undefined ? updates.notes.trim() : current[index].notes
    };

    current[index] = updatedEntry;
    setStorageItem('healthnav_vitals_logs', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('vitals_logs')
          .update({
            metric_type: updatedEntry.metricType,
            label: updatedEntry.label,
            value: String(updatedEntry.value),
            unit: updatedEntry.unit,
            date: updatedEntry.date,
            time: updatedEntry.time,
            status: updatedEntry.status,
            notes: updatedEntry.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', logId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase vitals log update error:", e);
      }
    }

    return updatedEntry;
  },

  async deleteVitalsLog(logId: string, userId?: string): Promise<boolean> {
    if (!logId) throw new Error("Log ID is required.");
    const current = await this.getVitalsLogs(userId);
    const updated = current.filter(v => v.id !== logId);
    setStorageItem('healthnav_vitals_logs', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('vitals_logs')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', logId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase vitals log delete error:", e);
      }
    }

    return true;
  },

  // ==========================================
  // 6. CARE APPOINTMENTS (CRUD)
  // ==========================================
  async getAppointments(userId?: string): Promise<Appointment[]> {
    const defaultAppts: Appointment[] = [
      {
        id: "appt-1",
        doctorName: "Dr. Sarah Chen, MD",
        hospitalName: "Apollo Speciality Hospital, Chennai",
        date: "Aug 24, 2026",
        time: "10:30 AM",
        type: "Cardiology Consultation & ECG Review",
        specialty: "Cardiology",
        status: "scheduled",
        notes: "Bring previous lipid profile and blood pressure log."
      },
      {
        id: "appt-2",
        doctorName: "Dr. Rajesh Varma",
        hospitalName: "Max Super Speciality Hospital",
        date: "Sep 05, 2026",
        time: "02:00 PM",
        type: "Annual Health Assessment",
        specialty: "General Medicine",
        status: "scheduled",
        notes: "12-hour fasting required prior to appointment."
      }
    ];

    const local = getStorageItem<Appointment[]>('healthnav_appointments', defaultAppts);

    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }

      return data.map((d: any) => ({
        id: d.id,
        doctorName: d.doctor_name,
        hospitalName: d.hospital_name,
        date: d.date,
        time: d.time,
        type: d.type,
        specialty: d.specialty,
        notes: d.notes,
        status: d.status || 'scheduled'
      }));
    } catch (e) {
      return local;
    }
  },

  async createAppointment(userId: string | undefined, appt: Partial<Appointment>): Promise<Appointment> {
    if (!appt.doctorName?.trim() || !appt.hospitalName?.trim() || !appt.date) {
      throw new Error("Doctor name, hospital name, and appointment date are required.");
    }

    const newId = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: Appointment = {
      id: newId,
      doctorName: appt.doctorName.trim(),
      hospitalName: appt.hospitalName.trim(),
      date: appt.date,
      time: appt.time || '10:00 AM',
      type: appt.type?.trim() || 'Clinical Consultation',
      specialty: appt.specialty?.trim() || 'General Practice',
      notes: appt.notes?.trim() || '',
      status: appt.status || 'scheduled'
    };

    const current = await this.getAppointments(userId);
    const updated = [newEntry, ...current];
    setStorageItem('healthnav_appointments', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase.from('appointments').insert([{
          id: newId,
          user_id: userId,
          doctor_name: newEntry.doctorName,
          hospital_name: newEntry.hospitalName,
          date: newEntry.date,
          time: newEntry.time,
          type: newEntry.type,
          specialty: newEntry.specialty,
          notes: newEntry.notes,
          status: newEntry.status,
          is_deleted: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Supabase appointment insert error:", e);
      }
    }

    return newEntry;
  },

  async updateAppointment(apptId: string, updates: Partial<Appointment>, userId?: string): Promise<Appointment> {
    if (!apptId) throw new Error("Appointment ID is required.");
    const current = await this.getAppointments(userId);
    const index = current.findIndex(a => a.id === apptId);
    if (index === -1) throw new Error("Appointment not found.");

    const updatedEntry: Appointment = {
      ...current[index],
      ...updates,
      id: apptId,
      doctorName: updates.doctorName !== undefined ? updates.doctorName.trim() : current[index].doctorName,
      hospitalName: updates.hospitalName !== undefined ? updates.hospitalName.trim() : current[index].hospitalName,
      notes: updates.notes !== undefined ? updates.notes.trim() : current[index].notes
    };

    current[index] = updatedEntry;
    setStorageItem('healthnav_appointments', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('appointments')
          .update({
            doctor_name: updatedEntry.doctorName,
            hospital_name: updatedEntry.hospitalName,
            date: updatedEntry.date,
            time: updatedEntry.time,
            type: updatedEntry.type,
            specialty: updatedEntry.specialty,
            notes: updatedEntry.notes,
            status: updatedEntry.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', apptId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase appointment update error:", e);
      }
    }

    return updatedEntry;
  },

  async deleteAppointment(apptId: string, userId?: string): Promise<boolean> {
    if (!apptId) throw new Error("Appointment ID is required.");
    const current = await this.getAppointments(userId);
    const updated = current.filter(a => a.id !== apptId);
    setStorageItem('healthnav_appointments', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('appointments')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', apptId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase appointment delete error:", e);
      }
    }

    return true;
  },

  // ==========================================
  // 7. DONOR PLEDGES & REQUESTS (CRUD)
  // ==========================================
  async getDonorRecords(userId?: string): Promise<DonorRecord[]> {
    const defaultDonors: DonorRecord[] = [
      {
        id: 'dnr-user-1',
        type: 'O+ Blood',
        role: 'donor',
        units: '1 Unit',
        location: 'Apollo Hospital Blood Bank, Greams Road',
        availability: 'Available on Call',
        eta: '30 mins',
        contact: '+91 98765 43210',
        notes: 'Universal donor. Certified healthy with recent Hb test 14.5 g/dL.',
        verified: true,
        status: 'active',
        createdAt: 'Aug 10, 2026'
      }
    ];

    const local = getStorageItem<DonorRecord[]>('healthnav_donors', defaultDonors);
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('donor_records')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return local;
      }
      return data;
    } catch (e) {
      return local;
    }
  },

  async createDonorRecord(userId: string | undefined, donor: Partial<DonorRecord>): Promise<DonorRecord> {
    if (!donor.type?.trim()) {
      throw new Error("Blood group or organ type is required.");
    }

    const newId = `dnr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: DonorRecord = {
      id: newId,
      type: donor.type.trim(),
      role: donor.role || 'donor',
      units: donor.units?.trim() || '1 Unit',
      location: donor.location?.trim() || 'Local City Blood Bank',
      availability: donor.availability?.trim() || 'Immediate / On Request',
      eta: donor.eta?.trim() || '30 mins',
      contact: donor.contact?.trim() || '+91 User Contact',
      notes: donor.notes?.trim() || '',
      verified: true,
      status: donor.status || 'active',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const current = await this.getDonorRecords(userId);
    const updated = [newEntry, ...current];
    setStorageItem('healthnav_donors', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase.from('donor_records').insert([{
          id: newId,
          user_id: userId,
          type: newEntry.type,
          role: newEntry.role,
          units: newEntry.units,
          location: newEntry.location,
          availability: newEntry.availability,
          eta: newEntry.eta,
          contact: newEntry.contact,
          notes: newEntry.notes,
          verified: newEntry.verified,
          status: newEntry.status,
          is_deleted: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn("Supabase donor insert error:", e);
      }
    }

    return newEntry;
  },

  async updateDonorRecord(donorId: string, updates: Partial<DonorRecord>, userId?: string): Promise<DonorRecord> {
    if (!donorId) throw new Error("Donor record ID is required.");
    const current = await this.getDonorRecords(userId);
    const index = current.findIndex(d => d.id === donorId);
    if (index === -1) throw new Error("Donor record not found.");

    const updatedEntry: DonorRecord = {
      ...current[index],
      ...updates,
      id: donorId,
      type: updates.type !== undefined ? updates.type.trim() : current[index].type,
      location: updates.location !== undefined ? updates.location.trim() : current[index].location,
      notes: updates.notes !== undefined ? updates.notes.trim() : current[index].notes,
      contact: updates.contact !== undefined ? updates.contact.trim() : current[index].contact
    };

    current[index] = updatedEntry;
    setStorageItem('healthnav_donors', current);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('donor_records')
          .update({
            type: updatedEntry.type,
            role: updatedEntry.role,
            units: updatedEntry.units,
            location: updatedEntry.location,
            availability: updatedEntry.availability,
            eta: updatedEntry.eta,
            contact: updatedEntry.contact,
            notes: updatedEntry.notes,
            status: updatedEntry.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', donorId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase donor update error:", e);
      }
    }

    return updatedEntry;
  },

  async deleteDonorRecord(donorId: string, userId?: string): Promise<boolean> {
    if (!donorId) throw new Error("Donor record ID is required.");
    const current = await this.getDonorRecords(userId);
    const updated = current.filter(d => d.id !== donorId);
    setStorageItem('healthnav_donors', updated);

    if (isSupabaseConfigured && userId && userId !== GUEST_ID) {
      try {
        await supabase
          .from('donor_records')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', donorId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase donor delete error:", e);
      }
    }

    return true;
  },

  // ==========================================
  // 8. FEEDBACK & BUG/SAFETY REPORTS
  // ==========================================
  async createFeedback(feedbackData: any) {
    try {
      const savedFeedbacks = JSON.parse(localStorage.getItem('healthnav_feedbacks') || '[]');
      savedFeedbacks.push({ ...feedbackData, created_at: new Date().toISOString() });
      localStorage.setItem('healthnav_feedbacks', JSON.stringify(savedFeedbacks));
    } catch (e) {
      // Ignore
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

  // Real-time Subscriptions
  async subscribeToProfile(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return { unsubscribe: () => {} };
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
      return { unsubscribe: () => {} };
    }
  },

  async subscribeToReminders(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured || !userId || userId === GUEST_ID) {
      return { unsubscribe: () => {} };
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
      return { unsubscribe: () => {} };
    }
  }
};
