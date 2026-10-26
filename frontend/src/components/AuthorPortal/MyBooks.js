'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquarePlus,
  Building,
  Info
} from 'lucide-react';

const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Editing',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live'
];

export default function MyBooks({ authorId, onRaiseQueryForBook }) {
  const [data, setData] = useState({ books: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.books.getMyBooks(authorId);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, [authorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-[#eb586f] rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your BookLeaf catalog & royalty records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const { books, summary } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & KPI Stat Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              My Books & Royalties
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time sales, production milestones, and royalty calculation across all distribution platforms.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full border border-rose-200/60 font-medium self-start sm:self-auto">
            <Info className="w-3.5 h-3.5" />
            <span>80/20 Profit Split • Quarterly Payout Window: 45 Days</span>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bookleaf-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Titles</span>
              <BookOpen className="w-4 h-4 text-[#eb586f]" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-heading">
              {summary.totalBooks || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summary.publishedBooks || 0} Live • {summary.inProductionBooks || 0} In Production
            </div>
          </div>

          <div className="bookleaf-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Copies Sold</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-heading">
              {(summary.totalCopiesSold || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Across Amazon & BookLeaf
            </div>
          </div>

          <div className="bookleaf-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Royalty</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-heading">
              ₹{(summary.totalRoyaltyEarned || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Lifetime Net Royalty (80%)
            </div>
          </div>

          <div className="bookleaf-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Royalty Paid</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-700 font-heading">
              ₹{(summary.royaltyPaid || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-teal-600 font-medium mt-1">
              Disbursed via Bank Transfer
            </div>
          </div>

          <div className="bookleaf-card p-4 sm:p-5 col-span-2 lg:col-span-1 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/40 dark:to-[#0f172a] border-rose-200 dark:border-rose-500/50">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Pending Payout</span>
              <Clock className="w-4 h-4 text-[#eb586f]" />
            </div>
            <div className="text-2xl font-extrabold text-[#eb586f] font-heading">
              ₹{(summary.royaltyPending || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
              {summary.royaltyPending >= 1000 ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓ Above ₹1,000 payout mark</span>
              ) : summary.royaltyPending > 0 ? (
                <span className="text-amber-700 dark:text-amber-300 font-bold">Rolls over (&lt; ₹1,000 threshold)</span>
              ) : (
                <span>No pending balance</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Catalog Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          Published Catalog & In-Production Pipeline ({books.length})
        </h2>

        {books.length === 0 ? (
          <div className="bookleaf-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No books found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">No publishing records exist for this author account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {books.map((book) => {
              const inProd = book.isInProduction;
              const currentStage = book.status.replace('In Production - ', '');

              return (
                <div
                  key={book.book_id}
                  className="bookleaf-card p-6 relative overflow-hidden border border-slate-300 dark:border-[#334460] hover:border-rose-300 dark:hover:border-[#ff5c75] transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    
                    {/* Left: Book Meta Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                          inProd
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-500/60'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500/60'
                        }`}>
                          {book.status}
                        </span>

                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-700">
                          {book.genre || 'General'}
                        </span>

                        <span className="text-xs text-slate-500 dark:text-slate-300 font-mono font-medium">
                          ID: {book.book_id}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          ISBN: <span className="font-mono font-bold text-slate-900 dark:text-white">{book.isbn || 'Pending ISBN Assignment'}</span>
                          {book.publication_date && ` • Published on: ${book.publication_date}`}
                        </p>
                      </div>

                      {/* Edge Case: In Production Pipeline Stepper */}
                      {inProd ? (
                        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/50 rounded-2xl p-4 mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              Current Production Milestone: {currentStage}
                            </span>
                            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                              Estimated timeline: 5–7 business days
                            </span>
                          </div>

                          {/* Progress Stepper */}
                          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-center">
                            {PRODUCTION_STAGES.map((stage, idx) => {
                              const isPast = PRODUCTION_STAGES.indexOf(currentStage) > idx;
                              const isCurrent = currentStage.toLowerCase().includes(stage.toLowerCase());

                              return (
                                <div key={stage} className="flex flex-col items-center">
                                  <div
                                    className={`w-full h-2 rounded-full mb-1.5 transition-all ${
                                      isCurrent
                                        ? 'bg-amber-500 shadow-sm animate-pulse'
                                        : isPast
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                  />
                                  <span className={`text-[9px] truncate max-w-full font-semibold ${
                                    isCurrent ? 'text-amber-900 dark:text-amber-200 font-bold' : isPast ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {stage}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Published Info & Distribution Channels */
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>Print Partner: <strong>{book.print_partner || 'In-House (Delhi)'}</strong></span>
                          </div>

                          {book.available_on && book.available_on.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400">Available on:</span>
                              {book.available_on.map((store) => (
                                <span
                                  key={store}
                                  className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                                >
                                  {store}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Financial & Royalty Box */}
                    <div className="lg:w-80 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
                      {inProd ? (
                        <div className="text-center py-6 text-slate-500">
                          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700">Financials in Setup</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            MRP and royalty tracking activate once the title goes live on retail stores.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Retail Price (MRP)</span>
                            <span className="font-bold text-slate-900">₹{book.mrp}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Author Royalty / Copy</span>
                            <span className="font-bold text-emerald-700">₹{book.author_royalty_per_copy}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Total Copies Sold</span>
                            <span className="font-bold text-slate-900">{(book.total_copies_sold || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Total Royalty Earned</span>
                            <span className="font-bold text-indigo-700">₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Royalty Paid Out</span>
                            <span className="font-semibold text-teal-700">₹{(book.royalty_paid || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="font-bold text-[#eb586f]">Pending Royalty</span>
                            <span className="text-sm font-extrabold text-[#eb586f]">
                              ₹{(book.royalty_pending || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Rollover notification for edge cases under ₹1,000 */}
                          {book.royalty_pending > 0 && book.royalty_pending < 1000 && (
                            <div className="p-2 bg-amber-50 rounded-lg text-[10px] text-amber-800 border border-amber-200/80">
                              ⚠️ Pending balance is below ₹1,000 threshold; it will roll over to the next quarterly payout.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action: Raise query about this book */}
                      <button
                        onClick={() => onRaiseQueryForBook(book.book_id)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#eb586f] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        Raise Query for this Title
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
