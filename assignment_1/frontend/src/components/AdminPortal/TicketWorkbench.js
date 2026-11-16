'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Send,
  Lock,
  User,
  BookOpen,
  DollarSign,
  Clock,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Flag,
  FileText,
  UserCheck,
  X,
  ArrowLeft,
  Eye,
  Download,
  ExternalLink,
  Maximize2,
  FileImage,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const OFFICIAL_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function TicketWorkbench({ ticketId, onClose, onTicketUpdated }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [editableCategory, setEditableCategory] = useState('');
  const [editablePriority, setEditablePriority] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [status, setStatus] = useState('Open');
  const [assignedTo, setAssignedTo] = useState('');

  // Loading states
  const [savingClassification, setSavingClassification] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [notification, setNotification] = useState(null);

  // Attachment Viewer Modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const loadTicketDetail = async () => {
    setLoading(true);
    try {
      const res = await api.tickets.getDetail(ticketId);
      setData(res);
      setEditableCategory(res.ticket.category);
      setEditablePriority(res.ticket.priority);
      setDraftResponse(res.ticket.ai_draft_response || '');
      setStatus(res.ticket.status);
      setAssignedTo(res.ticket.assigned_to || '');
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found')) {
        if (onClose) onClose();
      } else if (!err.isNetworkError) {
        console.warn('Error loading ticket workbench:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicketDetail();
    }
  }, [ticketId]);

  // Close workbench on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Override AI Classification / Priority
  const handleUpdateClassification = async (newCat, newPri) => {
    setSavingClassification(true);
    try {
      const res = await api.admin.overrideClassification(ticketId, {
        category: newCat || editableCategory,
        priority: newPri || editablePriority
      });
      setEditableCategory(res.ticket.category);
      setEditablePriority(res.ticket.priority);
      showToast('AI Classification & Priority updated successfully!');
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert('Failed to override classification: ' + err.message);
    } finally {
      setSavingClassification(false);
    }
  };

  // 2. Regenerate AI Draft
  const handleRegenerateDraft = async () => {
    setRegeneratingDraft(true);
    try {
      const res = await api.admin.regenerateDraft(ticketId, {
        category: editableCategory,
        priority: editablePriority
      });
      setDraftResponse(res.aiDraftResponse);
      showToast('AI Draft response regenerated with fresh Knowledge Base policies.');
    } catch (err) {
      alert('Failed to regenerate draft: ' + err.message);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  // 3. Send Response to Author & Exit to Admin Home Page (Status applied on Send)
  const handleSendResponse = async () => {
    if (!draftResponse.trim()) {
      alert('Response message cannot be empty.');
      return;
    }

    setSendingResponse(true);
    try {
      const authorName = data?.ticket?.author_name || 'Author';
      // Apply status (e.g. 'Closed') upon pressing Send!
      await api.admin.sendMessage(ticketId, draftResponse.trim(), true, status);
      setDraftResponse('');
      if (onTicketUpdated) onTicketUpdated();
      // Exit workbench screen and return directly to admin home page
      if (onClose) {
        onClose({
          success: true,
          message: `✓ Response dispatched to ${authorName} and ticket marked as ${status}!`
        });
      }
    } catch (err) {
      alert('Failed to send response: ' + err.message);
      setSendingResponse(false);
    }
  };

  // 4. Update Status Immediately (Only if explicitly clicked "Apply Now")
  const handleApplyStatusNow = async (statusToApply) => {
    const target = statusToApply || status;
    try {
      await api.admin.updateStatus(ticketId, target);
      setStatus(target);
      showToast(`Ticket status updated to ${target}`);
      await loadTicketDetail();
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // 5. Assign Ticket
  const handleAssign = async (assignee) => {
    try {
      await api.admin.assignTicket(ticketId, assignee);
      setAssignedTo(assignee);
      showToast(`Ticket assigned to ${assignee}`);
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert('Failed to assign ticket: ' + err.message);
    }
  };

  // 6. Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await api.admin.addInternalNote(ticketId, internalNote.trim());
      setData((prev) => ({ ...prev, internalNotes: res.internalNotes }));
      setInternalNote('');
      showToast('Internal note saved (strictly private to ops team).');
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-[#eb586f] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Opening Ticket Workbench & loading author profile...</p>
      </div>
    );
  }

  const { ticket, messages, internalNotes } = data;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-2xl p-6 lg:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Action Bar with Back & Close Cross Buttons */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#eb586f] bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#eb586f]" />
          <span>← Back to Ticket Queue</span>
        </button>

        <button
          onClick={onClose}
          aria-label="Close"
          title="Close Workbench (Esc)"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 transition-all cursor-pointer shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-4 right-16 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-[#eb586f]">
              #{ticket.ticket_id}
            </span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              ticket.status === 'Open'
                ? 'bg-blue-100 text-blue-700'
                : ticket.status === 'In Progress'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {ticket.status}
            </span>
            <span className="text-xs text-slate-400">
              Created: {new Date(ticket.created_at).toLocaleString('en-IN')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading mt-1">
            {ticket.subject}
          </h2>
        </div>

        {/* Status & Assignment Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Staging Dropdown (Applies strictly on Send) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#080d18] p-1 rounded-xl border border-slate-300 dark:border-[#334460]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2">
              Status on Send:
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border-0 focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
              title="Select status to apply when you press Send"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s} {s !== data?.ticket?.status ? '(will apply on send)' : ''}
                </option>
              ))}
            </select>
            {status !== data?.ticket?.status && (
              <button
                type="button"
                onClick={() => handleApplyStatusNow(status)}
                title="Immediately apply this status change to ticket without sending message"
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-[#eb586f] border border-rose-200 cursor-pointer transition-colors"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Assign Dropdown */}
          <select
            value={assignedTo}
            onChange={(e) => handleAssign(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30"
          >
            <option value="">Unassigned</option>
            <option value="Ankit Verma (Ops Lead)">Ankit Verma (Ops Lead)</option>
            <option value="Pooja Iyer (Author Relations)">Pooja Iyer (Author Relations)</option>
            <option value={user?.name}>{user?.name} (Assign to me)</option>
          </select>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 cols): Ticket Content, AI Copilot & Response Composer */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Original Query & Author Inquiry Details */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Inquiry from: <strong>{ticket.author_name}</strong> ({ticket.author_email})
              </span>
              <span>Title: <strong>{ticket.book_title || 'General / Account'}</strong></span>
            </div>

            <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
              {ticket.description}
            </div>

            {ticket.attachment_name && (
              <div className="p-4 bg-gradient-to-r from-rose-50/90 via-white to-pink-50/60 dark:from-rose-950/40 dark:via-[#0b1322] dark:to-pink-950/30 rounded-2xl border-2 border-rose-200 dark:border-rose-500/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-[#eb586f] dark:text-[#ff5c75] flex items-center justify-center border border-rose-300 dark:border-rose-500/50 shadow-xs">
                      {ticket.attachment_url?.startsWith('data:image/') || ticket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)
                        ? <FileImage className="w-4 h-4" />
                        : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {ticket.attachment_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-[#eb586f] dark:text-[#ff5c75] uppercase">
                          Author File
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Uploaded with support query for verification
                      </span>
                    </div>
                  </div>

                  {/* Actions: View / New Tab / Download */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eb586f] hover:bg-[#d9445b] text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View File</span>
                    </button>

                    <a
                      href={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#eb586f] border border-slate-300 dark:border-[#334460] hover:border-rose-300 bg-white dark:bg-[#080d18] transition-all cursor-pointer"
                      title="Open file in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New Tab</span>
                    </a>

                    <a
                      href={api.tickets.getAttachmentUrl(ticket.ticket_id, true)}
                      download={ticket.attachment_name}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 border border-slate-300 dark:border-[#334460] hover:border-emerald-300 bg-white dark:bg-[#080d18] transition-all cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </div>
                </div>

                {/* Inline Visual Preview for Photos */}
                {(ticket.attachment_url?.startsWith('data:image/') || ticket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)) && (
                  <div
                    onClick={() => setShowAttachmentModal(true)}
                    className="relative group mt-2 max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-[#334460] bg-white dark:bg-[#080d18] cursor-pointer shadow-xs hover:border-[#eb586f] transition-all"
                  >
                    <img
                      src={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                      alt={ticket.attachment_name}
                      className="max-h-48 w-auto object-contain mx-auto p-1.5 transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                      <Maximize2 className="w-4 h-4" />
                      <span>Click to Inspect Full Photo</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI-Powered Auto-Classification & Priority Score Control */}
          <div className="p-5 bg-gradient-to-br from-rose-50/50 via-rose-50/20 to-pink-50/30 dark:from-rose-950/40 dark:via-[#0f172a] dark:to-pink-950/20 border-2 border-rose-200 dark:border-rose-500/50 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#eb586f] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Auto-Classification & Priority Engine</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                Admin Override Enabled
              </span>
            </div>

            {/* AI Reasoning pill */}
            <div className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-[#080d18] p-3 rounded-xl border border-rose-100 dark:border-rose-500/30 italic">
              AI Triage Reason: "{ticket.ai_priority_reason || 'Classified against BookLeaf operational policies.'}"
            </div>

            {/* Overrides row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Category (Override AI):
                </label>
                <select
                  value={editableCategory}
                  onChange={(e) => {
                    setEditableCategory(e.target.value);
                    handleUpdateClassification(e.target.value, editablePriority);
                  }}
                  disabled={savingClassification}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
                >
                  {OFFICIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Priority Score (Override AI):
                </label>
                <select
                  value={editablePriority}
                  onChange={(e) => {
                    setEditablePriority(e.target.value);
                    handleUpdateClassification(editableCategory, e.target.value);
                  }}
                  disabled={savingClassification}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
                >
                  {PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>{pri}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI-Drafted Response & Smart Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#eb586f]" />
                <span>AI-Drafted Response (BookLeaf Knowledge Base Grounded)</span>
              </label>

              <button
                type="button"
                onClick={handleRegenerateDraft}
                disabled={regeneratingDraft}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  regeneratingDraft
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-[#eb586f] dark:text-[#ff5c75] cursor-not-allowed opacity-90'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-[#eb586f] dark:text-[#ff5c75] hover:bg-rose-100 border border-rose-200 dark:border-rose-500/40 shadow-2xs'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${regeneratingDraft ? 'animate-spin text-[#eb586f]' : ''}`} />
                <span>{regeneratingDraft ? 'Regenerating AI Draft...' : 'Regenerate Draft'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              The response below is pre-drafted following BookLeaf tone guidelines (empathy, specific dates, 48-hr timeline, ownership of issues). You may edit freely before dispatching.
            </p>

            {/* Buffering Indicator for Draft Regeneration */}
            {regeneratingDraft && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-50/90 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-500/60 rounded-xl text-xs text-[#eb586f] dark:text-[#ff5c75] font-bold animate-pulse shadow-xs">
                <div className="w-4 h-4 border-2 border-[#eb586f] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>BookLeaf AI Copilot is synthesizing a fresh draft with Knowledge Base policies...</span>
              </div>
            )}

            <textarea
              rows={9}
              value={draftResponse}
              onChange={(e) => setDraftResponse(e.target.value)}
              placeholder="Edit AI drafted response or write a custom message for the author..."
              disabled={regeneratingDraft}
              className={`w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#334460] text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f] bg-slate-50/50 dark:bg-[#080d18] transition-opacity ${
                regeneratingDraft ? 'opacity-60 cursor-wait' : 'opacity-100'
              }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={status === 'Closed'}
                    onChange={(e) => setStatus(e.target.checked ? 'Closed' : (data?.ticket?.status === 'Closed' ? 'In Progress' : data?.ticket?.status || 'In Progress'))}
                    className="w-4 h-4 rounded text-[#eb586f] focus:ring-[#eb586f] cursor-pointer"
                  />
                  <span>Mark as Closed when sending response</span>
                </label>

                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {status === 'Closed'
                    ? '✓ Status will become Closed upon clicking send'
                    : `Status will be "${status}" upon clicking send`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendResponse}
                disabled={sendingResponse || !draftResponse.trim() || regeneratingDraft}
                className={`btn-primary text-xs px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  status === 'Closed'
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 shadow-md'
                    : ''
                }`}
              >
                {sendingResponse ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending & Returning to Home...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {status === 'Closed'
                        ? 'Send Response & Close Ticket'
                        : status === 'Resolved'
                        ? 'Send Response & Resolve'
                        : 'Send Response to Author'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#23344e]">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Thread History ({messages?.length || 0} messages)
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {messages?.map((m) => {
                const isAdmin = m.sender_role === 'admin' || m.is_ai_assisted === 1 || m.sender_id?.startsWith('ADM');

                return (
                  <div
                    key={m.message_id}
                    className={`p-3 rounded-xl text-xs border ${
                      isAdmin
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-500/60 text-indigo-950 dark:text-indigo-200 font-medium'
                        : 'bg-white dark:bg-[#080d18] border-slate-200 dark:border-[#334460] text-slate-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        <span>{m.sender_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                          isAdmin
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isAdmin ? 'BookLeaf Team' : 'Author'}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Author Intelligence & Internal Notes */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Author Context Intelligence Card */}
          <div className="p-5 bg-slate-50 dark:bg-[#080d18] rounded-2xl border border-slate-200 dark:border-[#334460] space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Author Profile & Publishing Context</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                <span className="text-slate-600 dark:text-slate-400">Author Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{ticket.author_name}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                <span className="text-slate-600 dark:text-slate-400">City</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{ticket.author_city || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                <span className="text-slate-600 dark:text-slate-400">Book Title</span>
                <span className="font-bold text-slate-900 dark:text-white">{ticket.book_title || 'General'}</span>
              </div>
              {ticket.book_isbn && (
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                  <span className="text-slate-600 dark:text-slate-400">Book ISBN</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{ticket.book_isbn}</span>
                </div>
              )}
              {ticket.book_status && (
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                  <span className="text-slate-600 dark:text-slate-400">Book Status</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{ticket.book_status}</span>
                </div>
              )}
              {ticket.total_copies_sold !== null && ticket.total_copies_sold !== undefined && (
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-[#23344e]">
                  <span className="text-slate-600 dark:text-slate-400">Total Copies Sold</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ticket.total_copies_sold}</span>
                </div>
              )}
              {ticket.royalty_pending !== null && ticket.royalty_pending !== undefined && (
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-[#eb586f]">Pending Royalty</span>
                  <span className="font-extrabold text-[#eb586f]">₹{ticket.royalty_pending}</span>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes Panel (STRICTLY OPS TEAM ONLY - HIDDEN FROM AUTHOR) */}
          <div className="p-5 bg-amber-50/50 dark:bg-amber-950/30 border-2 border-amber-200/90 dark:border-amber-500/60 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Internal Notes (Confidential)</span>
              </h3>
              <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full uppercase">
                Staff Only
              </span>
            </div>

            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Notes added here are only visible to BookLeaf operations admins and will <strong>never</strong> be shown to the author.
            </p>

            {/* Notes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {internalNotes?.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No internal notes added yet.</p>
              ) : (
                internalNotes?.map((note) => (
                  <div key={note.note_id} className="p-3 bg-white dark:bg-[#080d18] rounded-xl border border-amber-200 dark:border-amber-500/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                      <span>{note.admin_name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {new Date(note.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-100 font-medium">{note.note}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-2">
              <textarea
                rows={3}
                placeholder="Add confidential internal note (e.g. Verified bank IFSC, contacted Delhi print supervisor)..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-500/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-[#080d18]"
              />
              <button
                type="submit"
                disabled={addingNote || !internalNote.trim()}
                className="w-full py-2 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {addingNote ? 'Saving Note...' : '+ Add Internal Note'}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* High-Resolution Attachment Viewer Lightbox Modal */}
      {showAttachmentModal && ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-[#334460] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#23344e] flex items-center justify-between bg-slate-50 dark:bg-[#080d18]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-[#eb586f] flex items-center justify-center">
                  {ticket.attachment_url?.startsWith('data:image/') || ticket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)
                    ? <FileImage className="w-5 h-5" />
                    : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                    {ticket.attachment_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Attached to Ticket #{ticket.ticket_id} by {ticket.author_name}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {(ticket.attachment_url?.startsWith('data:image/') || ticket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)) && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#151f32] p-1 rounded-xl border border-slate-200 dark:border-[#334460] mr-2">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono px-1 font-semibold text-slate-700 dark:text-slate-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="text-[10px] font-semibold px-1.5 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}

                <a
                  href={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#101726] text-slate-700 dark:text-slate-200 hover:text-[#eb586f] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Window</span>
                </a>

                <a
                  href={api.tickets.getAttachmentUrl(ticket.ticket_id, true)}
                  download={ticket.attachment_name}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowAttachmentModal(false);
                    setZoomLevel(1);
                  }}
                  className="p-1.5 rounded-xl border border-slate-300 dark:border-[#334460] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-all cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-950/20 dark:bg-[#060a12] flex items-center justify-center min-h-[400px]">
              {(ticket.attachment_url?.startsWith('data:image/') || ticket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)) ? (
                <div className="overflow-auto max-h-[72vh] flex items-center justify-center p-2">
                  <img
                    src={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                    alt={ticket.attachment_name}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 origin-center bg-white dark:bg-[#0b1322]"
                  />
                </div>
              ) : (ticket.attachment_url?.startsWith('data:application/pdf') || ticket.attachment_name.match(/\.pdf$/i)) ? (
                <iframe
                  src={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                  title={ticket.attachment_name}
                  className="w-full h-[72vh] rounded-2xl border border-slate-300 dark:border-[#334460] bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    File ready to view or download.
                  </p>
                  <div className="flex justify-center gap-3">
                    <a
                      href={ticket.attachment_url && ticket.attachment_url.startsWith('data:') ? ticket.attachment_url : api.tickets.getAttachmentUrl(ticket.ticket_id, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs px-4 py-2"
                    >
                      Open in Browser
                    </a>
                    <a
                      href={api.tickets.getAttachmentUrl(ticket.ticket_id, true)}
                      download={ticket.attachment_name}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
