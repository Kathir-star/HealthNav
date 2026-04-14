import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Footprints, 
  Flame, 
  Moon, 
  Heart, 
  Wind, 
  TrendingUp, 
  Compass,
  Bluetooth,
  Smartphone,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MOCK_VITALS } from '../constants';
import { cn } from '../lib/utils';

export const VitalsTab: React.FC = () => {
  const [vitals, setVitals] = React.useState(MOCK_VITALS);
  const [isResetting, setIsResetting] = React.useState(false);

  const stats = [
    { label: "Steps", value: vitals.steps, unit: "steps", icon: Footprints, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Heart Rate", value: vitals.heartRate, unit: "bpm", icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Calories", value: vitals.calories, unit: "kcal", icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Sleep", value: vitals.sleepHours, unit: "hours", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "SpO2", value: vitals.spO2, unit: "%", icon: Wind, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Elevation", value: vitals.elevation, unit: "flights", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setVitals({
        steps: 0,
        heartRate: 0,
        calories: 0,
        sleepHours: 0,
        spO2: 0,
        elevation: 0,
        timestamp: new Date().toISOString()
      });
      setIsResetting(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-white">Vitals & Movement</h2>
          <p className="text-sm text-white/60 font-medium">Real-time sensor data from your devices</p>
        </div>
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <RotateCcw className={cn("w-4 h-4", isResetting && "animate-spin")} />
          Reset Data
        </button>
      </div>

      {/* AI Insight Banner */}
      <GlassCard className="p-4 bg-emerald-500 text-white neon-glow-teal border-none flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Airi AI Analysis</h4>
          <p className="text-xs text-white/80 leading-relaxed">
            Your heart rate is stable at {vitals.heartRate} BPM. I've analyzed your movement patterns and they indicate optimal recovery.
          </p>
        </div>
      </GlassCard>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        {stats.map((stat, idx) => (
          <GlassCard key={stat.label} delay={idx * 0.05} className="p-5 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform bg-white/5 border-white/10">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Sensor Status */}
      <section className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-white/80">
          <Compass className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Active Sensors</h3>
        </div>
        <div className="grid gap-3">
          <GlassCard className="p-4 flex items-center justify-between bg-white/5 border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Internal Sensors</h4>
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Accelerometer • Gyroscope • GPS</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active & Precise</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center justify-between bg-white/5 border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bluetooth className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Wearable Link</h4>
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Optical PPG • Heart Rate • SpO2</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest neon-glow-teal">
              Connect
            </button>
          </GlassCard>
        </div>
      </section>

      {/* Movement Analysis */}
      <section className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-white/80">
          <Activity className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Movement Analysis</h3>
        </div>
        <GlassCard className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-white">Daily Goal</h4>
              <p className="text-xs text-white/60">84% of your 10,000 steps goal reached</p>
            </div>
            <div className="text-2xl font-bold text-emerald-400">8,432</div>
          </div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '84.32%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-500 neon-glow-teal"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm font-bold text-white">2.4 km</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Distance</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-sm font-bold text-white">45 min</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Active Time</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white">12 fl</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Elevation</div>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
