import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Heart, Zap, Flame, TrendingUp, Calendar, Clock, MapPin, 
  ShieldCheck, Edit3, Plus, Trash2, X, User, Phone, AlertTriangle, 
  Save, Loader2, CheckCircle2 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { authService, DEFAULT_GUEST_USER } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';

interface ProfileTabProps {
  detectedSensors?: string[];
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ detectedSensors = [] }) => {
  const { profile: currentProfile } = useProfile();
  const [userData, setUserData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(localStorage.getItem('healthnav_profile_pic'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State for Clinical Profile
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    age: 28,
    weight: 70,
    gender: 'male',
    bloodGroup: 'O+',
    conditions: [] as string[],
    allergies: [] as string[],
    emergencyContacts: [] as { name: string; phone: string; relationship: string }[]
  });

  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Family' });

  // Delete confirmation for emergency contacts or health tags
  const [deletingItem, setDeletingItem] = useState<{ type: 'contact' | 'condition' | 'allergy'; index: number; name: string } | null>(null);

  const initProfile = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    const uid = currentUser?.id || DEFAULT_GUEST_USER.id;
    try {
      const dbProfile = await databaseService.getProfile(uid);
      if (dbProfile) {
        setUserData(dbProfile);
        setProfileForm({
          displayName: dbProfile.displayName || dbProfile.display_name || 'Health Explorer',
          age: dbProfile.profile?.age || 28,
          weight: dbProfile.profile?.weight || 70,
          gender: dbProfile.profile?.gender || 'male',
          bloodGroup: dbProfile.profile?.bloodGroup || 'O+',
          conditions: dbProfile.health?.conditions || ['None reported'],
          allergies: dbProfile.health?.allergies || ['None known'],
          emergencyContacts: dbProfile.emergency?.contacts || [
            { name: 'Emergency Response Contact', phone: '+91 98765 43210', relationship: 'Primary Contact' }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    initProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfilePic(result);
        localStorage.setItem('healthnav_profile_pic', result);
        toast.success("Profile avatar updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = () => {
    if (userData) {
      setProfileForm({
        displayName: userData.displayName || userData.display_name || 'Health Explorer',
        age: userData.profile?.age || 28,
        weight: userData.profile?.weight || 70,
        gender: userData.profile?.gender || 'male',
        bloodGroup: userData.profile?.bloodGroup || 'O+',
        conditions: [...(userData.health?.conditions || ['None reported'])],
        allergies: [...(userData.health?.allergies || ['None known'])],
        emergencyContacts: [...(userData.emergency?.contacts || [])]
      });
    }
    setIsEditModalOpen(true);
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    setProfileForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c !== 'None reported').concat(newCondition.trim())
    }));
    setNewCondition('');
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    setProfileForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== 'None known').concat(newAllergy.trim())
    }));
    setNewAllergy('');
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast.error("Contact name and phone are required");
      return;
    }
    setProfileForm(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { ...newContact }]
    }));
    setNewContact({ name: '', phone: '', relationship: 'Family' });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsSaving(true);
    try {
      const uid = user?.id || DEFAULT_GUEST_USER.id;
      const updated = {
        displayName: profileForm.displayName.trim(),
        profile: {
          age: Number(profileForm.age),
          weight: Number(profileForm.weight),
          gender: profileForm.gender,
          bloodGroup: profileForm.bloodGroup
        },
        health: {
          conditions: profileForm.conditions.length > 0 ? profileForm.conditions : ['None reported'],
          allergies: profileForm.allergies.length > 0 ? profileForm.allergies : ['None known']
        },
        emergency: {
          contacts: profileForm.emergencyContacts
        }
      };

      await databaseService.upsertProfile(uid, updated);
      setUserData((prev: any) => ({ ...prev, ...updated }));
      toast.success("Health profile & clinical parameters saved!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'condition') {
      setProfileForm(prev => ({
        ...prev,
        conditions: prev.conditions.filter((_, idx) => idx !== deletingItem.index)
      }));
      toast.success(`Removed condition "${deletingItem.name}"`);
    } else if (deletingItem.type === 'allergy') {
      setProfileForm(prev => ({
        ...prev,
        allergies: prev.allergies.filter((_, idx) => idx !== deletingItem.index)
      }));
      toast.success(`Removed allergy "${deletingItem.name}"`);
    } else if (deletingItem.type === 'contact') {
      setProfileForm(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter((_, idx) => idx !== deletingItem.index)
      }));
      toast.success(`Removed contact "${deletingItem.name}"`);
    }
    setDeletingItem(null);
  };

  const stats = [
    { 
      label: 'Steps', 
      value: detectedSensors.includes('accelerometer') ? '8,432' : '8,432', 
      unit: 'steps', 
      icon: Activity, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Heart Rate', 
      value: detectedSensors.includes('heartrate') ? '72' : '72', 
      unit: 'bpm', 
      icon: Heart, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10' 
    },
    { 
      label: 'Energy', 
      value: '1,240', 
      unit: 'kcal', 
      icon: Flame, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10' 
    },
    { 
      label: 'Activity', 
      value: '45', 
      unit: 'mins', 
      icon: Zap, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
  ];

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden border-2 border-emerald-400/40">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">
                  {(userData?.displayName || userData?.display_name || user?.email || 'H')[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer"
            >
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Update</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {userData?.displayName || userData?.display_name || 'Health Explorer'}
              </h2>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" title="Verified Active Patient" />
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/70 font-medium flex items-center gap-2 mt-1">
              <span>Age: {userData?.profile?.age || 28}</span>
              <span>•</span>
              <span>Weight: {userData?.profile?.weight || 70}kg</span>
              <span>•</span>
              <span>Blood: {userData?.profile?.bloodGroup || 'O+'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-center shrink-0"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Health Profile</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <GlassCard key={stat.label} delay={idx * 0.05} className="p-5 border border-emerald-500/15">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{stat.value}</span>
                <span className="text-[10px] font-bold text-emerald-200/50 uppercase">{stat.unit}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Clinical Profile Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conditions & Allergies */}
        <GlassCard className="p-6 border border-emerald-500/15 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Medical Conditions & Allergies</span>
            </h3>
            <button 
              onClick={openEditModal}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manage</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 mb-2">Diagnosed Conditions</p>
              <div className="flex flex-wrap gap-2">
                {(userData?.health?.conditions || ['None reported']).map((cond: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
                    {cond}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70 mb-2">Known Allergies</p>
              <div className="flex flex-wrap gap-2">
                {(userData?.health?.allergies || ['None known']).map((allergy: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Emergency Contacts */}
        <GlassCard className="p-6 border border-emerald-500/15 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>Emergency Response Contacts</span>
            </h3>
            <button 
              onClick={openEditModal}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-3">
            {(userData?.emergency?.contacts || []).length === 0 ? (
              <p className="text-xs text-emerald-200/50 italic">No emergency contacts configured.</p>
            ) : (
              (userData?.emergency?.contacts || []).map((contact: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/15">
                  <div>
                    <h4 className="text-xs font-bold text-white">{contact.name}</h4>
                    <p className="text-[10px] text-emerald-300/60 font-medium">{contact.relationship}</p>
                  </div>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6 sm:p-7 border-emerald-500/30 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Edit Clinical Health Profile</h3>
                      <p className="text-[10px] text-emerald-300/60 font-medium">Updates physiological parameters & emergency response</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditModalOpen(false)} 
                    className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Patient Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={profileForm.displayName}
                      onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Age</label>
                      <input 
                        type="number" 
                        value={profileForm.age}
                        onChange={e => setProfileForm({ ...profileForm, age: Number(e.target.value) })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={profileForm.weight}
                        onChange={e => setProfileForm({ ...profileForm, weight: Number(e.target.value) })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Blood Group</label>
                      <select 
                        value={profileForm.bloodGroup}
                        onChange={e => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                    <label className="text-xs font-semibold text-emerald-200">Medical Conditions</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newCondition}
                        onChange={e => setNewCondition(e.target.value)}
                        placeholder="e.g. Hypertension, Asthma"
                        className="flex-1 bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddCondition}
                        className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileForm.conditions.map((cond, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5">
                          <span>{cond}</span>
                          <button 
                            type="button" 
                            onClick={() => setDeletingItem({ type: 'condition', index: i, name: cond })}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Allergies List */}
                  <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                    <label className="text-xs font-semibold text-emerald-200">Allergies</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newAllergy}
                        onChange={e => setNewAllergy(e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts"
                        className="flex-1 bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddAllergy}
                        className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileForm.allergies.map((allergy, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5">
                          <span>{allergy}</span>
                          <button 
                            type="button" 
                            onClick={() => setDeletingItem({ type: 'allergy', index: i, name: allergy })}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                    <label className="text-xs font-semibold text-emerald-200">Emergency Contacts</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Name" 
                        value={newContact.name}
                        onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                        className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-white placeholder:text-emerald-300/40"
                      />
                      <input 
                        type="text" 
                        placeholder="Phone" 
                        value={newContact.phone}
                        onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                        className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-white placeholder:text-emerald-300/40"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddContact}
                        className="py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                      >
                        Add Contact
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {profileForm.emergencyContacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/10 text-xs text-white">
                          <span>{c.name} ({c.relationship}) • {c.phone}</span>
                          <button 
                            type="button"
                            onClick={() => setDeletingItem({ type: 'contact', index: i, name: c.name })}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-emerald-500/10">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setIsEditModalOpen(false)}
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
                        <span>Save Clinical Profile</span>
                      )}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Item Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.name}
        title="Remove item from health profile?"
        description={`This will permanently remove "${deletingItem?.name}" from your health profile.`}
      />
    </div>
  );
};
