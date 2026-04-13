import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, Tab } from './components/Sidebar';
import { Sparkles, Shield, Activity, Heart, Chrome, Apple, Mail, Loader2, X, Menu } from 'lucide-react';
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

import { authService } from './services/authService';
import { databaseService } from './services/databaseService';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function App() {
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
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);
  const [detectedSensors, setDetectedSensors] = React.useState<string[]>([]);

  React.useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if onboarding is completed
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

  React.useEffect(() => {
    const handleOpenTerms = () => setIsTermsOpen(true);
    window.addEventListener('open-terms', handleOpenTerms);
    return () => window.removeEventListener('open-terms', handleOpenTerms);
  }, []);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoggingIn(true);
    try {
      if (provider === 'google') {
        await authService.signInWithGoogle();
      } else {
        // Apple login not directly implemented in authService yet, but similar to Google
        console.warn('Apple login not fully implemented in this demo');
      }
    } catch (err: any) {
      console.error("Social login error:", err);
      setUser(null);
    } finally {
      setIsLoggingIn(false);
    }
  };

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
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setActiveTab('medicine');
      setAiriState('calm');
      setAiriMessage(`I've found details for ${medicine}. Let's check the best prices!`);
    }, 2000);
  };

  const [notification, setNotification] = React.useState<{ message: string; type: 'info' | 'success' } | null>(null);

  React.useEffect(() => {
    if (user && isAuthReady) {
      setTimeout(() => {
        setNotification({ 
          message: "New medical navigation updates available! Please enable notifications for real-time alerts.", 
          type: 'info' 
        });
      }, 5000);
    }
  }, [user, isAuthReady]);

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

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4"
          >
            <GlassCard className="p-4 bg-emerald-500 text-white shadow-2xl flex items-center justify-between gap-4 border-emerald-400/30">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold leading-tight">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

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

      {!isAuthReady ? (
        <div className="fixed inset-0 z-[300] bg-emerald-950 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
        </div>
      ) : !user ? (
        <div className="fixed inset-0 z-[250] bg-emerald-950 flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10">
            <img 
              src="https://images.unsplash.com/photo-1501854140801-50d01674aa3e?q=80&w=2560&auto=format&fit=crop" 
              alt="Nature Landscape" 
              className="w-full h-full object-cover opacity-30"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-emerald-950/60 to-emerald-950" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-lg relative"
          >
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10">
                <Sparkles className="text-white w-12 h-12" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl -z-10"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white tracking-tight">HealthNav AI</h1>
              <p className="text-xl text-emerald-100/70 font-medium leading-relaxed">
                Your advanced medical companion for real-time support, medication tracking, and expert health insights.
              </p>
            </div>

            <div className="grid gap-4 pt-8 w-full max-w-sm mx-auto">
              <button 
                onClick={() => handleSocialLogin('google')}
                disabled={isLoggingIn}
                className="w-full py-4 rounded-2xl bg-white text-emerald-950 font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-emerald-600" />}
                Continue with Google
              </button>
              
              <button 
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoggingIn}
                className="w-full py-4 rounded-2xl bg-emerald-900 text-white font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Apple className="w-5 h-5" />}
                Continue with Apple
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-emerald-950 px-4 text-emerald-100/40 font-bold tracking-widest">Or</span>
                </div>
              </div>

              <button 
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all active:scale-95"
              >
                <Mail className="w-5 h-5" />
                Sign in with Email
              </button>
            </div>

            <div className="pt-12 flex items-center justify-center gap-8 opacity-40">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-6 h-6 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Secure</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Activity className="w-6 h-6 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Real-time</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Heart className="text-white w-6 h-6" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Caring</span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            onOpenTerms={() => {
              setIsTermsOpen(true);
            }}
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
                    <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-emerald-50 font-bold tracking-widest uppercase text-sm"
                >
                  Searching Nearby Resources...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 flex flex-col gap-4 z-[200]">
            <ScanFAB onClick={() => setIsCameraOpen(true)} />
            <AiriAssistant 
              state={airiState} 
              message={airiMessage} 
            />
          </div>
        </>
      )}

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

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

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
}
