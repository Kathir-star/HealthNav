import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Mic, Send, Activity, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';
// Firebase imports removed
import { getAiriResponse } from '../services/geminiService';
import { HealthProfile } from '../types';
import { useProfile } from '../hooks/useProfile';

interface Message {
  id: string;
  text: string;
  sender: 'airi' | 'user';
  timestamp: Date;
}

interface AiriAssistantProps {
  state?: 'calm' | 'attentive' | 'urgent';
  message?: string;
  className?: string;
}

const AiriMascot = ({ state }: { state: 'calm' | 'attentive' | 'urgent' }) => (
  <motion.div 
    animate={{ 
      y: [0, -5, 0],
      scale: state === 'urgent' ? [1, 1.1, 1] : 1
    }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    className="relative w-full h-full flex items-center justify-center bg-white rounded-full p-2"
  >
    {/* Medical Plus Sign */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-2/3 h-1/4 bg-red-500 rounded-full" />
      <div className="h-2/3 w-1/4 bg-red-500 rounded-full absolute" />
    </div>
    
    {/* Eyes */}
    <div className="relative z-10 flex gap-3 mb-1">
      <motion.div 
        animate={{ height: [4, 4, 1, 4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-2 h-4 bg-emerald-950 rounded-full" 
      />
      <motion.div 
        animate={{ height: [4, 4, 1, 4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-2 h-4 bg-emerald-950 rounded-full" 
      />
    </div>
    
    {/* Mouth */}
    <motion.div 
      animate={{ 
        width: state === 'attentive' ? [8, 12, 8] : 8,
        borderRadius: state === 'calm' ? "0 0 10px 10px" : "10px"
      }}
      className="absolute bottom-4 w-2 h-1 border-b-2 border-emerald-950" 
    />
  </motion.div>
);

export const AiriAssistant: React.FC<AiriAssistantProps> = ({ 
  state: initialState = 'calm', 
  message: initialMessage,
  className 
}) => {
  const { profile: healthProfile } = useProfile();
  const [isOpen, setIsOpen] = React.useState(false);
  const [airiState, setAiriState] = React.useState<'calm' | 'attentive' | 'urgent'>(initialState);
  const [isListening, setIsListening] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isDiagnosisMode, setIsDiagnosisMode] = React.useState(false);
  const [airiMessageState, setAiriMessageState] = React.useState<string | undefined>(initialMessage);

  React.useEffect(() => {
    if (initialState) setAiriState(initialState);
  }, [initialState]);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!isOpen) {
          setAiriMessageState("Have you searching anything? I'm here to help!");
        }
      }, 30000); // 30 seconds of inactivity
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (airiMessageState) {
      const newMessage: Message = {
        id: Math.random().toString(),
        text: airiMessageState,
        sender: 'airi',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  }, [airiMessageState]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const reply = await getAiriResponse(text, healthProfile);

      const airiMsg: Message = {
        id: Math.random().toString(),
        text: reply,
        sender: 'airi',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, airiMsg]);
      
      // Check for urgency level
      if (reply.includes('Urgency Level: CRITICAL')) {
        setAiriState('urgent');
        setIsDiagnosisMode(true);
      } else if (reply.toLowerCase().includes('diagnosis') || reply.toLowerCase().includes('symptom')) {
        setIsDiagnosisMode(true);
        setAiriState('attentive');
      } else {
        setIsDiagnosisMode(false);
        setAiriState('calm');
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: Math.random().toString(),
        text: "I'm having trouble connecting to my medical database right now. Please try again in a moment.",
        sender: 'airi',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate voice recognition for now as Web Speech API can be tricky in iframes
      setTimeout(() => {
        setIsListening(false);
        const simulatedVoiceText = "Find me a hospital with cardiology speciality.";
        handleSendMessage(simulatedVoiceText);
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  const quickActions = [
    { label: "Find Hospitals", query: "Find nearby hospitals with bed availability" },
    { label: "Check Meds", query: "What medicines are available in the database?" },
    { label: "Blood Donors", query: "Are there any O+ blood donors nearby?" },
    { label: "Insurance", query: "Show me insurance plans for families" }
  ];

  return (
    <div className={cn("fixed bottom-6 right-6 z-[200]", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-[350px] max-h-[600px] flex flex-col"
          >
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-emerald-500/30 shadow-2xl">
              {/* Chat Header */}
              <div className="p-4 bg-emerald-500 text-white flex items-center justify-between neon-glow-teal shadow-lg shadow-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/40 shadow-inner">
                    <AiriMascot state={airiState} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Airi AI</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                      <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Gemini 1.5 Powered</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] bg-emerald-950/40 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 mx-auto mb-4 flex items-center justify-center border border-emerald-500/20">
                      <Sparkles className="text-emerald-400 w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-emerald-50">Advanced Medical Support</p>
                    <p className="text-[10px] text-emerald-100/40 uppercase tracking-widest mt-1">Real-time search & diagnosis</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      {quickActions.map(action => (
                        <button
                          key={action.label}
                          onClick={() => handleSendMessage(action.query)}
                          className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      msg.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm",
                      msg.sender === 'user' 
                        ? "bg-emerald-500 text-white rounded-tr-none neon-glow-teal" 
                        : "bg-emerald-500/10 text-emerald-50 border border-emerald-500/20 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl rounded-tl-none border border-emerald-500/20">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                {isDiagnosisMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-start gap-3"
                  >
                    <Activity className="w-5 h-5 text-lime-400 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-lime-400 uppercase tracking-widest mb-1">AI Diagnosis Insight</h4>
                      <p className="text-[11px] text-emerald-100 leading-relaxed">
                        Airi is analyzing your symptoms with Gemini 1.5. Always consult a professional for critical care.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 bg-emerald-950/60">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      isListening ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                    )}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="Ask Airi anything..." 
                    className="flex-1 h-12 px-4 rounded-xl glass border-emerald-500/20 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-emerald-50 placeholder:text-emerald-100/40"
                  />
                  <button 
                    onClick={() => handleSendMessage(inputText)}
                    disabled={isTyping}
                    className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg neon-glow-teal hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative group",
          isOpen ? "bg-red-500 rotate-90" : "bg-emerald-500 neon-glow-teal"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 group-hover:opacity-40" />
        {isOpen ? (
          <X className="text-white w-8 h-8" />
        ) : (
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 bg-white">
            <AiriMascot state={airiState} />
          </div>
        )}
      </motion.button>
    </div>
  );
};
