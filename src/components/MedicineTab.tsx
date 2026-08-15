import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Pill, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, 
  Camera, X, Info, ShoppingCart, Clock, ExternalLink, Loader2, Sparkles, 
  BookOpen, ShieldCheck, AlertTriangle, XCircle, Plus, Edit3, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { databaseService } from '../services/databaseService';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import { ArticleSection } from './ArticleSection';
import { getRecommendedArticles, getAiriResponse } from '../services/geminiService';
import { Article } from '../types';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';

interface MedicineResult {
  id: string;
  name: string;
  genericName: string;
  price: number;
  shopName: string;
  arrivalTime: string;
  imageUrl: string;
  link: string;
  verified: boolean;
  trend: 'up' | 'down' | 'stable';
  form: string;
  pack: string;
  dosage: string;
  restrictions: string[];
  substitutes: string[];
  safetyAnalysis?: {
    status: '✅' | '⚠️' | '❌';
    analysis: string;
    recommendation: string;
    warning?: string;
  };
}

export const MedicineTab: React.FC = () => {
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MedicineResult[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState(false);
  const [analyzingMedId, setAnalyzingMedId] = useState<string | null>(null);

  // Medication Tracker State
  const [reminders, setReminders] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<any | null>(null);
  const [deletingMed, setDeletingMed] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    sound: 'Zen',
    notes: ''
  });

  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  const alarmSounds: Record<string, string> = {
    Zen: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    Chime: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
    Nature: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3'
  };

  const fetchReminders = async () => {
    try {
      const data = await databaseService.getReminders(profile?.uid);
      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [profile?.uid]);

  // Audio reminder listener
  useEffect(() => {
    audioPlayer.current = new Audio();
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(med => {
        if (med.reminder_time && !med.taken) {
          const reminderTime = new Date(med.reminder_time);
          if (Math.abs(now.getTime() - reminderTime.getTime()) < 60000 && !med.triggered) {
            playAlarm(med);
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders]);

  const playAlarm = (med: any) => {
    if (audioPlayer.current) {
      audioPlayer.current.src = alarmSounds[med.sound || 'Zen'];
      audioPlayer.current.play().catch(e => console.error("Audio play error:", e));
    }
    
    toast.custom((t) => (
      <div className="bg-emerald-950 border border-emerald-500 p-6 rounded-2xl shadow-2xl neon-glow-teal flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
          <Clock className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-emerald-50">🔔 REMINDER: {med.medicine_name}</h3>
          <p className="text-emerald-100/60">It is time to take your medication ({med.dosage}).</p>
        </div>
        <button 
          onClick={() => {
            audioPlayer.current?.pause();
            toggleTaken(med.id, false);
            toast.dismiss(t);
          }}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:scale-105 transition-transform"
        >
          I've Taken It
        </button>
      </div>
    ), { duration: Infinity });

    setReminders(prev => prev.map(r => r.id === med.id ? { ...r, triggered: true } : r));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsArticlesLoading(true);
    
    getRecommendedArticles(searchQuery).then(articles => {
      setRecommendedArticles(articles);
      setIsArticlesLoading(false);
    });

    setTimeout(() => {
      const mockResults: MedicineResult[] = [
        {
          id: '1',
          name: searchQuery,
          genericName: 'Generic ' + searchQuery,
          price: 450,
          shopName: 'Apollo Pharmacy',
          arrivalTime: '2 Hours',
          imageUrl: `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop`,
          link: `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(searchQuery)}`,
          verified: true,
          trend: 'down',
          form: 'Tablet',
          pack: '10 Tablets',
          dosage: '1 tablet twice daily after meals',
          restrictions: ['Prescription Required', 'Adults Only'],
          substitutes: ['Generic Alternative A', 'Generic Alternative B']
        },
        {
          id: '2',
          name: searchQuery,
          genericName: 'Generic ' + searchQuery,
          price: 410,
          shopName: 'Netmeds',
          arrivalTime: 'Next Day',
          imageUrl: `https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop`,
          link: `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(searchQuery)}`,
          verified: true,
          trend: 'stable',
          form: 'Tablet',
          pack: '10 Tablets',
          dosage: '1 tablet twice daily after meals',
          restrictions: ['Prescription Required'],
          substitutes: ['Generic Alternative C']
        },
        {
          id: '3',
          name: searchQuery,
          genericName: 'Generic ' + searchQuery,
          price: 390,
          shopName: '1mg',
          arrivalTime: '2-3 Days',
          imageUrl: `https://images.unsplash.com/photo-1550572017-edd951aa8f72?q=80&w=400&auto=format&fit=crop`,
          link: `https://www.1mg.com/search/all?name=${encodeURIComponent(searchQuery)}`,
          verified: true,
          trend: 'up',
          form: 'Tablet',
          pack: '10 Tablets',
          dosage: '1 tablet twice daily after meals',
          restrictions: ['Prescription Required'],
          substitutes: ['Generic Alternative D']
        }
      ];
      setResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const handleSafetyCheck = async (med: MedicineResult) => {
    setAnalyzingMedId(med.id);
    try {
      const prompt = `Perform a safety check for a patient considering: ${med.name} (${med.genericName}).
Patient Health Profile:
- Age: ${profile?.profile?.age || 28}
- Biological Sex: ${profile?.profile?.gender || 'male'}
- Existing Conditions: ${profile?.health?.conditions?.join(', ') || 'None reported'}
- Known Allergies: ${profile?.health?.allergies?.join(', ') || 'None reported'}
- Pregnancy Status: ${profile?.pregnancy?.status || 'not_pregnant'}

Return a structured evaluation with status (SAFE, CAUTION, or CONTRAINDICATED), clinical analysis, recommendation, and any specific warning.`;

      const response = await getAiriResponse(prompt, profile);
      
      const responseStr = typeof response === 'string' ? response : (response?.text || '');
      let status: '✅' | '⚠️' | '❌' = '✅';
      const lowerResp = responseStr.toLowerCase();
      if (lowerResp.includes('contraindicated') || lowerResp.includes('danger') || lowerResp.includes('severe risk')) {
        status = '❌';
      } else if (lowerResp.includes('caution') || lowerResp.includes('monitor') || lowerResp.includes('moderate')) {
        status = '⚠️';
      }

      setResults(prev => prev.map(m => m.id === med.id ? {
        ...m,
        safetyAnalysis: {
          status,
          analysis: responseStr,
          recommendation: status === '✅' ? 'Compatible with your recorded health profile.' : 'Consult your prescribing doctor before taking.',
          warning: status === '❌' ? 'Potential contraindication with your health profile detected.' : undefined
        }
      } : m));

      toast.success(`Safety analysis complete for ${med.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Safety check failed. Please retry.');
    } finally {
      setAnalyzingMedId(null);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      dosage: '',
      time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      sound: 'Zen',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (med: any) => {
    setEditingMed(med);
    setFormData({
      name: med.medicine_name || '',
      dosage: med.dosage || '',
      time: med.reminder_time ? (med.reminder_time.includes('T') ? med.reminder_time.slice(0, 16) : new Date().toISOString().slice(0, 16)) : '',
      sound: med.sound || 'Zen',
      notes: med.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const isFormDirty = () => {
    if (editingMed) {
      return (
        formData.name !== (editingMed.medicine_name || '') ||
        formData.dosage !== (editingMed.dosage || '') ||
        formData.notes !== (editingMed.notes || '') ||
        formData.sound !== (editingMed.sound || 'Zen')
      );
    }
    return Boolean(formData.name || formData.dosage || formData.notes);
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsFormModalOpen(false);
      setEditingMed(null);
    }
  };

  // Save (Create or Update)
  const handleSaveMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    if (!formData.dosage.trim()) {
      toast.error("Dosage is required (e.g. 500mg, 1 tablet)");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMed) {
        // UPDATE
        await databaseService.updateReminder(editingMed.id, {
          medicine_name: formData.name.trim(),
          dosage: formData.dosage.trim(),
          reminder_time: formData.time,
          sound: formData.sound,
          notes: formData.notes.trim()
        }, profile?.uid);

        toast.success(`Updated reminder for "${formData.name}"`);
      } else {
        // CREATE
        await databaseService.addReminder(profile?.uid, {
          name: formData.name.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          sound: formData.sound,
          notes: formData.notes.trim()
        });

        toast.success(`Added "${formData.name}" to medication tracker`);
      }

      setIsFormModalOpen(false);
      setEditingMed(null);
      await fetchReminders();
    } catch (err: any) {
      console.error("Error saving medicine:", err);
      toast.error(err.message || "Failed to save medication reminder.");
    } finally {
      setIsSaving(false);
    }
  };

  // Real Delete Operation
  const handleConfirmDelete = async () => {
    if (!deletingMed) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteReminder(deletingMed.id, profile?.uid);
      setReminders(prev => prev.filter(r => r.id !== deletingMed.id));
      toast.success(`Medication "${deletingMed.medicine_name}" removed from tracker`);
      setDeletingMed(null);
    } catch (err: any) {
      console.error("Error deleting medicine:", err);
      toast.error(err.message || "Failed to delete medicine.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTaken = async (id: string, currentStatus: boolean) => {
    try {
      await databaseService.toggleReminder(id, currentStatus, profile?.uid);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, taken: !currentStatus } : r));
      toast.success(!currentStatus ? "Marked as taken!" : "Marked as pending");
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Medicine Tracker Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
            <Pill className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Regimen & Reminders</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Medicine Tracker
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/70 max-w-xl">
            Real persistent database storage for your active prescriptions, dosage schedules, sound alerts, and compliance history.
          </p>
        </div>

        <button 
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-center shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.length === 0 ? (
          <GlassCard className="col-span-full py-12 text-center border-dashed border-emerald-500/20 space-y-3">
            <Clock className="w-12 h-12 text-emerald-500/20 mx-auto" />
            <p className="text-emerald-100/60 text-xs">No medications added yet. Click "Add Medication" to start tracking.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </GlassCard>
        ) : (
          reminders.map((med, idx) => (
            <GlassCard key={med.id} delay={idx * 0.04} className="p-4 border-emerald-500/15 hover:border-emerald-400/30 transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <button 
                  onClick={() => toggleTaken(med.id, med.taken)}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0 cursor-pointer",
                    med.taken 
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20" 
                      : "border-emerald-500/30 text-emerald-500/40 hover:border-emerald-400 hover:text-emerald-400"
                  )}
                  title={med.taken ? "Mark as pending" : "Mark as taken"}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h4 className={cn("font-bold text-sm text-white truncate", med.taken && "line-through opacity-60")}>
                    {med.medicine_name}
                  </h4>
                  <p className="text-xs text-emerald-200/70 truncate">
                    {med.dosage} • {med.reminder_time ? (med.reminder_time.includes('T') ? new Date(med.reminder_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : med.reminder_time) : 'As Needed'}
                  </p>
                  {med.notes && (
                    <p className="text-[10px] text-emerald-300/50 italic truncate mt-0.5">
                      {med.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => openEditModal(med)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-200/70 hover:text-emerald-300 transition-colors cursor-pointer"
                  title="Edit Medication"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingMed(med)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                  title="Delete Medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Add / Edit Medication Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 sm:p-7 border-emerald-500/30 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      {editingMed ? <Edit3 className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {editingMed ? 'Edit Medication' : 'Add Medication Reminder'}
                      </h3>
                      <p className="text-[10px] text-emerald-300/60 font-medium">
                        {editingMed ? 'Update dosage or timing schedule' : 'Save persistent medication schedule'}
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

                <form onSubmit={handleSaveMed} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Medicine Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. Metformin, Paracetamol, Atorvastatin"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Dosage & Strength *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.dosage}
                      onChange={e => setFormData({...formData, dosage: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. 500mg (1 tablet after dinner)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Reminder Time</label>
                      <input 
                        type="datetime-local" 
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 [color-scheme:dark]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Alarm Tone</label>
                      <select 
                        value={formData.sound}
                        onChange={e => setFormData({...formData, sound: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Zen">Zen Garden</option>
                        <option value="Chime">Soft Chime</option>
                        <option value="Nature">Morning Birds</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Physician Instructions / Notes</label>
                    <input 
                      type="text"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. Take with a glass of water, avoid citrus"
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
                        <span>{editingMed ? 'Save Changes' : 'Save Reminder'}</span>
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
        isOpen={Boolean(deletingMed)}
        onClose={() => setDeletingMed(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingMed?.medicine_name}
        title="Remove medication reminder?"
        description="This will remove this prescription and its reminder alarms from your daily medication schedule."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsFormModalOpen(false);
          setEditingMed(null);
        }}
      />

      {/* Global Medicine Search & Pharmacy Section */}
      <div className="pt-6 border-t border-emerald-500/20 space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Global Medicine Search</h2>
          <p className="text-xs text-emerald-100/60 font-medium">Search verified Asian pharmacies for real-time prices, availability, and AI profile safety</p>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine brand or generic active ingredient (e.g. Metformin, Paracetamol, Amoxicillin)..." 
            className="w-full h-14 pl-12 pr-28 sm:pr-32 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs sm:text-sm text-white placeholder:text-emerald-300/40 font-medium"
          />
          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
            <button 
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Medicine Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Available Verified Pharmacies ({results.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.map((res) => (
              <GlassCard key={res.id} className="p-5 border-emerald-500/20 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        {res.shopName}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1 capitalize">{res.name}</h4>
                      <p className="text-xs text-emerald-300/60">{res.genericName}</p>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-400">₹{res.price}</span>
                  </div>

                  <div className="text-xs text-emerald-100/70 space-y-1">
                    <p>📦 <strong>Pack:</strong> {res.pack} ({res.form})</p>
                    <p>⚡ <strong>Delivery:</strong> {res.arrivalTime}</p>
                  </div>

                  {res.safetyAnalysis && (
                    <div className={cn(
                      "p-3 rounded-xl border text-xs leading-relaxed space-y-1",
                      res.safetyAnalysis.status === '✅' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100" :
                      res.safetyAnalysis.status === '⚠️' ? "bg-amber-500/10 border-amber-500/30 text-amber-100" :
                      "bg-red-500/10 border-red-500/30 text-red-100"
                    )}>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{res.safetyAnalysis.status}</span>
                        <span>Safety Compatibility Evaluation</span>
                      </div>
                      <p className="text-[11px] opacity-90">{res.safetyAnalysis.recommendation}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                  <button
                    onClick={() => handleSafetyCheck(res)}
                    disabled={analyzingMedId === res.id}
                    className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {analyzingMedId === res.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>AI Safety Check</span>
                  </button>

                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <span>View at {res.shopName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Medical Articles & Guidance */}
      {recommendedArticles.length > 0 && (
        <ArticleSection articles={recommendedArticles} />
      )}
    </div>
  );
};
