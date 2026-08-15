import React from 'react';
import { ShieldCheck, Heart, Lock, Sparkles, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, DEFAULT_GUEST_USER } from '../../services/authService';
import { HealthNavLogo } from '../HealthNavLogo';
import { toast } from 'sonner';

export const AuthSelection: React.FC = () => {
  const navigate = useNavigate();
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

  const handleDemoAccess = () => {
    toast.success("Welcome to HealthNav Demo Mode!");
    navigate('/app');
  };

  return (
    <div className="space-y-7">
      {/* Brand & Emblem */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <HealthNavLogo size="lg" showText={false} />

        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-center gap-0.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
              Health
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Nav
            </span>
          </h2>
          <p className="text-emerald-300/90 font-semibold text-xs tracking-wider uppercase mt-1">
            Your Health. Clearly Navigated.
          </p>
          <p className="text-emerald-100/70 mt-2 text-xs md:text-sm font-normal leading-relaxed max-w-sm mx-auto">
            Understand your health records, organize your clinical timeline, and get AI-assisted healthcare navigation.
          </p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-3 pt-1">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        <button 
          id="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-13 rounded-2xl bg-white text-emerald-950 font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/40 hover:bg-emerald-50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
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

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-emerald-950 px-2 text-[10px] tracking-wider text-emerald-200/50">or explore preview</span>
          </div>
        </div>

        <button 
          id="demo-access-btn"
          onClick={handleDemoAccess}
          className="w-full h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Launch CIT Hackfest Demo Experience</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        <p className="text-[11px] text-center text-emerald-100/50 font-normal px-2 pt-1">
          By signing in, you access private health records protected with encryption. No clinical claims are made without medical evaluation.
        </p>
      </div>

      {/* Trust & Safety Highlights */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
          <Lock className="w-4 h-4 text-emerald-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/80">Encrypted Data</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
          <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/80">Privacy Controls</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
          <Sparkles className="w-4 h-4 text-lime-400 mx-auto" />
          <p className="text-[10px] font-bold text-emerald-100/80">AI Navigator</p>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center pt-1">
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


