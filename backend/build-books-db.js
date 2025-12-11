import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Build a simple `library` SQLite database file using this order:
// 1. `process.env.BOOKS_DB` if set
// 2. first CLI arg (node build-books-db.js ./db/library.db)
// 3. default to `./db/library.db` in repository root
const defaultFile = './db/library.db';
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

// Drop existing tables
database.exec('DROP TABLE IF EXISTS FINES;');
database.exec('DROP TABLE IF EXISTS BOOK_LOANS;');
database.exec('DROP TABLE IF EXISTS BOOK_AUTHOR;');
database.exec('DROP TABLE IF EXISTS AUTHORS;');
database.exec('DROP TABLE IF EXISTS BORROWER;');
database.exec('DROP TABLE IF EXISTS BOOK;');

// Create library schema
database.exec(`
  CREATE TABLE BOOK (
    isbn TEXT PRIMARY KEY,
    title TEXT NOT NULL
  );
`);

database.exec(`
  CREATE TABLE AUTHORS (
    author_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
`);

database.exec(`
  CREATE TABLE BOOK_AUTHOR (
    author_id INTEGER,
    isbn TEXT,
    PRIMARY KEY (author_id, isbn),
    FOREIGN KEY (author_id) REFERENCES AUTHORS(author_id),
    FOREIGN KEY (isbn) REFERENCES BOOK(isbn)
  );
`);

database.exec(`
  CREATE TABLE BORROWER (
    card_id INTEGER PRIMARY KEY,
    ssn TEXT NOT NULL UNIQUE,
    bname TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL
  );
`);

database.exec(`
  CREATE TABLE BOOK_LOANS (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT NOT NULL,
    card_id INTEGER NOT NULL,
    date_out DATE NOT NULL,
    due_date DATE NOT NULL,
    date_in DATE,
    FOREIGN KEY (isbn) REFERENCES BOOK(isbn),
    FOREIGN KEY (card_id) REFERENCES BORROWER(card_id)
  );
`);

database.exec(`
  CREATE TABLE FINES (
    loan_id INTEGER PRIMARY KEY,
    fine_amt DECIMAL(8,2) NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (loan_id) REFERENCES BOOK_LOANS(loan_id)
  );
`);

// Insert sample data
const authorInsert = database.prepare('INSERT INTO AUTHORS (author_id, name) VALUES (?, ?)');
const bookInsert = database.prepare('INSERT INTO BOOK (isbn, title) VALUES (?, ?)');
const bookAuthorInsert = database.prepare('INSERT INTO BOOK_AUTHOR (author_id, isbn) VALUES (?, ?)');
const borrowerInsert = database.prepare('INSERT INTO BORROWER (card_id, ssn, bname, address, phone) VALUES (?, ?, ?, ?, ?)');

// Read CSV files from local data directory by default or use CSV_DIR env var
const defaultCsvDir = path.resolve('./data');
const csvPath = process.env.CSV_DIR || defaultCsvDir;

// Load authors from CSV
const authorsCSV = fs.readFileSync(path.join(csvPath, 'authors.csv'), 'utf-8');
const authorLines = authorsCSV.trim().split('\n');
for (const line of authorLines) {
  const [id, name] = line.split(',');
  if (id && name) {
    try {
      authorInsert.run(parseInt(id), name.trim());
    } catch (err) {
      // Skip duplicates or errors
    }
  }
}

// Load books from CSV
const booksCSV = fs.readFileSync(path.join(csvPath, 'book.csv'), 'utf-8');
const bookLines = booksCSV.trim().split('\n');
for (const line of bookLines) {
  const parts = line.split(',');
  if (parts.length >= 2) {
    const isbn = parts[0].trim();
    const title = parts[1].trim();
    if (isbn && title) {
      try {
        bookInsert.run(isbn, title);
      } catch (err) {
        // Skip duplicates or errors
      }
    }
  }
}

// Load book-author relationships from CSV (use unique mapping file)
const bookAuthorsCSV = fs.readFileSync(path.join(csvPath, 'book_authors_unique.csv'), 'utf-8');
const bookAuthorLines = bookAuthorsCSV.trim().split('\n');
for (const line of bookAuthorLines) {
  const [authorId, rawIsbn] = line.split(',');
  if (authorId && rawIsbn) {
    try {
      let isbnVal = rawIsbn.trim();
      // If the unique file uses 13-digit ISBNs starting with 978, convert to 10-digit by removing the 978 prefix
      if (/^978\d{10}$/.test(isbnVal)) {
        const maybe10 = isbnVal.slice(3);
        // prefer the 10-digit form if the BOOK table uses 10-digit ISBNs
        isbnVal = maybe10;
      }
      bookAuthorInsert.run(parseInt(authorId), isbnVal);
    } catch (err) {
      // Skip duplicates or errors
    }
  }
}

// Load borrowers from CSV (use the no-header file provided)
const borrowersCSV = fs.readFileSync(path.join(csvPath, 'borrowers_noheader.csv'), 'utf-8');
const borrowerLines = borrowersCSV.trim().split('\n');
for (const line of borrowerLines) {
  const parts = line.split(',');
  if (parts.length >= 5) {
    const rawCardId = parts[0].trim(); // e.g., "ID000001" or "000001"
    const ssn = parts[1].trim();
    const bname = parts[2].trim();
    const address = parts[3].trim();
    const phone = parts[4].trim();
    // Normalize card id to integer (drop leading ID and parse number)
    const numericPart = rawCardId.replace(/^ID/i, '').replace(/^0+/, '') || '0';
    const cardId = parseInt(numericPart, 10);
    if (!Number.isNaN(cardId) && ssn && bname) {
      try {
        borrowerInsert.run(cardId, ssn, bname, address, phone);
      } catch (err) {
        // Skip duplicates or errors
      }
    }
  }
}

// Query and show contents
const query = database.prepare(`
  SELECT
    b.isbn,
    b.title,
    GROUP_CONCAT(a.name, ', ') AS authors
  FROM BOOK b
  LEFT JOIN BOOK_AUTHOR ba ON b.isbn = ba.isbn
  LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
  GROUP BY b.isbn, b.title
  ORDER BY b.title
`);
const rows = query.all();
console.log('Books table rows:', rows);

console.log(`Books DB written to: ${dbPath}`);
