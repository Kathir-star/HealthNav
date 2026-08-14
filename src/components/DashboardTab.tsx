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
  Search
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { 
  MOCK_REMINDERS, 
  MOCK_APPOINTMENTS, 
  MOCK_ACTIVITIES, 
  MOCK_TIPS 
} from '../constants';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface DashboardTabProps {
  onSetupClick: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onSetupClick }) => {
  const [reminders, setReminders] = React.useState(MOCK_REMINDERS);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    let subscription: any;

    const init = async () => {
      const user = await authService.getCurrentUser();
      if (!user) return;

      // Initial fetch
      try {
        const data = await databaseService.getReminders(user.id);
        if (data && data.length > 0) {
          setReminders(data);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }

      // Real-time subscription
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
    // Update local state immediately for better responsiveness
    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, taken: !currentStatus } : r
    ));

    try {
      await databaseService.updateReminder(reminderId, {
        taken: !currentStatus,
        last_taken_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const filteredReminders = reminders.filter(r => 
    r.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-50">Your Health</h2>
          <p className="text-sm text-emerald-100/60 font-medium">Personalized overview for today</p>
        </div>
        <button 
          onClick={onSetupClick}
          className="p-3 rounded-2xl glass hover:bg-white/10 transition-colors"
        >
          <Settings className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reminders or health data..." 
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
      </div>

      {/* Medication Reminders */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Bell className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Medication Reminders</h3>
        </div>
        <div className="grid gap-3">
          {filteredReminders.map((reminder, idx) => (
            <GlassCard key={reminder.id} delay={idx * 0.05} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    reminder.taken ? "bg-emerald-500/20 text-emerald-400" : "bg-lime-500/20 text-lime-400"
                  )}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-50">{reminder.medicineName}</h4>
                    <p className="text-[10px] font-medium text-emerald-100/40 uppercase tracking-wider">{reminder.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleTaken(reminder.id, reminder.taken)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
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
            <GlassCard key={apt.id} delay={idx * 0.1} className="p-5 border-l-4 border-l-lime-500">
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
                onClick={() => toast.info("Appointment details are being retrieved from the hospital system...")}
                className="w-full py-2 rounded-xl bg-lime-500/10 text-lime-400 text-[10px] font-bold uppercase tracking-widest hover:bg-lime-500/20 transition-colors"
              >
                View Details
              </button>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-100/60">
          <ActivityIcon className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {MOCK_ACTIVITIES.map((activity, idx) => (
            <div key={activity.id} className="flex items-center gap-4 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-100/80">{activity.description}</p>
                <p className="text-[10px] text-emerald-100/40">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Health Tips */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Personalized Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_TIPS.map((tip, idx) => (
            <GlassCard key={tip.id} delay={idx * 0.1} className="p-0 overflow-hidden">
              <img 
                src={tip.imageUrl} 
                alt={tip.title} 
                className="w-full h-32 object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="p-5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                  {tip.category}
                </span>
                <h4 className="text-base font-bold text-emerald-50 mt-3 mb-2">{tip.title}</h4>
                <p className="text-xs text-emerald-100/70 leading-relaxed mb-4">
                  {tip.content}
                </p>
                <button 
                  onClick={() => toast.info("Full article is loading from our medical library...")}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-400"
                >
                  Read Full Article <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};
