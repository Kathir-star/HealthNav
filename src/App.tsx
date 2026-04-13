import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar, Tab } from './components/Sidebar';
import { Sparkles, Shield, Activity, Heart, Loader2, X, Menu } from 'lucide-react';
import { MedicineTab } from './components/MedicineTab';
import { CareTab } from './components/CareTab';
import { DonorTab } from './components/DonorTab';
import { DashboardTab } from './components/DashboardTab';
import { InsuranceTab } from './components/InsuranceTab';
import { HealthyLivingTab } from './components/HealthyLivingTab';
import { SettingsTab } from './components/SettingsTab';
import { VitalsTab } from './components/VitalsTab';
import { ProfileTab } from './components/ProfileTab';
import { CameraMode } from './components/CameraMode';
import { AuthModal } from './components/AuthModal';
import { ScanFAB } from './components/ScanFAB';
import { AiriAssistant } from './components/AiriAssistant';
import { FeedbackModal } from './components/FeedbackModal';
import { TermsModal } from './components/TermsModal';
import { OnboardingSurvey } from './components/OnboardingSurvey';
import { SensorDiagnosis } from './components/SensorDiagnosis';
import { GlassCard } from './components/GlassCard';
import { LandingPage } from './pages/LandingPage';

import { authService } from './services/authService';
import { databaseService } from './services/databaseService';
import { User as SupabaseUser } from '@supabase/supabase-js';

const AppContent = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isTermsOpen, setIsTermsOpen] = React.useState(false);
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [airiMessage, setAiriMessage] = React.useState<string | undefined>("Welcome back! I'm Airi, your health guide.");
  const [airiState, setAiriState] = React.useState<'calm' | 'attentive' | 'urgent'>('calm');
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isOnboardingNeeded, setIsOnboardingNeeded] = React.useState(false);
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);
  const [detectedSensors, setDetectedSensors] = React.useState<string[]>([]);

  React.useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const profile = await databaseService.getProfile(currentUser.id);
          if (profile) {
            setIsOnboardingNeeded(!profile.onboarding_completed);
          } else {
            setIsOnboardingNeeded(true);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setIsOnboardingNeeded(false);
      }
      
      setIsAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSetupDashboard = () => {
    setAiriState('attentive');
    setAiriMessage("Let's customize your dashboard! What health goals should we focus on?");
    setTimeout(() => {
      setAiriMessage("Great! I'll prioritize hydration tips and medication reminders for you.");
      setTimeout(() => {
        setAiriState('calm');
        setAiriMessage(undefined);
      }, 3000);
    }, 3000);
  };

  const handleIdentifyMedicine = (medicine: string) => {
    setIsCameraOpen(false);
    setActiveTab('medicine');
    setAiriState('calm');
    setAiriMessage(`I've found details for ${medicine}. Let's check the best prices!`);
  };

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 z-[300] bg-emerald-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage 
          onGetStarted={() => setIsAuthOpen(true)} 
          onLogin={() => setIsAuthOpen(true)} 
        />
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row overflow-x-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-white/10 z-[80] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center neon-glow-teal">
            <Heart className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-emerald-50 tracking-tight">HealthNav</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 text-emerald-100/60"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Nature-Themed Background */}
      <div className="fixed inset-0 -z-10">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop" 
          alt="Forest Nature" 
          className="w-full h-full object-cover opacity-10"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-950/98 to-emerald-900/95 backdrop-blur-[1px]" />
      </div>

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardTab onSetupClick={handleSetupDashboard} />}
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
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
