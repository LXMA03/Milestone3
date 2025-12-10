import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Build a simple `books` SQLite database file using this order:
// 1. `process.env.BOOKS_DB` if set
// 2. first CLI arg (node build-books-db.js ./db/books.sqlite)
// 3. default to `./db/books.sqlite` in repository root
const defaultFile = './db/books.sqlite';
const dbFile = process.env.BOOKS_DB || process.argv[2] || defaultFile;
const dbPath = path.resolve(dbFile);

// Ensure directory exists for the database file
const dir = path.dirname(dbPath);
try {
  fs.mkdirSync(dir, { recursive: true });
} catch (err) {
  throw new Error(`Failed to create directory for DB file ${dir}: ${err}`);
}

const database = new DatabaseSync(dbPath);

// Create books table
database.exec(`
  CREATE TABLE IF NOT EXISTS books (
    isbn TEXT PRIMARY KEY,
    book_title TEXT NOT NULL,
    author TEXT NOT NULL
  ) STRICT
`);

// Insert some sample books. Use a prepared statement for safety.
const insert = database.prepare('INSERT OR REPLACE INTO books (isbn, book_title, author) VALUES (?, ?, ?)');
const samples = [
  ['9780141439518', 'Pride and Prejudice', 'Jane Austen'],
  ['9780553213119', 'Dracula', 'Bram Stoker'],
  ['9780061120084', 'To Kill a Mockingbird', 'Harper Lee'],
];

for (const [isbn, title, author] of samples) {
  insert.run(isbn, title, author);
}

// Query and show contents
const query = database.prepare('SELECT isbn, book_title, author FROM books ORDER BY book_title');
const rows = query.all();
console.log('Books table rows:', rows);

console.log(`Books DB written to: ${dbPath}`);
