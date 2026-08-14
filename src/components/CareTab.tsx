import React from 'react';
import { Search, Stethoscope, Star, MapPin, Bed, Info, ExternalLink, Clock, Calendar, Sparkles, BookOpen, AlertCircle, Navigation, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import { ArticleSection } from './ArticleSection';
import { getRecommendedArticles, searchHospital } from '../services/geminiService';
import { getCurrentLocation, findNearbyHospitals } from '../services/locationService';
import { Article, Hospital } from '../types';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [recommendedArticles, setRecommendedArticles] = React.useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = React.useState(false);
  const [nearbyHospitals, setNearbyHospitals] = React.useState<Hospital[]>(REAL_HOSPITALS);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [activeSpecialty, setActiveSpecialty] = React.useState<string>('All');
  const [bookingStatus, setBookingStatus] = React.useState<Record<string, 'idle' | 'booking' | 'success'>>({});

  const specialties = ['All', 'ENT', 'Cardiology', 'General', 'Pediatrics', 'Oncology'];

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
  };

  const executeSearch = async () => {
    if (searchQuery.length < 2) return;
    
    setIsSearching(true);
    setIsArticlesLoading(true);
    
    try {
      // 1. Get Articles
      getRecommendedArticles(searchQuery + " healthcare and treatment").then(articles => {
        setRecommendedArticles(articles);
        setIsArticlesLoading(false);
      });

      // 2. AI Hospital Search
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
        
        // 3. Trigger Airi Chat
        window.dispatchEvent(new CustomEvent('airi-message', {
          detail: { 
            content: `**Airi AI:** I've analyzed **${aiData.name}**. ${aiData.airi_insight} \n\nThe facility specializes in ${aiData.specialists}.`,
            role: 'assistant'
          }
        }));
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
    } catch (err) {
      console.error("GPS Search error:", err);
      setLocationError("Failed to find nearby hospitals. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBooking = async (hospitalId: string, hospitalName: string) => {
    setBookingStatus(prev => ({ ...prev, [hospitalId]: 'booking' }));
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1800));
    
    setBookingStatus(prev => ({ ...prev, [hospitalId]: 'success' }));
    toast.success(`Appointment Secured at ${hospitalName}!`);
    
    // Reset after 5 seconds
    setTimeout(() => {
      setBookingStatus(prev => ({ ...prev, [hospitalId]: 'idle' }));
    }, 5000);
  };

  const filteredHospitals = nearbyHospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.badges.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = activeSpecialty === 'All' || 
      h.badges.some(b => b.toLowerCase().includes(activeSpecialty.toLowerCase()));
      
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6 pb-24">
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-emerald-50 font-bold tracking-widest uppercase text-sm"
            >
              Locating Nearby Hospitals...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Section */}
      <GlassCard className="bg-red-500/10 border-red-500/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500 flex items-center justify-center neon-glow-red shrink-0">
              <AlertCircle className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-white text-base sm:text-lg font-bold">Emergency SOS</h3>
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Immediate Help Required?</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = 'tel:102'}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            <Phone className="w-4 h-4" /> Call 102
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={handleGPSSearch}
            className="py-3 rounded-xl glass border-white/10 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Navigation className="w-4 h-4 text-emerald-400" /> Find Nearest ICU
          </button>
          <button 
            className="py-3 rounded-xl glass border-white/10 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <MapPin className="w-4 h-4 text-emerald-400" /> Nearby Pharmacies
          </button>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-50">Healthcare & Consultations</h2>
          <button 
            onClick={handleGPSSearch}
            className="text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
          >
            <Navigation className="w-3 h-3" /> Use GPS
          </button>
        </div>
        <p className="text-xs sm:text-sm text-emerald-100/60 font-medium">Direct access to Indias top hospitals and real-time appointment booking</p>
      </div>

      {locationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          {locationError}
        </div>
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={handleSearch}
          onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
          placeholder="Search hospital, city, or specialty..." 
          className="w-full h-14 pl-12 pr-16 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
        <button 
          onClick={executeSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Specialist Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {specialties.map(specialty => (
          <button
            key={specialty}
            onClick={() => setActiveSpecialty(specialty)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              activeSpecialty === specialty 
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                : "bg-emerald-950/50 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
            )}
          >
            {specialty}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredHospitals.map((hospital, idx) => (
          <GlassCard key={hospital.id} delay={idx * 0.1} className="border border-white/10 shadow-2xl">
            {hospital.bestFit && (
              <div className="absolute top-0 right-0 bg-lime-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-2xl uppercase tracking-wider neon-glow-lime">
                AI Recommended
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40 h-48 md:h-40 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/10 shadow-lg">
                <img 
                  src={hospital.imageUrl} 
                  alt={hospital.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-1 pr-16">
                    <h3 className="text-lg font-bold text-emerald-50">{hospital.name}</h3>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      hospital.availabilityStatus === 'Available' ? "bg-emerald-500/20 text-emerald-400" :
                      hospital.availabilityStatus === 'Busy' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {hospital.availabilityStatus}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-100/60">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {hospital.location}</span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" /> 
                      <span className="font-bold text-emerald-400">{hospital.bedAvailability}</span> Beds Real-Time
                    </span>
                    <span className="font-bold text-emerald-400">{hospital.costRange}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Fee: {hospital.consultationFee}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Next Slot</span>
                      </div>
                      <p className="text-xs text-emerald-50 font-bold">{hospital.nextSlot}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Wait Time</span>
                      </div>
                      <p className="text-xs text-emerald-50 font-bold">~15-30 mins</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hospital.badges.map(badge => (
                      <span key={badge} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        {badge}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-100/80 leading-relaxed italic">
                        {hospital.reviewSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleBooking(hospital.id, hospital.name)}
                      disabled={bookingStatus[hospital.id] === 'booking' || bookingStatus[hospital.id] === 'success'}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2",
                        bookingStatus[hospital.id] === 'success' ? "bg-emerald-500 text-white" :
                        bookingStatus[hospital.id] === 'booking' ? "bg-amber-500 text-white animate-pulse" :
                        "bg-lime-500 text-white neon-glow-lime hover:scale-[1.02]"
                      )}
                    >
                      {bookingStatus[hospital.id] === 'success' ? (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Secured
                        </>
                      ) : bookingStatus[hospital.id] === 'booking' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Securing Slot...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" /> Book at {hospital.name}
                        </>
                      )}
                    </button>
                    <a 
                      href={`https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 text-emerald-100/60" />
                    </a>
                  </div>
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
            title={`Medical Insights for ${searchQuery}`}
          />
        </div>
      )}
    </div>
  );
};
