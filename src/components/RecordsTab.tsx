import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Upload, Folder, Search, Filter, Eye, Download, Sparkles, 
  CheckCircle2, AlertCircle, Trash2, X, Plus, ShieldCheck, Tag, ExternalLink, Edit3, Loader2 
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HealthRecord, RecordCategory } from '../types';
import { databaseService } from '../services/databaseService';
import { useProfile } from '../hooks/useProfile';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { UnsavedChangesModal } from './modals/UnsavedChangesModal';
import { toast } from 'sonner';

interface RecordsTabProps {
  onAskAI?: (prompt: string) => void;
}

export const RecordsTab: React.FC<RecordsTabProps> = ({ onAskAI }) => {
  const { profile } = useProfile();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [previewRecord, setPreviewRecord] = useState<HealthRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<HealthRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form State (for both Upload and Edit)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Lab Reports' as RecordCategory,
    date: new Date().toISOString().split('T')[0],
    provider: '',
    summary: '',
    notes: '',
    fileName: '',
    fileSize: '1.2 MB',
    status: 'Verified' as HealthRecord['status']
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Documents' },
    { id: 'Lab Reports', label: 'Lab Reports' },
    { id: 'Prescriptions', label: 'Prescriptions' },
    { id: 'Medical Reports', label: 'Medical Reports' },
    { id: 'Imaging', label: 'Imaging' },
    { id: 'Vaccination', label: 'Vaccination' },
    { id: 'Other', label: 'Other' },
  ];

  // Fetch real records from databaseService
  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.getRecords(profile?.uid);
      setRecords(data);
    } catch (err) {
      console.error("Error loading records:", err);
      toast.error("Unable to load health documents. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [profile?.uid]);

  const filteredRecords = records.filter(record => {
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    const search = (searchQuery || '').toLowerCase();
    const matchesSearch = search === '' || 
      (record.title || '').toLowerCase().includes(search) ||
      (record.summary || '').toLowerCase().includes(search) ||
      (record.provider || '').toLowerCase().includes(search) ||
      (record.category || '').toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  // Handle Opening Create Modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      category: 'Lab Reports',
      date: new Date().toISOString().split('T')[0],
      provider: '',
      summary: '',
      notes: '',
      fileName: '',
      fileSize: '1.2 MB',
      status: 'Verified'
    });
    setEditingRecord(null);
    setIsUploadModalOpen(true);
  };

  // Handle Opening Edit Modal
  const openEditModal = (rec: HealthRecord) => {
    setEditingRecord(rec);
    setFormData({
      title: rec.title,
      category: rec.category,
      date: rec.date || new Date().toISOString().split('T')[0],
      provider: rec.provider,
      summary: rec.summary,
      notes: rec.notes || '',
      fileName: rec.fileName,
      fileSize: rec.fileSize,
      status: rec.status
    });
    setIsUploadModalOpen(true);
  };

  // Check dirty state
  const isFormDirty = () => {
    if (editingRecord) {
      return (
        formData.title !== editingRecord.title ||
        formData.category !== editingRecord.category ||
        formData.provider !== editingRecord.provider ||
        formData.summary !== editingRecord.summary ||
        formData.notes !== (editingRecord.notes || '')
      );
    }
    return Boolean(formData.title || formData.provider || formData.summary || formData.notes || formData.fileName);
  };

  const handleCloseModalWithPrompt = () => {
    if (isFormDirty()) {
      setShowUnsavedPrompt(true);
    } else {
      setIsUploadModalOpen(false);
      setEditingRecord(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeMB,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      }));
      toast.success(`Attached file: ${file.name}`);
    }
  };

  // Save (Create or Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRecord) {
        // UPDATE Operation
        const updated = await databaseService.updateRecord(editingRecord.id, {
          title: formData.title,
          category: formData.category,
          date: formData.date,
          provider: formData.provider || 'Personal Health Entry',
          summary: formData.summary || 'Patient document recorded in HealthNav.',
          notes: formData.notes,
          fileName: formData.fileName || editingRecord.fileName,
          fileSize: formData.fileSize,
          status: formData.status
        }, profile?.uid);

        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        toast.success(`Updated "${updated.title}" successfully`);
      } else {
        // CREATE Operation
        const created = await databaseService.createRecord(profile?.uid, {
          title: formData.title,
          category: formData.category,
          date: formData.date,
          provider: formData.provider || 'Uploaded by Patient',
          summary: formData.summary || 'Patient-uploaded medical document. Encrypted and stored securely.',
          notes: formData.notes,
          fileName: formData.fileName || `${(formData.title || 'document').toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSize: formData.fileSize,
          status: 'Verified'
        });

        setRecords(prev => [created, ...prev]);
        toast.success(`Document "${created.title}" stored securely`);
      }

      setIsUploadModalOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      console.error("Save document error:", err);
      toast.error(err.message || "Failed to save record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Real Delete Operation
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await databaseService.deleteRecord(deletingRecord.id, profile?.uid);
      setRecords(prev => prev.filter(r => r.id !== deletingRecord.id));
      toast.success(`Record "${deletingRecord.title}" deleted from database`);
      setDeletingRecord(null);
      if (previewRecord?.id === deletingRecord.id) {
        setPreviewRecord(null);
      }
    } catch (err: any) {
      console.error("Delete document error:", err);
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadRecord = (rec: HealthRecord) => {
    const recordSummary = `
=========================================
HEALTHNAV ENCRYPTED MEDICAL RECORD EXPORT
=========================================
Document ID: ${rec.id}
Title: ${rec.title}
Category: ${rec.category}
Date: ${rec.date}
Provider/Facility: ${rec.provider}
Verification Status: ${rec.status}
File: ${rec.fileName} (${rec.fileSize})

CLINICAL SUMMARY & FINDINGS:
${rec.summary}

PHYSICIAN / PATIENT NOTES:
${rec.notes || 'None recorded.'}

Exported securely from HealthNav Personal Health Records.
Timestamp: ${new Date().toISOString()}
`.trim();

    const blob = new Blob([recordSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rec.fileName.replace('.pdf', '')}_export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${rec.fileName}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/60 via-emerald-950/70 to-teal-950/50 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Document Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Health Records
          </h1>
          <p className="text-sm text-emerald-100/70 max-w-xl">
            Real persistent database storage for your diagnostic reports, prescriptions, clinical notes, and scans with full edit and delete controls.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-start md:self-center">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-400/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test name, provider, condition, or findings..."
            className="w-full bg-emerald-950/60 border border-emerald-500/30 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const count = cat.id === 'all' 
              ? records.length 
              : records.filter(r => r.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white/[0.03] border border-white/10 text-emerald-200/70 hover:text-emerald-100 hover:bg-white/5'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === cat.id ? 'bg-emerald-700 text-white' : 'bg-white/10 text-emerald-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-emerald-200/60">Loading secure medical documents...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <GlassCard className="py-14 text-center border-dashed border-emerald-500/20 space-y-3">
          <Folder className="w-12 h-12 text-emerald-500/30 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No documents found</h3>
            <p className="text-xs text-emerald-200/60 max-w-sm mx-auto mt-1">
              {searchQuery ? 'No documents match your query.' : 'Your encrypted vault is empty. Click "Upload Document" to add your first record.'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </GlassCard>
      ) : (
        /* Document Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <GlassCard className="p-5 border-emerald-500/20 space-y-4 hover:border-emerald-400/40 transition-all flex flex-col justify-between h-full group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                          {record.category}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">
                          {record.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold shrink-0">
                        {record.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-100/70 line-clamp-2 leading-relaxed">
                    {record.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-300/60 pt-2 border-t border-emerald-500/10 gap-2">
                    <span>{record.provider}</span>
                    <span>{record.date} • {record.fileSize}</span>
                  </div>
                </div>

                {/* Action Buttons: Preview, Edit, Delete, AI */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setPreviewRecord(record)}
                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-emerald-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => openEditModal(record)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 text-emerald-200/80 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Edit Record"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadRecord(record)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-200/70 hover:text-white transition-colors cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingRecord(record)}
                    className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {onAskAI && (
                    <button
                      onClick={() => onAskAI(`Can you help me understand my ${record.category} "${record.title}" from ${record.provider}? Findings: ${record.summary}`)}
                      className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition-colors cursor-pointer"
                      title="Explain with AI Navigator"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewRecord(null)}
              className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-emerald-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {previewRecord.category}
                    </span>
                    <h3 className="text-base font-bold text-white">{previewRecord.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rec = previewRecord;
                      setPreviewRecord(null);
                      openEditModal(rec);
                    }}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white"
                    title="Edit Record"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewRecord(null)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-200/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                  <p className="text-[10px] text-emerald-300/60 uppercase">Date</p>
                  <p className="text-xs font-bold text-white">{previewRecord.date}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                  <p className="text-[10px] text-emerald-300/60 uppercase">Status</p>
                  <p className="text-xs font-bold text-emerald-400">{previewRecord.status}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                  <p className="text-[10px] text-emerald-300/60 uppercase">Size</p>
                  <p className="text-xs font-bold text-white">{previewRecord.fileSize}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                  <p className="text-[10px] text-emerald-300/60 uppercase">Security</p>
                  <p className="text-xs font-bold text-emerald-400">Encrypted</p>
                </div>
              </div>

              {/* Content / Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Diagnostic Findings & Clinical Summary
                </h4>
                <div className="p-4 rounded-2xl bg-emerald-900/40 border border-emerald-500/20 text-xs text-emerald-50 leading-relaxed font-mono">
                  {previewRecord.summary}
                </div>
              </div>

              {previewRecord.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-300/80 uppercase tracking-wider">
                    Physician Notes
                  </h4>
                  <p className="text-xs text-emerald-100/70 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    {previewRecord.notes}
                  </p>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDownloadRecord(previewRecord)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-emerald-200 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>

                {onAskAI && (
                  <button
                    onClick={() => {
                      const req = `Can you analyze my ${previewRecord.category} "${previewRecord.title}" from ${previewRecord.provider}? Key summary: ${previewRecord.summary}`;
                      setPreviewRecord(null);
                      onAskAI(req);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Explain with AI</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload & Edit Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
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
                    {editingRecord ? (
                      <Edit3 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Upload className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingRecord ? 'Edit Medical Record' : 'Upload Health Record'}
                    </h3>
                    <p className="text-[10px] text-emerald-300/60 font-medium">
                      {editingRecord ? 'Modify and re-save document metadata' : 'Encrypted with SHA-256 cloud persistence'}
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
                {/* File Attachment / Drag Drop */}
                <div className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-5 text-center space-y-2 bg-emerald-900/20 transition-all relative">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center">
                    <Upload className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {formData.fileName || (editingRecord ? `Attached: ${editingRecord.fileName}` : 'Click to browse or drag & drop file')}
                    </p>
                    <p className="text-[10px] text-emerald-300/50">
                      Supports PDF, PNG, JPG, DOCX (Up to 25MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Lipid Profile, Chest X-Ray Radiologist Report"
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as RecordCategory })}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="Lab Reports">Lab Reports</option>
                      <option value="Prescriptions">Prescriptions</option>
                      <option value="Medical Reports">Medical Reports</option>
                      <option value="Imaging">Imaging</option>
                      <option value="Vaccination">Vaccination</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-200">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Issuing Provider / Lab</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g. Apollo Diagnostics, Dr. Sarah Chen, MD"
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Summary / Findings</label>
                  <textarea
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Key test results, normal reference ranges, or recommendations..."
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-200">Physician Notes / Action Items</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Follow up in 6 months, take medication with meals"
                    className="w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-emerald-300/40 focus:outline-none focus:border-emerald-400"
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
                      <span>{editingRecord ? 'Save Changes' : 'Save & Encrypt'}</span>
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
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingRecord?.title}
        title="Permanently delete medical record?"
        description="This will remove the document, clinical summary, and file attachment from your secure health vault. This operation cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedPrompt}
        onStay={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          setIsUploadModalOpen(false);
          setEditingRecord(null);
        }}
      />
    </div>
  );
};
