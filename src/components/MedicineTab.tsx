import React from 'react';
import { Search, Pill, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, Camera, X, Info, ShoppingCart, Clock, ExternalLink, Loader2, Sparkles, BookOpen, ShieldCheck, AlertTriangle, XCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import { ArticleSection } from './ArticleSection';
import { getRecommendedArticles, getAiriResponse } from '../services/geminiService';
import { Article } from '../types';
import { useProfile } from '../hooks/useProfile';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<MedicineResult[]>([]);
  const [recommendedArticles, setRecommendedArticles] = React.useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = React.useState(false);
  const [analyzingMedId, setAnalyzingMedId] = React.useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsArticlesLoading(true);
    
    getRecommendedArticles(searchQuery).then(articles => {
      setRecommendedArticles(articles);
      setIsArticlesLoading(false);
    });

    // Simulate AI search across many websites in Asia
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
          arrivalTime: '4 Hours',
          imageUrl: `https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=400&auto=format&fit=crop`,
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
    }, 2000);
  };

  const checkSafety = async (med: MedicineResult) => {
    setAnalyzingMedId(med.id);
    try {
      const prompt = `Analyze the safety of ${med.name} (${med.genericName}) for me. Provide a detailed safety analysis based on my profile.`;
      const response = await getAiriResponse(prompt, profile);
      
      // Parse the response into structured format
      // Airi's response format is:
      // **Analysis:** ...
      // **Safety Status:** ✅ / ⚠️ / ❌
      // **Recommendation:** ...
      // **Warning:** ...

      const statusMatch = response.match(/\*\*Safety Status:\*\*\s*([✅⚠️❌])/);
      const analysisMatch = response.match(/\*\*Analysis:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
      const recommendationMatch = response.match(/\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
      const warningMatch = response.match(/\*\*Warning:\*\*\s*([\s\S]*?)(?=\*\*|$)/);

      const safetyAnalysis = {
        status: (statusMatch ? statusMatch[1] : '⚠️') as '✅' | '⚠️' | '❌',
        analysis: analysisMatch ? analysisMatch[1].trim() : "Unable to parse analysis.",
        recommendation: recommendationMatch ? recommendationMatch[1].trim() : "Consult a doctor.",
        warning: warningMatch ? warningMatch[1].trim() : undefined
      };

      setResults(prev => prev.map(m => m.id === med.id ? { ...m, safetyAnalysis } : m));
    } catch (err) {
      console.error("Safety check error:", err);
    } finally {
      setAnalyzingMedId(null);
    }
  };

  const [reminders, setReminders] = React.useState<any[]>([]);
  const [isAddingMed, setIsAddingMed] = React.useState(false);
  const [newMed, setNewMed] = React.useState({ name: '', dosage: '', time: 'Morning' });

  React.useEffect(() => {
    if (profile) {
      fetchReminders();
    }
  }, [profile]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', profile?.uid)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .insert([{
          user_id: profile?.uid,
          medicine_name: newMed.name,
          dosage: newMed.dosage,
          time: newMed.time,
          taken: false
        }]);

      if (error) throw error;
      toast.success("Medicine added to your tracker!");
      setIsAddingMed(false);
      setNewMed({ name: '', dosage: '', time: 'Morning' });
      fetchReminders();
    } catch (err) {
      console.error("Error adding medicine:", err);
      toast.error("Failed to add medicine.");
    }
  };

  const handleDeleteMed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success("Medicine removed.");
    } catch (err) {
      console.error("Error deleting medicine:", err);
    }
  };

  const toggleTaken = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          taken: !currentStatus,
          last_taken_date: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      setReminders(prev => prev.map(r => r.id === id ? { ...r, taken: !currentStatus } : r));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Medicine Tracker Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-50">My Medicine Tracker</h2>
          <p className="text-sm text-emerald-100/60 font-medium">Manage your daily medications and reminders</p>
        </div>
        <button 
          onClick={() => setIsAddingMed(true)}
          className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg neon-glow-teal hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {reminders.length === 0 ? (
          <GlassCard className="col-span-full py-12 text-center border-dashed border-emerald-500/20">
            <Clock className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
            <p className="text-emerald-100/40 text-sm">No medicines added yet. Click the + button to start tracking.</p>
          </GlassCard>
        ) : (
          reminders.map((med, idx) => (
            <GlassCard key={med.id} delay={idx * 0.05} className="flex items-center justify-between p-4 border-emerald-500/10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTaken(med.id, med.taken)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    med.taken ? "bg-emerald-500 border-emerald-500 text-white" : "border-emerald-500/20 text-emerald-500/40 hover:border-emerald-500"
                  )}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </button>
                <div>
                  <h4 className="font-bold text-emerald-50">{med.medicine_name}</h4>
                  <p className="text-xs text-emerald-100/60">{med.dosage} • {med.time}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteMed(med.id)}
                className="p-2 text-emerald-100/20 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </GlassCard>
          ))
        )}
      </div>

      <AnimatePresence>
        {isAddingMed && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 border-emerald-500/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-emerald-50">Add Medication</h3>
                  <button onClick={() => setIsAddingMed(false)} className="text-emerald-100/40 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddMed} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Medicine Name</label>
                    <input 
                      type="text" 
                      required
                      value={newMed.name}
                      onChange={e => setNewMed({...newMed, name: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl glass border-emerald-500/20 text-emerald-50 outline-none focus:border-emerald-500"
                      placeholder="e.g. Paracetamol"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Dosage</label>
                    <input 
                      type="text" 
                      required
                      value={newMed.dosage}
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl glass border-emerald-500/20 text-emerald-50 outline-none focus:border-emerald-500"
                      placeholder="e.g. 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Reminder Time</label>
                    <select 
                      value={newMed.time}
                      onChange={e => setNewMed({...newMed, time: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl glass border-emerald-500/20 text-emerald-50 outline-none focus:border-emerald-500 bg-emerald-900"
                    >
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Night</option>
                      <option>As Needed</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold neon-glow-teal shadow-lg mt-4"
                  >
                    Save Reminder
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-50">Global Medicine Search</h2>
        <p className="text-sm text-emerald-100/60 font-medium">AI-powered search across Asia for the best prices and availability</p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Medicine name..." 
          className="w-full h-14 pl-12 pr-24 sm:pr-32 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
          <button 
            type="submit"
            disabled={isSearching}
            className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] sm:text-xs font-bold neon-glow-teal hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
          <button type="button" className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
            <Camera className="w-4 h-4 sm:w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {results.length === 0 && !isSearching && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Pill className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-emerald-50">Find Your Medicine</h3>
            <p className="text-emerald-100/60 max-w-xs mx-auto mt-2">Search to compare prices and delivery times across top pharmacies in Asia.</p>
          </div>
        )}

        {results.map((med, idx) => (
          <GlassCard key={med.id} delay={idx * 0.1} className="border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/10 shadow-lg shadow-emerald-500/5">
                <img 
                  src={med.imageUrl} 
                  alt={med.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-xl font-bold text-emerald-50">{med.name}</h3>
                      {med.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                      {med.genericName}
                    </p>
                    <p className="text-xs text-emerald-100/60 font-medium">
                      {med.form} • {med.pack} • <span className="text-emerald-50 font-bold">{med.shopName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">₹{med.price}</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider">
                      {med.trend === 'up' ? (
                        <span className="text-red-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> Rising</span>
                      ) : med.trend === 'down' ? (
                        <span className="text-emerald-400 flex items-center"><ArrowDownRight className="w-3 h-3" /> Dropping</span>
                      ) : (
                        <span className="text-emerald-100/40 flex items-center"><Minus className="w-3 h-3" /> Stable</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Arrival Time</span>
                    </div>
                    <p className="text-xs text-emerald-50 font-bold">{med.arrivalTime}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">AI Dosage Insight</span>
                    </div>
                    <p className="text-xs text-emerald-50 font-bold">{med.dosage}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {med.restrictions.map(res => (
                      <span key={res} className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                        {res}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {med.substitutes.map(sub => (
                      <span key={sub} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-100/10 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-emerald-100/40 font-bold uppercase tracking-widest">
                        Best Price Found via AI
                      </span>
                      <button 
                        onClick={() => checkSafety(med)}
                        disabled={analyzingMedId === med.id}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {analyzingMedId === med.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        Check Safety with Airi
                      </button>
                    </div>
                    <a 
                      href={med.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold neon-glow-teal hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
                    >
                      Reserve & Buy <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {med.safetyAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {med.safetyAnalysis.status === '✅' ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          ) : med.safetyAnalysis.status === '⚠️' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-sm font-bold text-emerald-50">Airi Safety Analysis</span>
                        </div>
                        <span className="text-xl">{med.safetyAnalysis.status}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-emerald-100/80 leading-relaxed">
                          {med.safetyAnalysis.analysis}
                        </p>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Recommendation</p>
                          <p className="text-xs text-emerald-50 font-medium">{med.safetyAnalysis.recommendation}</p>
                        </div>
                        {med.safetyAnalysis.warning && (
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Warning</p>
                            <p className="text-xs text-red-50 font-medium">{med.safetyAnalysis.warning}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {(recommendedArticles.length > 0 || isArticlesLoading) && (
        <div className="mt-12 pt-12 border-t border-emerald-100/10">
          <ArticleSection 
            articles={recommendedArticles} 
            isLoading={isArticlesLoading} 
            title={`Verified Insights for ${searchQuery || 'your search'}`}
          />
        </div>
      )}
    </div>
  );
};
