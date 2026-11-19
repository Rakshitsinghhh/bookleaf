-- BookLeaf Publishing Author Support & Communication Portal
-- Database Schema (SQLite / PostgreSQL compatible)

CREATE TABLE IF NOT EXISTS authors (
  author_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  joined_date TEXT,
  role TEXT DEFAULT 'author',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  department TEXT DEFAULT 'Operations',
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  book_id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  publication_date TEXT,
  status TEXT NOT NULL,
  mrp REAL,
  author_royalty_per_copy REAL,
  total_copies_sold INTEGER DEFAULT 0,
  total_royalty_earned REAL DEFAULT 0,
  royalty_paid REAL DEFAULT 0,
  royalty_pending REAL DEFAULT 0,
  last_royalty_payout_date TEXT,
  print_partner TEXT,
  available_on TEXT, -- JSON array of store names
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
  ticket_id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  book_id TEXT, -- Can be 'GENERAL' or a specific book_id
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_name TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Closed'
  category TEXT NOT NULL, -- 1 of 6 official BookLeaf categories
  priority TEXT NOT NULL DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
  ai_category TEXT,
  ai_priority TEXT,
  ai_confidence REAL DEFAULT 0.95,
  ai_priority_reason TEXT,
  ai_draft_response TEXT,
  is_category_overridden INTEGER DEFAULT 0,
  is_priority_overridden INTEGER DEFAULT 0,
  assigned_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  message_id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- 'author', 'admin'
  message TEXT NOT NULL,
  is_ai_assisted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS internal_notes (
  note_id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notes_ticket ON internal_notes(ticket_id);
