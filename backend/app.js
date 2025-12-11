import express from 'express';
import books from './books-data.js';
const { getBooksByAuthor, searchBooks, listAllBooks, listAllAuthors, isBookAvailable, performCheckout, findActiveLoans, performCheckin, createBorrower, refreshFines, getBorrowerFines, payFines } = books;

const app = express();
const port = process.env.PORT || 3000;

// Simple CORS middleware to allow requests from the GUI dev server
// Change the origin value to restrict allowed origins in production.
app.use((req, res, next) => {
  // Allow the GUI dev server origin (update if your dev server runs elsewhere)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  // Allow these headers in requests
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Allow these methods
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  // If this is a preflight request, respond immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Note: POST /books removed — use GET /api/books/search?q=term instead.

// GET /api/books/search?q=term
app.get('/api/books/search', (req, res) => {
  const q = req.query.q || '';
  try {
    const rows = searchBooks(q.trim());
    return res.json({ books: rows });
  } catch (err) {
    console.error('Search error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/books/all
app.get('/api/books/all', (req, res) => {
  try {
    const rows = listAllBooks();
    return res.json({ books: rows });
  } catch (err) {
    console.error('List all books error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/authors
app.get('/api/authors', (req, res) => {
  try {
    const rows = listAllAuthors();
    return res.json({ authors: rows });
  } catch (err) {
    console.error('List authors error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/books/:isbn/availability
app.get('/api/books/:isbn/availability', (req, res) => {
  const { isbn } = req.params;
  try {
    const ok = isBookAvailable(isbn);
    return res.json({ isbn, available: !!ok });
  } catch (err) {
    console.error('Availability error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/checkout  { isbn, card_id }
app.post('/api/checkout', (req, res) => {
  const { isbn, card_id } = req.body ?? {};
  try {
    const result = performCheckout({ isbn, card_id });
    return res.json(result);
  } catch (err) {
    console.error('Checkout error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/checkin  { loan_id } OR { card_id, isbn }
app.post('/api/checkin', (req, res) => {
  const body = req.body ?? {};
  try {
    const result = performCheckin(body);
    return res.json(result);
  } catch (err) {
    console.error('Checkin error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/borrower/:card_id/loans  -> active loans for borrower
app.get('/api/borrower/:card_id/loans', (req, res) => {
  const { card_id } = req.params;
  try {
    const rows = findActiveLoans({ card_id });
    return res.json({ loans: rows });
  } catch (err) {
    console.error('Find active loans error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/borrower  { card_id, ssn, bname, address, phone }
app.post('/api/borrower', (req, res) => {
  try {
    const result = createBorrower(req.body ?? {});
    return res.json(result);
  } catch (err) {
    console.error('Create borrower error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fines/refresh
app.post('/api/fines/refresh', (req, res) => {
  try {
    const result = refreshFines();
    return res.json(result);
  } catch (err) {
    console.error('Refresh fines error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/borrower/:card_id/fines
app.get('/api/borrower/:card_id/fines', (req, res) => {
  const { card_id } = req.params;
  try {
    const result = getBorrowerFines(card_id);
    return res.json(result);
  } catch (err) {
    console.error('Get borrower fines error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/borrower/:card_id/payfines
app.post('/api/borrower/:card_id/payfines', (req, res) => {
  const { card_id } = req.params;
  try {
    const result = payFines(card_id);
    return res.json(result);
  } catch (err) {
    console.error('Pay fines error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
