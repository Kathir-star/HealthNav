import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Eye, Database, Trash2, Download, Check, 
  AlertTriangle, RefreshCw, Server, Key, HardDrive, Sparkles, FileText, CheckCircle2 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useProfile } from '../hooks/useProfile';
import { MOCK_TIMELINE_EVENTS, MOCK_HEALTH_RECORDS, MOCK_VITALS } from '../constants';
import { toast } from 'sonner';

export const PrivacyCenterTab: React.FC = () => {
  const { profile } = useProfile();
  const [preferences, setPreferences] = useState({
    shareWithAI: true,
    storeChatHistoryLocally: true,
    anonymousAnalytics: true,
    emergencyAlertConsent: true,
    retentionDays: 30
  });

  const [isWiping, setIsWiping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success('Privacy preference updated');
      return next;
    });
  };

  const handleExportAllData = () => {
    setIsExporting(true);
    try {
      const completeHealthArchive = {
        exportedAt: new Date().toISOString(),
        application: "HealthNav Personal Health Platform",
        userProfile: profile || {
          id: "guest_user",
          displayName: "Patient Record",
          email: "patient@healthnav.local"
        },
        healthMetrics: MOCK_VITALS,
        timelineEvents: MOCK_TIMELINE_EVENTS,
        healthRecords: MOCK_HEALTH_RECORDS,
        privacyAuditSettings: preferences
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(completeHealthArchive, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `healthnav_complete_archive_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Complete health archive downloaded as JSON');
    } catch (err) {
      toast.error('Failed to generate export file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLocalData = () => {
    setIsWiping(true);
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Local cache and stored session preferences cleared');
      setShowConfirmWipe(false);
    } catch (err) {
      toast.error('Could not clear local storage');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Healthcare Privacy & Transparency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Privacy Center
          </h1>
          <p className="text-sm text-emerald-100/70 max-w-xl">
            Your Health Data. Entirely in Your Control. Review how your clinical data is handled, adjust AI access scopes, or export your full health record.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-start md:self-center">
          <button
            onClick={handleExportAllData}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export My Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars of HealthNav Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <GlassCard className="p-5 border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">What HealthNav Stores</h3>
              <p className="text-[11px] text-emerald-300/60">Minimum data footprint</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            HealthNav records your uploaded medical files, logged timeline items, and basic health metrics (e.g. allergies, conditions) exclusively to personalize your navigation experience. We do not sell or monetize personal health data.
          </p>
        </GlassCard>

        {/* Pillar 2 */}
        <GlassCard className="p-5 border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Data Access</h3>
              <p className="text-[11px] text-teal-300/60">Strict server-side processing</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            When you consult the AI Health Navigator, queries are processed via secure server-side API routes using Google Gemini. Your personal identifiers are anonymized and never used to train public foundation models.
          </p>
        </GlassCard>

        {/* Pillar 3 */}
        <GlassCard className="p-5 border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security & Encryption</h3>
              <p className="text-[11px] text-amber-300/60">AES-256 and TLS 1.3 in transit</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            All data exchanges between your device, the application server, and the database are encrypted using modern Transport Layer Security. Sensitive records are token-protected and isolated per user.
          </p>
        </GlassCard>

        {/* Pillar 4 */}
        <GlassCard className="p-5 border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Clinical Boundaries & Disclaimers</h3>
              <p className="text-[11px] text-lime-300/60">Non-diagnostic safety mandate</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            HealthNav is designed for health navigation, medical education, and visit preparation. It never claims certified medical diagnosis or replaces a licensed healthcare provider’s direct judgment.
          </p>
        </GlassCard>
      </div>

      {/* Interactive Privacy Preferences Controls */}
      <GlassCard className="p-6 border-emerald-500/20 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white">Active Privacy Preferences</h3>
          <p className="text-xs text-emerald-200/60">Configure your personal consent and sharing parameters</p>
        </div>

        <div className="space-y-4 divide-y divide-emerald-500/10">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between pt-3 first:pt-0 gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Share Health Profile with AI Navigator</h4>
              <p className="text-[11px] text-emerald-100/60">
                Allows the AI Navigator to take into account your known allergies and conditions when analyzing questions.
              </p>
            </div>
            <button
              onClick={() => togglePreference('shareWithAI')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                preferences.shareWithAI ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                preferences.shareWithAI ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between pt-3 gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Local Chat History Retention</h4>
              <p className="text-[11px] text-emerald-100/60">
                Maintains previous AI conversations on your device for easy retrieval and follow-up.
              </p>
            </div>
            <button
              onClick={() => togglePreference('storeChatHistoryLocally')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                preferences.storeChatHistoryLocally ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                preferences.storeChatHistoryLocally ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between pt-3 gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Anonymous Quality Telemetry</h4>
              <p className="text-[11px] text-emerald-100/60">
                Help improve HealthNav accuracy by submitting de-identified system performance metrics.
              </p>
            </div>
            <button
              onClick={() => togglePreference('anonymousAnalytics')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                preferences.anonymousAnalytics ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                preferences.anonymousAnalytics ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Toggle 4 */}
          <div className="flex items-center justify-between pt-3 gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Emergency Donor Alert Network</h4>
              <p className="text-[11px] text-emerald-100/60">
                Permits receiving anonymized urgent blood matching alerts within your regional perimeter.
              </p>
            </div>
            <button
              onClick={() => togglePreference('emergencyAlertConsent')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                preferences.emergencyAlertConsent ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                preferences.emergencyAlertConsent ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Data Management & Deletion */}
      <GlassCard className="p-6 border-red-500/30 space-y-4 bg-red-950/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Data Erasure & Storage Wipe</h3>
            <p className="text-[11px] text-red-300/70">Immediate local deletion and session reset</p>
          </div>
        </div>

        <p className="text-xs text-emerald-100/70 leading-relaxed">
          You can immediately purge all cached session tokens, offline database logs, and temporary documents from your current browser environment.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowConfirmWipe(true)}
            className="px-4 py-2.5 rounded-2xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Clear Local Storage & Session Data</span>
          </button>
        </div>
      </GlassCard>

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {showConfirmWipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmWipe(false)}
              className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-emerald-950 border border-red-500/30 rounded-3xl p-6 space-y-4 shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">Wipe Local Health Cache?</h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                This will reset your local offline tokens, active filters, and browser-cached session state.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmWipe(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLocalData}
                  disabled={isWiping}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isWiping && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Wipe</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
