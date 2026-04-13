import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ArrowRight, Sparkles, Heart, Activity, Shield } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';
import { PregnancyStatus } from '../types';

interface OnboardingSurveyProps {
  onComplete: () => void;
}

export const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female' | 'other'>('male');
  const [medicalConditions, setMedicalConditions] = React.useState('');
  const [allergies, setAllergies] = React.useState('');
  const [pregnancyStatus, setPregnancyStatus] = React.useState<PregnancyStatus>('not_pregnant');
  const [loading, setLoading] = React.useState(false);

  const handleNext = async () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2 && age && weight) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          await databaseService.upsertProfile(user.id, {
            display_name: name,
            email: user.email,
            onboarding_completed: true,
            terms_accepted: true,
            profile_data: {
              age: parseInt(age),
              weight: parseFloat(weight),
              gender,
            },
            health_data: {
              conditions: medicalConditions.split(',').map(s => s.trim()).filter(Boolean),
              allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
            },
            pregnancy_data: {
              status: pregnancyStatus,
            },
            history_data: {
              medicines: [],
              scans: [],
            },
            emergency_data: {
              contacts: [],
            }
          });
        }
        onComplete();
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-emerald-950 flex items-center justify-center p-6">
      <div className="fixed inset-0 -z-10">
        <img 
          src="https://images.unsplash.com/photo-1518173946687-a4c8a9b746f5?q=80&w=1920&auto=format&fit=crop" 
          alt="Nature" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-950/80 to-black/90" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8 border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 mb-6 flex items-center justify-center neon-glow-teal">
                <User className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to HealthNav</h2>
              <p className="text-emerald-100/60 mb-8 font-medium">Let's start with your name. How should we call you?</p>
              
              <div className="relative mb-8">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name" 
                  className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
                  autoFocus
                />
              </div>

              <button 
                onClick={handleNext}
                disabled={!name.trim()}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8 border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 mb-6 flex items-center justify-center neon-glow-teal">
                <Activity className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Basic Vitals</h2>
              <p className="text-emerald-100/60 mb-8 font-medium">This helps us personalize your health insights.</p>
              
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Age</label>
                    <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Years" 
                      className="w-full h-12 px-4 rounded-xl glass border-emerald-500/20 outline-none font-medium text-emerald-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="kg" 
                      className="w-full h-12 px-4 rounded-xl glass border-emerald-500/20 outline-none font-medium text-emerald-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2 rounded-xl border transition-all capitalize text-sm font-bold ${
                          gender === g 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'glass border-white/10 text-emerald-100/60'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={!age || !weight}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </GlassCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8 border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 mb-6 flex items-center justify-center neon-glow-teal">
                <Shield className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Medical History</h2>
              <p className="text-emerald-100/60 mb-8 font-medium">List any conditions or allergies (comma separated).</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Medical Conditions</label>
                  <textarea 
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="e.g. Diabetes, Hypertension" 
                    className="w-full h-24 p-4 rounded-xl glass border-emerald-500/20 outline-none font-medium text-emerald-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Allergies</label>
                  <textarea 
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts" 
                    className="w-full h-24 p-4 rounded-xl glass border-emerald-500/20 outline-none font-medium text-emerald-50 resize-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </GlassCard>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8 border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 mb-6 flex items-center justify-center neon-glow-teal">
                <Heart className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Pregnancy Status</h2>
              <p className="text-emerald-100/60 mb-8 font-medium">This is critical for medication safety analysis.</p>
              
              <div className="space-y-3 mb-8">
                {(['not_pregnant', 'planning', 'pregnant', 'post_pregnancy'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setPregnancyStatus(status)}
                    className={`w-full py-3 px-4 rounded-xl border transition-all text-left font-bold flex items-center justify-between ${
                      pregnancyStatus === status 
                        ? 'bg-emerald-500 border-emerald-400 text-white' 
                        : 'glass border-white/10 text-emerald-100/60'
                    }`}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    {pregnancyStatus === status && <Sparkles className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleNext}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                {loading ? "Setting up..." : "Complete Setup"} <ArrowRight className="w-5 h-5" />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
