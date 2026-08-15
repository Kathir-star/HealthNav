import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Mic, Volume2, VolumeX, Copy, RefreshCw, Trash2, 
  AlertTriangle, ShieldCheck, ChevronRight, Check, HeartPulse, HelpCircle, 
  FileText, Stethoscope, ArrowUpRight, MessageSquare, Info, Lightbulb, MessageCircleQuestion
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { analyzeWithHealthNavigator } from '../services/geminiService';
import { useProfile } from '../hooks/useProfile';
import { SUGGESTED_AI_PROMPTS } from '../constants';
import { AIStructuredResponse } from '../types';
import { toast } from 'sonner';

interface AINavigatorTabProps {
  onSelectTab?: (tab: string) => void;
}

export const AINavigatorTab: React.FC<AINavigatorTabProps> = ({ onSelectTab }) => {
  const { profile } = useProfile();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [structuredResult, setStructuredResult] = useState<AIStructuredResponse | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutput, setIsVoiceOutput] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; code?: string; retryable?: boolean } | null>(null);
  const [history, setHistory] = useState<{ query: string; result: AIStructuredResponse; time: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (userPrompt?: string) => {
    const textToSubmit = (userPrompt || query).trim();
    if (!textToSubmit) return;

    setLoading(true);
    setQuery(textToSubmit);
    setActiveQuery(textToSubmit);
    setErrorState(null);
    setStructuredResult(null);

    // Build recent context for multi-turn navigation
    const recentHistory = history.slice(0, 3).flatMap(h => [
      { role: 'user', content: h.query },
      { role: 'model', content: h.result.summary }
    ]);

    try {
      const result = await analyzeWithHealthNavigator(textToSubmit, profile, recentHistory);
      setStructuredResult(result);
      setHistory(prev => [
        { query: textToSubmit, result, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev.filter(p => p.query !== textToSubmit).slice(0, 6)
      ]);

      if (isVoiceOutput && result.summary) {
        speakResponse(result.summary);
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Navigator search error:', err);
      const errMsg = err?.message || 'Could not complete analysis. Please check your network connection and retry.';
      setErrorState({
        message: errMsg,
        code: err?.code || 'NETWORK_OR_SERVER_ERROR',
        retryable: err?.retryable !== false
      });
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechAPI();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      toast.error('Could not access microphone.');
    }
  };

  const handleCopy = () => {
    if (!structuredResult) return;
    const copyText = `
HealthNav AI Healthcare Navigation
Query: ${activeQuery}

Summary:
${structuredResult.summary}

${structuredResult.keyTakeaway ? `Key Takeaway:\n${structuredResult.keyTakeaway}\n` : ''}
What This Could Mean:
${structuredResult.possibleConsiderations.map(c => `• ${c}`).join('\n')}

Actionable Next Steps & Doctor Questions:
${structuredResult.recommendedNextSteps.map(s => `• ${s}`).join('\n')}

When to Seek Professional Care:
${structuredResult.whenToSeekCare.map(w => `• ${w}`).join('\n')}

Warning Signs & Red Flags:
${structuredResult.warningSigns.map(w => `• ${w}`).join('\n')}

${structuredResult.disclaimer}
`.trim();

    navigator.clipboard.writeText(copyText);
    setCopied(true);
    toast.success('Analysis copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setStructuredResult(null);
    setQuery('');
    setActiveQuery('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    toast.info('Conversation cleared');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-emerald-900/40 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini 3.7 Healthcare Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Health Navigator
          </h1>
          <p className="text-sm text-emerald-100/70 max-w-xl">
            Understand medical reports, translate complex clinical terms into plain language, organize questions for your physician, and receive evidence-informed navigation.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-start md:self-center">
          <button
            onClick={() => {
              setIsVoiceOutput(!isVoiceOutput);
              toast.info(isVoiceOutput ? 'Voice readout disabled' : 'Voice readout enabled');
            }}
            className={`p-3 rounded-2xl border transition-all ${
              isVoiceOutput 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-white/5 border-white/10 text-emerald-200/70 hover:text-white'
            }`}
            title="Toggle Voice Readout"
          >
            {isVoiceOutput ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          {structuredResult && (
            <button
              onClick={handleClear}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-200/70 hover:text-red-400 transition-colors"
              title="Clear Session"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Medical Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-200/80">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-emerald-100 font-semibold">Medical Notice:</strong> HealthNav provides AI-assisted health information and navigation. It does not diagnose conditions or replace professional medical advice.
        </p>
      </div>

      {/* Query Input Section */}
      <GlassCard className="p-4 sm:p-6 border-emerald-500/20 space-y-4">
        <div className="relative">
          <textarea
            id="health-navigator-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Ask anything about your health, lab values, symptoms, or what questions to ask your physician..."
            rows={3}
            className="w-full bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4 pr-24 text-sm text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 resize-none transition-all"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-700 hover:text-white'
              }`}
              title="Voice dictation"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Navigate</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">
            Suggested Healthcare Prompts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SUGGESTED_AI_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item.prompt)}
                className="text-left p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-400/40 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 group-hover:text-emerald-100">
                  <span>{item.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400/60 group-hover:text-emerald-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-[11px] text-emerald-100/50 mt-1 line-clamp-2 leading-tight">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Structured Result Display */}
      <div ref={resultRef}>
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-8 rounded-3xl bg-emerald-950/60 border border-emerald-500/20 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto animate-pulse">
                <HeartPulse className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
              <h4 className="text-base font-semibold text-white">Synthesizing Clinical Navigation...</h4>
              <p className="text-xs text-emerald-200/60 max-w-md mx-auto">
                Reviewing physiological parameters, cross-referencing health guidelines, and structuring next-step questions.
              </p>
            </motion.div>
          )}

          {errorState && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-red-950/60 border border-red-500/30 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Analysis Interrupted</h3>
                  <p className="text-xs text-red-200/70">Error Code: {errorState.code || 'GENERAL_ERROR'}</p>
                </div>
              </div>

              <p className="text-sm text-red-100 leading-relaxed font-medium bg-red-900/40 p-4 rounded-2xl border border-red-500/20">
                {errorState.message}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                {errorState.retryable !== false && (
                  <button
                    onClick={() => handleSearch(activeQuery || query)}
                    className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Analysis</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {structuredResult && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Main Analysis Card */}
              <GlassCard className="p-6 sm:p-8 border-emerald-500/30 space-y-6 relative">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Healthcare Navigation Analysis</h3>
                      <p className="text-xs text-emerald-200/60 truncate max-w-md">Query: {activeQuery}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleSearch(activeQuery)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>

                {/* Key Takeaway Highlight if available */}
                {structuredResult.keyTakeaway && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-3">
                    <Lightbulb className="w-4 h-4 text-emerald-300 shrink-0" />
                    <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                      <strong className="text-emerald-300 font-bold">Key Takeaway:</strong> {structuredResult.keyTakeaway}
                    </p>
                  </div>
                )}

                {/* 1. Summary Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-900/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Summary & Clinical Understanding</span>
                  </div>
                  <p className="text-sm text-emerald-50 leading-relaxed font-medium">
                    {structuredResult.summary}
                  </p>
                </div>

                {/* 2 & 3 Column Grid: Considerations and Next Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Possible Considerations */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <HelpCircle className="w-4 h-4" />
                      <span>What This Could Mean</span>
                    </div>
                    <ul className="space-y-2">
                      {structuredResult.possibleConsiderations.map((item, i) => (
                        <li key={i} className="text-xs text-emerald-100/80 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable Next Steps */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
                      <Stethoscope className="w-4 h-4" />
                      <span>Actionable Next Steps & Doctor Questions</span>
                    </div>
                    <ul className="space-y-2">
                      {structuredResult.recommendedNextSteps.map((item, i) => (
                        <li key={i} className="text-xs text-emerald-100/80 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4 & 5: When to seek care & Warning Signs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Seeking Care */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                      <FileText className="w-4 h-4" />
                      <span>When to Seek Professional Care</span>
                    </div>
                    <ul className="space-y-2">
                      {structuredResult.whenToSeekCare.map((item, i) => (
                        <li key={i} className="text-xs text-emerald-100/80 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Warning Signs (Red flags) */}
                  <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Warning Signs & Red Flags</span>
                    </div>
                    <ul className="space-y-2">
                      {structuredResult.warningSigns.map((item, i) => (
                        <li key={i} className="text-xs text-red-200/90 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Follow-up Questions */}
                {structuredResult.suggestedFollowUps && structuredResult.suggestedFollowUps.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                      <MessageCircleQuestion className="w-4 h-4 text-emerald-400" />
                      <span>Explore Related Health Questions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {structuredResult.suggestedFollowUps.map((followUp, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(followUp)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/30 hover:bg-emerald-700/50 text-xs text-emerald-100 text-left transition-colors flex items-center gap-1.5 group"
                        >
                          <span>{followUp}</span>
                          <ArrowUpRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom navigation actions */}
                <div className="pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300/80">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Evidence-informed AI healthcare navigation</span>
                  </div>
                  {onSelectTab && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectTab('timeline')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-100 font-medium transition-colors"
                      >
                        View in Health Timeline →
                      </button>
                      <button
                        onClick={() => onSelectTab('care')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-100 font-medium transition-colors"
                      >
                        Find Specialists →
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Navigator Interactions */}
      {history.length > 0 && (
        <GlassCard className="p-6 border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Recent Navigator Sessions</span>
            </h3>
            <span className="text-[11px] text-emerald-300/60">{history.length} queries</span>
          </div>

          <div className="space-y-2">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.query);
                  setActiveQuery(item.query);
                  setStructuredResult(item.result);
                  resultRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left p-3 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-400/30 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5 min-w-0 pr-4">
                  <p className="text-xs font-semibold text-emerald-100 truncate group-hover:text-emerald-50">
                    {item.query}
                  </p>
                  <p className="text-[11px] text-emerald-200/50 truncate">
                    {item.result.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-emerald-300/40">{item.time}</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400/40 group-hover:text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

