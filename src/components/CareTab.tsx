import React, { useState, useEffect } from 'react';
import { 
  Search, Stethoscope, Star, MapPin, Bed, Info, ExternalLink, Clock, 
  Calendar, Sparkles, BookOpen, AlertCircle, Navigation, Phone, 
  ShieldCheck, Loader2, Plus, Edit3, Trash2, X, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import { ArticleSection } from './ArticleSection';
import { getRecommendedArticles, searchHospital } from '../services/geminiService';
import { getCurrentLocation, findNearbyHospitals } from '../services/locationService';
import { Article, Hospital, Appointment } from '../types';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';

const REAL_HOSPITALS: Hospital[] = [
  {
    id: '1',
    name: 'AIIMS New Delhi',
    location: 'Ansari Nagar, New Delhi',
    distance: '2.4 km',
    bedAvailability: '45',
    costRange: 'Government / Free',
    consultationFee: '₹10 (Registration)',
    capabilityScore: 98,
    badges: ['Top Ranked', 'Research Center', 'Specialized Care'],
    reviewSummary: 'Indias premier medical institute with world-class specialists and advanced diagnostic facilities.',
    bestFit: true,
    appointmentLink: 'https://ors.gov.in/orsportal/',
    availabilityStatus: 'Busy',
    nextSlot: 'Tomorrow, 9:00 AM',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Apollo Hospitals, Greams Road',
    location: 'Chennai, Tamil Nadu',
    distance: '5.1 km',
    bedAvailability: '120',
    costRange: 'Premium',
    consultationFee: '₹1,000 - ₹1,500',
    capabilityScore: 95,
    badges: ['JCI Accredited', 'Cardiology Hub', 'International Patients'],
    reviewSummary: 'Renowned for cardiology and multi-organ transplants with high success rates.',
    appointmentLink: 'https://www.apollohospitals.com/appointments/',
    availabilityStatus: 'Available',
    nextSlot: 'Today, 2:30 PM',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Fortis Memorial Research Institute',
    location: 'Gurugram, Haryana',
    distance: '12 km',
    bedAvailability: '80',
    costRange: 'High',
    consultationFee: '₹800 - ₹1,200',
    capabilityScore: 92,
    badges: ['Advanced Oncology', 'Robotic Surgery'],
    reviewSummary: 'State-of-the-art infrastructure focusing on oncology, neurosciences, and orthopaedics.',
    appointmentLink: 'https://www.fortishealthcare.com/book-an-appointment',
    availabilityStatus: 'Limited',
    nextSlot: 'Today, 5:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Christian Medical College (CMC)',
    location: 'Vellore, Tamil Nadu',
    distance: '150 km',
    bedAvailability: '200+',
    costRange: 'Affordable',
    consultationFee: '₹200 - ₹500',
    capabilityScore: 97,
    badges: ['Charity Care', 'Top Medical School'],
    reviewSummary: 'A leading tertiary care hospital known for its ethical practice and excellent patient care.',
    appointmentLink: 'https://www.cmcvellore.ac.in/PatientCare/Appointments.aspx',
    availabilityStatus: 'Busy',
    nextSlot: 'Next Week',
    imageUrl: 'https://images.unsplash.com/photo-1538108149393-fdfd81692333?q=80&w=400&auto=format&fit=crop'
  }
];

export const CareTab: React.FC = () => {
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>(REAL_HOSPITALS);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeSpecialty, setActiveSpecialty] = useState<string>('All');

  // Appointments CRUD State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppts, setIsLoadingAppts] = useState(true);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [deletingAppt, setDeletingAppt] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    doctorName: '',
    hospitalName: '',
    specialty: 'Cardiology',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '10:30 AM',
    type: 'In-Person Consultation',
    notes: ''
  });

  const specialties = ['All', 'ENT', 'Cardiology', 'General', 'Pediatrics', 'Oncology'];

  const loadAppointments = async () => {
    setIsLoadingAppts(true);
    try {
      const data = await databaseService.getAppointments(profile?.uid);
      setAppointments(data);
    } catch (e) {
      console.error("Error loading appointments:", e);
    } finally {
      setIsLoadingAppts(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [profile?.uid]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  const executeSearch = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    setIsArticlesLoading(true);
    
    try {
      getRecommendedArticles(searchQuery + " healthcare and treatment").then(articles => {
        setRecommendedArticles(articles);
        setIsArticlesLoading(false);
      });

      const aiData = await searchHospital(searchQuery);
      if (aiData) {
        const newHospital: Hospital = {
          id: `ai-${Date.now()}`,
          name: aiData.name,
          location: aiData.loc,
          distance: 'Calculating...',
          bedAvailability: `${aiData.avail} / ${aiData.beds}`,
          costRange: aiData.cost || 'Premium',
          consultationFee: aiData.fee || '₹1,000',
          capabilityScore: aiData.score || 90,
          badges: aiData.badges || (aiData.specialists ? aiData.specialists.split(',').map((s: string) => s.trim()) : ['AI Verified']),
          reviewSummary: aiData.airi_insight,
          bestFit: true,
          appointmentLink: aiData.link,
          availabilityStatus: 'Available',
          nextSlot: 'Today, 2:00 PM',
          imageUrl: aiData.img
        };

        setNearbyHospitals(prev => [newHospital, ...prev]);
        toast.success(`Found hospital info for ${aiData.name}`);
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGPSSearch = async () => {
    setIsSearching(true);
    setLocationError(null);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        setLocationError("Please enable location permissions to find nearby hospitals.");
        setIsSearching(false);
        return;
      }

      const hospitals = await findNearbyHospitals(location.lat, location.lng);
      setNearbyHospitals(hospitals);
      toast.success("Found nearest hospitals to your GPS location.");
    } catch (err) {
      console.error("GPS Search error:", err);
      setLocationError("Failed to find nearby hospitals. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Open booking modal for a hospital
  const startBookingForHospital = (hospital: Hospital) => {
    setEditingAppt(null);
    setFormData({
      doctorName: 'Attending Specialist',
      hospitalName: `${hospital.name}, ${hospital.location}`,
      specialty: hospital.badges[0] || 'General Medicine',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Clinical Consultation',
      notes: `Booked via HealthNav. Fee: ${hospital.consultationFee}`
    });
    setIsApptModalOpen(true);
  };

  // Open custom appointment modal
  const openCreateModal = () => {
    setEditingAppt(null);
    setFormData({
      doctorName: '',
      hospitalName: '',
      specialty: 'General Medicine',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Clinical Consultation',
      notes: ''
    });
    setIsApptModalOpen(true);
  };

  // Open edit appointment modal
  const openEditModal = (appt: Appointment) => {
    setEditingAppt(appt);
    setFormData({
      doctorName: appt.doctorName,
      hospitalName: appt.hospitalName,
      specialty: appt.specialty || 'General Medicine',
      date: appt.date,
      time: appt.time,
      type: appt.type,
      notes: appt.notes || ''
    });
    setIsApptModalOpen(true);
  };

  const isFormDirty = () => {
    if (editingAppt) {
      return (
        formData.doctorName !== editingAppt.doctorName ||
        formData.hospitalName !== editingAppt.hospitalName ||
        formData.date !== editingAppt.date ||
        formData.time !== editingAppt.time ||
        formData.notes !== (editingAppt.notes || '')
      );
    }
    return Boolean(formData.doctorName || formData.hospitalName || formData.notes);
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsApptModalOpen(false);
      setEditingAppt(null);
    }
  };

  // Save (Create or Update)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorName.trim() || !formData.hospitalName.trim()) {
      toast.error('Doctor and clinic/hospital name are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAppt) {
        // UPDATE
        const updated = await databaseService.updateAppointment(editingAppt.id, {
          doctorName: formData.doctorName,
          hospitalName: formData.hospitalName,
          specialty: formData.specialty,
          date: formData.date,
          time: formData.time,
          type: formData.type,
          notes: formData.notes
        }, profile?.uid);

        setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
        toast.success(`Appointment with ${updated.doctorName} updated`);
      } else {
        // CREATE
        const created = await databaseService.createAppointment(profile?.uid, {
          doctorName: formData.doctorName,
          hospitalName: formData.hospitalName,
          specialty: formData.specialty,
          date: formData.date,
          time: formData.time,
          type: formData.type,
          notes: formData.notes
        });

        // Also add timeline event
        await databaseService.createTimelineEvent(profile?.uid, {
          title: `Scheduled Consultation: ${formData.doctorName}`,
          type: 'appointment',
          date: formData.date,
          time: formData.time,
          provider: formData.hospitalName,
          description: `Care consultation booked at ${formData.hospitalName}.`,
          details: `Specialty: ${formData.specialty}. Type: ${formData.type}. Notes: ${formData.notes || 'None'}`
        });

        setAppointments(prev => [created, ...prev]);
        toast.success(`Appointment confirmed & added to health timeline!`);
      }

      setIsApptModalOpen(false);
      setEditingAppt(null);
    } catch (err: any) {
      console.error("Save appointment error:", err);
      toast.error(err.message || "Failed to save appointment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAppt) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteAppointment(deletingAppt.id, profile?.uid);
      setAppointments(prev => prev.filter(a => a.id !== deletingAppt.id));
      toast.success(`Appointment at ${deletingAppt.hospitalName} cancelled`);
      setDeletingAppt(null);
    } catch (err: any) {
      console.error("Cancel appointment error:", err);
      toast.error(err.message || "Failed to cancel appointment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHospitals = activeSpecialty === 'All' 
    ? nearbyHospitals 
    : nearbyHospitals.filter(h => Array.isArray(h.badges) && h.badges.some(b => (b || '').toLowerCase().includes((activeSpecialty || '').toLowerCase())));

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Care Booking & Navigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Care & Specialist Appointments
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/70 max-w-xl">
            Book consultations at premier medical institutions across Asia and manage your active appointment schedules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start md:self-center shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Scheduled Appointments Section (CRUD) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest">My Scheduled Appointments ({appointments.length})</h3>
          </div>
        </div>

        {isLoadingAppts ? (
          <div className="py-6 text-center text-xs text-emerald-200/60">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <GlassCard className="py-8 text-center border-dashed border-emerald-500/20">
            <p className="text-xs text-emerald-100/60">No upcoming appointments. Select a verified hospital below or click "Book Appointment" to schedule one.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => (
              <GlassCard key={appt.id} className="p-5 border-emerald-500/15 hover:border-emerald-400/30 transition-all space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        {appt.specialty || 'Consultation'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{appt.doctorName}</h4>
                      <p className="text-xs text-emerald-200/70">{appt.hospitalName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-semibold uppercase">
                      {appt.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-emerald-300/80 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Calendar className="w-3.5 h-3.5" /> {appt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {appt.time}
                    </span>
                  </div>

                  {appt.notes && (
                    <p className="text-[11px] text-emerald-100/70 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 italic">
                      {appt.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/10">
                  <button
                    onClick={() => openEditModal(appt)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-xs font-semibold text-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>

                  <button
                    onClick={() => setDeletingAppt(appt)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                    title="Cancel Appointment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Hospital Search & Directory */}
      <div className="space-y-4 pt-4 border-t border-emerald-500/20">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Find Premier Asian Healthcare Centers</h2>
          <p className="text-xs text-emerald-100/60 font-medium">Search premier accredited hospitals, ICU bed availability, and booking slots</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              placeholder="Search hospital name, city, or medical specialty..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs sm:text-sm text-white placeholder:text-emerald-300/40 font-medium"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={executeSearch}
              disabled={isSearching}
              className="px-5 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>

            <button 
              onClick={handleGPSSearch}
              className="px-4 h-14 rounded-2xl bg-white/5 border border-emerald-500/20 hover:bg-white/10 text-emerald-400 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">Near Me</span>
            </button>
          </div>
        </div>

        {locationError && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Specialty Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {specialties.map(specialty => (
            <button
              key={specialty}
              onClick={() => setActiveSpecialty(specialty)}
              className={cn(
                "px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                activeSpecialty === specialty 
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20" 
                  : "bg-white/[0.03] text-emerald-300 border-white/10 hover:bg-white/5"
              )}
            >
              {specialty}
            </button>
          ))}
        </div>

        {/* Hospitals Directory Grid */}
        <div className="grid gap-4">
          {filteredHospitals.map((hospital, idx) => (
            <GlassCard key={hospital.id} delay={idx * 0.05} className="border border-emerald-500/15 p-5 hover:border-emerald-400/30 transition-all">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-44 h-44 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/10 shadow-lg">
                  <img 
                    src={hospital.imageUrl} 
                    alt={hospital.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white">{hospital.name}</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        hospital.availabilityStatus === 'Available' ? "bg-emerald-500/20 text-emerald-400" :
                        hospital.availabilityStatus === 'Busy' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {hospital.availabilityStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/70">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {hospital.location}</span>
                      <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-emerald-400" /> <strong>{hospital.bedAvailability}</strong> Beds Real-Time</span>
                      <span className="font-bold text-emerald-400">{hospital.costRange}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hospital.badges.map(badge => (
                        <span key={badge} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                          {badge}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-emerald-100/70 leading-relaxed italic pt-1">
                      {hospital.reviewSummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-emerald-500/10">
                    <button 
                      onClick={() => startBookingForHospital(hospital)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book at {hospital.name}</span>
                    </button>

                    <a 
                      href={`https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
                      title="View on Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Book / Edit Appointment Modal */}
      <AnimatePresence>
        {isApptModalOpen && (
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
                      <Stethoscope className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {editingAppt ? 'Reschedule Appointment' : 'Book Clinical Consultation'}
                      </h3>
                      <p className="text-[10px] text-emerald-300/60 font-medium">
                        {editingAppt ? 'Update consultation date and notes' : 'Secures consultation slot & logs in health timeline'}
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

                <form onSubmit={handleSaveAppointment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Doctor / Specialist *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.doctorName}
                      onChange={e => setFormData({...formData, doctorName: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. Dr. Sarah Chen, MD (Cardiology)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Hospital / Facility *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.hospitalName}
                      onChange={e => setFormData({...formData, hospitalName: e.target.value})}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                      placeholder="e.g. Apollo Hospitals, Greams Road"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Specialty</label>
                      <input 
                        type="text" 
                        value={formData.specialty}
                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. Cardiology"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Consultation Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="Clinical Consultation">In-Person Consultation</option>
                        <option value="Follow-Up Review">Follow-Up Review</option>
                        <option value="Diagnostic Assessment">Diagnostic Assessment</option>
                        <option value="Teleconsultation">Teleconsultation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Date *</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-200">Time</label>
                      <input 
                        type="text" 
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        placeholder="e.g. 10:30 AM"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Patient Notes & Preparation</label>
                    <textarea 
                      rows={2}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g. Fasting blood tests required, bring prior ECG reports"
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
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
                        <span>{editingAppt ? 'Save Changes' : 'Confirm Booking'}</span>
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
        isOpen={Boolean(deletingAppt)}
        onClose={() => setDeletingAppt(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingAppt ? `${deletingAppt.doctorName} at ${deletingAppt.hospitalName}` : ''}
        title="Cancel scheduled appointment?"
        description="This will remove the consultation booking from your care schedule."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsApptModalOpen(false);
          setEditingAppt(null);
        }}
      />
    </div>
  );
};
