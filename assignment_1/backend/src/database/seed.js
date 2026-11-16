import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db, initSchema } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedDatabase() {
  console.log('--- Initializing BookLeaf Database ---');
  initSchema();

  // Load dataset
  const dataPath = path.resolve(__dirname, '../../../database/bookleaf_sample_data.json');
  if (!fs.existsSync(dataPath)) {
    console.warn('Dataset file not found at:', dataPath);
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const sampleData = JSON.parse(rawData);

  // Hash default password
  const defaultAuthorPassword = bcrypt.hashSync('author123', 8);
  const defaultAdminPassword = bcrypt.hashSync('admin123', 8);

  // Ensure Admins exist
  const insertAdmin = db.prepare(`
    INSERT OR REPLACE INTO admins (admin_id, name, email, password, department, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAdmin.run('ADM001', 'Ankit Verma (Ops Lead)', 'admin@bookleafpub.in', defaultAdminPassword, 'Operations & Royalties', 'admin');
  insertAdmin.run('ADM002', 'Pooja Iyer (Author Relations)', 'support@bookleafpub.in', defaultAdminPassword, 'Author Support', 'admin');

  // Ensure Authors and Books exist from dataset
  const insertAuthor = db.prepare(`
    INSERT OR REPLACE INTO authors (author_id, name, email, password, phone, city, joined_date, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'author')
  `);

  const insertBook = db.prepare(`
    INSERT OR REPLACE INTO books (
      book_id, author_id, title, isbn, genre, publication_date, status,
      mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned,
      royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const author of sampleData.authors) {
    const authorPassword = bcrypt.hashSync(author.name, 8);
    insertAuthor.run(
      author.author_id,
      author.name,
      author.email,
      authorPassword,
      author.phone || null,
      author.city || null,
      author.joined_date || null
    );

    if (author.books && Array.isArray(author.books)) {
      for (const book of author.books) {
        insertBook.run(
          book.book_id,
          author.author_id,
          book.title,
          book.isbn || null,
          book.genre || null,
          book.publication_date || null,
          book.status,
          book.mrp !== undefined ? book.mrp : null,
          book.author_royalty_per_copy !== undefined ? book.author_royalty_per_copy : null,
          book.total_copies_sold || 0,
          book.total_royalty_earned || 0,
          book.royalty_paid || 0,
          book.royalty_pending || 0,
          book.last_royalty_payout_date || null,
          book.print_partner || null,
          JSON.stringify(book.available_on || [])
        );
      }
    }
  }

  // NOTE: Zero mock tickets, zero fake messages, zero fake notes.
  // Real tickets are created exclusively when an author submits a query in real time.
  console.log('✓ Authors and book catalog initialized. Tickets queue is clean and empty.');
}

// Auto-seed if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}
