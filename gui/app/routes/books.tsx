import type { Route } from "./+types/books";
import { useState } from "react";

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
      const res = await fetch("http://localhost:3000/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      const data = await res.json();
      // Expecting { books: [ { isbn, book_title, author }, ... ] }
      setResults(data.books ?? []);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Search Books by Author</h1>

      <form onSubmit={search} className="mb-6 flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author name, e.g. Jane Austen"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      <ul className="space-y-4">
        {results.length === 0 && !loading && <li>No results</li>}
        {results.map((book) => (
          <li key={book.isbn} className="p-4 border rounded">
            <div className="text-lg font-medium">{book.book_title}</div>
            {book.author && <div className="text-sm">By: {book.author}</div>}
            {book.isbn && <div className="text-sm text-gray-600">ISBN: {book.isbn}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
