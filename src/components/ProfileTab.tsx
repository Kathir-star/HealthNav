import React from 'react';
import { motion } from 'motion/react';
import { Activity, Heart, Zap, Flame, TrendingUp, Calendar, Clock, MapPin } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';

interface ProfileTabProps {
  detectedSensors?: string[];
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ detectedSensors = [] }) => {
  const [userData, setUserData] = React.useState<any>(null);
  const [steps, setSteps] = React.useState(8432);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const init = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await databaseService.getProfile(currentUser.id);
          setUserData(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    init();
  }, []);

  const stats = [
    { 
      label: 'Steps', 
      value: detectedSensors.includes('accelerometer') ? steps.toLocaleString() : '-', 
      unit: 'steps', 
      icon: Activity, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Heart Rate', 
      value: detectedSensors.includes('heartrate') ? '72' : '-', 
      unit: 'bpm', 
      icon: Heart, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10' 
    },
    { 
      label: 'Energy', 
      value: detectedSensors.includes('accelerometer') ? '1,240' : '-', 
      unit: 'kcal', 
      icon: Flame, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10' 
    },
    { 
      label: 'Activity', 
      value: detectedSensors.includes('accelerometer') ? '45' : '-', 
      unit: 'mins', 
      icon: Zap, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden border-2 border-white/20">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-white">{userData?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <button 
            onClick={() => alert("Image upload feature coming soon!")}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl"
          >
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Update</span>
          </button>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-emerald-950 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </motion.div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">{userData?.display_name || 'Health Explorer'}</h2>
          <p className="text-emerald-100/60 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Member since 2024
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <GlassCard key={stat.label} delay={idx * 0.1} className="p-5 border border-white/5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{stat.value}</span>
                <span className="text-[10px] font-bold text-emerald-100/40 uppercase">{stat.unit}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Weekly Activity
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">
              <Calendar className="w-3 h-3" /> Last 7 Days
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 65, 80, 55].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                  className="w-full bg-gradient-to-t from-emerald-500/20 to-emerald-500 rounded-t-lg relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}%
                  </div>
                </motion.div>
                <span className="text-[8px] font-bold text-emerald-100/40 uppercase">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Recent Vitals
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Blood Pressure', value: '120/80', status: 'Normal', time: '2h ago' },
              { label: 'SpO2 Level', value: '98%', status: 'Optimal', time: '5h ago' },
              { label: 'Sleep Quality', value: '8.5h', status: 'Excellent', time: 'Today' },
            ].map((vital, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">{vital.label}</h4>
                  <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">{vital.time}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">{vital.value}</div>
                  <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">{vital.status}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
