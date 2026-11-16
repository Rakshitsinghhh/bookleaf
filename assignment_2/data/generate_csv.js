import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.resolve(__dirname, '../data/bookleaf_sample_data.json');
const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 1. Authors CSV
const authorsRows = [
  ['Author_ID', 'Name', 'Email', 'Phone', 'City', 'Joined_Date', 'Total_Books', 'Total_Royalty_Earned', 'Total_Royalty_Paid', 'Total_Royalty_Pending'].join(',')
];

const booksRows = [
  ['Book_ID', 'Author_ID', 'Author_Name', 'Title', 'ISBN', 'Genre', 'Publication_Date', 'Status', 'MRP', 'Royalty_Per_Copy', 'Total_Copies_Sold', 'Total_Royalty_Earned', 'Royalty_Paid', 'Royalty_Pending', 'Last_Payout_Date', 'Print_Partner', 'Available_On'].join(',')
];

raw.authors.forEach(a => {
  let totalBooks = a.books.length;
  let totalEarned = a.books.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0);
  let totalPaid = a.books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
  let totalPending = a.books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);

  authorsRows.push([
    `"${a.author_id}"`,
    `"${a.name}"`,
    `"${a.email}"`,
    `"${a.phone}"`,
    `"${a.city}"`,
    `"${a.joined_date}"`,
    totalBooks,
    totalEarned,
    totalPaid,
    totalPending
  ].join(','));

  a.books.forEach(b => {
    booksRows.push([
      `"${b.book_id}"`,
      `"${a.author_id}"`,
      `"${a.name}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.isbn || ''}"`,
      `"${b.genre || ''}"`,
      `"${b.publication_date || ''}"`,
      `"${b.status}"`,
      b.mrp ?? '',
      b.author_royalty_per_copy ?? '',
      b.total_copies_sold ?? 0,
      b.total_royalty_earned ?? 0,
      b.royalty_paid ?? 0,
      b.royalty_pending ?? 0,
      `"${b.last_royalty_payout_date || ''}"`,
      `"${b.print_partner || ''}"`,
      `"${(b.available_on || []).join('; ')}"`
    ].join(','));
  });
});

const logsRows = [
  ['Log_ID', 'Author_ID', 'Author_Name', 'Author_Email', 'Trigger_Type', 'Status', 'Generated_Email_Content', 'Sent_Timestamp', 'Error_Message', 'Idempotency_Key'].join(','),
  ['"LOG-INIT-001"', '"AUTH001"', '"Priya Sharma"', '"priya.sharma@gmail.com"', '"Manual Single"', '"Success"', '"Initial quarterly statement archived."', '"2025-10-15T10:00:00Z"', '""', '"AUTH001-20251015"'].join(',')
];

fs.writeFileSync(path.resolve(__dirname, '../data/Bubble_Authors.csv'), authorsRows.join('\n'));
fs.writeFileSync(path.resolve(__dirname, '../data/Bubble_Books.csv'), booksRows.join('\n'));
fs.writeFileSync(path.resolve(__dirname, '../data/Bubble_Notification_Logs.csv'), logsRows.join('\n'));

console.log('✅ Generated Bubble CSV files:');
console.log(' - Bubble_Authors.csv (' + (authorsRows.length - 1) + ' rows)');
console.log(' - Bubble_Books.csv (' + (booksRows.length - 1) + ' rows)');
console.log(' - Bubble_Notification_Logs.csv (' + (logsRows.length - 1) + ' rows)');
