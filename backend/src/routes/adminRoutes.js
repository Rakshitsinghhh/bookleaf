import express from 'express';
import { dbHelper } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { OFFICIAL_CATEGORIES, VALID_PRIORITIES, analyzeTicketWithAI, regenerateDraftResponse } from '../services/aiService.js';
import { sseService } from '../services/sseService.js';

const router = express.Router();

// Require admin for all routes in this file
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/tickets
 * Ticket queue filterable by status, category, priority, urgent flag, date sorting
 */
router.get('/tickets', (req, res) => {
  const { status, category, priority, urgent, search, sort = 'urgent_first' } = req.query;

  let sql = `
    SELECT t.*, a.name as author_name, a.email as author_email,
           b.title as book_title,
           (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id) as message_count,
           (SELECT COUNT(*) FROM internal_notes WHERE ticket_id = t.ticket_id) as note_count
    FROM tickets t
    JOIN authors a ON t.author_id = a.author_id
    LEFT JOIN books b ON t.book_id = b.book_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    sql += ` AND t.status = ?`;
    params.push(status);
  }

  if (category && category !== 'ALL') {
    sql += ` AND t.category = ?`;
    params.push(category);
  }

  if (priority && priority !== 'ALL') {
    sql += ` AND t.priority = ?`;
    params.push(priority);
  }

  if (urgent === 'true') {
    sql += ` AND t.priority IN ('Critical', 'High') AND t.status IN ('Open', 'In Progress')`;
  }

  if (search && search.trim()) {
    sql += ` AND (t.ticket_id LIKE ? OR t.subject LIKE ? OR a.name LIKE ? OR b.title LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  // Sorting
  if (sort === 'oldest') {
    sql += ` ORDER BY t.created_at ASC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY t.created_at DESC`;
  } else {
    // Default: Urgent and oldest unresolved first
    sql += `
      ORDER BY
        CASE t.status
          WHEN 'Open' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'Resolved' THEN 3
          WHEN 'Closed' THEN 4
        END ASC,
        CASE t.priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END ASC,
        t.created_at ASC
    `;
  }

  const tickets = dbHelper.all(sql, params);
  return res.json({ tickets });
});

/**
 * PATCH /api/admin/tickets/:id/classification
 * Override AI classification and priority score
 */
router.patch('/tickets/:id/classification', (req, res) => {
  const ticketId = req.params.id;
  const { category, priority } = req.body;

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const updates = [];
  const params = [];

  if (category) {
    if (!OFFICIAL_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid category' });
    }
    updates.push('category = ?', 'is_category_overridden = 1');
    params.push(category);
  }

  if (priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid priority' });
    }
    updates.push('priority = ?', 'is_priority_overridden = 1');
    params.push(priority);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'ValidationError', message: 'No updates provided' });
  }

  const now = new Date().toISOString();
  updates.push('updated_at = ?');
  params.push(now, ticketId);

  dbHelper.run(`UPDATE tickets SET ${updates.join(', ')} WHERE ticket_id = ?`, params);

  const updatedTicket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.json({
    message: 'Classification/Priority updated successfully',
    ticket: updatedTicket
  });
});

/**
 * POST /api/admin/tickets/:id/regenerate-draft
 * Regenerates AI draft response
 */
router.post('/tickets/:id/regenerate-draft', async (req, res) => {
  const ticketId = req.params.id;
  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);

  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const { category, priority } = req.body || {};
  const currentCategory = category || ticket.category;
  const currentPriority = priority || ticket.priority;

  const author = dbHelper.get('SELECT * FROM authors WHERE author_id = ?', [ticket.author_id]);
  const book = ticket.book_id !== 'GENERAL' ? dbHelper.get('SELECT * FROM books WHERE book_id = ?', [ticket.book_id]) : null;

  // Add realistic AI processing delay so the buffering spinner is clearly visible
  await new Promise((resolve) => setTimeout(resolve, 750));

  // Determine variation cycle
  const currentCounter = (ticket.is_category_overridden || 0) + 1;
  const variation = (currentCounter % 3) + 1;

  const newDraft = await regenerateDraftResponse({
    ticket,
    authorInfo: author,
    bookInfo: book,
    category: currentCategory,
    priority: currentPriority,
    variation
  });

  const now = new Date().toISOString();
  dbHelper.run(
    `UPDATE tickets SET ai_draft_response = ?, category = ?, priority = ?, is_category_overridden = ?, updated_at = ? WHERE ticket_id = ?`,
    [newDraft, currentCategory, currentPriority, currentCounter, now, ticketId]
  );

  return res.json({
    message: 'AI Draft regenerated successfully',
    aiDraftResponse: newDraft,
    variation
  });
});

/**
 * POST /api/admin/tickets/:id/assign
 * Assign ticket to admin or ops member
 */
router.post('/tickets/:id/assign', (req, res) => {
  const ticketId = req.params.id;
  const { assigned_to } = req.body;

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const assignee = assigned_to || req.user.name;
  const now = new Date().toISOString();
  dbHelper.run(`UPDATE tickets SET assigned_to = ?, updated_at = ? WHERE ticket_id = ?`, [assignee, now, ticketId]);

  const updatedTicket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.json({
    message: `Ticket assigned to ${assignee}`,
    ticket: updatedTicket
  });
});

/**
 * POST /api/admin/tickets/:id/internal-notes
 * Add internal note (strictly hidden from author)
 */
router.post('/tickets/:id/internal-notes', (req, res) => {
  const ticketId = req.params.id;
  const { note } = req.body;

  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'ValidationError', message: 'Note cannot be empty' });
  }

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const noteId = `NOT-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  dbHelper.run(
    `INSERT INTO internal_notes (note_id, ticket_id, admin_id, admin_name, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [noteId, ticketId, req.user.admin_id || req.user.id, req.user.name, note.trim(), now]
  );

  const notes = dbHelper.all('SELECT * FROM internal_notes WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);

  return res.status(201).json({
    message: 'Internal note added successfully',
    internalNotes: notes
  });
});

/**
 * GET /api/admin/analytics
 * High-level operations queue metrics
 */
router.get('/analytics', (req, res) => {
  const total = dbHelper.get('SELECT COUNT(*) as count FROM tickets').count;
  const open = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Open'`).count;
  const inProgress = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'In Progress'`).count;
  const resolved = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Resolved'`).count;
  const closed = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Closed'`).count;

  const critical = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE priority = 'Critical' AND status IN ('Open', 'In Progress')`).count;
  const high = dbHelper.get(`SELECT COUNT(*) as count FROM tickets WHERE priority = 'High' AND status IN ('Open', 'In Progress')`).count;

  const categoryBreakdown = dbHelper.all(`
    SELECT category, COUNT(*) as count
    FROM tickets
    GROUP BY category
  `);

  return res.json({
    total,
    open,
    inProgress,
    resolved,
    closed,
    urgentCount: critical + high,
    criticalCount: critical,
    highCount: high,
    categoryBreakdown
  });
});

/**
 * POST /api/admin/tickets/:id/messages
 * Send official admin response to author in ticket thread
 */
router.post('/tickets/:id/messages', (req, res) => {
  const ticketId = req.params.id;
  const { message, is_ai_assisted, status } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'ValidationError', message: 'Message content cannot be empty.' });
  }

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const messageId = `MSG-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const senderRole = 'admin';
  const senderId = req.user.admin_id || req.user.id || 'ADM001';
  const senderName = req.user.name || 'BookLeaf Royalties & Operations Team';

  dbHelper.run(
    `INSERT INTO ticket_messages (message_id, ticket_id, sender_id, sender_name, sender_role, message, is_ai_assisted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [messageId, ticketId, senderId, senderName, senderRole, message.trim(), is_ai_assisted ? 1 : 0, now]
  );

  // If status is specified (e.g. 'Closed' or 'Resolved'), apply it on send; otherwise transition Open -> In Progress
  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  let targetStatus = ticket.status;
  if (status && validStatuses.includes(status)) {
    targetStatus = status;
  } else if (ticket.status === 'Open') {
    targetStatus = 'In Progress';
  }

  dbHelper.run(`UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?`, [targetStatus, now, ticketId]);

  const updatedTicket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  const newMessage = {
    message_id: messageId,
    ticket_id: ticketId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    message: message.trim(),
    is_ai_assisted: is_ai_assisted ? 1 : 0,
    created_at: now
  };

  // Broadcast real-time SSE event to author and queue
  sseService.broadcast('new_message', { ticket: updatedTicket, message: newMessage }, ticket.author_id);
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.status(201).json({
    message: 'Response sent to author successfully',
    ticketMessage: newMessage,
    ticket: updatedTicket
  });
});

/**
 * PATCH /api/admin/tickets/:id/status
 * Update ticket status as admin (Open, In Progress, Resolved, Closed)
 */
router.patch('/tickets/:id/status', (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'ValidationError', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  const now = new Date().toISOString();
  dbHelper.run(`UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?`, [status, now, ticketId]);

  const updatedTicket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.json({
    message: `Ticket status updated to ${status}`,
    ticket: updatedTicket
  });
});

export default router;
