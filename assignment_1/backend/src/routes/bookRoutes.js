import express from 'express';
import { dbHelper } from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/books/my-books
 * Returns all books for the authenticated author with formatted statistics
 */
router.get('/my-books', authenticate, (req, res) => {
  let authorId = req.user.role === 'author' ? req.user.author_id : req.query.author_id;

  if (!authorId) {
    const firstAuthor = dbHelper.get('SELECT author_id FROM authors ORDER BY author_id LIMIT 1');
    authorId = firstAuthor?.author_id;
  }

  const books = dbHelper.all(
    `SELECT * FROM books WHERE author_id = ? ORDER BY publication_date DESC, created_at DESC`,
    [authorId]
  );

  // Parse available_on JSON
  const parsedBooks = books.map(book => {
    let availableOn = [];
    try {
      availableOn = book.available_on ? JSON.parse(book.available_on) : [];
    } catch {
      availableOn = [];
    }

    // Determine production stage vs published status
    const isInProduction = book.status.toLowerCase().includes('in production');
    const isPublished = book.status.toLowerCase().includes('published');

    // Calculate rollover eligibility (threshold ₹1,000 as per BookLeaf Royalty Policy)
    const isBelowThreshold = book.royalty_pending > 0 && book.royalty_pending < 1000;

    return {
      ...book,
      available_on: availableOn,
      isInProduction,
      isPublished,
      isBelowThreshold,
      payoutStatus: isInProduction
        ? 'Not Applicable'
        : book.royalty_pending === 0
        ? 'Fully Paid'
        : isBelowThreshold
        ? 'Rolling Over (< ₹1,000 threshold)'
        : 'Eligible for Next Payout'
    };
  });

  // Calculate author-level aggregates
  const summary = {
    totalBooks: parsedBooks.length,
    publishedBooks: parsedBooks.filter(b => b.isPublished).length,
    inProductionBooks: parsedBooks.filter(b => b.isInProduction).length,
    totalCopiesSold: parsedBooks.reduce((sum, b) => sum + (b.total_copies_sold || 0), 0),
    totalRoyaltyEarned: parsedBooks.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0),
    royaltyPaid: parsedBooks.reduce((sum, b) => sum + (b.royalty_paid || 0), 0),
    royaltyPending: parsedBooks.reduce((sum, b) => sum + (b.royalty_pending || 0), 0),
    minimumPayoutThreshold: 1000
  };

  return res.json({
    books: parsedBooks,
    summary
  });
});

/**
 * GET /api/books/:id
 * Single book details
 */
router.get('/:id', authenticate, (req, res) => {
  const book = dbHelper.get('SELECT * FROM books WHERE book_id = ?', [req.params.id]);
  if (!book) {
    return res.status(404).json({ error: 'NotFound', message: 'Book not found' });
  }

  // If author, verify ownership
  if (req.user.role === 'author' && book.author_id !== req.user.author_id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
  }

  try {
    book.available_on = book.available_on ? JSON.parse(book.available_on) : [];
  } catch {
    book.available_on = [];
  }

  return res.json({ book });
});

/**
 * GET /api/books
 * Admin catalog list
 */
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }

  const books = dbHelper.all(`
    SELECT b.*, a.name as author_name, a.email as author_email
    FROM books b
    JOIN authors a ON b.author_id = a.author_id
    ORDER BY b.publication_date DESC
  `);

  return res.json({
    books: books.map(b => ({
      ...b,
      available_on: b.available_on ? JSON.parse(b.available_on) : []
    }))
  });
});

export default router;
