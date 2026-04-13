import React from 'react';
import { motion } from 'motion/react';
import { Shield, ExternalLink, Check, Info, Search } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface InsurancePlan {
  id: string;
  provider: string;
  planName: string;
  monthlyPremium: string | number;
  coverageAmount: string;
  features: string[];
  termsSummary: string;
  link: string;
}

const REAL_INSURANCE: InsurancePlan[] = [
  {
    id: '1',
    provider: 'Star Health',
    planName: 'Family Health Optima',
    monthlyPremium: 1200,
    coverageAmount: '₹5 - ₹25 Lakhs',
    features: ['No Claim Bonus', 'Day Care Procedures', 'Automatic Restoration'],
    termsSummary: 'Comprehensive family floater plan with wide network of hospitals across India.',
    link: 'https://www.starhealth.in/health-insurance-plans/family-health-optima'
  },
  {
    id: '2',
    provider: 'HDFC ERGO',
    planName: 'Optima Secure',
    monthlyPremium: 1500,
    coverageAmount: '₹5 Lakhs - ₹2 Crores',
    features: ['Secure Benefit', 'Plus Benefit', 'Restore Benefit', 'Protect Benefit'],
    termsSummary: 'Offers 4x coverage from day 1 with unique benefits like Secure and Plus.',
    link: 'https://www.hdfcergo.com/health-insurance/optima-secure'
  },
  {
    id: '3',
    provider: 'Care Health',
    planName: 'Care Supreme',
    monthlyPremium: 1100,
    coverageAmount: '₹7 Lakhs - ₹1 Crore',
    features: ['Cumulative Bonus Super', 'Unlimited Automatic Recharge', 'Wellness Rewards'],
    termsSummary: 'Focuses on wellness and rewards for maintaining a healthy lifestyle.',
    link: 'https://www.careinsurance.com/health-insurance/care-supreme'
  },
  {
    id: '4',
    provider: 'Niva Bupa',
    planName: 'ReAssure 2.0',
    monthlyPremium: 1300,
    coverageAmount: '₹5 Lakhs - ₹1 Crore',
    features: ['ReAssure Forever', 'Lock the Age', 'Booster Benefit'],
    termsSummary: 'Innovative plan where the base sum insured is triggered for every claim.',
    link: 'https://www.nivabupa.com/health-insurance-plans/reassure-2-0.html'
  }
];

export const InsuranceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredInsurance = REAL_INSURANCE.filter(plan => 
    plan.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-50">Insurance Comparison</h2>
        <p className="text-sm text-emerald-100/60 font-medium">Find the best health coverage with real-time price comparison</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search insurance provider or plan..." 
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
      </div>

      <div className="grid gap-6">
        {filteredInsurance.map((plan, idx) => (
          <GlassCard key={plan.id} delay={idx * 0.1} className="p-0 overflow-hidden border-l-4 border-l-emerald-500">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-emerald-50">{plan.provider}</h3>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">{plan.planName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-50">
                    {typeof plan.monthlyPremium === 'number' ? `₹${plan.monthlyPremium}` : plan.monthlyPremium}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-wider">est. per month</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest mb-1">Coverage</p>
                  <p className="text-sm font-bold text-emerald-50">{plan.coverageAmount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest mb-1">Scope</p>
                  <p className="text-sm font-bold text-emerald-50">Pan-India Network</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold text-emerald-100/60 uppercase tracking-widest">Key Features</h4>
                <div className="grid grid-cols-1 gap-2">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-xs font-medium text-emerald-100/80">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-white/10 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest mb-1">AI Summary</h5>
                    <p className="text-[11px] text-emerald-100/80 leading-relaxed italic">
                      {plan.termsSummary}
                    </p>
                  </div>
                </div>
              </div>

              <a 
                href={plan.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-500/20"
              >
                View Details & Apply <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
