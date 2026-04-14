import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Shield, Activity, Heart, ArrowRight, CheckCircle2, Star, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/utils';

export const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-white/10 rounded-2xl px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center neon-glow-teal">
              <Heart className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight">HealthNav</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-bold text-emerald-100/60 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth/login" className="text-sm font-bold text-emerald-100/60 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              to="/auth"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm neon-glow-teal hover:scale-105 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-emerald-100/60">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-emerald-950 pt-24 px-6 md:hidden"
          >
            <div className="space-y-6">
              {['Features', 'How it Works', 'Pricing', 'About'].map((item) => (
                <a key={item} href="#" className="block text-2xl font-black text-emerald-100/60 hover:text-white">
                  {item}
                </a>
              ))}
              <div className="pt-6 space-y-4">
                <Link to="/auth/login" className="block w-full py-4 rounded-2xl border border-white/10 text-white font-bold text-center">
                  Sign In
                </Link>
                <Link to="/auth" className="block w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal text-center">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Medical Companion
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] max-w-4xl mx-auto"
          >
            Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Navigated</span> by Intelligence.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-emerald-100/60 max-w-2xl mx-auto font-medium"
          >
            Experience the future of personal healthcare. Real-time monitoring, medication safety analysis, and expert guidance—all in one premium platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link 
              to="/auth"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg neon-glow-teal flex items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95"
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl glass border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all">
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Image / UI Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative mt-20 max-w-5xl mx-auto"
          >
            <div className="aspect-[16/9] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent" />
              
              {/* Floating UI Elements */}
              <div className="absolute top-1/4 -left-10 glass p-4 rounded-2xl border border-white/10 shadow-2xl hidden lg:block animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Activity className="text-emerald-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Heart Rate</p>
                    <p className="text-xl font-black text-white">72 BPM</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 -right-10 glass p-4 rounded-2xl border border-white/10 shadow-2xl hidden lg:block animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Shield className="text-teal-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">Safety Score</p>
                    <p className="text-xl font-black text-white">98%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-emerald-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Advanced Features</h2>
            <p className="text-emerald-100/60 max-w-2xl mx-auto font-medium">Everything you need to manage your health with confidence and precision.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Airi AI Assistant',
                desc: 'Real-time medical guidance powered by advanced LLMs. Ask anything, anytime.',
                icon: Sparkles,
                color: 'bg-emerald-500'
              },
              {
                title: 'Medication Safety',
                desc: 'Scan and analyze prescriptions for potential interactions and safety alerts.',
                icon: Shield,
                color: 'bg-teal-500'
              },
              {
                title: 'Vitals Tracking',
                desc: 'Monitor heart rate, steps, and energy levels with seamless device integration.',
                icon: Activity,
                color: 'bg-blue-500'
              },
              {
                title: 'Care Navigation',
                desc: 'Find nearby hospitals, pharmacies, and specialists with real-time availability.',
                icon: Heart,
                color: 'bg-rose-500'
              },
              {
                title: 'Secure Records',
                desc: 'Your medical history, encrypted and accessible only to you and your doctors.',
                icon: Shield,
                color: 'bg-amber-500'
              },
              {
                title: 'Smart Reminders',
                desc: 'Never miss a dose with intelligent, context-aware medication reminders.',
                icon: Activity,
                color: 'bg-indigo-500'
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-8 rounded-[32px] border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform", feature.color)}>
                  <feature.icon className="text-white w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-emerald-100/60 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto glass rounded-[48px] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Trusted by Healthcare Professionals.</h2>
              <div className="space-y-4">
                {[
                  'HIPAA Compliant Data Storage',
                  'Verified Medical Databases',
                  'Real-time Doctor Collaboration',
                  '24/7 AI Emergency Support'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                    <span className="font-bold text-emerald-50">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/auth" className="px-8 py-4 rounded-2xl bg-white text-emerald-950 font-bold hover:scale-105 transition-all">
                Join the Network
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="glass p-6 rounded-3xl border border-white/10">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-xs font-bold text-white mb-2">"Life-changing app for my chronic condition."</p>
                  <p className="text-[10px] text-emerald-100/40 font-bold uppercase tracking-widest">— Sarah J.</p>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/10">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-xs font-bold text-white mb-2">"The AI assistant is incredibly accurate."</p>
                  <p className="text-[10px] text-emerald-100/40 font-bold uppercase tracking-widest">— Dr. Michael R.</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="glass p-6 rounded-3xl border border-white/10">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-xs font-bold text-white mb-2">"Finally, a health app that actually works."</p>
                  <p className="text-[10px] text-emerald-100/40 font-bold uppercase tracking-widest">— James L.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center neon-glow-teal">
                <Heart className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight">HealthNav</span>
            </div>
            <p className="text-sm text-emerald-100/40 font-medium leading-relaxed">
              Navigating the future of personal healthcare with advanced AI and real-time insights.
            </p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'AI Assistant', 'Safety', 'Pricing'] },
            { title: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
            { title: 'Support', links: ['Help Center', 'Contact', 'Status', 'API'] }
          ].map((col) => (
            <div key={col.title} className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-white">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-emerald-100/60 hover:text-emerald-400 transition-colors font-medium">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-xs text-emerald-100/20 font-bold uppercase tracking-widest">© 2024 HealthNav AI. All rights reserved.</p>
          <div className="flex gap-6">
            {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
              <a key={social} href="#" className="text-xs text-emerald-100/20 hover:text-white font-bold uppercase tracking-widest transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
