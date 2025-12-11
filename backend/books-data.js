import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Resolve DB path (can be overridden with BOOKS_DB env var)
const defaultFile = './db/library.db';
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

// Book search and availability
export function getBooksByAuthor(author) {
  // Keep backwards-compatible wrapper around the more general searchBooks
  return searchBooks(author);
}

/**
 * Search books by term (matches ISBN, title, or author name).
 * @param {string} term
 * @returns {Array<{isbn:string,title:string,authors:string,status:string}>}
 */
export function searchBooks(term) {
  const trimmedTerm = term.trim();
  const like = `%${trimmedTerm}%`;
  
  // Simple approach: search in BOOK table and join with authors
  const sql = `
    SELECT
      b.isbn,
      b.title,
      REPLACE(GROUP_CONCAT(DISTINCT a.name), ',', ', ') AS authors,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM BOOK_LOANS bl
          WHERE bl.isbn = b.isbn AND bl.date_in IS NULL
        ) THEN 'OUT'
        ELSE 'IN'
      END AS status
    FROM BOOK b
    LEFT JOIN BOOK_AUTHOR ba ON b.isbn = ba.isbn
    LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
    WHERE b.isbn = ? 
       OR b.title LIKE ? 
       OR a.name LIKE ?
    GROUP BY b.isbn
    ORDER BY b.title COLLATE NOCASE
  `;

  const stmt = db.prepare(sql);
  return stmt.all(trimmedTerm, like, like);
}

  /**
   * Return all books with authors and status.
   * @returns {Array<{isbn:string,title:string,authors:string,status:string}>}
   */
  export function listAllBooks() {
    const sql = `
      SELECT
        b.isbn,
        b.title,
        REPLACE(GROUP_CONCAT(DISTINCT a.name), ',', ', ') AS authors,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM BOOK_LOANS bl
            WHERE bl.isbn = b.isbn AND bl.date_in IS NULL
          ) THEN 'OUT'
          ELSE 'IN'
        END AS status
      FROM BOOK b
      LEFT JOIN BOOK_AUTHOR ba ON b.isbn = ba.isbn
      LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
      GROUP BY b.isbn, b.title
      ORDER BY b.title COLLATE NOCASE
    `;

    return db.prepare(sql).all();
  }

  /**
   * Return all authors.
   * @returns {Array<{author_id:number,name:string}>}
   */
  export function listAllAuthors() {
    const sql = `SELECT author_id, name FROM AUTHORS ORDER BY name COLLATE NOCASE`;
    return db.prepare(sql).all();
  }

/**
 * Return true if the book is available (no active loan with date_in IS NULL).
 * @param {string} isbn
 * @returns {boolean}
 */
export function isBookAvailable(isbn) {
  const sql = `SELECT COUNT(*) AS activeLoans FROM BOOK_LOANS WHERE isbn = ? AND date_in IS NULL`;
  const row = db.prepare(sql).get(isbn);
  return (row && row.activeLoans === 0) || (row && row.activeLoans === undefined) ? true : row.activeLoans === 0;
}

/**
 * Perform a checkout. Validates borrower and book availability and business rules.
 * Returns { success: boolean, message: string, loanId?: number }
 */
export function performCheckout({ isbn, card_id }) {
  if (!isbn || (card_id === undefined || card_id === null)) return { success: false, message: 'Missing ISBN or card ID' };

  const numericCardId = Number.isInteger(card_id) ? card_id : parseInt(String(card_id).replace(/^ID/i, '').replace(/^0+/, ''), 10);
  if (Number.isNaN(numericCardId)) return { success: false, message: 'Invalid card ID' };

  const borrower = db.prepare('SELECT * FROM BORROWER WHERE card_id = ?').get(numericCardId);
  if (!borrower) return { success: false, message: 'Borrower not found' };

  const book = db.prepare('SELECT * FROM BOOK WHERE isbn = ?').get(isbn);
  if (!book) return { success: false, message: 'Book not found' };

  const activeLoans = db.prepare('SELECT COUNT(*) AS cnt FROM BOOK_LOANS WHERE card_id = ? AND date_in IS NULL').get(numericCardId);
  if (activeLoans && activeLoans.cnt >= 3) return { success: false, message: 'Borrower has 3 or more active loans' };

  const unpaidFines = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM FINES f
    JOIN BOOK_LOANS bl ON bl.loan_id = f.loan_id
    WHERE bl.card_id = ? AND f.paid = 0
  `).get(numericCardId);
  if (unpaidFines && unpaidFines.cnt > 0) return { success: false, message: 'Borrower has unpaid fines' };

  const bookActive = db.prepare('SELECT COUNT(*) AS cnt FROM BOOK_LOANS WHERE isbn = ? AND date_in IS NULL').get(isbn);
  if (bookActive && bookActive.cnt > 0) return { success: false, message: 'Book is currently checked out' };

  const insert = db.prepare(`
    INSERT INTO BOOK_LOANS (isbn, card_id, date_out, due_date)
    VALUES (?, ?, DATE('now'), DATE('now', '+14 days'))
  `);
  const result = insert.run(isbn, numericCardId);

  const loanId = result && (result.lastInsertRowid || result.lastID || result.last_insert_rowid) ? (result.lastInsertRowid || result.lastID || result.last_insert_rowid) : undefined;

  return { success: true, message: 'Checked out', loanId };
}

/**
 * Find active loans by isbn, card_id, or borrower name.
 * Returns array of loans with borrower name.
 */
export function findActiveLoans({ isbn, card_id, name } = {}) {
  const sql = `
    SELECT bl.loan_id, bl.isbn, b.title AS book_title, bl.card_id, br.bname, bl.date_out, bl.due_date
    FROM BOOK_LOANS bl
    JOIN BORROWER br ON br.card_id = bl.card_id
    LEFT JOIN BOOK b ON b.isbn = bl.isbn
    WHERE bl.date_in IS NULL
      AND (
        (? IS NOT NULL AND bl.isbn = ?)
        OR (? IS NOT NULL AND br.card_id = ?)
        OR (? IS NOT NULL AND LOWER(br.bname) LIKE LOWER('%' || ? || '%'))
      )
  `;

  const stmt = db.prepare(sql);
  return stmt.all(isbn || null, isbn || null, card_id || null, card_id || null, name || null, name || null);
}

/**
 * Perform a check-in by loan_id. 
 */
export function performCheckin({ loan_id, card_id, isbn } = {}) {
  // If a loan_id is provided, preserve original behavior
  if (loan_id) {
    const update = db.prepare("UPDATE BOOK_LOANS SET date_in = DATE('now') WHERE loan_id = ? AND date_in IS NULL");
    const res = update.run(loan_id);
    const changed = res && (res.changes || res.changes === 0) ? res.changes : (res.changes ?? 0);
    if (changed === 0) return { success: false, message: 'No active loan found with that loan_id' };
    return { success: true, message: 'Checked in', loanId: loan_id };
  }

  // Otherwise support checkin by card_id + isbn
  if (!card_id || !isbn) return { success: false, message: 'Missing card_id or isbn' };

  const numericCardId = Number.isInteger(card_id) ? card_id : parseInt(String(card_id).replace(/^ID/i, '').replace(/^0+/, ''), 10);
  if (Number.isNaN(numericCardId)) return { success: false, message: 'Invalid card ID' };

  // Find an active loan matching the borrower and isbn
  const loan = db.prepare('SELECT loan_id FROM BOOK_LOANS WHERE isbn = ? AND card_id = ? AND date_in IS NULL').get(isbn, numericCardId);
  if (!loan) return { success: false, message: 'No active loan found for that borrower and ISBN' };

  const updateByLoan = db.prepare("UPDATE BOOK_LOANS SET date_in = DATE('now') WHERE loan_id = ?");
  const res2 = updateByLoan.run(loan.loan_id);
  const changed2 = res2 && (res2.changes || res2.changes === 0) ? res2.changes : (res2.changes ?? 0);
  if (changed2 === 0) return { success: false, message: 'Failed to check in the book' };

  return { success: true, message: 'Checked in', loanId: loan.loan_id };
}

/**
 * Create a borrower if SSN does not already exist.
 * Auto-assigns a card_id using the next available ID.
 * Requires: ssn, bname, address (card_id is auto-assigned)
 */
export function createBorrower({ card_id, ssn, bname, address, phone }) {
  if (!ssn || !bname || !address) return { success: false, message: 'Name, SSN, and address are required' };

  const exists = db.prepare('SELECT COUNT(*) AS cnt FROM BORROWER WHERE ssn = ?').get(ssn);
  if (exists && exists.cnt > 0) return { success: false, message: 'A borrower with this SSN already exists. Borrowers are allowed to possess exactly one library card.' };

  // Auto-assign card_id: get the next available ID
  const maxCard = db.prepare('SELECT MAX(card_id) AS max_id FROM BORROWER').get();
  const nextCardId = (maxCard && maxCard.max_id) ? maxCard.max_id + 1 : 1;

  const insert = db.prepare('INSERT INTO BORROWER (card_id, ssn, bname, address, phone) VALUES (?, ?, ?, ?, ?)');
  insert.run(nextCardId, ssn, bname, address, phone || '');
  return { success: true, message: `Borrower created successfully. Your library card ID is: ${nextCardId}` };
}

/**
 * Refresh fines: insert new fines for late returned and unreturned books, and update unpaid fines amounts.
 */
export function refreshFines() {
  const insertLateReturned = db.prepare(`
    INSERT INTO FINES (loan_id, fine_amt, paid)
    SELECT bl.loan_id,
      ROUND((JULIANDAY(bl.date_in) - JULIANDAY(bl.due_date)) * 0.25, 2),
      0
    FROM BOOK_LOANS bl
    WHERE bl.date_in IS NOT NULL
      AND bl.date_in > bl.due_date
      AND bl.loan_id NOT IN (SELECT loan_id FROM FINES)
  `);
  const res1 = insertLateReturned.run();

  const insertLateUnreturned = db.prepare(`
    INSERT INTO FINES (loan_id, fine_amt, paid)
    SELECT bl.loan_id,
      ROUND((JULIANDAY('now') - JULIANDAY(bl.due_date)) * 0.25, 2),
      0
    FROM BOOK_LOANS bl
    WHERE bl.date_in IS NULL
      AND DATE('now') > bl.due_date
      AND bl.loan_id NOT IN (SELECT loan_id FROM FINES)
  `);
  const res2 = insertLateUnreturned.run();

  const updateFines = db.prepare(`
    UPDATE FINES
    SET fine_amt = (
      SELECT ROUND(
        (CASE
          WHEN bl.date_in IS NOT NULL THEN (JULIANDAY(bl.date_in) - JULIANDAY(bl.due_date))
          ELSE (JULIANDAY('now') - JULIANDAY(bl.due_date))
        END) * 0.25, 2
      )
      FROM BOOK_LOANS bl
      WHERE bl.loan_id = FINES.loan_id
    )
    WHERE paid = 0
  `);
  const res3 = updateFines.run();

  return { insertedReturned: (res1 && res1.changes) || 0, insertedUnreturned: (res2 && res2.changes) || 0, updated: (res3 && res3.changes) || 0 };
}

export function getBorrowerFines(card_id) {
  const sql = `
    SELECT bl.card_id, SUM(f.fine_amt) AS total_fine
    FROM FINES f
    JOIN BOOK_LOANS bl ON bl.loan_id = f.loan_id
    WHERE bl.card_id = ? AND f.paid = 0
    GROUP BY bl.card_id
  `;
  return db.prepare(sql).get(card_id) || { card_id, total_fine: 0 };
}

export function payFines(card_id) {
  const sql = `
    UPDATE FINES
    SET paid = 1
    WHERE loan_id IN (
      SELECT f.loan_id
      FROM FINES f
      JOIN BOOK_LOANS bl ON bl.loan_id = f.loan_id
      WHERE bl.card_id = ? AND f.paid = 0
    )
  `;
  const res = db.prepare(sql).run(card_id);
  return { success: true, changed: (res && res.changes) || 0 };
}

export default { getBooksByAuthor, searchBooks, isBookAvailable, performCheckout, findActiveLoans, performCheckin, createBorrower, refreshFines, getBorrowerFines, payFines };
