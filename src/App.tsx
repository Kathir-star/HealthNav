import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar, Tab } from './components/Sidebar';
import { Activity, Heart, Menu, ShieldCheck } from 'lucide-react';
import { DashboardTab } from './components/DashboardTab';
import { AINavigatorTab } from './components/AINavigatorTab';
import { TimelineTab } from './components/TimelineTab';
import { RecordsTab } from './components/RecordsTab';
import { PrivacyCenterTab } from './components/PrivacyCenterTab';
import { MedicineTab } from './components/MedicineTab';
import { CareTab } from './components/CareTab';
import { DonorTab } from './components/DonorTab';
import { InsuranceTab } from './components/InsuranceTab';
import { HealthyLivingTab } from './components/HealthyLivingTab';
import { SettingsTab } from './components/SettingsTab';
import { VitalsTab } from './components/VitalsTab';
import { ProfileTab } from './components/ProfileTab';
import { CameraMode } from './components/CameraMode';
import { ScanFAB } from './components/ScanFAB';
import { AiriAssistant } from './components/AiriAssistant';
import { FeedbackModal } from './components/FeedbackModal';
import { TermsModal } from './components/TermsModal';
import { OnboardingSurvey } from './components/OnboardingSurvey';
import { SensorDiagnosis } from './components/SensorDiagnosis';
import { HealthNavLogo } from './components/HealthNavLogo';
import { LoadingScreen } from './components/LoadingScreen';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { cn } from './lib/utils';

import { authService, DEFAULT_GUEST_USER } from './services/authService';
import { databaseService } from './services/databaseService';
import { User as SupabaseUser } from '@supabase/supabase-js';

const AppContent = ({ user }: { user: SupabaseUser | null }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isTermsOpen, setIsTermsOpen] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [airiMessage, setAiriMessage] = React.useState<string | undefined>("Welcome to HealthNav! I'm your AI health guide.");
  const [airiState, setAiriState] = React.useState<'calm' | 'attentive' | 'urgent'>('calm');
  const [isOnboardingNeeded, setIsOnboardingNeeded] = React.useState(false);
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);
  const [detectedSensors, setDetectedSensors] = React.useState<string[]>(['accelerometer', 'gyroscope']);
  const [language, setLanguage] = React.useState(localStorage.getItem('healthnav_lang') || 'en');

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('healthnav_lang', lang);
    document.body.style.opacity = '0.5';
    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 300);
  };
  
  // Pull to Refresh Logic
  const [startY, setStartY] = React.useState(0);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refreshThreshold = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].pageY;
      const dist = currentY - startY;
      if (dist > 0) {
        setPullDistance(Math.min(dist / 2, refreshThreshold));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > refreshThreshold * 0.8) {
      executeRefresh();
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  const executeRefresh = () => {
    setIsRefreshing(true);
    setPullDistance(refreshThreshold / 2);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  React.useEffect(() => {
    if (user && user.id !== DEFAULT_GUEST_USER.id) {
      const checkOnboarding = async () => {
        try {
          const profile = await databaseService.getProfile(user.id);
          if (profile) {
            setIsOnboardingNeeded(!profile.onboarding_completed);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      checkOnboarding();
    }
  }, [user]);

  const handleSetupDashboard = () => {
    setAiriState('attentive');
    setAiriMessage("Let's customize your health dashboard!");
    setTimeout(() => {
      setAiriState('calm');
      setAiriMessage(undefined);
    }, 3000);
  };

  const handleIdentifyMedicine = (medicine: string) => {
    setIsCameraOpen(false);
    setActiveTab('medicine');
    setAiriState('calm');
    setAiriMessage(`I've found details for ${medicine}. Let's check the verified safety interactions!`);
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col lg:flex-row overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 z-[1000] flex items-center justify-center transition-all duration-200",
          isRefreshing ? "top-8" : pullDistance > 0 ? `top-[${pullDistance - 50}px]` : "-top-16"
        )}
        style={{ 
          top: isRefreshing ? '32px' : pullDistance > 0 ? `${pullDistance - 50}px` : '-64px',
          transform: `translateX(-50%) rotate(${pullDistance * 2}deg)`
        }}
      >
        <div className={cn(
          "w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl neon-glow-teal",
          isRefreshing && "animate-spin"
        )}>
          <Activity className="text-emerald-950 w-6 h-6 stroke-[3]" />
        </div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-white/10 z-[80] flex items-center justify-between px-4 sm:px-6 bg-emerald-950/90 backdrop-blur-md">
        <HealthNavLogo size="sm" showSubtitle={false} onClick={() => setActiveTab('dashboard')} />
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 text-emerald-100/60 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Subtle Healthcare & Navigation Geometry Pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.06] overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="app-content-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 4" />
              <circle cx="24" cy="24" r="1.5" fill="#10b981" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#app-content-grid)" />
        </svg>
      </div>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-950 via-emerald-950/98 to-emerald-900/95 pointer-events-none" />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
      />

      <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-10 pt-20 lg:pt-10 pb-24 lg:pb-10 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  onSetupClick={handleSetupDashboard} 
                  onSelectTab={(tab) => setActiveTab(tab as Tab)}
                />
              )}
              {activeTab === 'ai_navigator' && (
                <AINavigatorTab 
                  onSelectTab={(tab) => setActiveTab(tab as Tab)}
                />
              )}
              {activeTab === 'timeline' && <TimelineTab />}
              {activeTab === 'records' && (
                <RecordsTab 
                  onAskAI={(prompt) => {
                    setActiveTab('ai_navigator');
                  }}
                />
              )}
              {activeTab === 'privacy' && <PrivacyCenterTab />}
              {activeTab === 'medicine' && <MedicineTab />}
              {activeTab === 'care' && <CareTab />}
              {activeTab === 'donor' && <DonorTab />}
              {activeTab === 'insurance' && <InsuranceTab />}
              {activeTab === 'vitals' && <VitalsTab />}
              {activeTab === 'healthy' && <HealthyLivingTab />}
              {activeTab === 'profile' && <ProfileTab detectedSensors={detectedSensors} />}
              {activeTab === 'settings' && (
                <SettingsTab 
                  onOpenProfile={() => setActiveTab('profile')} 
                  detectedSensors={detectedSensors}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 flex flex-col gap-4 z-[200]">
        <ScanFAB onClick={() => setIsCameraOpen(true)} />
        <AiriAssistant 
          state={airiState} 
          message={airiMessage} 
        />
      </div>

      {isDiagnosing && (
        <SensorDiagnosis onComplete={(sensors) => {
          setDetectedSensors(sensors);
          setIsDiagnosing(false);
        }} />
      )}

      {isOnboardingNeeded && user && !isDiagnosing && (
        <OnboardingSurvey onComplete={() => setIsOnboardingNeeded(false)} />
      )}

      <AnimatePresence>
        {isCameraOpen && (
          <CameraMode 
            onClose={() => setIsCameraOpen(false)} 
            onIdentify={handleIdentifyMedicine}
          />
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
      
      <TermsModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  const [user, setUser] = React.useState<SupabaseUser | null>(DEFAULT_GUEST_USER as any);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [initError, setInitError] = React.useState<string | null>(null);

  const initializeApp = React.useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser || (DEFAULT_GUEST_USER as any));
      setIsInitializing(false);
    } catch (err: any) {
      console.error('HealthNav initialization error:', err);
      // If error occurs, capture message so user has real retry action
      setInitError(err?.message || 'Unable to establish secure health navigation connection.');
      setIsInitializing(false);
    }
  }, []);

  React.useEffect(() => {
    initializeApp();
    const { data: { subscription } } = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser || (DEFAULT_GUEST_USER as any));
    });
    return () => subscription?.unsubscribe?.();
  }, [initializeApp]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      
      {/* Intro & Real Initialization Loading Overlay */}
      <AnimatePresence mode="wait">
        {isInitializing ? (
          <LoadingScreen key="loading" />
        ) : initError ? (
          <LoadingScreen 
            key="error" 
            error={initError} 
            onRetry={initializeApp} 
          />
        ) : null}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<AppContent user={user} />} />
        <Route path="/dashboard" element={<AppContent user={user} />} />
        <Route path="/app" element={<AppContent user={user} />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
