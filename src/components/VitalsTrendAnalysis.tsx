import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Heart, 
  Footprints, 
  Flame, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Zap, 
  Info, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';

// Mock datasets for trend visualization
const WEEKLY_DATA = [
  { label: 'Mon', fullDate: 'Aug 8', heartRate: 72, restingHR: 58, peakHR: 124, steps: 7850, calories: 2150, activeMin: 42 },
  { label: 'Tue', fullDate: 'Aug 9', heartRate: 76, restingHR: 60, peakHR: 138, steps: 9420, calories: 2420, activeMin: 55 },
  { label: 'Wed', fullDate: 'Aug 10', heartRate: 70, restingHR: 57, peakHR: 118, steps: 6900, calories: 1980, activeMin: 35 },
  { label: 'Thu', fullDate: 'Aug 11', heartRate: 74, restingHR: 59, peakHR: 132, steps: 10250, calories: 2600, activeMin: 62 },
  { label: 'Fri', fullDate: 'Aug 12', heartRate: 71, restingHR: 56, peakHR: 128, steps: 8800, calories: 2310, activeMin: 48 },
  { label: 'Sat', fullDate: 'Aug 13', heartRate: 68, restingHR: 54, peakHR: 145, steps: 12400, calories: 2890, activeMin: 75 },
  { label: 'Sun', fullDate: 'Aug 14', heartRate: 69, restingHR: 55, peakHR: 115, steps: 8432, calories: 2240, activeMin: 45 },
];

const MONTHLY_DATA = [
  { label: 'Day 1-3', fullDate: 'Jul 16-18', heartRate: 74, restingHR: 60, peakHR: 130, steps: 8100, calories: 2200, activeMin: 44 },
  { label: 'Day 4-6', fullDate: 'Jul 19-21', heartRate: 73, restingHR: 59, peakHR: 126, steps: 8400, calories: 2280, activeMin: 46 },
  { label: 'Day 7-9', fullDate: 'Jul 22-24', heartRate: 71, restingHR: 58, peakHR: 135, steps: 9200, calories: 2450, activeMin: 52 },
  { label: 'Day 10-12', fullDate: 'Jul 25-27', heartRate: 75, restingHR: 61, peakHR: 142, steps: 10100, calories: 2620, activeMin: 58 },
  { label: 'Day 13-15', fullDate: 'Jul 28-30', heartRate: 70, restingHR: 57, peakHR: 120, steps: 7900, calories: 2150, activeMin: 40 },
  { label: 'Day 16-18', fullDate: 'Jul 31-Aug 2', heartRate: 69, restingHR: 56, peakHR: 125, steps: 8750, calories: 2340, activeMin: 49 },
  { label: 'Day 19-21', fullDate: 'Aug 3-5', heartRate: 72, restingHR: 58, peakHR: 138, steps: 9600, calories: 2510, activeMin: 56 },
  { label: 'Day 22-24', fullDate: 'Aug 6-8', heartRate: 71, restingHR: 57, peakHR: 122, steps: 8300, calories: 2230, activeMin: 43 },
  { label: 'Day 25-27', fullDate: 'Aug 9-11', heartRate: 73, restingHR: 58, peakHR: 134, steps: 9100, calories: 2410, activeMin: 51 },
  { label: 'Day 28-30', fullDate: 'Aug 12-14', heartRate: 69, restingHR: 55, peakHR: 130, steps: 9880, calories: 2480, activeMin: 56 },
];

type Period = 'weekly' | 'monthly';
type MetricView = 'all' | 'heartRate' | 'activity';

export const VitalsTrendAnalysis: React.FC = () => {
  const [period, setPeriod] = useState<Period>('weekly');
  const [view, setView] = useState<MetricView>('all');

  const data = period === 'weekly' ? WEEKLY_DATA : MONTHLY_DATA;

  // Aggregate stats
  const avgHR = Math.round(data.reduce((acc, curr) => acc + curr.heartRate, 0) / data.length);
  const avgRestingHR = Math.round(data.reduce((acc, curr) => acc + curr.restingHR, 0) / data.length);
  const avgSteps = Math.round(data.reduce((acc, curr) => acc + curr.steps, 0) / data.length);
  const totalCalories = data.reduce((acc, curr) => acc + curr.calories, 0);
  const maxPeakHR = Math.max(...data.map(d => d.peakHR));

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="rounded-2xl p-4 bg-emerald-950/95 border border-emerald-500/30 backdrop-blur-xl shadow-2xl text-white space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="font-bold text-emerald-200 text-sm">{label}</span>
            <span className="text-[11px] text-emerald-400/80 font-medium">{pointData.fullDate}</span>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            {(view === 'all' || view === 'heartRate') && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Avg Heart Rate
                  </span>
                  <span className="font-bold text-white">{pointData.heartRate} <span className="text-[10px] text-white/50">BPM</span></span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px] text-white/70">
                  <span className="ml-3.5">Resting / Peak</span>
                  <span>{pointData.restingHR} / {pointData.peakHR} BPM</span>
                </div>
              </>
            )}

            {(view === 'all' || view === 'activity') && (
              <>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Steps
                  </span>
                  <span className="font-bold text-white">{pointData.steps.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Burned
                  </span>
                  <span className="font-bold text-white">{pointData.calories} <span className="text-[10px] text-white/50">kcal</span></span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="space-y-4 relative z-10" id="vitals-trend-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white/90">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Trend & Longitudinal Analysis</h3>
        </div>

        {/* Period & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
            <button
              id="view-all-btn"
              onClick={() => setView('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all",
                view === 'all' ? "bg-emerald-500 text-white shadow-sm" : "text-white/60 hover:text-white"
              )}
            >
              Combined
            </button>
            <button
              id="view-hr-btn"
              onClick={() => setView('heartRate')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                view === 'heartRate' ? "bg-rose-500 text-white shadow-sm" : "text-white/60 hover:text-white"
              )}
            >
              <Heart className="w-3 h-3" />
              Heart Rate
            </button>
            <button
              id="view-activity-btn"
              onClick={() => setView('activity')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                view === 'activity' ? "bg-emerald-600 text-white shadow-sm" : "text-white/60 hover:text-white"
              )}
            >
              <Footprints className="w-3 h-3" />
              Activity
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-xl bg-white/10 p-1 border border-white/15 text-xs">
            <button
              id="period-weekly-btn"
              onClick={() => setPeriod('weekly')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5",
                period === 'weekly' ? "bg-white text-emerald-950 shadow" : "text-white/70 hover:text-white"
              )}
            >
              <Calendar className="w-3 h-3" />
              7 Days
            </button>
            <button
              id="period-monthly-btn"
              onClick={() => setPeriod('monthly')}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5",
                period === 'monthly' ? "bg-white text-emerald-950 shadow" : "text-white/70 hover:text-white"
              )}
            >
              <Calendar className="w-3 h-3" />
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for Period Summary with Staggered Entrance */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span className="font-semibold uppercase tracking-wider">Avg Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{avgHR}</span>
            <span className="text-xs text-white/60 font-semibold">BPM</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Resting: {avgRestingHR} BPM</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span className="font-semibold uppercase tracking-wider">Daily Avg Steps</span>
            <Footprints className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{avgSteps.toLocaleString()}</span>
            <span className="text-xs text-white/60 font-semibold">steps/day</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+6% vs last period</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span className="font-semibold uppercase tracking-wider">Peak Cardio HR</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{maxPeakHR}</span>
            <span className="text-xs text-white/60 font-semibold">BPM</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-300/80 font-medium">
            Aerobic threshold safe
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
        >
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Energy</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{totalCalories.toLocaleString()}</span>
            <span className="text-xs text-white/60 font-semibold">kcal</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">
            Optimal metabolic rate
          </div>
        </motion.div>
      </motion.div>

      {/* Main Recharts Visualization Canvas */}
      <GlassCard className="p-6 bg-white/5 border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{period === 'weekly' ? '7-Day Rolling Trend' : '30-Day Physiological Trajectory'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                {view === 'all' ? 'Cardio & Steps' : view === 'heartRate' ? 'Heart Rate Dynamics' : 'Movement & Energy'}
              </span>
            </h4>
            <p className="text-xs text-white/60 mt-0.5">
              Continuous sensor correlation across heart rate zones and movement telemetry.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
            {(view === 'all' || view === 'heartRate') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span>Heart Rate</span>
              </div>
            )}
            {(view === 'all' || view === 'activity') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span>Steps</span>
              </div>
            )}
            {view === 'activity' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span>Calories</span>
              </div>
            )}
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 md:h-80 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'all' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <YAxis 
                  yAxisId="left" 
                  domain={[50, 150]} 
                  stroke="rgba(244,63,94,0.7)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}bpm`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="rgba(16,185,129,0.7)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="steps" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorSteps)" 
                  name="Steps"
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Heart Rate"
                />
              </AreaChart>
            ) : view === 'heartRate' ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHRZone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <YAxis 
                  domain={[45, 160]} 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}bpm`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="peakHR" 
                  stroke="#fb7185" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="Peak Heart Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Average Heart Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="restingHR" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={{ r: 2, fill: '#38bdf8' }}
                  name="Resting Heart Rate"
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <YAxis 
                  yAxisId="stepsAxis"
                  stroke="rgba(16,185,129,0.7)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="calAxis"
                  orientation="right"
                  stroke="rgba(245,158,11,0.7)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  yAxisId="stepsAxis"
                  dataKey="steps" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  name="Steps"
                />
                <Line 
                  yAxisId="calAxis"
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                  name="Calories"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Dynamic AI Airi Health Insight Note */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-3 text-xs text-emerald-200/90 leading-relaxed">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-white mr-1.5">Airi Trend Correlation:</span>
            {period === 'weekly' ? (
              <span>
                Your average resting heart rate decreased by <strong>3 BPM</strong> following high-step active days (Sat & Thu), showing healthy cardiovascular autonomic recovery and consistent aerobic adaptation.
              </span>
            ) : (
              <span>
                Over the past 30 days, your step cadence maintained a consistent <strong>9,100 daily average</strong> with zero abnormal tachycardic spikes. Your cardiovascular baseline is stable and strong.
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
