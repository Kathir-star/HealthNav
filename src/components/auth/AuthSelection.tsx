import React from 'react';
import { ShieldCheck, Heart, Lock, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

export const AuthSelection: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      const msg = error.message || 'Unable to authenticate with Google. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Brand & Emblem */}
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center neon-glow-teal shadow-xl shadow-emerald-500/20">
            <Heart className="text-white w-8 h-8 fill-white/20" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-black text-emerald-50 tracking-tight">
            Your Health, One Connected Place
          </h2>
          <p className="text-emerald-100/60 mt-2 text-sm font-medium leading-relaxed max-w-sm mx-auto">
            Access your AI medical companion, prescription safety checks, and care navigation.
          </p>
        </div>
      </div>

      {/* Primary Action Card */}
      <div className="space-y-4 pt-2">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        <button 
          id="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-white text-emerald-950 font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/40 hover:bg-emerald-50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
              <span className="text-emerald-900 font-semibold">Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-emerald-100/40 font-medium px-2">
          By continuing, you agree to our Terms of Service and acknowledge our Healthcare Privacy Policy.
        </p>
      </div>

      {/* Security & Feature Badges */}
      <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <Lock className="w-4 h-4 text-emerald-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/70">Encrypted</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/70">Verified OAuth</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <Sparkles className="w-4 h-4 text-amber-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/70">Airi AI Ready</p>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center pt-2">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-100/60 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
      </div>
    </div>
  );
};

