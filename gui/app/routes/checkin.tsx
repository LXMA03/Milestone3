import type { Route } from "./+types/checkout";
import { useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Checkin Book" }, { name: "description", content: "Checkin a book by loan id" }];
}

export default function Checkin() {
  const [cardId, setCardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loans, setLoans] = useState<Array<any>>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loansLoaded, setLoansLoaded] = useState(false);

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!cardId.trim()) {
      setError("Please enter a card ID");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const numericCard = parseInt(cardId.trim().replace(/^ID/i, '').replace(/^0+/, ''), 10);
      if (Number.isNaN(numericCard)) throw new Error("Invalid card ID");

      // If loans are loaded and some are selected, checkin selected loan_ids
      const selectedLoanIds = Object.keys(selected).filter((k) => selected[k]);
      if (selectedLoanIds.length > 0) {
        const results: Array<any> = [];
        for (const loanId of selectedLoanIds) {
          const res = await fetch("http://localhost:3000/api/checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loan_id: parseInt(loanId, 10) }),
          });
          const data = await res.json().catch(() => ({ success: false, message: `HTTP ${res.status}` }));
          results.push({ loanId, ok: data.success, message: data.message });
        }
        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          setError(failed.map((f) => `Loan ${f.loanId}: ${f.message}`).join('; '));
        } else {
          setMessage('Selected books checked in');
          // reload loans
          await loadLoans(cardId);
        }
      } else {
        setError("Please select at least one book to check in");
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadLoans(inputCardId?: string) {
    const cid = (inputCardId ?? cardId).trim();
    if (!cid) {
      setError('Enter a card ID first');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const numericCard = parseInt(cid.replace(/^ID/i, '').replace(/^0+/, ''), 10);
      if (Number.isNaN(numericCard)) throw new Error('Invalid card ID');
      const res = await fetch(`http://localhost:3000/api/borrower/${numericCard}/loans`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoans(data.loans || []);
      setLoansLoaded(true);
      // reset selections
      const sel: Record<string, boolean> = {};
      (data.loans || []).forEach((l: any) => (sel[String(l.loan_id)] = false));
      setSelected(sel);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoans([]);
      setLoansLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold ">Checkin Book</h1>
        <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Back to Home
        </Link>
      </div>

      <form onSubmit={handleCheckin} className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          className="col-span-1 p-2 border rounded"
          type="text"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          placeholder="Card ID (e.g. 000001 or ID000001)"
          disabled={loading}
        />
        <div className="col-span-1 flex gap-2">
          <button type="button" onClick={() => loadLoans(cardId)} className="px-3 py-2 bg-gray-300 rounded">
            Load Loans
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400" disabled={loading || loans.length === 0}>
            {loading ? "Processing…" : "Checkin"}
          </button>
        </div>
      </form>

      {loans.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Active Loans</h2>
          <ul className="space-y-2">
            {loans.map((l: any) => (
              <li key={l.loan_id} className="p-2 border rounded flex items-center justify-between">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={!!selected[String(l.loan_id)]} onChange={(e) => setSelected((s) => ({ ...s, [String(l.loan_id)]: e.target.checked }))} />
                  <div>
                    <div className="font-medium">{l.book_title || l.isbn}</div>
                    <div className="text-sm text-gray-600">ISBN: {l.isbn} — Loan ID: {l.loan_id}</div>
                    <div className="text-sm text-gray-600">Out: {l.date_out} — Due: {l.due_date}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loansLoaded && loans.length === 0 && !error && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded mb-4">
          <p className="font-semibold">No books to checkin</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
          <p className="font-semibold">Success</p>
          <p>{message}</p>
        </div>
      )}
    </main>
  );
}
