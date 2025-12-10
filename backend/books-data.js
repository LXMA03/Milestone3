import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Resolve DB path (can be overridden with BOOKS_DB env var)
const defaultFile = './db/books.sqlite';
const dbFile = process.env.BOOKS_DB || defaultFile;
const dbPath = path.resolve(dbFile);

if (!fs.existsSync(dbPath)) {
  throw new Error(`Books DB file not found at ${dbPath}. Run backend/build-books-db.js first.`);
}

const db = new DatabaseSync(dbPath);

/**
 * Return an array of books matching the author (partial match).
 * @param {string} author
 * @returns {Array<{isbn:string, book_title:string, author:string}>}
 */
export function getBooksByAuthor(author) {
  const like = `%${author}%`;
  const stmt = db.prepare('SELECT isbn, book_title, author FROM books WHERE author LIKE ? ORDER BY book_title');
  return stmt.all(like);
}

export default { getBooksByAuthor };
