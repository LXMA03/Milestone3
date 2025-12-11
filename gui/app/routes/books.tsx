import type { Route } from "./+types/books";
import { useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Books" }, { name: "description", content: "Search books by author" }];
}

export default function Books() {
  const [author, setAuthor] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!author.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // Use the GET search endpoint (returns the same { books: [...] } shape)
      const q = encodeURIComponent(author.trim());
      const res = await fetch(`http://localhost:3000/api/books/search?q=${q}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Expecting { books: [ { isbn, title, authors, status }, ... ] }
      setResults(data.books ?? []);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  // Search calls the backend which queries `library.db` with `searchBooks`
  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Search Books by Author, ISBN, or Title</h1>
        <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Back to Home
        </Link>
      </div>

      <form onSubmit={search} className="mb-6 flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Search"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <ol className="space-y-4">
        {results.length === 0 && !loading && <li>No results</li>}
        {results.map((book, index) => (
          <li key={book.isbn} className="p-4 border rounded">
            <div className="text-sm text-gray-500 mb-2">#{index + 1}</div>
            <div className="text-lg font-medium">{book.title}"</div>
            {book.authors && <div className="text-sm">By: {book.authors}</div>}
            {book.isbn && <div className="text-sm text-gray-600">ISBN: {book.isbn}</div>}
            {book.status && <div className="text-sm font-semibold" style={{ color: book.status === 'IN' ? '#16a34a' : '#dc2626' }}>Status: {book.status}</div>}
          </li>
        ))}
      </ol>
    </main>
  );
}
