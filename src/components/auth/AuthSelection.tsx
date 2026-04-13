import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

export const AuthSelection: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500 mx-auto mb-6 flex items-center justify-center neon-glow-teal shadow-xl shadow-emerald-500/20">
          <ShieldCheck className="text-white w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-emerald-50 tracking-tight">Welcome to HelpNav</h2>
        <p className="text-emerald-100/60 mt-3 font-medium text-lg">Your intelligent health companion</p>
      </div>

      <div className="grid gap-4">
        <Link 
          to="/auth/signup"
          className="w-full py-4.5 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <UserPlus className="w-6 h-6" />
          Create Account
        </Link>
        <Link 
          to="/auth/login"
          className="w-full py-4.5 rounded-2xl glass border-emerald-500/20 text-emerald-50 font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
        >
          <LogIn className="w-6 h-6" />
          Sign In
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-emerald-100/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent backdrop-blur-md px-4 text-emerald-100/40 font-bold tracking-widest">Or continue with</span>
        </div>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-white text-emerald-950 font-bold text-lg flex items-center justify-center gap-3 shadow-sm hover:bg-emerald-50 transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            Google
          </>
        )}
      </button>
    </div>
  );
};
