'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  UploadCloud,
  HelpCircle,
  Clock,
  ShieldAlert,
  Eye,
  FileImage,
  FolderOpen
} from 'lucide-react';

export default function SubmitTicket({ authorId, initialBookId = 'GENERAL', onTicketSubmitted }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(initialBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);
  const [attachmentName, setAttachmentName] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [attachmentSize, setAttachmentSize] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState(null);

  // Load author's books to populate dropdown
  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await api.books.getMyBooks(authorId);
        setBooks(res.books || []);
      } catch (err) {
        console.error('Error loading books for ticket dropdown:', err);
      }
    }
    loadBooks();
  }, [authorId]);

  useEffect(() => {
    if (initialBookId) {
      setSelectedBook(initialBookId);
    }
  }, [initialBookId]);

  const processSelectedFile = (file) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('Attachment exceeds 25MB limit. Please attach a smaller file.');
      return;
    }

    setError(null);
    setAttachmentName(file.name);
    setAttachmentType(file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'));
    setAttachmentSize((file.size / 1024).toFixed(1) + ' KB');

    // Revoke previous object URL if any
    if (attachmentPreviewUrl && attachmentPreviewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(attachmentPreviewUrl); } catch (e) {}
    }

    // Synchronous instant object URL for 0ms preview
    try {
      const objUrl = URL.createObjectURL(file);
      setAttachmentPreviewUrl(objUrl);
    } catch (e) {
      console.warn('URL.createObjectURL failed:', e);
    }

    // Read as Base64 Data URL for submitting payload to backend
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAttachmentUrl(uploadEvent.target.result);
    };
    reader.onerror = () => {
      console.error('FileReader error reading attached file');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // Reset target value so selecting the exact same file in future triggers onChange reliably
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    if (attachmentPreviewUrl && attachmentPreviewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(attachmentPreviewUrl); } catch (e) {}
    }
    setAttachmentName(null);
    setAttachmentUrl(null);
    setAttachmentPreviewUrl(null);
    setAttachmentType(null);
    setAttachmentSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject line for your query.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your query in detail.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.tickets.submit({
        book_id: selectedBook,
        subject: subject.trim(),
        description: description.trim(),
        attachment_name: attachmentName,
        attachment_url: attachmentUrl
      });

      setSubmissionResult(response);
      setSubject('');
      setDescription('');
      handleRemoveAttachment();

      if (onTicketSubmitted) {
        onTicketSubmitted(response.ticket);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
          Submit a Support Query
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Have questions about your royalties, ISBN, printing quality, or distribution? Our operations team and AI support copilot are here to assist.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {submissionResult && (
        <div className="bg-white dark:bg-[#0f172a] border-2 border-emerald-400 dark:border-emerald-500 rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-300 dark:border-emerald-500/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  Ticket #{submissionResult.ticket.ticket_id} Raised Successfully!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Your ticket has been logged into our queue and classified by BookLeaf AI Copilot.
                </p>
              </div>

              {/* AI Auto-Classification & Priority Card */}
              <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-500/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#eb586f] dark:text-[#ff5c75]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Auto-Classification & Triage Assessment</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white dark:bg-[#080d18] border border-rose-200 dark:border-rose-500/40 text-slate-900 dark:text-white px-3 py-1 rounded-full font-bold">
                    Category: <strong>{submissionResult.aiAnalysis.category}</strong>
                  </span>
                  <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    submissionResult.aiAnalysis.priority === 'Critical'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : submissionResult.aiAnalysis.priority === 'High'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    Priority: {submissionResult.aiAnalysis.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 italic font-medium">
                  "{submissionResult.aiAnalysis.reason}"
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onTicketSubmitted(submissionResult.ticket.ticket_id)}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  View in My Tickets
                </button>
                <button
                  onClick={() => setSubmissionResult(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Raise Another Query
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Form */}
      <div className="bookleaf-card p-6 sm:p-8 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-[#334460]">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Book Dropdown Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Which book is this query about? <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f] transition-all font-medium"
            >
              <option value="GENERAL">General / Account Level / Other Query</option>
              {books.map((b) => (
                <option key={b.book_id} value={b.book_id}>
                  {b.title} ({b.status}) {b.isbn ? `• ISBN: ${b.isbn}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Select specific title for faster resolution by our production and distribution leads.
            </p>
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. My royalty balance is missing for Q3 / Incorrect ISBN on Amazon"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-sm text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f] transition-all font-medium"
            />
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Please provide complete context (dates, platform names, copies involved, defect details) so our operations team can resolve this accurately..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#334460] text-sm text-slate-900 dark:text-white bg-white dark:bg-[#080d18] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f] transition-all font-medium"
            />
          </div>

          {/* File Attachment Support */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Attach Photos / Documents (Optional)
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">PNG, JPG, PDF up to 25MB</span>
            </div>

            {/* Native input accessible via label and ref */}
            <input
              ref={fileInputRef}
              id="ticket-attachment-input"
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt,.doc,.docx"
            />

            {attachmentName ? (
              /* PROMINENT VISUAL ATTACHMENT CARD (SHOWN IMMEDIATELY UPON SELECTION) */
              <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/50 border-2 border-emerald-500 rounded-2xl space-y-3 shadow-md animate-in fade-in zoom-in-95 duration-150">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border-2 border-emerald-400 shadow-sm flex-shrink-0">
                      {attachmentType?.startsWith('image/') || attachmentName.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/i) ? (
                        <FileImage className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                      ) : (
                        <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[260px] sm:max-w-md">
                          {attachmentName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs uppercase tracking-wider">
                          ✓ Attached
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5 font-medium">
                        {attachmentSize} • File selected and ready to submit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-700 dark:text-slate-200 hover:text-[#eb586f] hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#eb586f]" />
                      <span>Change File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-red-300 dark:border-red-900/60 bg-red-100/70 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-200 transition-all cursor-pointer shadow-2xs"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Instant Visual Image Thumbnail Preview */}
                {(attachmentType?.startsWith('image/') || attachmentName.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/i)) && (attachmentPreviewUrl || attachmentUrl) && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
                    <div className="rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-[#080d18] p-3 shadow-sm inline-block max-w-full">
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Instant Image Preview:</span>
                      </p>
                      <img
                        src={attachmentPreviewUrl || attachmentUrl}
                        alt="Selected Preview"
                        className="max-h-56 max-w-full object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* PDF Document Preview Card */}
                {(attachmentType?.includes('pdf') || attachmentName.match(/\.pdf$/i)) && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
                    <div className="p-3 bg-white dark:bg-[#080d18] rounded-xl border-2 border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-7 h-7 text-rose-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">PDF Document Attached ({attachmentName})</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Ready to upload with ticket for admin inspection</p>
                        </div>
                      </div>
                      {attachmentPreviewUrl && (
                        <a
                          href={attachmentPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#eb586f] border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open PDF Preview</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Documents Preview Card */}
                {!attachmentType?.startsWith('image/') && !attachmentName.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/i) && !attachmentType?.includes('pdf') && !attachmentName.match(/\.pdf$/i) && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
                    <div className="p-3 bg-white dark:bg-[#080d18] rounded-xl border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">File Attached: {attachmentName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Document ready for support investigation</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* PROMINENT UPLOAD DROPZONE USING NATIVE LABEL WRAPPER */
              <label
                htmlFor="ticket-attachment-input"
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) processSelectedFile(droppedFile);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all block ${
                  isDragOver
                    ? 'border-[#eb586f] bg-rose-50/70 dark:bg-rose-950/50 scale-[1.01]'
                    : 'border-slate-300 dark:border-[#334460] hover:border-rose-400 dark:hover:border-[#ff5c75] bg-slate-50/70 dark:bg-[#080d18] hover:bg-rose-50/30'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#eb586f] dark:text-[#ff5c75] mb-2" />
                <span className="text-sm font-bold text-slate-900 dark:text-white text-center">
                  Click to Browse or Drag & Drop Photos / Documents Here
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  Attach photos of defective books, receipts, or PDF documentation (up to 25MB)
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#101726] border border-slate-300 dark:border-[#334460] text-slate-800 dark:text-slate-200 shadow-2xs group-hover:border-rose-300">
                  <FolderOpen className="w-3.5 h-3.5 text-[#eb586f]" />
                  <span>Choose File from Computer</span>
                </span>
              </label>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#23344e] flex items-center justify-between">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#eb586f] dark:text-[#ff5c75]" />
              <span>AI copilot auto-classifies query into BookLeaf 6 support categories</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-6 py-2.5"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Copilot Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
