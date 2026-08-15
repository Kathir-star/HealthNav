import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { 
  Activity, Footprints, Flame, Moon, Heart, Wind, TrendingUp, 
  Compass, Bluetooth, Smartphone, RotateCcw, Sparkles, ShieldCheck, 
  Plus, Edit3, Trash2, X, Clock, Calendar, CheckCircle2, Loader2 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { VitalsTrendAnalysis } from './VitalsTrendAnalysis';
import { VitalsLogEntry } from '../types';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut"
    }
  }
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const VitalsTab: React.FC = () => {
  const { profile } = useProfile();
  const [vitalsSummary, setVitalsSummary] = useState({
    steps: 8432,
    heartRate: 72,
    calories: 480,
    sleepHours: 7.5,
    spO2: 98,
    elevation: 12
  });

  const [vitalsLogs, setVitalsLogs] = useState<VitalsLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<VitalsLogEntry | null>(null);
  const [deletingLog, setDeletingLog] = useState<VitalsLogEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    metricType: 'bloodPressure',
    label: 'Blood Pressure',
    value: '120/80',
    unit: 'mmHg',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'Normal',
    notes: ''
  });

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await databaseService.getVitalsLogs(profile?.uid);
      setVitalsLogs(logs);
      const summary = await databaseService.getVitals(profile?.uid);
      if (summary) {
        setVitalsSummary({
          steps: summary.steps,
          heartRate: summary.heartRate,
          calories: summary.calories,
          sleepHours: summary.sleepHours,
          spO2: summary.spO2,
          elevation: summary.elevation
        });
      }
    } catch (e) {
      console.error("Error loading vitals logs:", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [profile?.uid]);

  const stats = [
    { label: "Steps", value: vitalsSummary.steps, unit: "steps", icon: Footprints, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Heart Rate", value: vitalsSummary.heartRate, unit: "bpm", icon: Heart, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Calories", value: vitalsSummary.calories, unit: "kcal", icon: Flame, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Sleep", value: vitalsSummary.sleepHours, unit: "hours", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "SpO2", value: vitalsSummary.spO2, unit: "%", icon: Wind, color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "Elevation", value: vitalsSummary.elevation, unit: "flights", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  const handleMetricTypeChange = (type: string) => {
    switch (type) {
      case 'bloodPressure':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Blood Pressure', unit: 'mmHg', value: '120/80' }));
        break;
      case 'heartRate':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Resting Heart Rate', unit: 'bpm', value: '72' }));
        break;
      case 'spO2':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Blood Oxygen (SpO2)', unit: '%', value: '98' }));
        break;
      case 'bloodGlucose':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Blood Glucose', unit: 'mg/dL', value: '95' }));
        break;
      case 'temperature':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Body Temperature', unit: '°F', value: '98.6' }));
        break;
      case 'weight':
        setFormData(prev => ({ ...prev, metricType: type, label: 'Body Weight', unit: 'kg', value: '68' }));
        break;
      default:
        setFormData(prev => ({ ...prev, metricType: type, label: 'Custom Metric', unit: '', value: '' }));
    }
  };

  const openCreateModal = () => {
    setEditingLog(null);
    setFormData({
      metricType: 'bloodPressure',
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Normal',
      notes: ''
    });
    setIsLogModalOpen(true);
  };

  const openEditModal = (log: VitalsLogEntry) => {
    setEditingLog(log);
    setFormData({
      metricType: log.metricType,
      label: log.label,
      value: String(log.value),
      unit: log.unit,
      date: log.date,
      time: log.time || '',
      status: log.status || 'Normal',
      notes: log.notes || ''
    });
    setIsLogModalOpen(true);
  };

  const isFormDirty = () => {
    if (editingLog) {
      return (
        formData.label !== editingLog.label ||
        formData.value !== String(editingLog.value) ||
        formData.notes !== (editingLog.notes || '')
      );
    }
    return Boolean(formData.value && formData.value !== '120/80');
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsLogModalOpen(false);
      setEditingLog(null);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.value.trim()) {
      toast.error('Metric label and value are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingLog) {
        // UPDATE
        const updated = await databaseService.updateVitalsLog(editingLog.id, {
          metricType: formData.metricType as any,
          label: formData.label,
          value: formData.value,
          unit: formData.unit,
          date: formData.date,
          time: formData.time,
          status: formData.status as any,
          notes: formData.notes
        }, profile?.uid);

        setVitalsLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success(`Updated ${updated.label} reading`);
      } else {
        // CREATE
        const created = await databaseService.addVitalsLog(profile?.uid, {
          metricType: formData.metricType as any,
          label: formData.label,
          value: formData.value,
          unit: formData.unit,
          date: formData.date,
          time: formData.time,
          status: formData.status as any,
          notes: formData.notes
        });

        setVitalsLogs(prev => [created, ...prev]);
        toast.success(`Logged ${created.label} reading`);
      }

      setIsLogModalOpen(false);
      setEditingLog(null);
    } catch (err: any) {
      console.error("Save vitals log error:", err);
      toast.error(err.message || "Failed to save reading.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteVitalsLog(deletingLog.id, profile?.uid);
      setVitalsLogs(prev => prev.filter(l => l.id !== deletingLog.id));
      toast.success(`Reading for ${deletingLog.label} deleted`);
      setDeletingLog(null);
    } catch (err: any) {
      console.error("Delete vitals error:", err);
      toast.error(err.message || "Failed to delete reading.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-24 max-w-5xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold w-fit">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry & Clinical Logs</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vitals & Movement</h2>
          <p className="text-xs sm:text-sm text-emerald-100/70 font-medium">Real-time physiological sensor telemetry with persistent clinical reading logs</p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Vital Reading</span>
          </motion.button>
        </div>
      </motion.div>

      {/* AI Insight Banner */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-4 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Airi AI Real-Time Analysis</h4>
            <p className="text-xs text-white/90 leading-relaxed">
              Your resting heart rate is stable at {vitalsSummary.heartRate} BPM. Fasting blood glucose trends and oxygen saturation indicators remain within optimal clinical thresholds.
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <GlassCard className="p-5 flex flex-col items-center text-center group bg-emerald-950/40 border-emerald-500/15 h-full justify-center">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest mt-0.5">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Recharts Trend Analysis Section */}
      <motion.div variants={sectionVariants}>
        <VitalsTrendAnalysis />
      </motion.div>

      {/* Vitals History & Log Management (CRUD) */}
      <motion.section variants={sectionVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Clinical Vitals Log History</h3>
          </div>
          <button
            onClick={openCreateModal}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Reading</span>
          </button>
        </div>

        <div className="grid gap-3">
          {isLoadingLogs ? (
            <div className="py-8 text-center text-xs text-emerald-200/60">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
              Loading vitals history...
            </div>
          ) : vitalsLogs.length === 0 ? (
            <GlassCard className="py-8 text-center border-dashed border-emerald-500/20">
              <p className="text-xs text-emerald-100/60">No manual vitals logged yet. Click "Log Vital Reading" to add blood pressure, glucose, or weight records.</p>
            </GlassCard>
          ) : (
            vitalsLogs.map((log) => (
              <GlassCard key={log.id} className="p-4 flex items-center justify-between border-emerald-500/15 hover:border-emerald-400/30 transition-all gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{log.label}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        {log.value} {log.unit}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/60 truncate mt-0.5">
                      {log.date} {log.time && `• ${log.time}`} {log.notes && `• ${log.notes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => openEditModal(log)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-200/70 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Edit Reading"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeletingLog(log)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                    title="Delete Reading"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </motion.section>

      {/* Sensor Status */}
      <motion.section variants={sectionVariants} className="space-y-4">
        <div className="flex items-center gap-2 text-white/80">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Active Sensors</h3>
        </div>
        <div className="grid gap-3">
          <GlassCard className="p-4 flex items-center justify-between bg-emerald-950/40 border-emerald-500/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Internal Sensors</h4>
                <p className="text-[10px] text-emerald-200/50 font-medium uppercase tracking-wider">Accelerometer • Gyroscope • GPS</p>
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

          <GlassCard className="p-4 flex items-center justify-between bg-emerald-950/40 border-emerald-500/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bluetooth className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Wearable Link</h4>
                <p className="text-[10px] text-emerald-200/50 font-medium uppercase tracking-wider">Optical PPG • Heart Rate • SpO2</p>
              </div>
            </div>
            <button 
              onClick={() => toast.success("Wearable connected via Web Bluetooth")}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-md cursor-pointer hover:bg-emerald-400 transition-colors"
            >
              Connect
            </button>
          </GlassCard>
        </div>
      </motion.section>

      {/* Add / Edit Vitals Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 sm:p-7 border-emerald-500/30 space-y-5">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      {editingLog ? <Edit3 className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {editingLog ? 'Edit Vital Reading' : 'Log Vital Reading'}
                      </h3>
                      <p className="text-[10px] text-emerald-300/60 font-medium">
                        {editingLog ? 'Update recorded measurement' : 'Store physiological reading in database'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCloseModalWithPrompt} 
                    className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveLog} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Metric Type</label>
                    <select
                      value={formData.metricType}
                      onChange={(e) => handleMetricTypeChange(e.target.value)}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="bloodPressure">Blood Pressure (mmHg)</option>
                      <option value="heartRate">Heart Rate (bpm)</option>
                      <option value="spO2">Blood Oxygen SpO2 (%)</option>
                      <option value="bloodGlucose">Blood Glucose (mg/dL)</option>
                      <option value="temperature">Body Temperature (°F)</option>
                      <option value="weight">Body Weight (kg)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Value *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.value}
                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. 120/80 or 72"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Unit</label>
                      <input 
                        type="text" 
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Date</label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Time</label>
                      <input 
                        type="text" 
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Notes / State</label>
                    <input 
                      type="text" 
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Resting morning reading, after 10 min rest"
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCloseModalWithPrompt}
                      className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-200 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{editingLog ? 'Save Changes' : 'Save Reading'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingLog)}
        onClose={() => setDeletingLog(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingLog?.label}
        title="Permanently remove vital reading?"
        description="This will delete this metric measurement from your persistent vitals log history."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsLogModalOpen(false);
          setEditingLog(null);
        }}
      />
    </motion.div>
  );
};
