import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'motion/react';
import { Sparkles, X, Mic, Send, Activity, Loader2, Volume2, VolumeX, MoreVertical, Trash2, Edit2, Plus, MessageSquare, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';
import { getChatResponse } from '../services/geminiService';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';

// --- Type Definitions ---
interface Message {
  id: string;
  content: string;
  role: 'assistant' | 'user';
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface AiriAssistantProps {
  state?: 'calm' | 'attentive' | 'urgent';
  message?: string;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- 🌟 UPGRADED: Lively Mascot Component ---
const AiriMascot = ({ state }: { state: 'calm' | 'attentive' | 'urgent' }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Smooth, snappy eye tracking
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const eyeX = useSpring(mouseX, springConfig);
  const eyeY = useSpring(mouseY, springConfig);

  // Eye tracking logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX / innerWidth) - 0.5) * 12; 
      const y = ((e.clientY / innerHeight) - 0.5) * 12;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Autonomous Blinking Logic
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      const nextBlinkTime = Math.random() * 4000 + 2000;
      setTimeout(blink, nextBlinkTime);
    };
    const initialTimeout = setTimeout(blink, 2000);
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <motion.div 
      animate={{ 
        y: state === 'urgent' ? [0, -4, 0] : [0, -2, 0],
        scale: state === 'urgent' ? [1, 1.05, 1] : [1, 1.02, 1],
      }}
      transition={{ 
        duration: state === 'urgent' ? 1 : 3,
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="relative w-full h-full flex items-center justify-center bg-white rounded-full p-2 overflow-hidden shadow-inner"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-3/4 h-1/4 bg-emerald-500 rounded-full" />
        <div className="h-3/4 w-1/4 bg-emerald-500 rounded-full absolute" />
      </div>
      <div className="relative z-10 flex gap-3 mb-1">
        <motion.div 
          style={{ x: eyeX, y: eyeY }}
          animate={{ height: isBlinking ? 2 : 16 }}
          transition={{ duration: 0.1 }}
          className="w-2.5 bg-emerald-950 rounded-full relative overflow-hidden flex items-center justify-center"
        >
          {!isBlinking && (
            <motion.div 
              style={{ x: eyeX, y: eyeY }}
              className="absolute top-1 left-1 w-1 h-1.5 bg-white rounded-full opacity-80" 
            />
          )}
        </motion.div>
        <motion.div 
          style={{ x: eyeX, y: eyeY }}
          animate={{ height: isBlinking ? 2 : 16 }}
          transition={{ duration: 0.1 }}
          className="w-2.5 bg-emerald-950 rounded-full relative overflow-hidden flex items-center justify-center"
        >
          {!isBlinking && (
             <motion.div 
               style={{ x: eyeX, y: eyeY }}
               className="absolute top-1 left-1 w-1 h-1.5 bg-white rounded-full opacity-80" 
             />
          )}
        </motion.div>
      </div>
      <motion.div 
        animate={{ 
          width: state === 'attentive' ? 10 : 6,
          height: state === 'attentive' ? 4 : 2,
          borderRadius: state === 'attentive' ? "10px" : "0 0 10px 10px",
          y: state === 'attentive' ? 2 : 0
        }}
        className="absolute bottom-3 border-b-2 border-emerald-950 bg-emerald-900/10" 
      />
    </motion.div>
  );
};

// --- Main Assistant Component ---
export const AiriAssistant: React.FC<AiriAssistantProps> = ({ 
  state: initialState = 'calm', 
  message: initialMessage,
  className 
}) => {
  const { profile: healthProfile } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [airiState, setAiriState] = useState<'calm' | 'attentive' | 'urgent'>(initialState);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Chat History State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const fetchConversations = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch("/api/conversations", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(`/api/messages?conversation_id=${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
      setVoiceAndSpeak();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const tempMsg: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await getChatResponse(text, activeConversationId, healthProfile);
      
      if (!activeConversationId) {
        setActiveConversationId(result.conversation_id);
        fetchConversations();
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        content: result.text,
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      speak(result.text);
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle }),
      });
      if (!response.ok) throw new Error("Rename failed");
      
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle } : c));
      setEditingId(null);
      toast.success("Chat renamed");
    } catch (err) {
      toast.error("Failed to rename chat");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Delete failed");

      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      setShowDeleteConfirm(null);
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setAiriState('calm');
      return;
    }
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.onstart = () => { setIsListening(true); setAiriState('attentive'); };
      recognition.onresult = (event: any) => { handleSendMessage(event.results[0][0].transcript); };
      recognition.onerror = () => { setIsListening(false); setAiriState('calm'); };
      recognition.onend = () => { setIsListening(false); setAiriState('calm'); };
      recognition.start();
    } catch (error) {
      toast.error("Could not start microphone.");
    }
  };

  return (
    <div className={cn("fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[200]", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[450px] h-[75vh] sm:h-[650px] flex flex-row origin-bottom-right overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl"
          >
            {/* Sidebar */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ x: -250 }}
                  animate={{ x: 0 }}
                  exit={{ x: -250 }}
                  className="w-[250px] bg-emerald-950/98 border-r border-emerald-500/20 flex flex-col z-20"
                >
                  <div className="p-4 border-b border-emerald-500/20 flex items-center justify-between">
                    <h4 className="text-white font-bold text-sm">Chat History</h4>
                    <button onClick={() => setActiveConversationId(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-400">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.map(conv => (
                      <div key={conv.id} className={cn(
                        "group relative flex items-center p-2 rounded-xl transition-all cursor-pointer",
                        activeConversationId === conv.id ? "bg-emerald-500/20 border border-emerald-500/30" : "hover:bg-white/5"
                      )}>
                        <div className="flex-1 min-w-0" onClick={() => setActiveConversationId(conv.id)}>
                          {editingId === conv.id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onBlur={() => handleRename(conv.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(conv.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="w-full bg-emerald-900/50 border border-emerald-500/50 rounded px-1 text-xs text-white outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-xs text-emerald-50 truncate font-medium">{conv.title}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-0.5 opacity-40">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[9px] uppercase tracking-tighter text-white">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1">
                          <button onClick={() => { setEditingId(conv.id); setEditTitle(conv.title); }} className="p-1 hover:text-emerald-400 text-white/40">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(conv.id)} className="p-1 hover:text-red-400 text-white/40">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <GlassCard className="flex-1 flex flex-col p-0 border-none bg-emerald-950/95 backdrop-blur-2xl relative">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-emerald-200 shadow-sm">
                    <AiriMascot state={airiState} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Airi Medical AI</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", airiState === 'urgent' ? 'bg-red-400' : 'bg-lime-400')} />
                      <span className="text-[10px] font-medium opacity-90 uppercase tracking-widest">
                        {airiState === 'urgent' ? 'Critical Mode' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 mx-auto mb-4 flex items-center justify-center border border-emerald-400/30">
                      <Sparkles className="text-emerald-300 w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-emerald-50">Advanced Medical Support</p>
                    <p className="text-[11px] text-emerald-200/60 uppercase tracking-widest mt-1">Real-time voice enabled</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed", msg.role === 'user' ? "bg-emerald-500 text-white rounded-br-sm" : "bg-emerald-900/80 text-emerald-50 border border-emerald-500/30 rounded-bl-sm")}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-emerald-900/80 p-4 rounded-2xl rounded-bl-sm border border-emerald-500/30">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-3 border-t border-emerald-500/20 bg-emerald-950/50">
                <div className="flex items-center gap-2">
                  <button onClick={toggleListening} className={cn("p-3 rounded-xl transition-all duration-300 shadow-sm flex-shrink-0", isListening ? "bg-red-500 text-white animate-pulse" : "bg-emerald-800/50 text-emerald-300 hover:bg-emerald-600 hover:text-white")}>
                    <Mic className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="Ask Airi..." 
                    className="flex-1 h-12 px-4 rounded-xl bg-emerald-900/40 border border-emerald-500/30 outline-none focus:border-emerald-400 focus:bg-emerald-900/60 text-sm text-emerald-50 placeholder:text-emerald-300/40"
                  />
                  <button onClick={() => handleSendMessage(inputText)} disabled={isTyping || !inputText.trim()} className="p-3 flex-shrink-0 rounded-xl bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 disabled:opacity-50">
                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-emerald-950/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <GlassCard className="p-6 text-center space-y-4 border-red-500/30">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <Trash2 className="w-6 h-6 text-red-500" />
                      </div>
                      <h3 className="text-white font-bold">Delete this chat?</h3>
                      <p className="text-white/60 text-xs">This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold">Cancel</button>
                        <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">Delete</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative group z-50",
          isOpen ? "bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-400",
          airiState === 'urgent' && !isOpen && "ring-4 ring-red-500 animate-pulse bg-red-500"
        )}
      >
        <div className={cn("absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity", airiState === 'urgent' ? "bg-red-500" : "bg-emerald-400")} />
        {isOpen ? (
          <X className="text-white w-7 h-7 sm:w-8 sm:h-8 relative z-10" />
        ) : (
          <div className={cn("relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 bg-white z-10", airiState === 'urgent' ? "border-red-200" : "border-emerald-100")}>
            <AiriMascot state={airiState} />
          </div>
        )}
      </motion.button>
    </div>
  );
};
