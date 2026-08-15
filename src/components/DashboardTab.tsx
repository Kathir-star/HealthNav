import React from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Calendar, 
  Activity as ActivityIcon, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Settings,
  Pill,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Folder,
  Heart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { 
  MOCK_REMINDERS, 
  MOCK_APPOINTMENTS, 
  MOCK_ACTIVITIES, 
  MOCK_TIPS,
  MOCK_TIMELINE_EVENTS,
  MOCK_HEALTH_RECORDS,
  MOCK_VITALS
} from '../constants';
import { cn } from '../lib/utils';
import { HealthNavLogo } from './HealthNavLogo';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface DashboardTabProps {
  onSetupClick: () => void;
  onSelectTab?: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onSetupClick, onSelectTab }) => {
  const [reminders, setReminders] = React.useState(MOCK_REMINDERS);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    let subscription: any;

    const init = async () => {
      const user = await authService.getCurrentUser();
      if (!user) return;

      try {
        const data = await databaseService.getReminders(user.id);
        if (data && data.length > 0) {
          setReminders(data);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }

      subscription = await databaseService.subscribeToReminders(user.id, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setReminders(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'INSERT') {
          setReminders(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'DELETE') {
          setReminders(prev => prev.filter(r => r.id !== payload.old.id));
        }
      });
    };

    init();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const toggleTaken = async (reminderId: string, currentStatus: boolean) => {
    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, taken: !currentStatus } : r
    ));

    try {
      await databaseService.updateReminder(reminderId, {
        taken: !currentStatus,
        last_taken_date: new Date().toISOString()
      });
      toast.success(currentStatus ? 'Medication marked as pending' : 'Medication marked as taken');
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const filteredReminders = reminders.filter(r => {
    const name = r.medicineName || r.medicine_name || r.name || '';
    return name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto">
      {/* Hero Navigator Quick Card */}
      <div className="bg-gradient-to-r from-emerald-900/70 via-emerald-950/80 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <HealthNavLogo size="lg" showText={false} />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Health Intelligence Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Health. Clearly Navigated.
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/70 max-w-xl">
                AI-assisted medical report interpretation, clinical timeline tracking, and safe healthcare navigation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onSelectTab?.('ai_navigator')}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open AI Navigator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Health Quick Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <p className="text-[10px] text-emerald-300/70 uppercase font-semibold">Resting HR</p>
            <p className="text-lg font-bold text-white flex items-baseline gap-1">
              {MOCK_VITALS.heartRate} <span className="text-[10px] text-emerald-400 font-normal">bpm</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <p className="text-[10px] text-emerald-300/70 uppercase font-semibold">Blood Oxygen</p>
            <p className="text-lg font-bold text-white flex items-baseline gap-1">
              {MOCK_VITALS.spO2} <span className="text-[10px] text-teal-400 font-normal">%</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <p className="text-[10px] text-emerald-300/70 uppercase font-semibold">Active Steps</p>
            <p className="text-lg font-bold text-white flex items-baseline gap-1">
              {MOCK_VITALS.steps.toLocaleString()} <span className="text-[10px] text-lime-400 font-normal">steps</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <p className="text-[10px] text-emerald-300/70 uppercase font-semibold">Sleep Duration</p>
            <p className="text-lg font-bold text-white flex items-baseline gap-1">
              {MOCK_VITALS.sleepHours} <span className="text-[10px] text-indigo-300 font-normal">hrs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Timeline Preview & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Preview */}
        <GlassCard className="p-6 border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Health Timeline</h3>
            </div>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('timeline')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all ({MOCK_TIMELINE_EVENTS.length}) <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {MOCK_TIMELINE_EVENTS.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectTab?.('timeline')}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-400/30 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{event.title}</span>
                  <span className="text-[10px] text-emerald-300/60 font-medium">{event.date}</span>
                </div>
                <p className="text-[11px] text-emerald-100/60 line-clamp-1">{event.description}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Records Preview */}
        <GlassCard className="p-6 border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Folder className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Medical Vault</h3>
            </div>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('records')}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                View all ({MOCK_HEALTH_RECORDS.length}) <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {MOCK_HEALTH_RECORDS.slice(0, 3).map((record) => (
              <div
                key={record.id}
                onClick={() => onSelectTab?.('records')}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-teal-500/10 hover:border-teal-400/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.2 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-bold text-teal-300 uppercase">
                      {record.category}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{record.title}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/50">{record.provider} • {record.date}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold shrink-0">
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Medication Reminders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Bell className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Medication Reminders</h3>
          </div>
          <span className="text-xs text-emerald-300/60 font-medium">
            {filteredReminders.filter(r => r.taken).length} of {filteredReminders.length} taken today
          </span>
        </div>

        <div className="grid gap-3">
          {filteredReminders.map((reminder, idx) => (
            <GlassCard key={reminder.id} delay={idx * 0.05} className="p-4 border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    reminder.taken ? "bg-emerald-500/20 text-emerald-400" : "bg-lime-500/20 text-lime-400"
                  )}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-50">{reminder.medicineName || reminder.medicine_name || reminder.name || 'Medication'}</h4>
                    <p className="text-[10px] font-medium text-emerald-100/40 uppercase tracking-wider">{reminder.time || reminder.reminder_time || 'Daily'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleTaken(reminder.id, reminder.taken)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                    reminder.taken 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-emerald-500 text-white neon-glow-teal shadow-lg shadow-emerald-500/20"
                  )}
                >
                  {reminder.taken ? 'Taken' : 'Mark Taken'}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Upcoming Appointments */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lime-400">
          <Calendar className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Upcoming Appointments</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_APPOINTMENTS.map((apt, idx) => (
            <GlassCard key={apt.id} delay={idx * 0.1} className="p-5 border-l-4 border-l-lime-500 border-emerald-500/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-base font-bold text-emerald-50">{apt.type}</h4>
                  <p className="text-xs font-medium text-emerald-100/60">{apt.doctorName} • {apt.hospitalName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-lime-400">{apt.date}</div>
                  <div className="text-[10px] font-medium text-emerald-100/40">{apt.time}</div>
                </div>
              </div>
              <button 
                onClick={() => toast.info(`Appointment scheduled with ${apt.doctorName} on ${apt.date} at ${apt.time}`)}
                className="w-full py-2 rounded-xl bg-lime-500/10 text-lime-400 text-[10px] font-bold uppercase tracking-widest hover:bg-lime-500/20 transition-colors"
              >
                View Details
              </button>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Evidence-Based Health Tips */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Evidence-Based Clinical Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_TIPS.map((tip, idx) => (
            <GlassCard key={tip.id} delay={idx * 0.1} className="p-0 overflow-hidden border-emerald-500/20">
              <img 
                src={tip.imageUrl} 
                alt={tip.title} 
                className="w-full h-32 object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                  {tip.category}
                </span>
                <h4 className="text-base font-bold text-emerald-50">{tip.title}</h4>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};
