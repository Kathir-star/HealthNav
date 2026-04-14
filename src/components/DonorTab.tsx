import React from 'react';
import { Search, Heart, MapPin, Clock, ShieldCheck, Phone, Users, UserPlus, ExternalLink, Activity, Droplets, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { cn } from '../utils/utils';

interface DonorItem {
  id: string;
  type: string;
  role: 'donor' | 'needer';
  distance: string;
  availability: string;
  eta: string;
  verified: boolean;
  contact?: string;
}

const MOCK_DONORS: DonorItem[] = [
  { id: '1', type: 'O+ Blood', role: 'donor', distance: '1.2 km', availability: '4 Units Available', eta: '15 mins', verified: true, contact: 'https://www.eraktkosh.in' },
  { id: '2', type: 'Kidney', role: 'needer', distance: '5.4 km', availability: 'Urgent Requirement', eta: 'Critical', verified: true, contact: 'https://www.notto.mohfw.gov.in' },
  { id: '3', type: 'AB- Blood', role: 'donor', distance: '3.8 km', availability: '2 Units Available', eta: '45 mins', verified: true, contact: 'https://www.eraktkosh.in' },
  { id: '4', type: 'Liver', role: 'needer', distance: '12 km', availability: 'Waiting List', eta: 'Stable', verified: true, contact: 'https://www.notto.mohfw.gov.in' },
];

export const DonorTab: React.FC = () => {
  const [view, setView] = React.useState<'stock' | 'requests'>('stock');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 2) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 1500);
    }
  };

  const filteredItems = MOCK_DONORS.filter(d => 
    (view === 'stock' ? d.role === 'donor' : d.role === 'needer') &&
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const officialLinks = [
    { name: 'e-RaktKosh (Blood Stock)', url: 'https://www.eraktkosh.in/BLDAHIMS/bloodbank/stockAvailability.cnt', icon: Droplets },
    { name: 'NOTTO (Organ Registry)', url: 'https://www.notto.mohfw.gov.in/', icon: Activity },
    { name: 'Indian Red Cross', url: 'https://indianredcross.org/ircs/program/BloodBank', icon: ShieldCheck },
    { name: 'BloodDonor.in', url: 'https://blooddonor.in', icon: Heart },
    { name: 'UMANG (e-RaktKosh)', url: 'https://web.umang.gov.in', icon: ExternalLink },
  ];

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
                <Heart className="w-10 h-10 text-red-400 animate-pulse" />
              </div>
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-emerald-50 font-bold tracking-widest uppercase text-sm"
            >
              Scanning Donor Network...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-50">Blood & Organ Network</h2>
        <p className="text-sm text-emerald-100/60 font-medium">Real-time matching and official government registry access</p>
      </div>

      {/* Official Links Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {officialLinks.map((link) => (
          <a 
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl glass border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <link.icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-widest leading-tight">{link.name}</span>
          </a>
        ))}
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search blood type or organ..." 
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
      </div>

      {/* View Switcher */}
      <div className="flex p-1 glass rounded-2xl border border-white/10">
        <button
          onClick={() => setView('stock')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
            view === 'stock' 
              ? "bg-emerald-500 text-white shadow-lg neon-glow-teal" 
              : "text-emerald-100/60 hover:bg-white/10"
          )}
        >
          <Droplets className="w-4 h-4" />
          Available Stock
        </button>
        <button
          onClick={() => setView('requests')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
            view === 'requests' 
              ? "bg-lime-500 text-white shadow-lg neon-glow-lime" 
              : "text-emerald-100/60 hover:bg-white/10"
          )}
        >
          <UserPlus className="w-4 h-4" />
          Urgent Requests
        </button>
      </div>

      <div className="grid gap-4">
        {filteredItems.map((item, idx) => (
          <GlassCard 
            key={item.id} 
            delay={idx * 0.1}
            className={cn(
              "border-l-4",
              item.role === 'donor' ? "border-l-emerald-500" : "border-l-lime-500"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border",
                  item.role === 'donor' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-lime-500/10 border-lime-500/20"
                )}>
                  <Heart className={cn("w-6 h-6", item.role === 'donor' ? "text-emerald-400" : "text-lime-400")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-emerald-50">{item.type}</h3>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      item.role === 'donor' ? "bg-emerald-500/20 text-emerald-400" : "bg-lime-500/20 text-lime-400"
                    )}>
                      {item.role === 'donor' ? 'In Stock' : 'Needed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-100/40 uppercase tracking-wider">
                    {item.verified && <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3 h-3" /> Verified</span>}
                    <span>• {item.distance} away</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-sm font-bold", item.role === 'donor' ? "text-emerald-400" : "text-lime-400")}>
                  {item.availability}
                </div>
                <div className="text-[10px] font-medium text-emerald-100/40">ETA: {item.eta}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <a 
                href={item.contact}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2",
                  item.role === 'donor' ? "bg-emerald-500 shadow-emerald-500/20 neon-glow-teal" : "bg-lime-500 shadow-lime-500/20 neon-glow-lime"
                )}
              >
                <ExternalLink className="w-4 h-4" />
                {item.role === 'donor' ? 'Visit Blood Bank' : 'Visit Registry'}
              </a>
              <button className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <Phone className="w-5 h-5 text-emerald-100/60" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
      
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-white/10 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-50 mb-1">Official Registry Integration</h4>
          <p className="text-[10px] text-emerald-100/70 leading-relaxed">
            We sync with e-RaktKosh and NOTTO for real-time availability. Always verify with the official portal before travel.
          </p>
        </div>
      </div>
    </div>
  );
};
