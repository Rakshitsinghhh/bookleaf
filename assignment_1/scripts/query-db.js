import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database/bookleaf.db');

const db = new DatabaseSync(dbPath);

const sqlQuery = process.argv[2];

if (!sqlQuery) {
  console.log('====================================================');
  console.log('       BookLeaf Database Quick Explorer');
  console.log(`  File: ${dbPath}`);
  console.log('====================================================\n');

  const tables = ['authors', 'admins', 'books', 'tickets', 'ticket_messages', 'internal_notes'];
  
  console.log('📊 Table Record Counts:');
  for (const table of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  • ${table.padEnd(16)} : ${row.count} records`);
    } catch (e) {
      console.log(`  • ${table.padEnd(16)} : [Table not created yet]`);
    }
  }

  console.log('\n💡 Examples of how to query:');
  console.log('  npm run db "SELECT author_id, name, email, city FROM authors LIMIT 5"');
  console.log('  npm run db "SELECT book_id, title, status, mrp, royalty_pending FROM books LIMIT 5"');
  console.log('  npm run db "SELECT * FROM tickets"');
  console.log('  npm run db "SELECT * FROM admins"');
  console.log('====================================================');
  process.exit(0);
}

try {
  const isSelect = /^\s*select/i.test(sqlQuery);
  if (isSelect) {
    const rows = db.prepare(sqlQuery).all();
    console.log(`\nResults (${rows.length} rows):`);
    console.table(rows);
  } else {
    const result = db.prepare(sqlQuery).run();
    console.log('\nQuery executed successfully:', result);
  }
} catch (err) {
  console.error('\n❌ SQL Error:', err.message);
}
