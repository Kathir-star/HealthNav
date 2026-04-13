import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, UserPlus, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import { databaseService } from '../../services/databaseService';
import { toast } from 'sonner';

export const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const passwordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName);
      
      // If session exists, user is logged in (email confirmation disabled)
      if (data.session) {
        await databaseService.upsertProfile(data.user!.id, {
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
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        // Email confirmation is likely required
        toast.success('Sign up successful! Please check your email to confirm your account.', {
          duration: 6000
        });
        navigate('/auth/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(password);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Link to="/auth" className="absolute left-0 top-0 p-2 text-emerald-100/40 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-16 h-16 rounded-3xl bg-emerald-500 mx-auto mb-4 flex items-center justify-center neon-glow-teal shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-emerald-50">Join HelpNav</h2>
        <p className="text-emerald-100/60 mt-2 font-medium">Create your personalized health profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {password.length > 0 && (
          <div className="px-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Password Strength</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                strength <= 25 ? 'text-red-400' : strength <= 50 ? 'text-orange-400' : strength <= 75 ? 'text-yellow-400' : 'text-emerald-400'
              }`}>
                {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
              </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  strength <= 25 ? 'bg-red-500' : strength <= 50 ? 'bg-orange-500' : strength <= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${strength}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-2 pt-2">
          <input type="checkbox" required id="terms" className="rounded border-emerald-500/40 bg-white/10 text-emerald-500 focus:ring-emerald-500" />
          <label htmlFor="terms" className="text-[10px] font-medium text-emerald-100/60">
            I accept the <button type="button" className="text-emerald-400 font-bold hover:underline">Terms & Conditions</button> and <span className="text-emerald-400 font-bold">Privacy Policy</span>
          </label>
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
              <UserPlus className="w-5 h-5" />
              Create Account
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-4">
        <p className="text-sm text-emerald-100/60">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-bold text-emerald-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
