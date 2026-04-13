import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertTriangle, Bug, Lightbulb, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { FeedbackType } from '../types';
import { authService } from '../services/authService';
import { databaseService } from '../services/databaseService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = React.useState<FeedbackType>('ux_suggestion');
  const [message, setMessage] = React.useState('');
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const user = await authService.getCurrentUser();
      await databaseService.createFeedback({
        uid: isAnonymous ? null : user?.id,
        user_email: isAnonymous ? null : user?.email,
        type,
        content: message,
        recipient: 'jafferrilwaan@gmail.com'
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md glass rounded-[32px] p-8 relative z-10"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-emerald-100/60" />
            </button>

            <h2 className="text-2xl font-bold text-emerald-50 mb-6">Feedback</h2>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-emerald-50">Thank You!</h3>
                <p className="text-sm text-emerald-100/60">Your feedback has been sent directly to jafferrilwaan@gmail.com</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'bug', label: 'Bug', icon: Bug },
                    { id: 'data_error', label: 'Data Error', icon: AlertTriangle },
                    { id: 'ux_suggestion', label: 'Suggestion', icon: Lightbulb },
                    { id: 'safety_report', label: 'Safety', icon: MessageSquare },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setType(item.id as FeedbackType)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                        type === item.id 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' 
                          : 'border-white/10 bg-white/5 text-emerald-100/60 hover:border-white/20'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-100/40 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what happened..." 
                    className="w-full h-32 p-4 rounded-2xl glass border-emerald-500/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-sm resize-none text-emerald-50 placeholder:text-emerald-100/40"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="anon" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-emerald-500/40 bg-white/10 text-emerald-500 focus:ring-emerald-500" 
                  />
                  <label htmlFor="anon" className="text-xs font-medium text-emerald-100/60">Send anonymously</label>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading || !message.trim()}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold neon-glow-teal shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
