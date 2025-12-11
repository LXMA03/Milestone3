# React Router Demo

This repository contains a small demo with a GUI (Vite + React Router) and a backend (Express + SQLite) used to search books by author.

This README explains how to generate the sample books database, run the backend server, and start the GUI dev server.

Prerequisites
 - Node.js (recommended >= 18)
 - npm
 - (optional) `sqlite3` CLI if you want to inspect the DB manually

Repository layout (important files)
- `gui/` — Vite + React Router GUI application
- `backend/` — Express backend and DB helper scripts
- `backend/build-books-db.js` — script to create `db/books.sqlite` and seed sample rows
- `backend/app.js` — Express server exposing `POST /books` (expects `{ author }`) and returns matching books
- `backend/books-data.js` — module that encapsulates SQLite access

1) Generate the books database

From the project root run:

```bash
node backend/build-books-db.js
```

This will create `./db/books.sqlite` by default and insert a few sample rows. You can also specify the output file:

```bash
node backend/build-books-db.js ./data/my-books.sqlite
# or set BOOKS_DB env var
BOOKS_DB=./data/my-books.sqlite node backend/build-books-db.js
```

CSV data (optional)
 - By default the build script looks for CSV files in `backend/data`. You can either copy your CSVs into that folder or point the script at another directory via the `CSV_DIR` environment variable.
 - Expected CSV filenames (place them in `backend/data`):
   - `authors.csv`
   - `book.csv`
   - `book_authors_unique.csv` (use this unique mapping file)
   - `borrowers_noheader.csv`
 - Example: copy CSVs into the project-local data folder and run the build:
```bash
mkdir -p backend/data
cp /path/to/your/csvs/{authors.csv,book.csv,book_authors_unique.csv,borrowers_noheader.csv} backend/data/
node backend/build-books-db.js
```
 - Or run the script against a custom CSV directory:
```bash
CSV_DIR=/full/path/to/csvs node backend/build-books-db.js
```
 - Do NOT commit CSVs with private data (SSNs/addresses) to your git repository. Keep them out of source control or provide a small anonymized sample in `backend/data/sample/` if you want a repo-friendly example.

2) Run the backend server

Install backend dependencies (only required once):

```bash
cd backend
npm install
cd ..
```

Start the backend from the repo root:

```bash
node backend/app.js
```

By default the backend listens on port `3000`. The backend exposes a `POST /books` endpoint that expects JSON `{ "author": "..." }` and returns `{ "books": [...] }`.

Note about CORS: the dev backend includes a lightweight CORS middleware that allows requests from `http://localhost:5173` (the default Vite dev origin). If you run the GUI dev server on a different origin, either update the backend allowed origin or use a proxy.

3) Run the GUI (dev)

Install GUI dependencies (only required once):

```bash
cd gui
npm install
cd ..
```

Start the GUI dev server:

```bash
cd gui
npm run dev
```

The GUI dev server typically runs on `http://localhost:5173`. Use the app to navigate to the "Search Books" page and search for an author (e.g. `Austen`). The GUI will POST to `http://localhost:3000/books`.

4) Test the backend directly

You can test the backend via curl:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"author":"Austen"}' http://localhost:3000/books
```

Troubleshooting
- CORS errors in the browser: either ensure the backend `Access-Control-Allow-Origin` header includes your GUI origin, or use a Vite proxy so the browser sees same-origin requests. To set a Vite proxy, edit `gui/vite.config.ts` and add a `server.proxy` entry such as:

```ts
// vite.config.ts (example)
export default defineConfig({
  server: {
    proxy: {
      '/books': 'http://localhost:3000'
    }
  }
});
```

- If the backend fails to start because of missing DB file, run the `build-books-db.js` script first.
- If you change locations for the DB file, set `BOOKS_DB` env var or update `backend/books-data.js` to point to the correct path.

Security and production notes
- The current CORS setup and the use of the built-in experimental `node:sqlite` API are intended for local development and demonstration only. For production use:
  - Use a stable SQLite client (e.g., `better-sqlite3`), or a managed database.
  - Ensure CORS is configured to allow only trusted origins.
  - Add proper input validation, rate limiting, and authentication as needed.

If you'd like, I can add a Vite proxy configuration, switch the backend to use the `cors` package, or convert the backend to use `better-sqlite3` for production readiness.
