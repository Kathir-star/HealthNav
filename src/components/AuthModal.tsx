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
      } else if (provider === 'apple') {
        await authService.signInWithApple();
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  className="w-full py-3.5 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05 1.61-3.22 1.61-1.14 0-1.54-.71-2.87-.71-1.33 0-1.81.69-2.87.71-1.11.02-2.11-.6-3.13-1.59C2.9 18.33 1.5 14.91 1.5 11.97c0-3.08 1.93-4.73 3.8-4.73 1.01 0 1.9.61 2.51.61.6 0 1.67-.67 2.85-.67 1.5 0 2.62.77 3.34 1.83-3.08 1.83-2.58 5.8 0 6.94-.65 1.61-1.5 3.21-2.95 4.33zM12.03 7.25c-.02-2.13 1.76-3.95 3.85-4.04.22 2.44-2.29 4.32-3.85 4.04z" />
                  </svg>
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
