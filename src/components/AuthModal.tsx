import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Lock, LogIn, UserPlus, ShieldCheck, Loader2, Chrome, Apple } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = React.useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      if (provider === 'google') {
        await authService.signInWithGoogle();
      } else {
        console.warn('Apple login not fully implemented');
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const data = await authService.signUp(email, password, fullName);
        if (data.user) {
          // Create profile in Supabase
          await databaseService.upsertProfile(data.user.id, {
            display_name: fullName,
            email: email,
            terms_accepted: true,
            onboarding_completed: false,
            profile_data: { age: 0, weight: 0, gender: 'other' },
            health_data: { conditions: [], allergies: [] },
            pregnancy_data: { status: 'not_pregnant' },
            history_data: { medicines: [], scans: [] },
            emergency_data: { contacts: [] }
          });
        }
      } else {
        await authService.signIn(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md relative z-10"
          >
            <GlassCard className="p-8 shadow-2xl border-white/10">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-emerald-100/60" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 mx-auto mb-4 flex items-center justify-center neon-glow-teal shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-50">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Profile'}
                </h2>
                <p className="text-sm text-emerald-100/60 mt-2 font-medium">
                  {mode === 'signin' ? 'Sign in to access your health data' : 'Join HealthNav AI for personalized care'}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full py-3.5 rounded-2xl bg-white text-emerald-950 font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  <Chrome className="w-5 h-5 text-emerald-600" />
                  Continue with Google
                </button>
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  className="w-full py-3.5 rounded-2xl bg-emerald-950 text-white font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-emerald-900 transition-colors"
                >
                  <Apple className="w-5 h-5" />
                  Continue with Apple
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-100/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-emerald-950/20 backdrop-blur-md px-4 text-emerald-100/40 font-bold tracking-widest">Or with Email</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name" 
                      className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address" 
                    className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
                  />
                </div>

                <div className="flex items-center gap-2 px-2">
                  <input type="checkbox" required id="terms" className="rounded border-emerald-500/40 bg-white/10 text-emerald-500 focus:ring-emerald-500" />
                  <label htmlFor="terms" className="text-[10px] font-medium text-emerald-100/60">
                    I accept the <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-terms'))} className="text-emerald-400 font-bold hover:underline">Terms & Conditions</button> and <span className="text-emerald-400 font-bold">Privacy Policy</span>
                  </label>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-emerald-100/10 text-center">
                <p className="text-sm text-emerald-100/60">
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="ml-2 font-bold text-emerald-400 hover:underline"
                  >
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
