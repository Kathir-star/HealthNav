import React, { useState, useEffect } from 'react';
import { 
  Search, Heart, MapPin, Clock, ShieldCheck, Phone, Users, 
  UserPlus, ExternalLink, Activity, Droplets, Sparkles, Plus, 
  Edit3, Trash2, X, Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import { DonorRecord } from '../types';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';
import { toast } from 'sonner';

const OFFICIAL_LINKS = [
  { name: 'e-RaktKosh (Blood Stock)', url: 'https://www.eraktkosh.in/BLDAHIMS/bloodbank/stockAvailability.cnt', icon: Droplets },
  { name: 'NOTTO (Organ Registry)', url: 'https://www.notto.mohfw.gov.in/', icon: Activity },
  { name: 'Indian Red Cross', url: 'https://indianredcross.org/ircs/program/BloodBank', icon: ShieldCheck },
  { name: 'BloodDonor.in', url: 'https://blooddonor.in', icon: Heart },
  { name: 'UMANG (e-RaktKosh)', url: 'https://web.umang.gov.in', icon: ExternalLink },
];

export const DonorTab: React.FC = () => {
  const { profile } = useProfile();
  const [view, setView] = useState<'stock' | 'requests'>('stock');
  const [searchQuery, setSearchQuery] = useState('');

  // Donor Records CRUD State
  const [donorRecords, setDonorRecords] = useState<DonorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DonorRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DonorRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'O+ Blood',
    role: 'donor' as 'donor' | 'needer',
    availability: 'Ready to donate (1 Unit)',
    distance: 'Local Area',
    eta: 'Immediate',
    contact: '',
    location: '',
    notes: ''
  });

  const loadDonorRecords = async () => {
    setIsLoading(true);
    try {
      const records = await databaseService.getDonorRecords(profile?.uid);
      setDonorRecords(records);
    } catch (e) {
      console.error("Error loading donor records:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonorRecords();
  }, [profile?.uid]);

  const filteredItems = donorRecords.filter(d => 
    (view === 'stock' ? d.role === 'donor' : d.role === 'needer') &&
    (((d.type || '').toLowerCase().includes((searchQuery || '').toLowerCase())) || 
     ((d.location || '').toLowerCase().includes((searchQuery || '').toLowerCase())))
  );

  const openCreateModal = (role: 'donor' | 'needer' = 'donor') => {
    setEditingRecord(null);
    setFormData({
      type: 'O+ Blood',
      role,
      availability: role === 'donor' ? 'Ready to donate (1 Unit)' : 'Urgent Requirement',
      distance: 'Local Hospital / City Center',
      eta: role === 'donor' ? '24 Hours' : 'Critical',
      contact: profile?.emergency?.contacts?.[0]?.phone || '+91 98765 43210',
      location: 'Delhi NCR',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rec: DonorRecord) => {
    setEditingRecord(rec);
    setFormData({
      type: rec.type,
      role: rec.role,
      availability: rec.availability,
      distance: rec.distance,
      eta: rec.eta,
      contact: rec.contact || '',
      location: rec.location || '',
      notes: rec.notes || ''
    });
    setIsModalOpen(true);
  };

  const isFormDirty = () => {
    if (editingRecord) {
      return (
        formData.type !== editingRecord.type ||
        formData.availability !== editingRecord.availability ||
        formData.contact !== (editingRecord.contact || '') ||
        formData.notes !== (editingRecord.notes || '')
      );
    }
    return Boolean(formData.contact || formData.notes);
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsModalOpen(false);
      setEditingRecord(null);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type.trim()) {
      toast.error('Blood group or organ type is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRecord) {
        // UPDATE
        const updated = await databaseService.updateDonorRecord(editingRecord.id, {
          type: formData.type,
          role: formData.role,
          availability: formData.availability,
          distance: formData.distance,
          eta: formData.eta,
          contact: formData.contact,
          location: formData.location,
          notes: formData.notes
        }, profile?.uid);

        setDonorRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        toast.success(`Updated ${updated.type} registry entry`);
      } else {
        // CREATE
        const created = await databaseService.createDonorRecord(profile?.uid, {
          type: formData.type,
          role: formData.role,
          availability: formData.availability,
          distance: formData.distance,
          eta: formData.eta,
          contact: formData.contact,
          location: formData.location,
          notes: formData.notes
        });

        setDonorRecords(prev => [created, ...prev]);
        toast.success(`Pledged / posted ${created.type} to live network`);
      }

      setIsModalOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      console.error("Save donor record error:", err);
      toast.error(err.message || "Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteDonorRecord(deletingRecord.id, profile?.uid);
      setDonorRecords(prev => prev.filter(r => r.id !== deletingRecord.id));
      toast.success(`Removed ${deletingRecord.type} entry from network`);
      setDeletingRecord(null);
    } catch (err: any) {
      console.error("Delete donor record error:", err);
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            <span>Lifeline Network & Pledges</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Blood & Organ Donor Network
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/70 max-w-xl">
            Real-time donor matching, urgent blood/organ requests, and verified national registry links.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => openCreateModal('donor')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pledge Donation</span>
          </button>
          <button 
            onClick={() => openCreateModal('needer')}
            className="px-4 py-2.5 rounded-2xl bg-lime-500 hover:bg-lime-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Post Request</span>
          </button>
        </div>
      </div>

      {/* Official Registry Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {OFFICIAL_LINKS.map((link) => (
          <a 
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/15 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group hover:scale-[1.02]"
          >
            <link.icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-wider leading-tight">{link.name}</span>
          </a>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blood group (e.g. O+, AB-, B+) or organ (Kidney, Liver, Cornea)..." 
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-xs sm:text-sm text-white placeholder:text-emerald-300/40"
        />
      </div>

      {/* View Switcher */}
      <div className="flex p-1 bg-emerald-950/50 rounded-2xl border border-emerald-500/20">
        <button
          onClick={() => setView('stock')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
            view === 'stock' 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "text-emerald-200/60 hover:bg-white/5"
          )}
        >
          <Droplets className="w-4 h-4" />
          <span>Available Donor Pledges ({donorRecords.filter(r => r.role === 'donor').length})</span>
        </button>
        <button
          onClick={() => setView('requests')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
            view === 'requests' 
              ? "bg-lime-500 text-white shadow-lg shadow-lime-500/20" 
              : "text-emerald-200/60 hover:bg-white/5"
          )}
        >
          <UserPlus className="w-4 h-4" />
          <span>Urgent Requests ({donorRecords.filter(r => r.role === 'needer').length})</span>
        </button>
      </div>

      {/* Records List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-emerald-200/60">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading donor network...
          </div>
        ) : filteredItems.length === 0 ? (
          <GlassCard className="py-10 text-center border-dashed border-emerald-500/20 space-y-3">
            <Heart className="w-10 h-10 text-emerald-400/30 mx-auto" />
            <p className="text-xs text-emerald-100/60">
              No active {view === 'stock' ? 'donor pledges' : 'urgent requests'} found matching your search.
            </p>
            <button
              onClick={() => openCreateModal(view === 'stock' ? 'donor' : 'needer')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{view === 'stock' ? 'Pledge Donation' : 'Post Request'}</span>
            </button>
          </GlassCard>
        ) : (
          filteredItems.map((item, idx) => (
            <GlassCard 
              key={item.id} 
              delay={idx * 0.04}
              className={cn(
                "p-5 border-l-4 transition-all",
                item.role === 'donor' ? "border-l-emerald-500 border-emerald-500/20" : "border-l-lime-500 border-lime-500/20"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                    item.role === 'donor' ? "bg-emerald-500/10 border-emerald-500/30" : "bg-lime-500/10 border-lime-500/30"
                  )}>
                    <Heart className={cn("w-6 h-6", item.role === 'donor' ? "text-emerald-400" : "text-lime-400")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{item.type}</h3>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                        item.role === 'donor' ? "bg-emerald-500/20 text-emerald-300" : "bg-lime-500/20 text-lime-300"
                      )}>
                        {item.role === 'donor' ? 'Donor Pledge' : 'Urgent Need'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/70 mt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                      <span>• {item.distance}</span>
                      {item.location && <span>• {item.location}</span>}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-emerald-100/70 italic mt-1 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <div className={cn("text-sm font-bold", item.role === 'donor' ? "text-emerald-400" : "text-lime-400")}>
                    {item.availability}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-200/60">ETA: {item.eta}</div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-200 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeletingRecord(item)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {item.contact && (
                <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-xs text-emerald-200/80">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <strong>Contact:</strong> {item.contact}
                  </span>
                  <a
                    href={item.contact.startsWith('http') ? item.contact : `tel:${item.contact}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline text-xs font-semibold"
                  >
                    Direct Connect →
                  </a>
                </div>
              )}
            </GlassCard>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
                      <Heart className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {editingRecord ? 'Edit Donor Entry' : (formData.role === 'donor' ? 'Pledge Blood/Organ' : 'Post Urgent Need')}
                      </h3>
                      <p className="text-[10px] text-emerald-300/60 font-medium">
                        {editingRecord ? 'Update availability or contact info' : 'Broadcast to the live lifeline network'}
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

                <form onSubmit={handleSaveRecord} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Category</label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="donor">Donor (Available)</option>
                        <option value="needer">Recipient (Urgent Need)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Blood / Organ Type *</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="O+ Blood">O+ Blood</option>
                        <option value="O- Blood">O- Blood</option>
                        <option value="A+ Blood">A+ Blood</option>
                        <option value="A- Blood">A- Blood</option>
                        <option value="B+ Blood">B+ Blood</option>
                        <option value="B- Blood">B- Blood</option>
                        <option value="AB+ Blood">AB+ Blood</option>
                        <option value="AB- Blood">AB- Blood</option>
                        <option value="Platelets">Platelets</option>
                        <option value="Kidney">Kidney</option>
                        <option value="Liver">Liver</option>
                        <option value="Cornea">Cornea</option>
                        <option value="Bone Marrow">Bone Marrow</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Availability / Quantity</label>
                    <input 
                      type="text" 
                      required
                      value={formData.availability}
                      onChange={e => setFormData({...formData, availability: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. 2 Units Available, Urgent Requirement"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">City / Hospital</label>
                      <input 
                        type="text" 
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. AIIMS Delhi / Mumbai"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Contact / Phone</label>
                      <input 
                        type="text" 
                        value={formData.contact}
                        onChange={e => setFormData({...formData, contact: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Clinical Notes</label>
                    <input 
                      type="text" 
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. Willing to travel within 50km"
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
                        <span>{editingRecord ? 'Save Changes' : 'Publish Entry'}</span>
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
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingRecord ? `${deletingRecord.type} (${deletingRecord.role === 'donor' ? 'Pledge' : 'Request'})` : ''}
        title="Remove donor network entry?"
        description="This will delete this pledge or request from the active lifeline registry."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
      />
    </div>
  );
};
