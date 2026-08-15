import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Sparkles,
  Calendar,
  Folder,
  Pill, 
  Stethoscope, 
  Heart, 
  ShieldCheck,
  Activity,
  User,
  Settings as SettingsIcon,
  MessageSquare, 
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HealthNavLogo } from './HealthNavLogo';

export type Tab = 
  | 'dashboard' 
  | 'ai_navigator'
  | 'timeline'
  | 'records'
  | 'medicine' 
  | 'care' 
  | 'donor' 
  | 'insurance' 
  | 'healthy' 
  | 'vitals' 
  | 'privacy'
  | 'settings' 
  | 'profile';

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
  const primaryNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'ai_navigator', label: 'AI Navigator', icon: Sparkles, badge: 'AI' },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'records', label: 'Records', icon: Folder },
    { id: 'care', label: 'Find Care', icon: Stethoscope },
    { id: 'medicine', label: 'Medicines', icon: Pill },
    { id: 'vitals', label: 'Vitals & Stats', icon: Activity },
    { id: 'donor', label: 'Blood Donor', icon: Heart },
    { id: 'privacy', label: 'Privacy Center', icon: ShieldCheck },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Health Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
            className="fixed inset-0 bg-emerald-950/70 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-72 lg:w-64 glass border-r border-white/10 z-[110] flex flex-col py-6 transition-transform duration-300 lg:translate-x-0 bg-emerald-950/90",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="px-6 mb-6 flex items-center justify-between">
          <HealthNavLogo 
            size="md" 
            subtitleText="Your Health. Clearly Navigated." 
            onClick={() => handleTabClick('dashboard')}
          />
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-emerald-100/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-1 text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider">
            Clinical Navigation
          </div>
          {primaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as Tab)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-2xl transition-all group relative overflow-hidden text-left",
                activeTab === item.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                  : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  activeTab === item.id ? "text-white" : "text-emerald-400"
                )} />
                <span className="font-semibold text-xs">{item.label}</span>
              </div>

              {item.badge && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider",
                  activeTab === item.id ? "bg-white text-emerald-950" : "bg-emerald-400/20 text-emerald-300"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider">
            Account & System
          </div>
          {secondaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group text-left",
                activeTab === item.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                  : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-emerald-400"
              )} />
              <span className="font-semibold text-xs">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="px-3 pt-3 border-t border-white/10 space-y-1">
          <button 
            onClick={() => { onOpenFeedback(); if (window.innerWidth < 1024) onClose(); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-emerald-100/60 hover:bg-white/5 hover:text-white transition-all text-xs font-semibold"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Send Feedback</span>
          </button>
          <button 
            onClick={() => { onOpenTerms(); if (window.innerWidth < 1024) onClose(); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-emerald-100/60 hover:bg-white/5 hover:text-white transition-all text-xs font-semibold"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Privacy & Terms</span>
          </button>
        </div>
      </aside>
    </>
  );
};
