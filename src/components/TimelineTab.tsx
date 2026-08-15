import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, FileText, Stethoscope, Pill, Sparkles, Plus, Download, 
  Filter, CheckCircle2, ChevronDown, ChevronUp, Clock, Tag, MapPin, 
  AlertCircle, Activity, X, Edit3, Trash2, Loader2 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { TimelineEvent, TimelineEventType } from '../types';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';
import { toast } from 'sonner';

export const TimelineTab: React.FC = () => {
  const { profile } = useProfile();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TimelineEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'report' as TimelineEventType,
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    provider: '',
    description: '',
    details: '',
    status: 'completed' as TimelineEvent['status']
  });

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.getTimelineEvents(profile?.uid);
      setEvents(data);
      if (data.length > 0 && !expandedEventId) {
        setExpandedEventId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading timeline events:", err);
      toast.error("Unable to load timeline. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [profile?.uid]);

  const filterOptions = [
    { id: 'all', label: 'All Events', count: events.length },
    { id: 'report', label: 'Medical Reports', count: events.filter(e => e.type === 'report').length },
    { id: 'appointment', label: 'Appointments', count: events.filter(e => e.type === 'appointment').length },
    { id: 'medication', label: 'Medications', count: events.filter(e => e.type === 'medication').length },
    { id: 'assessment', label: 'Assessments', count: events.filter(e => e.type === 'assessment').length },
    { id: 'ai_interaction', label: 'AI Navigator', count: events.filter(e => e.type === 'ai_interaction').length },
  ];

  const filteredEvents = selectedFilter === 'all' 
    ? events 
    : events.filter(e => e.type === selectedFilter);

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'report':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'appointment':
        return <Stethoscope className="w-4 h-4 text-teal-400" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-amber-400" />;
      case 'assessment':
        return <Activity className="w-4 h-4 text-lime-400" />;
      case 'ai_interaction':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Calendar className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getEventBadgeClass = (type: TimelineEventType) => {
    switch (type) {
      case 'report':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'appointment':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
      case 'medication':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'assessment':
        return 'bg-lime-500/10 text-lime-300 border-lime-500/20';
      case 'ai_interaction':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  // Open Create
  const openCreateModal = () => {
    setFormData({
      title: '',
      type: 'report',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM',
      provider: '',
      description: '',
      details: '',
      status: 'completed'
    });
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  // Open Edit
  const openEditModal = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time || '09:00 AM',
      provider: event.provider || '',
      description: event.description || '',
      details: event.details || '',
      status: event.status || 'completed'
    });
    setIsFormModalOpen(true);
  };

  const isFormDirty = () => {
    if (editingEvent) {
      return (
        formData.title !== editingEvent.title ||
        formData.type !== editingEvent.type ||
        formData.provider !== (editingEvent.provider || '') ||
        formData.description !== (editingEvent.description || '') ||
        formData.details !== (editingEvent.details || '')
      );
    }
    return Boolean(formData.title || formData.provider || formData.description || formData.details);
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsFormModalOpen(false);
      setEditingEvent(null);
    }
  };

  // Save (Create or Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEvent) {
        // UPDATE
        const updated = await databaseService.updateTimelineEvent(editingEvent.id, {
          title: formData.title,
          type: formData.type,
          date: formData.date,
          time: formData.time,
          provider: formData.provider || 'Personal Health Entry',
          description: formData.description || 'Health record entry added by user.',
          details: formData.details,
          status: formData.status
        }, profile?.uid);

        setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
        toast.success(`Updated "${updated.title}"`);
      } else {
        // CREATE
        const created = await databaseService.createTimelineEvent(profile?.uid, {
          title: formData.title,
          type: formData.type,
          date: formData.date,
          time: formData.time,
          provider: formData.provider || 'Personal Health Entry',
          description: formData.description || 'Health record entry added by user.',
          details: formData.details || '',
          status: formData.status,
          tags: ['Personal Log', formData.type.toUpperCase()]
        });

        setEvents(prev => [created, ...prev]);
        toast.success(`Event added to timeline`);
      }

      setIsFormModalOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      console.error("Save timeline error:", err);
      toast.error(err.message || "Failed to save timeline event.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteTimelineEvent(deletingEvent.id, profile?.uid);
      setEvents(prev => prev.filter(e => e.id !== deletingEvent.id));
      toast.success(`Timeline event "${deletingEvent.title}" removed`);
      setDeletingEvent(null);
    } catch (err: any) {
      console.error("Delete timeline event error:", err);
      toast.error(err.message || "Failed to delete timeline event.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportTimeline = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `healthnav_timeline_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Timeline exported as JSON');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chronological Care History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Health Journey Timeline
          </h1>
          <p className="text-sm text-emerald-100/70 max-w-xl">
            A real, chronologically organized timeline of your diagnostic tests, specialist visits, medication changes, and health milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 self-start md:self-center">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>

          <button
            onClick={handleExportTimeline}
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-200/80 hover:text-white transition-all cursor-pointer"
            title="Export Timeline"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedFilter(opt.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedFilter === opt.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.03] border border-white/10 text-emerald-200/70 hover:text-emerald-100 hover:bg-white/5'
            }`}
          >
            <span>{opt.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedFilter === opt.id ? 'bg-emerald-700 text-white' : 'bg-white/10 text-emerald-300'
            }`}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Events Timeline View */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-emerald-200/60">Loading clinical timeline events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <GlassCard className="py-14 text-center border-dashed border-emerald-500/20 space-y-3">
          <Calendar className="w-12 h-12 text-emerald-500/30 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No timeline events found</h3>
            <p className="text-xs text-emerald-200/60 max-w-sm mx-auto mt-1">
              Click "Add Event" to log your first medical checkup, report, or prescription.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </GlassCard>
      ) : (
        <div className="relative pl-6 md:pl-8 space-y-4 before:absolute before:left-[11px] md:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500 before:via-teal-500/40 before:to-emerald-900/10">
          {filteredEvents.map((event, idx) => {
            const isExpanded = expandedEventId === event.id;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative"
              >
                {/* Node Bullet */}
                <div className="absolute -left-[30px] md:-left-[35px] top-4 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <GlassCard className="p-5 border-emerald-500/20 hover:border-emerald-400/40 transition-all space-y-3">
                  {/* Event Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getEventBadgeClass(event.type)}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-emerald-300/60 font-medium">
                            {event.date} {event.time && `• ${event.time}`}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-200/70 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingEvent(event)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200/60 hover:text-white transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary / Description */}
                  <p className="text-xs text-emerald-100/80 leading-relaxed pl-12">
                    {event.description}
                  </p>

                  {/* Expanded Clinical Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-12 pt-2 border-t border-emerald-500/10 space-y-3"
                      >
                        {event.details && (
                          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/20 text-xs text-emerald-100/90 leading-relaxed font-mono">
                            {event.details}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-300/60 gap-2">
                          <span className="font-semibold">{event.provider || 'Personal Health Entry'}</span>
                          <span className="capitalize px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-emerald-300">
                            Status: {event.status || 'Completed'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModalWithPrompt}
              className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-emerald-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    {editingEvent ? <Edit3 className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingEvent ? 'Edit Timeline Event' : 'Add Health Event'}
                    </h3>
                    <p className="text-[10px] text-emerald-300/60 font-medium">
                      {editingEvent ? 'Update historical clinical record' : 'Log a medical report, checkup, or milestone'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModalWithPrompt}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Cardiology Follow-Up, Lipid Profile Test"
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Event Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEventType })}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="report">Medical Report</option>
                      <option value="appointment">Appointment</option>
                      <option value="medication">Medication</option>
                      <option value="assessment">Assessment</option>
                      <option value="ai_interaction">AI Navigator</option>
                      <option value="note">Clinical Note</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="e.g. Aug 15, 2026"
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Time</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="e.g. 10:30 AM"
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Provider / Clinic</label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      placeholder="e.g. Apollo Diagnostics, Dr. Sarah Chen"
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Description / Summary</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the visit, recommendation, or findings..."
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Clinical Details / Exact Values</label>
                  <textarea
                    rows={3}
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Detailed vitals, dosage, lab reference values, or instructions..."
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCloseModalWithPrompt}
                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-200 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingEvent ? 'Save Changes' : 'Add Event'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingEvent?.title}
        title="Permanently remove timeline event?"
        description="This will remove this health event from your chronological care history. This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
};
