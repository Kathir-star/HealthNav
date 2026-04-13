import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Pill, 
  Stethoscope, 
  Heart, 
  Shield, 
  MessageSquare, 
  ShieldCheck,
  Leaf,
  Settings as SettingsIcon,
  Activity,
  User,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export type Tab = 'dashboard' | 'medicine' | 'care' | 'donor' | 'insurance' | 'healthy' | 'vitals' | 'settings' | 'profile';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenFeedback: () => void;
  onOpenTerms: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenFeedback, 
  onOpenTerms,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'medicine', label: 'Meds', icon: Pill },
    { id: 'care', label: 'Care', icon: Stethoscope },
    { id: 'donor', label: 'Donor', icon: Heart },
    { id: 'vitals', label: 'Vitals', icon: Activity },
  ];

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-72 lg:w-64 glass border-r border-white/10 z-[110] flex flex-col py-8 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center neon-glow-teal shrink-0">
              <Heart className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-emerald-50 tracking-tight">HealthNav</h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-emerald-100/60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] neon-glow-teal" 
                  : "text-emerald-100/60 hover:bg-white/10"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
              <item.icon className={cn(
                "w-6 h-6 transition-transform group-hover:scale-110 relative z-10",
                activeTab === item.id ? "text-white" : "text-emerald-400"
              )} />
              <span className="font-bold text-sm relative z-10">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto space-y-2">
          <button 
            onClick={() => handleTabClick('settings')}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden",
              activeTab === 'settings' 
                ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] neon-glow-teal" 
                : "text-emerald-100/60 hover:bg-white/10"
            )}
          >
            <SettingsIcon className={cn(
              "w-6 h-6 transition-transform group-hover:scale-110 relative z-10",
              activeTab === 'settings' ? "text-white" : "text-emerald-400"
            )} />
            <span className="font-bold text-sm relative z-10">Settings</span>
          </button>
          <button 
            onClick={() => { onOpenFeedback(); if (window.innerWidth < 1024) onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-emerald-100/60 hover:bg-white/10 transition-all group"
          >
            <MessageSquare className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Feedback</span>
          </button>
          <button 
            onClick={() => { onOpenTerms(); if (window.innerWidth < 1024) onClose(); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-emerald-100/60 hover:bg-white/10 transition-all group"
          >
            <ShieldCheck className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Privacy</span>
          </button>
        </div>
      </aside>
    </>
  );
};
