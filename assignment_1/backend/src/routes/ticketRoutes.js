import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbHelper } from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { analyzeTicketWithAI } from '../services/aiService.js';
import { sseService } from '../services/sseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const router = express.Router();

/**
 * GET /api/tickets
 * General tickets endpoint (resolves 404 when querying /api/tickets)
 * If admin -> returns all tickets with filters
 * If author -> returns their submitted tickets
 */
router.get('/', authenticate, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { status, category, priority, search } = req.query;
      let sql = `
        SELECT t.*, a.name as author_name, a.email as author_email, b.title as book_title
        FROM tickets t
        JOIN authors a ON t.author_id = a.author_id
        LEFT JOIN books b ON t.book_id = b.book_id
        WHERE 1=1
      `;
      const params = [];
      if (status && status !== 'All') { sql += ' AND t.status = ?'; params.push(status); }
      if (category && category !== 'All') { sql += ' AND t.category = ?'; params.push(category); }
      if (priority && priority !== 'All') { sql += ' AND t.priority = ?'; params.push(priority); }
      if (search && search.trim()) {
        sql += ' AND (t.ticket_id LIKE ? OR t.subject LIKE ? OR a.name LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
      }
      sql += ' ORDER BY CASE t.priority WHEN "Critical" THEN 1 WHEN "High" THEN 2 WHEN "Medium" THEN 3 ELSE 4 END, t.created_at DESC';
      const tickets = dbHelper.all(sql, params);
      return res.json({ tickets, total: tickets.length });
    }

    // Author view
    const authorId = req.user.author_id || req.user.id;
    const tickets = dbHelper.all(
      `SELECT t.*, a.name as author_name, b.title as book_title
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.author_id = ?
       ORDER BY t.created_at DESC`,
      [authorId]
    );
    return res.json({ tickets, total: tickets.length });
  } catch (err) {
    console.error('Error in GET /api/tickets:', err);
    return res.status(500).json({ error: 'ServerError', message: 'Failed to retrieve tickets.' });
  }
});

/**
 * POST /api/tickets
 * Submit a new ticket (Author only)
 * Automatically triggers AI classification, priority scoring, and draft generation.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { book_id, subject, description, attachment_name, attachment_url } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Subject line is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Detailed description is required.' });
    }

    let authorId = req.user.role === 'author' ? req.user.author_id : (req.body.author_id || req.user.id);
    let author = dbHelper.get('SELECT * FROM authors WHERE author_id = ?', [authorId]);

    // Ensure author exists in DB to prevent foreign key constraint violation
    if (!author) {
      const existingAuthor = dbHelper.get('SELECT * FROM authors LIMIT 1');
      if (existingAuthor) {
        authorId = existingAuthor.author_id;
        author = existingAuthor;
      } else {
        authorId = authorId || 'AUTH001';
        dbHelper.run(
          "INSERT OR IGNORE INTO authors (author_id, name, email, password) VALUES (?, ?, ?, 'author123')",
          [authorId, req.user.name || 'Author', req.user.email || 'author@bookleafpub.in']
        );
        author = dbHelper.get('SELECT * FROM authors WHERE author_id = ?', [authorId]);
      }
    }

    let book = null;
    let validBookId = 'GENERAL';
    if (book_id && book_id !== 'GENERAL') {
      book = dbHelper.get('SELECT * FROM books WHERE book_id = ?', [book_id]);
      if (book) validBookId = book.book_id;
    }

    // Call AI Integration Service (with graceful degradation fallback)
    const aiResult = await analyzeTicketWithAI(
      { subject, description },
      author || { name: req.user.name },
      book || { title: validBookId === 'GENERAL' ? 'General Inquiry' : 'Selected Title' }
    );

    const ticketId = `TCK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Persist attachment to server disk if provided
    let storedAttachmentUrl = attachment_url || null;
    if (attachment_url && attachment_url.startsWith('data:')) {
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const matches = attachment_url.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const safeName = (attachment_name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
          const diskFileName = `${ticketId}_${safeName}`;
          const filePath = path.join(uploadsDir, diskFileName);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        }
      } catch (fileErr) {
        console.warn('Could not save attachment to disk:', fileErr.message);
      }
    }

    // Insert Ticket
    dbHelper.run(
      `INSERT INTO tickets (
        ticket_id, author_id, book_id, subject, description,
        attachment_name, attachment_url, status, category, priority,
        ai_category, ai_priority, ai_confidence, ai_priority_reason,
        ai_draft_response, is_category_overridden, is_priority_overridden,
        assigned_to, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)`,
      [
        ticketId,
        authorId,
        book_id || 'GENERAL',
        subject.trim(),
        description.trim(),
        attachment_name || null,
        attachment_url || null,
        aiResult.category,
        aiResult.priority,
        aiResult.category,
        aiResult.priority,
        aiResult.confidence,
        aiResult.reason,
        aiResult.replyDraft,
        now,
        now
      ]
    );

    // Insert initial author message in ticket conversation
    const messageId = `MSG-${Date.now().toString().slice(-6)}`;
    dbHelper.run(
      `INSERT INTO ticket_messages (message_id, ticket_id, sender_id, sender_name, sender_role, message, is_ai_assisted, created_at)
       VALUES (?, ?, ?, ?, 'author', ?, 0, ?)`,
      [messageId, ticketId, authorId, author?.name || req.user.name, description.trim(), now]
    );

    const createdTicket = dbHelper.get(
      `SELECT t.*, a.name as author_name, a.email as author_email, b.title as book_title
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.ticket_id = ?`,
      [ticketId]
    );

    // Real-time broadcast: notify admins and author
    sseService.broadcast('ticket_created', createdTicket, authorId);

    return res.status(201).json({
      message: 'Ticket submitted successfully',
      ticket: createdTicket,
      aiAnalysis: {
        category: aiResult.category,
        priority: aiResult.priority,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        isAiDegraded: aiResult.isAiDegraded
      }
    });
  } catch (err) {
    console.error('Error submitting ticket:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: err.message || 'Failed to submit ticket. Please try again.'
    });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Author's submitted tickets with message counts and latest status
 */
router.get('/my-tickets', authenticate, (req, res) => {
  let authorId = req.user.role === 'author' ? req.user.author_id : req.query.author_id;

  if (!authorId) {
    const firstAuthor = dbHelper.get('SELECT author_id FROM authors ORDER BY author_id LIMIT 1');
    authorId = firstAuthor?.author_id;
  }

  const tickets = dbHelper.all(
    `SELECT t.*, b.title as book_title,
      (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id) as message_count,
      (SELECT message FROM ticket_messages WHERE ticket_id = t.ticket_id ORDER BY created_at DESC LIMIT 1) as latest_message,
      (SELECT sender_role FROM ticket_messages WHERE ticket_id = t.ticket_id ORDER BY created_at DESC LIMIT 1) as latest_sender_role
     FROM tickets t
     LEFT JOIN books b ON t.book_id = b.book_id
     WHERE t.author_id = ?
     ORDER BY t.created_at DESC`,
    [authorId]
  );

  return res.json({ tickets });
});

/**
 * GET /api/tickets/:id
 * Full ticket details with conversation thread
 * Internal notes are filtered out if requester is an author!
 */
router.get('/:id', authenticate, (req, res) => {
  const ticketId = req.params.id;

  const ticket = dbHelper.get(
    `SELECT t.*, a.name as author_name, a.email as author_email, a.city as author_city,
            b.title as book_title, b.status as book_status, b.isbn as book_isbn,
            b.total_copies_sold, b.royalty_pending, b.royalty_paid
     FROM tickets t
     JOIN authors a ON t.author_id = a.author_id
     LEFT JOIN books b ON t.book_id = b.book_id
     WHERE t.ticket_id = ?`,
    [ticketId]
  );

  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  // RBAC: author can only see their own ticket
  if (req.user.role === 'author' && ticket.author_id !== req.user.author_id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this ticket' });
  }

  // Messages thread
  const messages = dbHelper.all(
    `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
    [ticketId]
  );

  // Internal notes: STRICTLY admin-only
  let internalNotes = [];
  if (req.user.role === 'admin') {
    internalNotes = dbHelper.all(
      `SELECT * FROM internal_notes WHERE ticket_id = ? ORDER BY created_at ASC`,
      [ticketId]
    );
  }

  return res.json({
    ticket,
    messages,
    internalNotes
  });
});

/**
 * GET /api/tickets/:id/attachment
 * View or download the file attached by the author
 * Allows admin and author to view images, PDFs, documents directly in browser or download
 */
router.get('/:id/attachment', (req, res) => {
  const ticketId = req.params.id;
  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);

  if (!ticket || (!ticket.attachment_name && !ticket.attachment_url)) {
    return res.status(404).json({ error: 'NotFound', message: 'No attachment found for this ticket.' });
  }

  const isDownload = req.query.download === 'true' || req.query.dl === '1';

  // 1. Check if file is stored on server disk in uploads directory
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith(ticketId));
    if (files.length > 0) {
      const filePath = path.join(uploadsDir, files[0]);
      if (isDownload) {
        return res.download(filePath, ticket.attachment_name || files[0]);
      }
      return res.sendFile(filePath);
    }
  }

  // 2. Fallback: decode base64 data URL
  if (ticket.attachment_url && ticket.attachment_url.startsWith('data:')) {
    const matches = ticket.attachment_url.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      const disposition = isDownload ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(ticket.attachment_name || 'attachment')}"`);
      return res.send(buffer);
    }
  }

  // 3. Fallback: redirect if url is present
  if (ticket.attachment_url) {
    return res.redirect(ticket.attachment_url);
  }

  return res.status(404).json({ error: 'NotFound', message: 'Attachment file not found.' });
});

/**
 * POST /api/tickets/:id/messages
 * Send a reply in the ticket thread
 * If admin responds, it reflects in real time on author's view!
 */
router.post('/:id/messages', authenticate, (req, res) => {
  const ticketId = req.params.id;
  const { message, is_ai_assisted } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'ValidationError', message: 'Message content cannot be empty.' });
  }

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  // RBAC
  if (req.user.role === 'author' && ticket.author_id !== req.user.author_id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
  }

  const messageId = `MSG-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const senderRole = req.user.role;
  const senderId = req.user.role === 'admin' ? req.user.admin_id : req.user.author_id;
  const senderName = req.user.name;

  dbHelper.run(
    `INSERT INTO ticket_messages (message_id, ticket_id, sender_id, sender_name, sender_role, message, is_ai_assisted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [messageId, ticketId, senderId, senderName, senderRole, message.trim(), is_ai_assisted ? 1 : 0, now]
  );

  // If admin responds and ticket was Open, transition to In Progress automatically
  if (senderRole === 'admin' && ticket.status === 'Open') {
    dbHelper.run(`UPDATE tickets SET status = 'In Progress', updated_at = ? WHERE ticket_id = ?`, [now, ticketId]);
  } else {
    dbHelper.run(`UPDATE tickets SET updated_at = ? WHERE ticket_id = ?`, [now, ticketId]);
  }

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

  // Real-time broadcast
  sseService.broadcast('new_message', { ticket: updatedTicket, message: newMessage }, ticket.author_id);
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.status(201).json({
    message: 'Reply sent successfully',
    ticketMessage: newMessage,
    ticket: updatedTicket
  });
});

/**
 * PATCH /api/tickets/:id/status
 * Update ticket status (Open, In Progress, Resolved, Closed)
 */
router.patch('/:id/status', authenticate, (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'ValidationError',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const ticket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
  if (!ticket) {
    return res.status(404).json({ error: 'NotFound', message: 'Ticket not found' });
  }

  // Author can close their own ticket, but only admin can move between other states
  if (req.user.role === 'author') {
    if (ticket.author_id !== req.user.author_id || status !== 'Closed') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only close their own tickets.' });
    }
  }

  const now = new Date().toISOString();
  dbHelper.run(`UPDATE tickets SET status = ?, updated_at = ? WHERE ticket_id = ?`, [status, now, ticketId]);

  const updatedTicket = dbHelper.get('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);

  // Real-time broadcast
  sseService.broadcast('ticket_updated', updatedTicket, ticket.author_id);

  return res.json({
    message: `Ticket status updated to ${status}`,
    ticket: updatedTicket
  });
});

export default router;
