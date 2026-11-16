-- BookLeaf Publishing - Assignment 2 Relational Database Schema
-- Matches Bubble.io Data Types, Relationships & Privacy Rules

CREATE TABLE IF NOT EXISTS authors (
    author_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    city TEXT,
    joined_date DATE NOT NULL,
    user_type TEXT DEFAULT 'Author' CHECK (user_type IN ('Author', 'Admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    book_id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    isbn TEXT,
    genre TEXT,
    publication_date DATE,
    status TEXT NOT NULL,
    mrp REAL,
    author_royalty_per_copy REAL,
    total_copies_sold INTEGER DEFAULT 0,
    total_royalty_earned REAL DEFAULT 0,
    royalty_paid REAL DEFAULT 0,
    royalty_pending REAL DEFAULT 0,
    last_royalty_payout_date DATE,
    print_partner TEXT,
    available_on TEXT, -- Stored as JSON or comma-separated list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_logs (
    log_id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Manual Single', 'Bulk Trigger')),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Success', 'Failed')),
    generated_email_content TEXT,
    sent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_logs_author_id ON notification_logs(author_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON notification_logs(sent_timestamp DESC);
