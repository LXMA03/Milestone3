import express from 'express';
import { getBooksByAuthor } from './books-data.js';

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

// POST /books
// Body: { "author": "Author Name" }
// Returns: { books: [ { isbn, book_title, author }, ... ] }
app.post('/books', (req, res) => {
  const { author } = req.body ?? {};
  if (!author || typeof author !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "author" in request body' });
  }

  try {
    const books = getBooksByAuthor(author.trim());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.json({ books });
  } catch (err) {
    console.error('Error querying books DB:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
