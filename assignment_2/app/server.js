import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;
const EXPECTED_API_KEY = process.env.N8N_WEBHOOK_SECRET || 'bk_live_7f8a9e2d4c1b';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load dataset
const dataFilePath = path.resolve(__dirname, '../data/bookleaf_sample_data.json');
let rawData = { authors: [] };

try {
  rawData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
} catch (err) {
  console.error('Error loading sample data:', err.message);
}

// In-memory data store
let authors = JSON.parse(JSON.stringify(rawData.authors));
let notificationLogs = [
  {
    log_id: 'LOG-INIT-001',
    author_id: 'AUTH001',
    author_name: 'Priya Sharma',
    author_email: 'priya.sharma@gmail.com',
    trigger_type: 'Manual Single',
    status: 'Success',
    generated_email_content: 'Subject: Your BookLeaf Royalty Summary & Catalog Update — Priya Sharma\n\nDear Priya Sharma,\n\nThank you for being a valued author with BookLeaf Publishing from Mumbai. Here is your latest catalog summary.\n\n📊 Performance Summary:\n• Total Published Books: 2\n• Lifetime Copies Sold: 531\n• Total Royalty Earned: ₹19,908\n• Total Royalty Paid: ₹16,338\n• Pending Balance: ₹3,570\n\n📅 Payout Schedule: Scheduled for direct bank transfer within the quarterly 45-day window.',
    sent_timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    error_message: null,
    idempotency_key: 'AUTH001-INIT'
  }
];

// Idempotency memory cache: { [key]: timestamp }
const idempotencyCache = new Map();

/**
 * Calculates badge and payout status for a book:
 * - Green: Fully paid (pending == 0)
 * - Yellow: Pending within normal cycle
 * - Red: Overdue (> 90 days since last payout, or > 90 days since pub with no payout)
 * - In Production: Stage notice
 */
function getBookBadge(book, referenceDate = new Date()) {
  if (book.status !== 'Published & Live') {
    return {
      type: 'in_production',
      label: book.status.replace('In Production - ', ''),
      color: 'purple',
      badgeClass: 'badge-production'
    };
  }

  const pending = Number(book.royalty_pending || 0);
  if (pending === 0) {
    return {
      type: 'fully_paid',
      label: 'Fully Paid',
      color: 'green',
      badgeClass: 'badge-green'
    };
  }

  const lastPayout = book.last_royalty_payout_date ? new Date(book.last_royalty_payout_date) : null;
  const pubDate = book.publication_date ? new Date(book.publication_date) : null;

  let isOverdue = false;
  let reason = '';

  if (lastPayout) {
    const daysSinceLast = Math.floor((referenceDate - lastPayout) / (1000 * 3600 * 24));
    if (daysSinceLast > 90) {
      isOverdue = true;
      reason = `Pending > 90 days since last payout (${daysSinceLast} days)`;
    }
  } else if (pubDate) {
    const daysSincePub = Math.floor((referenceDate - pubDate) / (1000 * 3600 * 24));
    if (daysSincePub > 90) {
      isOverdue = true;
      reason = `Published > 90 days ago with no payouts (${daysSincePub} days)`;
    }
  }

  if (isOverdue) {
    return {
      type: 'overdue',
      label: 'Overdue Payout',
      color: 'red',
      badgeClass: 'badge-red',
      reason
    };
  }

  return {
    type: 'pending_normal',
    label: 'Pending (In Cycle)',
    color: 'yellow',
    badgeClass: 'badge-yellow',
    reason: 'Within normal quarterly payout cycle'
  };
}

/**
 * Compute aggregate statistics for an author
 */
function enrichAuthor(author) {
  let totalSold = 0;
  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let hasOverdue = false;
  let hasPending = false;

  const enrichedBooks = (author.books || []).map(b => {
    const badge = getBookBadge(b);
    if (badge.type === 'overdue') hasOverdue = true;
    if (b.royalty_pending > 0) hasPending = true;

    totalSold += Number(b.total_copies_sold || 0);
    totalEarned += Number(b.total_royalty_earned || 0);
    totalPaid += Number(b.royalty_paid || 0);
    totalPending += Number(b.royalty_pending || 0);

    return {
      ...b,
      badge
    };
  });

  let overallStatus = 'Fully Paid';
  if (hasOverdue) {
    overallStatus = 'Overdue';
  } else if (hasPending || totalPending > 0) {
    overallStatus = 'Pending';
  }

  return {
    ...author,
    total_books: author.books.length,
    total_copies_sold: totalSold,
    total_royalty_earned: totalEarned,
    total_royalty_paid: totalPaid,
    total_royalty_pending: totalPending,
    overall_payout_status: overallStatus,
    books: enrichedBooks
  };
}

/**
 * High-quality deterministic AI Royalty Summary generator (grounded in Knowledge Base)
 */
function generateEmailContent(authorEnriched) {
  const now = new Date();
  const month = now.getMonth();
  let upcomingPayoutDate = 'May 15';
  let quarter = 'Q1';
  if (month >= 3 && month <= 5) { quarter = 'Q2'; upcomingPayoutDate = 'August 15'; }
  else if (month >= 6 && month <= 8) { quarter = 'Q3'; upcomingPayoutDate = 'November 15'; }
  else if (month >= 9 && month <= 11) { quarter = 'Q4'; upcomingPayoutDate = 'February 15'; }

  const published = authorEnriched.books.filter(b => b.status === 'Published & Live');
  const inProduction = authorEnriched.books.filter(b => b.status !== 'Published & Live');

  const bookRows = published.map(b => 
    `  • "${b.title}" (ISBN: ${b.isbn || 'Assigned'})\n    - Genre: ${b.genre}\n    - Copies Distributed: ${b.total_copies_sold}\n    - Royalty Earned: ₹${b.total_royalty_earned.toLocaleString('en-IN')}\n    - Already Disbursed: ₹${b.royalty_paid.toLocaleString('en-IN')}\n    - Current Pending: ₹${b.royalty_pending.toLocaleString('en-IN')} [Status: ${b.badge.label}]`
  ).join('\n\n');

  let productionSection = '';
  if (inProduction.length > 0) {
    productionSection = '\n\n⏳ Books Currently in Production Pipeline:\n' +
      inProduction.map(b => `  • "${b.title}": Currently undergoing ${b.status.replace('In Production - ', '')}. Our editorial and design teams are actively working on it.`).join('\n');
  }

  let payoutSection = '';
  if (authorEnriched.total_royalty_pending === 0) {
    payoutSection = `🎉 Congratulations! All royalties earned across your catalog are fully settled and paid up to date. Thank you for your continued commitment to sharing your stories with BookLeaf readers!`;
  } else if (authorEnriched.total_royalty_pending < 1000) {
    payoutSection = `💡 Royalty Balance Note: Your current pending royalty is ₹${authorEnriched.total_royalty_pending.toLocaleString('en-IN')}. Per BookLeaf's author agreement, royalties are transferred to your linked bank account once the minimum ₹1,000 threshold is reached. Your balance will securely roll over to the next quarter.`;
  } else if (authorEnriched.overall_payout_status === 'Overdue') {
    payoutSection = `⚠️ Action Underway: Our records show that an outstanding royalty balance of ₹${authorEnriched.total_royalty_pending.toLocaleString('en-IN')} has crossed our standard cycle. Our Senior Operations Team has been notified to expedite bank account reconciliation and initiate transfer.`;
  } else {
    payoutSection = `📅 Scheduled Payout Timeline: Your pending balance of ₹${authorEnriched.total_royalty_pending.toLocaleString('en-IN')} is scheduled for direct transfer to your linked bank account by ${upcomingPayoutDate} (within our standard 45-day post-quarter window).`;
  }

  return `Subject: Your BookLeaf Royalty Summary & Catalog Update — ${authorEnriched.name}

Dear ${authorEnriched.name},

Warm greetings from the BookLeaf Publishing author team! We are pleased to provide you with your comprehensive catalog performance and royalty summary statement.

📊 Catalog Performance Summary:
• Author ID: ${authorEnriched.author_id}
• Total Titles Registered: ${authorEnriched.total_books}
• Total Copies Distributed & Sold: ${authorEnriched.total_copies_sold.toLocaleString('en-IN')}
• Total Royalty Accrued: ₹${authorEnriched.total_royalty_earned.toLocaleString('en-IN')}
• Total Royalty Disbursed to Date: ₹${authorEnriched.total_royalty_paid.toLocaleString('en-IN')}
• Current Outstanding Balance: ₹${authorEnriched.total_royalty_pending.toLocaleString('en-IN')}

📚 Individual Book Breakdown:
${bookRows}${productionSection}

💰 Payout Status & Next Steps:
${payoutSection}

As always, author royalties are calculated at 80% of net profits following verified sales receipts across Amazon, Flipkart, and the BookLeaf Store. If you need any assistance or need to update your bank credentials, please reply to this email or submit a ticket through your Author Dashboard.

Warm regards,

Author Relations & Royalties Desk
BookLeaf Publishing
support@bookleafpublishing.com | www.bookleafpublishing.com`;
}

// ----------------- API ROUTES -----------------

// 1. Get all authors (Admin Overview)
app.get('/api/authors', (req, res) => {
  const { city, status, search } = req.query;
  let list = authors.map(enrichAuthor);

  if (city && city !== 'All') {
    list = list.filter(a => a.city.toLowerCase() === city.toLowerCase());
  }

  if (status && status !== 'All') {
    list = list.filter(a => a.overall_payout_status.toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    list = list.filter(a => a.name.toLowerCase().includes(q) || a.author_id.toLowerCase().includes(q));
  }

  res.json({ success: true, count: list.length, authors: list });
});

// 2. Get single author (Author Portal & Admin Detail View)
app.get('/api/authors/:id', (req, res) => {
  const author = authors.find(a => a.author_id === req.params.id);
  if (!author) {
    return res.status(404).json({ success: false, message: 'Author not found' });
  }
  res.json({ success: true, author: enrichAuthor(author) });
});

// 3. Notification logs
app.get('/api/notification-logs', (req, res) => {
  res.json({ success: true, count: notificationLogs.length, logs: notificationLogs });
});

// 4. Bubble Data API Callback endpoint (for external n8n webhook or internal callback)
app.post('/api/1.1/obj/notification_log', (req, res) => {
  const body = req.body;
  const newLog = {
    log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    author_id: body.author_id,
    author_name: body.author_name,
    author_email: body.author_email,
    trigger_type: body.trigger_type || 'n8n Automation',
    status: body.status || 'Success',
    generated_email_content: body.generated_email_content || '',
    sent_timestamp: body.sent_timestamp || new Date().toISOString(),
    error_message: body.error_message || null,
    idempotency_key: body.idempotency_key || null
  };
  notificationLogs.unshift(newLog);
  res.status(201).json({ success: true, response: newLog });
});

// 5. n8n Automation Webhook endpoint (POST /webhook/generate-royalty-summary)
app.post('/webhook/generate-royalty-summary', async (req, res) => {
  const apiKey = req.headers['x-bookleaf-api-key'] || req.headers['authorization'];
  
  // Security validation (allow internal simulation if header is set or in dev mode)
  if (apiKey && !apiKey.includes(EXPECTED_API_KEY) && apiKey !== 'dev_simulation') {
    return res.status(401).json({
      error: 'Unauthorized: Invalid x-bookleaf-api-key header.',
      status: 401
    });
  }

  const { author_id, trigger_type, idempotency_key, simulate_error } = req.body;

  if (!author_id) {
    return res.status(400).json({ error: 'Missing author_id in payload', status: 400 });
  }

  // Idempotency check: 3 minute window
  const key = idempotency_key || `${author_id}-${new Date().toISOString().slice(0, 10)}`;
  const lastTime = idempotencyCache.get(key);
  const now = Date.now();

  if (lastTime && (now - lastTime < 180000)) {
    return res.json({
      success: true,
      status: 'Duplicate Skipped',
      message: 'A royalty summary for this author was already initiated within the last 3 minutes.',
      author_id,
      idempotency_key: key
    });
  }

  idempotencyCache.set(key, now);

  const rawAuthor = authors.find(a => a.author_id === author_id);
  if (!rawAuthor) {
    return res.status(404).json({ error: 'Author not found', status: 404 });
  }

  const authorEnriched = enrichAuthor(rawAuthor);

  // If simulation requested an error to test resilient failure handling:
  if (simulate_error) {
    const failedLog = {
      log_id: `LOG-${Date.now()}`,
      author_id: authorEnriched.author_id,
      author_name: authorEnriched.name,
      author_email: authorEnriched.email,
      trigger_type: trigger_type || 'Manual Single',
      status: 'Failed',
      generated_email_content: null,
      sent_timestamp: new Date().toISOString(),
      error_message: 'Simulated downstream AI service timeout (504 Gateway Timeout)',
      idempotency_key: key
    };
    notificationLogs.unshift(failedLog);
    return res.status(500).json({
      success: false,
      status: 'Failed',
      error: failedLog.error_message
    });
  }

  try {
    let generatedEmail = '';
    let usedLiveN8n = false;

    // Dispatch directly to live n8n instance if running
    const n8nTarget = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/generate-royalty-summary';
    try {
      const n8nRes = await fetch(n8nTarget, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bookleaf-api-key': EXPECTED_API_KEY
        },
        body: JSON.stringify({
          author_id: authorEnriched.author_id,
          name: authorEnriched.name,
          email: authorEnriched.email,
          city: authorEnriched.city,
          trigger_type: trigger_type || 'Manual Single',
          idempotency_key: key,
          books: authorEnriched.books
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (n8nRes.ok) {
        const n8nData = await n8nRes.json();
        console.log('⚡ Successfully executed via LIVE n8n workflow:', n8nData.status);
        generatedEmail = n8nData.email_content || n8nData.email_preview || '';
        usedLiveN8n = true;
      }
    } catch (n8nErr) {
      console.log('ℹ️ n8n live bridge fallback to local engine:', n8nErr.message);
    }

    if (!generatedEmail) {
      generatedEmail = generateEmailContent(authorEnriched);
    }

    const logEntry = {
      log_id: `LOG-${Date.now()}`,
      author_id: authorEnriched.author_id,
      author_name: authorEnriched.name,
      author_email: authorEnriched.email,
      trigger_type: trigger_type || 'Manual Single',
      status: 'Success',
      generated_email_content: generatedEmail,
      sent_timestamp: new Date().toISOString(),
      error_message: null,
      idempotency_key: key
    };

    notificationLogs.unshift(logEntry);

    return res.json({
      success: true,
      status: 'Success',
      author_id: authorEnriched.author_id,
      author_name: authorEnriched.name,
      author_email: authorEnriched.email,
      email_content: generatedEmail,
      sent_timestamp: logEntry.sent_timestamp,
      log_id: logEntry.log_id,
      used_live_n8n: usedLiveN8n
    });
  } catch (err) {
    console.error('Workflow error:', err);
    const errLog = {
      log_id: `LOG-${Date.now()}`,
      author_id: authorEnriched.author_id,
      author_name: authorEnriched.name,
      author_email: authorEnriched.email,
      trigger_type: trigger_type || 'Manual Single',
      status: 'Failed',
      generated_email_content: null,
      sent_timestamp: new Date().toISOString(),
      error_message: err.message,
      idempotency_key: key
    };
    notificationLogs.unshift(errLog);

    return res.status(500).json({
      success: false,
      status: 'Failed',
      error: err.message
    });
  }
});

// 6. Bulk Trigger Endpoint
app.post('/api/admin/bulk-trigger', async (req, res) => {
  const eligibleAuthors = authors
    .map(enrichAuthor)
    .filter(a => a.total_royalty_pending > 0);

  const results = [];

  for (const author of eligibleAuthors) {
    const key = `BULK-${author.author_id}-${Date.now()}`;
    const email = generateEmailContent(author);
    const logEntry = {
      log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      author_id: author.author_id,
      author_name: author.name,
      author_email: author.email,
      trigger_type: 'Bulk Trigger',
      status: 'Success',
      generated_email_content: email,
      sent_timestamp: new Date().toISOString(),
      error_message: null,
      idempotency_key: key
    };
    notificationLogs.unshift(logEntry);
    results.push({ author_id: author.author_id, name: author.name, status: 'Success' });
  }

  res.json({
    success: true,
    total_eligible: eligibleAuthors.length,
    processed: results.length,
    results
  });
});

// Serve frontend SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 BookLeaf Assignment 2 Companion Server running on http://localhost:${PORT}`);
  console.log(`📡 n8n Webhook Endpoint: http://localhost:${PORT}/webhook/generate-royalty-summary`);
  console.log(`📋 Bubble Data API Mock: http://localhost:${PORT}/api/1.1/obj/notification_log`);
});
