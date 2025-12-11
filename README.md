This repository contains a small demo with a GUI (Vite + React Router) and a backend (Express + SQLite) used to search books by author.

This README explains how to generate the database, run the backend server, and start the GUI dev server.

Prerequisites
 - Node.js (recommended >= 22)
 - npm
 - (optional) `sqlite3` CLI if you want to inspect the DB manually

1. Run the backend server

Install backend dependencies (only required once):

```bash
cd backend
npm install
```

Start the backend from the repo root:

```bash
node ./app.js
```

By default the backend listens on port `3000`. The backend exposes a `POST /books` endpoint that expects JSON `{ "author": "..." }` and returns `{ "books": [...] }`.

Note about CORS: the dev backend includes a lightweight CORS middleware that allows requests from `http://localhost:5173` (the default Vite dev origin). If you run the GUI dev server on a different origin, either update the backend allowed origin or use a proxy.

2. Run the GUI (dev)

Install GUI dependencies (only required once):

```bash
cd gui
npm install
```

Start the GUI dev server:

```bash
npm run dev
```

3. Test the backend directly
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