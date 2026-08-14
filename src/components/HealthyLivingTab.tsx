import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Heart, Check, Leaf, Sparkles, Search, BookOpen, Info, Loader2, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ArticleSection } from './ArticleSection';
import { getRecommendedArticles, generateDietPlan } from '../services/geminiService';
import { Article } from '../types';
import { useProfile } from '../hooks/useProfile';
import { cn } from '../lib/utils';

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  benefits: string[];
  ingredients: string[];
}

interface Habit {
  id: string;
  title: string;
  content: string;
  category: string;
}

const REAL_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Turmeric Golden Milk',
    description: 'An ancient Ayurvedic drink known for its powerful anti-inflammatory properties.',
    imageUrl: 'https://picsum.photos/seed/turmeric/800/600',
    benefits: ['Anti-inflammatory', 'Immune Boost', 'Better Sleep'],
    ingredients: ['Turmeric', 'Black Pepper', 'Ginger', 'Honey', 'Milk/Almond Milk']
  },
  {
    id: '2',
    title: 'Miso Seaweed Soup',
    description: 'A Japanese staple rich in probiotics and essential minerals for gut health.',
    imageUrl: 'https://picsum.photos/seed/miso/800/600',
    benefits: ['Gut Health', 'Rich in Iodine', 'Detoxification'],
    ingredients: ['Miso Paste', 'Wakame Seaweed', 'Tofu', 'Green Onions']
  },
  {
    id: '3',
    title: 'Ashwagandha Tea',
    description: 'An adaptogenic herb that helps the body manage stress and anxiety.',
    imageUrl: 'https://picsum.photos/seed/ashwagandha/800/600',
    benefits: ['Stress Relief', 'Energy Boost', 'Mental Clarity'],
    ingredients: ['Ashwagandha Root', 'Cardamom', 'Honey', 'Hot Water']
  }
];

const REAL_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Pranayama Breathing',
    content: 'Practice rhythmic breathing for 10 minutes daily to oxygenate your blood and calm the nervous system.',
    category: 'Mindfulness'
  },
  {
    id: '2',
    title: 'Forest Bathing (Shinrin-yoku)',
    content: 'Spend at least 20 minutes in nature to lower cortisol levels and improve heart health.',
    category: 'Nature'
  },
  {
    id: '3',
    title: 'Intermittent Fasting',
    content: 'Allow your digestive system to rest for 14-16 hours to trigger cellular repair (autophagy).',
    category: 'Nutrition'
  }
];

export const HealthyLivingTab: React.FC = () => {
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recommendedArticles, setRecommendedArticles] = React.useState<Article[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = React.useState(false);
  const [dietPlan, setDietPlan] = React.useState<any>(null);
  const [isDietLoading, setIsDietLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchInitialArticles = async () => {
      setIsArticlesLoading(true);
      const articles = await getRecommendedArticles('general wellness and healthy living in Asia');
      setRecommendedArticles(articles);
      setIsArticlesLoading(false);
    };
    fetchInitialArticles();
  }, []);

  const handleGenerateDiet = async () => {
    setIsDietLoading(true);
    const plan = await generateDietPlan(profile);
    setDietPlan(plan);
    setIsDietLoading(false);
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.length > 3) {
      setIsArticlesLoading(true);
      const articles = await getRecommendedArticles(val);
      setRecommendedArticles(articles);
      setIsArticlesLoading(false);
    }
  };

  const filteredRecipes = REAL_RECIPES.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHabits = REAL_HABITS.filter(h => 
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-emerald-50">Healthy Living</h2>
        <p className="text-sm text-emerald-100/60 font-medium">Nourish your body and mind with AI-curated wisdom and ancient traditions</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5 group-focus-within:scale-110 transition-transform" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search recipes or habits..." 
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass border-emerald-500/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-50 placeholder:text-emerald-100/40"
        />
      </div>

      {/* Diet Plan Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Utensils className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">AI Diet Engine</h3>
          </div>
          <button 
            onClick={handleGenerateDiet}
            disabled={isDietLoading}
            className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            {isDietLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate Plan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {dietPlan ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {dietPlan.meals.map((meal: any) => (
                <GlassCard key={meal.name} className="p-4 border border-emerald-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-emerald-50">{meal.name}</h4>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      {meal.calories} kcal
                    </span>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {meal.items.map((item: string) => (
                      <li key={item} className="text-xs text-emerald-100/60 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-emerald-100/40 italic leading-relaxed">
                      {meal.rationale}
                    </p>
                  </div>
                </GlassCard>
              ))}
            </motion.div>
          ) : (
            <GlassCard className="p-8 text-center border-dashed border-emerald-500/30">
              <Utensils className="w-10 h-10 text-emerald-500/20 mx-auto mb-3" />
              <h4 className="text-emerald-50 font-bold mb-1">Personalized Nutrition</h4>
              <p className="text-xs text-emerald-100/40 max-w-xs mx-auto mb-4">
                Get a 1-day sample meal plan tailored to your medical conditions and goals.
              </p>
              <button 
                onClick={handleGenerateDiet}
                className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold neon-glow-teal"
              >
                Generate My Plan
              </button>
            </GlassCard>
          )}
        </AnimatePresence>
      </section>

      {/* Vaccination Tracker */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Vaccination Tracker</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'COVID-19 Booster', date: 'Oct 2023', status: 'Completed' },
            { name: 'Influenza (Flu)', date: 'Due Now', status: 'Due' },
            { name: 'Hepatitis B', date: 'Pending', status: 'Missed' }
          ].map((vax) => (
            <GlassCard key={vax.name} className="p-4 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-bold text-emerald-50">{vax.name}</h4>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                  vax.status === 'Completed' ? "bg-emerald-500/20 text-emerald-400" :
                  vax.status === 'Due' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                )}>
                  {vax.status}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-emerald-100/40 font-medium">
                <Calendar className="w-3 h-3" /> {vax.date}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <ArticleSection 
          articles={recommendedArticles} 
          isLoading={isArticlesLoading} 
          title={searchQuery ? `Verified Insights for ${searchQuery}` : "Verified Health Insights"}
        />
      </section>

      {/* Recipes Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Utensils className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Healing Recipes</h3>
        </div>
        <div className="grid gap-6">
          {filteredRecipes.map((recipe, idx) => (
            <GlassCard key={recipe.id} delay={idx * 0.1} className="p-0 overflow-hidden border border-white/10">
              <div className="relative h-48">
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
                <h4 className="absolute bottom-4 left-4 text-xl font-bold text-white">{recipe.title}</h4>
              </div>
              <div className="p-5">
                <p className="text-sm text-emerald-100/70 mb-4">{recipe.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Benefits</h5>
                    <div className="flex flex-wrap gap-1">
                      {recipe.benefits.map(benefit => (
                        <span key={benefit} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                          <Check className="w-2 h-2" /> {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Key Ingredients</h5>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map(ing => (
                        <span key={ing} className="px-2 py-0.5 rounded-lg bg-white/5 text-emerald-100/60 text-[9px] font-medium border border-white/10">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Healthy Habits Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lime-400">
          <Leaf className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Daily Habits</h3>
        </div>
        <div className="grid gap-4">
          {filteredHabits.map((habit, idx) => (
            <GlassCard key={habit.id} delay={idx * 0.1} className="p-5 flex gap-4 items-start border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-lime-500/10 flex items-center justify-center shrink-0 border border-lime-500/20 shadow-lg shadow-lime-500/10">
                <Sparkles className="w-6 h-6 text-lime-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-emerald-50">{habit.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 text-[8px] font-bold uppercase tracking-widest">
                    {habit.category}
                  </span>
                </div>
                <p className="text-xs text-emerald-100/70 leading-relaxed">{habit.content}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-white/10 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <BookOpen className="text-white w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-50 mb-1">Scientific Backing</h4>
          <p className="text-[10px] text-emerald-100/70 leading-relaxed">
            All recipes and habits are cross-referenced with modern nutritional science and traditional Ayurvedic/TCM wisdom.
          </p>
        </div>
      </div>
    </div>
  );
};
