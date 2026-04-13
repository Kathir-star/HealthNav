import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Globe, 
  LogOut, 
  ChevronRight, 
  Camera,
  Activity,
  MapPin,
  Heart,
  Bluetooth,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Languages
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MOCK_PERMISSIONS } from '../constants';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';

interface SettingsTabProps {
  onOpenProfile: () => void;
  detectedSensors?: string[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onOpenProfile, detectedSensors = [] }) => {
  const [permissions, setPermissions] = React.useState(MOCK_PERMISSIONS);
  const [language, setLanguage] = React.useState('English (Pan-Asia)');
  const [isConnectingWearable, setIsConnectingWearable] = React.useState(false);
  const [connectedDevice, setConnectedDevice] = React.useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isHealthConnectSyncing, setIsHealthConnectSyncing] = React.useState(false);
  const [isHealthConnectLinked, setIsHealthConnectLinked] = React.useState(false);

  const filteredPermissions = permissions.filter(p => {
    if (p.id === 'activity') return detectedSensors.includes('accelerometer');
    if (p.id === 'location') return true; // Always show location for navigation
    if (p.id === 'sensors') return detectedSensors.includes('heartrate');
    if (p.id === 'devices') return detectedSensors.includes('bluetooth');
    return true;
  });

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const togglePermission = async (id: string, currentStatus: string) => {
    try {
      if (id === 'location') {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'denied') {
          alert("Please enable location permissions in your browser settings.");
          return;
        }
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      
      setPermissions(prev => prev.map(p => 
        p.id === id ? { ...p, status: p.status === 'granted' ? 'denied' : 'granted' } : p
      ));
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  const handleLanguageChange = () => {
    const langs = [
      'English (Pan-Asia)', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'తెలుగు (Telugu)', 'मराठी (Marathi)', 
      'தமிழ் (Tamil)', 'اردو (Urdu)', 'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)', 'മലയാളം (Malayalam)', 
      'ਪੰਜਾਬੀ (Punjabi)', 'ଓଡ଼ିଆ (Odia)', 'অসমীয়া (Assamese)', 'मैथिली (Maithili)', 'संस्कृतम् (Sanskrit)',
      '日本語 (Japanese)', '中文 (Chinese)', '한국어 (Korean)', 'Tiếng Việt (Vietnamese)', 'ไทย (Thai)',
      'Bahasa Indonesia', 'Bahasa Melayu', 'Tagalog (Filipino)', 'Burmese', 'Khmer', 'Lao', 'Sinhala',
      'Nepali', 'Dzongkha', 'Dhivehi'
    ];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const handleConnectWearable = () => {
    setIsConnectingWearable(true);
    setTimeout(() => {
      setIsConnectingWearable(false);
      setConnectedDevice('HealthBand Pro v2');
      alert("Connected to HealthBand Pro v2 via Bluetooth LE. Diagnosis complete.");
    }, 3000);
  };

  const handleHealthConnectSync = () => {
    setIsHealthConnectSyncing(true);
    setTimeout(() => {
      setIsHealthConnectSyncing(false);
      setIsHealthConnectLinked(true);
      alert("Health Connect synced successfully.");
    }, 2500);
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Your Profile", sub: "Manage your health data", action: onOpenProfile },
        { icon: Shield, label: "Privacy & Security", sub: "Data encryption settings", action: () => alert("Privacy settings are encrypted and locked.") },
      ]
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: Bell, 
          label: "Notifications", 
          sub: notificationsEnabled ? "On" : "Off", 
          action: () => setNotificationsEnabled(!notificationsEnabled),
          toggle: true,
          enabled: notificationsEnabled
        },
        { icon: Languages, label: "Language", sub: language, action: handleLanguageChange },
        { icon: Camera, label: "Camera Settings", sub: "OCR & Vision calibration", action: () => alert("Camera calibrated.") },
      ]
    }
  ];

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Activity': return Activity;
      case 'MapPin': return MapPin;
      case 'Heart': return Heart;
      case 'Bluetooth': return Bluetooth;
      case 'ShieldCheck': return ShieldCheck;
      default: return Shield;
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-50">Settings</h2>
        <p className="text-sm text-emerald-100/60 font-medium">Configure your HealthNav AI experience</p>
      </div>

      {/* Permissions Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-2">
          Detected Sensors & Permissions
        </h3>
        <div className="grid gap-3">
          {filteredPermissions.map((perm) => {
            const Icon = getIcon(perm.icon);
            return (
              <GlassCard key={perm.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      perm.status === 'granted' ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        perm.status === 'granted' ? "text-emerald-400" : "text-red-400"
                      )} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-50">{perm.name}</h4>
                      <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">{perm.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => togglePermission(perm.id, perm.status)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    {perm.status === 'granted' ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-emerald-100/20" />
                    )}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Wearable Connection */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-2">
          Wearable Devices
        </h3>
        <GlassCard className="p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                connectedDevice ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
              )}>
                <Bluetooth className={cn("w-5 h-5", isConnectingWearable && "animate-pulse")} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-50">
                  {connectedDevice || "No Device Connected"}
                </h4>
                <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">
                  {isConnectingWearable ? "Scanning for Bluetooth bands..." : connectedDevice ? "Synced & Updating Data" : "Connect your fitness band"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleConnectWearable}
              disabled={isConnectingWearable || !!connectedDevice}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                connectedDevice ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-500 text-white shadow-lg neon-glow-teal"
              )}
            >
              {isConnectingWearable ? "Connecting..." : connectedDevice ? "Connected" : "Connect"}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Health Connect Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-2">
          Health Services
        </h3>
        <GlassCard className="p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isHealthConnectLinked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
              )}>
                <Smartphone className={cn("w-5 h-5", isHealthConnectSyncing && "animate-spin")} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-50">Health Connect</h4>
                <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">
                  {isHealthConnectSyncing ? "Syncing medical data..." : isHealthConnectLinked ? "Linked & Updated" : "Sync with Android/iOS Health"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleHealthConnectSync}
              disabled={isHealthConnectSyncing || isHealthConnectLinked}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                isHealthConnectLinked ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-500 text-white shadow-lg neon-glow-teal"
              )}
            >
              {isHealthConnectSyncing ? "Syncing..." : isHealthConnectLinked ? "Linked" : "Sync Now"}
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] ml-2">
              {section.title}
            </h3>
            <div className="grid gap-3">
              {section.items.map((item) => (
                <GlassCard 
                  key={item.label} 
                  className="p-4 hover:bg-white/10 transition-colors cursor-pointer group"
                  onClick={item.action}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-50">{item.label}</h4>
                        <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">{item.sub}</p>
                      </div>
                    </div>
                    {item.toggle ? (
                      item.enabled ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-emerald-100/20" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-emerald-100/20 group-hover:text-emerald-400 transition-colors" />
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSignOut}
        className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
};
