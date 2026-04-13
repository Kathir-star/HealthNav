import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.signIn(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Link to="/auth" className="absolute left-0 top-0 p-2 text-emerald-100/40 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-16 h-16 rounded-3xl bg-emerald-500 mx-auto mb-4 flex items-center justify-center neon-glow-teal shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-emerald-50">Welcome Back</h2>
        <p className="text-emerald-100/60 mt-2 font-medium">Sign in to your HelpNav account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            type={showPassword ? "text" : "password"} 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" 
            className="w-full h-14 pl-12 pr-12 rounded-2xl glass border-emerald-500/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-emerald-400 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex justify-end px-2">
          <button 
            type="button"
            onClick={handleForgotPassword}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all mt-6 disabled:opacity-50 disabled:scale-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-4">
        <p className="text-sm text-emerald-100/60">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="font-bold text-emerald-400 hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};
