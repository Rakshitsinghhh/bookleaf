'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Radio,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Filter,
  X,
  ExternalLink,
  Download,
  FileImage,
  Paperclip
} from 'lucide-react';

export default function MyTickets({ authorId, activeTicketId, newTicket, onSelectTicket }) {
  const [tickets, setTickets] = useState(() => (newTicket ? [newTicket] : []));
  const [selectedTicket, setSelectedTicket] = useState(() => newTicket || null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(() => !newTicket);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { lastEvent, connected } = useRealtime();

  // Load author tickets
  const loadTickets = async () => {
    try {
      const res = await api.tickets.getMyTickets(authorId);
      const serverTickets = res.tickets || [];
      setTickets((prev) => {
        if (newTicket && !serverTickets.some((t) => t.ticket_id === newTicket.ticket_id)) {
          return [newTicket, ...serverTickets];
        }
        return serverTickets;
      });

      // Only open activeTicketId if it actually exists in the database
      if (activeTicketId) {
        const ticketExists = serverTickets.some((t) => t.ticket_id === activeTicketId);
        if (ticketExists) {
          openTicketDetail(activeTicketId);
        } else {
          // If the ticket was deleted or database was reset, safely reset selection
          setSelectedTicket(null);
          setTicketDetail(null);
          if (onSelectTicket) onSelectTicket(null);
        }
      }
    } catch (err) {
      if (!err.isNetworkError) {
        console.warn('Sync tickets:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [authorId, activeTicketId]);

  // Periodic auto-sync every 4 seconds (guarantees zero refresh needed)
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets();
    }, 4000);
    return () => clearInterval(interval);
  }, [authorId]);

  // Reactive instant prepend when a new ticket is submitted
  useEffect(() => {
    if (newTicket) {
      setTickets((prev) => {
        const filtered = prev.filter((t) => t.ticket_id !== newTicket.ticket_id);
        return [newTicket, ...filtered];
      });
      openTicketDetail(newTicket.ticket_id);
      setLoading(false);
    }
  }, [newTicket]);

  // Real-time SSE updates: update tickets without refreshing
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'ticket_created') {
      const created = lastEvent.data;
      if (created && (!authorId || created.author_id === authorId)) {
        setTickets((prev) => {
          const exists = prev.some((t) => t.ticket_id === created.ticket_id);
          if (exists) return prev;
          return [created, ...prev];
        });
      }
      loadTickets();
      if (created?.ticket_id) {
        openTicketDetail(created.ticket_id);
      }
    } else if (lastEvent.type === 'ticket_updated') {
      loadTickets();
      if (selectedTicket && selectedTicket.ticket_id === lastEvent.data?.ticket_id) {
        openTicketDetail(selectedTicket.ticket_id);
      }
    } else if (lastEvent.type === 'new_message') {
      loadTickets();
      if (selectedTicket && selectedTicket.ticket_id === lastEvent.data?.ticket?.ticket_id) {
        openTicketDetail(selectedTicket.ticket_id);
      }
    }
  }, [lastEvent]);

  const openTicketDetail = async (ticketId) => {
    if (!ticketId) return;
    try {
      const res = await api.tickets.getDetail(ticketId);
      setSelectedTicket(res.ticket);
      setTicketDetail(res);
      if (onSelectTicket) onSelectTicket(ticketId);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found')) {
        setSelectedTicket(null);
        setTicketDetail(null);
        if (onSelectTicket) onSelectTicket(null);
      } else if (!err.isNetworkError) {
        console.warn('Could not load ticket detail:', err.message);
      }
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      await api.tickets.sendMessage(selectedTicket.ticket_id, replyText.trim(), false);
      setReplyText('');
      // Refresh conversation
      await openTicketDetail(selectedTicket.ticket_id);
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              My Support Tickets
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="live-pulse-dot" />
              <span>Real-Time Sync Active</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track tickets, communicate with BookLeaf operations leads, and receive instant updates without refreshing.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-white text-[#eb586f] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: List on left, details on right if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ticket List Column */}
        <div className={`${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          {loading ? (
            <div className="bookleaf-card p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-rose-200 border-t-[#eb586f] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bookleaf-card p-12 text-center bg-white border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800 font-heading">No tickets found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'ALL'
                  ? `You have no tickets currently in ${statusFilter} status.`
                  : 'You have not submitted any support tickets yet. When you raise a query, you can track responses here in real time.'}
              </p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.ticket_id === t.ticket_id;
              const isResolved = t.status === 'Resolved' || t.status === 'Closed';

              return (
                <div
                  key={t.ticket_id}
                  onClick={() => openTicketDetail(t.ticket_id)}
                  className={`bookleaf-card p-5 cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-[#eb586f] dark:border-[#ff5c75] ring-2 ring-[#eb586f]/30 bg-rose-50/30 dark:bg-rose-950/30 shadow-md'
                      : 'border-slate-300 dark:border-[#334460] hover:border-rose-300 dark:hover:border-[#ff5c75] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-[#eb586f] dark:text-[#ff5c75]">
                      #{t.ticket_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      t.status === 'Open'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : t.status === 'In Progress'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {t.subject}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-[#23344e]">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md font-medium border border-slate-200 dark:border-slate-700">
                        {t.category}
                      </span>
                      {t.attachment_name && (
                        <span className="text-[10px] text-rose-600 dark:text-[#ff5c75] font-semibold flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />
                          <span>File</span>
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Ticket Conversation Drawer / View */}
        {selectedTicket && ticketDetail && (
          <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-[#334460] rounded-2xl shadow-xl p-6 flex flex-col h-[750px] animate-in fade-in-50 duration-200">
            
            {/* Drawer Header */}
            <div className="pb-4 border-b border-slate-200 dark:border-[#23344e] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#eb586f] dark:text-[#ff5c75]">
                    #{selectedTicket.ticket_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedTicket.status === 'Open'
                      ? 'bg-blue-100 text-blue-700'
                      : selectedTicket.status === 'In Progress'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-medium border border-slate-200 dark:border-slate-700">
                    {selectedTicket.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {selectedTicket.subject}
                </h2>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Book: <strong className="text-slate-900 dark:text-white">{selectedTicket.book_title || 'General Account Level'}</strong>
                </div>

                {/* Attached File Card */}
                {selectedTicket.attachment_name && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-[#eb586f] flex items-center justify-center">
                        {selectedTicket.attachment_url?.startsWith('data:image/') || selectedTicket.attachment_name.match(/\.(png|jpe?g|webp|gif|bmp)$/i)
                          ? <FileImage className="w-3.5 h-3.5" />
                          : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {selectedTicket.attachment_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={selectedTicket.attachment_url && selectedTicket.attachment_url.startsWith('data:') ? selectedTicket.attachment_url : api.tickets.getAttachmentUrl(selectedTicket.ticket_id, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#080d18] border border-slate-300 dark:border-[#334460] text-slate-700 dark:text-slate-200 hover:text-[#eb586f]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                      <a
                        href={api.tickets.getAttachmentUrl(selectedTicket.ticket_id, true)}
                        download={selectedTicket.attachment_name}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#eb586f] text-white hover:bg-[#d9445b]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                title="Close conversation"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-[#ff5c75] border border-slate-300 dark:border-[#334460] hover:border-rose-300 dark:hover:border-[#ff5c75] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {ticketDetail.messages?.map((msg) => {
                const isAdmin = msg.sender_role === 'admin' || msg.is_ai_assisted === 1 || msg.sender_id?.startsWith('ADM');

                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[11px] font-bold flex items-center gap-1.5">
                        {isAdmin ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-[#eb586f] dark:text-[#ff5c75] flex items-center justify-center border border-rose-200 dark:border-rose-500/40">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-slate-900 dark:text-white font-bold">
                              {msg.sender_name || 'BookLeaf Support Operations'}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-extrabold tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/50">
                              Support Lead
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-slate-900 dark:text-white font-semibold">
                              {msg.sender_name || 'Author'}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              You
                            </span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                        isAdmin
                          ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border-2 border-slate-200 dark:border-[#334460] border-l-4 border-l-[#eb586f] rounded-tl-sm'
                          : 'bg-gradient-to-r from-[#eb586f] to-[#f47285] text-white rounded-tr-sm font-medium shadow-md shadow-rose-200/40'
                      }`}
                    >
                      {msg.message}
                    </div>

                    {isAdmin && (
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 px-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#eb586f] dark:text-[#ff5c75]" />
                        <span className="font-medium">
                          {msg.is_ai_assisted === 1
                            ? 'AI-grounded response verified by BookLeaf Operations'
                            : 'Official response from BookLeaf Operations'}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}

            </div>

            {/* Reply Input Box */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#23344e]">
              {selectedTicket.status === 'Closed' ? (
                <div className="p-3 bg-slate-50 dark:bg-[#080d18] rounded-xl text-center text-xs text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-[#334460]">
                  This ticket has been marked as Closed. You can raise a new query if you have further questions.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a follow-up message to BookLeaf operations..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334460] text-xs text-slate-900 dark:text-white bg-white dark:bg-[#080d18] focus:outline-none focus:ring-2 focus:ring-[#eb586f]/30 focus:border-[#eb586f]"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-primary text-xs px-5 py-2.5"
                  >
                    {sendingReply ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
