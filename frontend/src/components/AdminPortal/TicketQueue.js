'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import TicketWorkbench from './TicketWorkbench';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
  ChevronRight,
  Flame,
  Radio,
  BarChart3,
  Lock,
  Paperclip,
  X
} from 'lucide-react';

const OFFICIAL_CATEGORIES = [
  'ALL',
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES = ['ALL', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function TicketQueue() {
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sortOption, setSortOption] = useState('urgent_first');

  const { user, role, switchUser, testAccounts, logoutAdmin } = useAuth();
  const { lastEvent } = useRealtime();

  const loadData = async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      const [ticketsRes, analyticsRes] = await Promise.all([
        api.admin.getTickets({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          urgent: urgentOnly,
          search: searchTerm,
          sort: sortOption
        }),
        api.admin.getAnalytics()
      ]);
      setTickets(ticketsRes.tickets || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      if (!err.isNetworkError) {
        console.warn('Sync admin queue:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, urgentOnly, searchTerm, sortOption]);

  // Real-time SSE updates
  useEffect(() => {
    if (!lastEvent) return;
    loadData();
  }, [lastEvent]);

  // Periodic auto-sync every 4 seconds so queries and status changes always sync without refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, categoryFilter, priorityFilter, urgentOnly, searchTerm, sortOption, role]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Live Operational Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                Operations Ticket Queue
              </h1>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#eb586f] border border-rose-200">
                <span className="live-pulse-dot" />
                <span>Live Queue Stream</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Incoming author queries triaged by AI Copilot. The oldest and most urgent unresolved queries are prioritized.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Quick Filter: Urgent & High Toggle */}
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                urgentOnly
                  ? 'bg-red-600 text-white shadow-red-200'
                  : 'bg-white text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200'
              }`}
            >
              <Flame className={`w-4 h-4 ${urgentOnly ? 'text-white' : 'text-red-500'}`} />
              <span>{urgentOnly ? 'Showing Urgent & High' : 'Filter Urgent & High'}</span>
            </button>

            {/* Lock Portal Button */}
            <button
              onClick={logoutAdmin}
              title="Lock Admin Operations Portal"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bookleaf-card p-4 sm:p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Queue
              </span>
              <div className="text-2xl font-bold text-slate-900 font-heading">
                {analytics.total || 0}
              </div>
              <span className="text-[11px] text-slate-400">All lifetime tickets</span>
            </div>

            <div className="bookleaf-card p-4 sm:p-5 bg-blue-50/40 border-blue-200">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Open Backlog
              </span>
              <div className="text-2xl font-extrabold text-blue-800 font-heading">
                {analytics.open || 0}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Awaiting response</span>
            </div>

            <div className="bookleaf-card p-4 sm:p-5 bg-purple-50/40 border-purple-200">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-1">
                In Progress
              </span>
              <div className="text-2xl font-extrabold text-purple-800 font-heading">
                {analytics.inProgress || 0}
              </div>
              <span className="text-[11px] text-purple-600 font-medium">Under active review</span>
            </div>

            <div className="bookleaf-card p-4 sm:p-5 bg-red-50/50 border-red-200">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <span className="urgent-pulse-dot" />
                Urgent & Critical
              </span>
              <div className="text-2xl font-extrabold text-red-700 font-heading">
                {analytics.urgentCount || 0}
              </div>
              <span className="text-[11px] text-red-600 font-medium">SLA Priority</span>
            </div>

            <div className="bookleaf-card p-4 sm:p-5 bg-emerald-50/40 border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Resolved & Closed
              </span>
              <div className="text-2xl font-extrabold text-emerald-800 font-heading">
                {(analytics.resolved || 0) + (analytics.closed || 0)}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Satisfied authors</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bookleaf-card p-4 sm:p-5 space-y-4 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-[#334460]">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ticket ID, subject, author name, or book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-[#334460] text-xs text-slate-900 dark:text-white bg-white dark:bg-[#080d18] focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
            >
              {OFFICIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>Category: {c}</option>
              ))}
            </select>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>Priority: {p}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#334460] bg-white dark:bg-[#080d18] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#eb586f]"
            >
              <option value="urgent_first">Sort: Urgent & Oldest First</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

        </div>
      </div>

      {/* Ticket Queue List / Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="bookleaf-card p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-rose-200 border-t-[#eb586f] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading queue tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bookleaf-card p-12 text-center bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-[#334460]">
            <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Ticket Queue is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              There are no support tickets in the system yet. When an author raises a query, it will be auto-classified by AI and appear here in real time.
            </p>
          </div>
        ) : (
          tickets.map((t) => {
            const isCritical = t.priority === 'Critical';
            const isHigh = t.priority === 'High';
            const isUrgent = (isCritical || isHigh) && (t.status === 'Open' || t.status === 'In Progress');

            return (
              <div
                key={t.ticket_id}
                onClick={() => setSelectedTicketId(t.ticket_id)}
                className={`bookleaf-card p-5 cursor-pointer border transition-all ${
                  isUrgent
                    ? 'border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-950/30 hover:border-red-500 hover:shadow-md'
                    : 'border-slate-300 dark:border-[#334460] hover:border-rose-300 dark:hover:border-[#ff5c75] hover:shadow-md'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: ID, Urgency, Meta */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Urgency Pulse for Critical/Urgent */}
                      {isUrgent && (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 uppercase">
                          <span className="urgent-pulse-dot" />
                          Urgent SLA
                        </span>
                      )}

                      <span className="text-xs font-mono font-bold text-[#eb586f] dark:text-[#ff5c75]">
                        #{t.ticket_id}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'Open'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : t.status === 'In Progress'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {t.status}
                      </span>

                      {/* Priority Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.priority === 'Critical'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : t.priority === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : t.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        Priority: {t.priority}
                      </span>

                      {/* AI Classification Category Badge */}
                      <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-700">
                        {t.category}
                      </span>

                      {/* Attachment Indicator Badge */}
                      {t.attachment_name && (
                        <span className="flex items-center gap-1 text-[11px] bg-rose-50 dark:bg-rose-950/60 text-[#eb586f] dark:text-[#ff5c75] px-2.5 py-0.5 rounded-full font-semibold border border-rose-200 dark:border-rose-500/40">
                          <Paperclip className="w-3 h-3" />
                          <span>File Attached</span>
                        </span>
                      )}
                    </div>

                    {/* Subject & Author Info */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
                        {t.subject}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                        {t.author_name}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                        {t.book_title || 'General Account Level'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(t.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Assigned Pill & Action Button */}
                  <div className="flex items-center gap-4 self-end lg:self-center">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Assigned to</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.assigned_to || 'Unassigned'}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedTicketId(t.ticket_id)}
                      className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
                    >
                      <span>Open Workbench</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Overlay for Ticket Workbench */}
      {selectedTicketId && (
        <div
          onClick={() => setSelectedTicketId(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl cursor-default"
          >
            <TicketWorkbench
              ticketId={selectedTicketId}
              onClose={(result) => {
                setSelectedTicketId(null);
                if (result?.message) {
                  showToast(result.message);
                }
                loadData();
              }}
              onTicketUpdated={() => loadData()}
            />
          </div>
        </div>
      )}

      {/* Floating Success Toast on Admin Home Page */}
      {toastMessage && (
        <div className="fixed top-24 right-6 sm:right-10 z-50 bg-emerald-950 text-white border-2 border-emerald-400 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-800/80 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/60 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">{toastMessage}</p>
            <p className="text-[11px] text-emerald-300/80 font-medium">Live sync broadcasted to author dashboard.</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-300/60 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
