import React from 'react';
import { BookOpen, ExternalLink, Tag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { Article } from '../types';

interface ArticleSectionProps {
  articles: Article[];
  title?: string;
  isLoading?: boolean;
}

export const ArticleSection: React.FC<ArticleSectionProps> = ({ 
  articles, 
  title = "Verified Health Insights", 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-64 animate-pulse bg-emerald-500/5 border-emerald-500/10" />
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          AI Verified Sources
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((article, idx) => (
          <GlassCard 
            key={article.id} 
            delay={idx * 0.1}
            className="group flex flex-col h-full p-0 overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-colors"
          >
            <div className="relative h-32 shrink-0">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-widest">
                  {article.source}
                </span>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <h4 className="text-sm font-bold text-emerald-50 mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                {article.title}
              </h4>
              <p className="text-[11px] text-emerald-100/60 line-clamp-3 mb-4 flex-1">
                {article.summary}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold border border-emerald-500/20">
                    <Tag className="w-2 h-2" /> {tag}
                  </span>
                ))}
              </div>
              
              <a 
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white/5 hover:bg-emerald-500 text-emerald-100 hover:text-white text-[10px] font-bold transition-all border border-white/10 hover:border-emerald-400"
              >
                Read Full Article <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
