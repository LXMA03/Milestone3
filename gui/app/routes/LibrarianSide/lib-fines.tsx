import type { Route } from "../+types/fines";
import { useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Lib Fines" }, { name: "description", content: "Librarian: Check or pay fines" }];
}

export default function LibFines() {
  const [cardId, setCardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fines, setFines] = useState<{ card_id?: number; total_fine: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function checkFines(e: React.FormEvent) {
    e.preventDefault();
    if (!cardId.trim()) {
      setError("Please enter a card ID");
      return;
    }

    setLoading(true);
    setError(null);
    setFines(null);
    setPaymentSuccess(false);

    try {
      const numericCardId = parseInt(String(cardId).replace(/^ID/i, '').replace(/^0+/, ''), 10);
      if (Number.isNaN(numericCardId)) {
        setError("Invalid card ID");
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3000/api/borrower/${numericCardId}/fines`);
      if (!response.ok) {
        throw new Error("Failed to fetch fines");
      }

      const data = await response.json();
      setFines(data);
    } catch (err: any) {
      setError(err.message || "Error checking fines");
    } finally {
      setLoading(false);
    }
  }

  async function payFines(e: React.FormEvent) {
    e.preventDefault();
    if (!cardId.trim()) return;

    setPaying(true);
    setError(null);
    setPaymentSuccess(false);

    try {
      const numericCardId = parseInt(String(cardId).replace(/^ID/i, '').replace(/^0+/, ''), 10);
      const response = await fetch(`http://localhost:3000/api/borrower/${numericCardId}/payfines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to pay fines");
      }

      const data = await response.json();
      setPaymentSuccess(true);
      setFines({ card_id: numericCardId, total_fine: 0 });
    } catch (err: any) {
      setError(err.message || "Error paying fines");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Librarian: Check or Pay Fines</h1>
        <Link to="/librarian-login" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Back to Librarian Login
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {paymentSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Fines paid successfully!
        </div>
      )}

      <form onSubmit={checkFines} className="mb-6 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Enter card ID (e.g., 000001 or ID000001)"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded"
          disabled={loading || paying}
        />
        <button
          type="submit"
          disabled={loading || paying}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Checking..." : "Check Fines"}
        </button>
      </form>

      {fines !== null && (
        <div className="max-w-[300px] mx-auto rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-center">Fine Details</h2>
          <p className="mb-6 text-center leading-6 text-gray-700 dark:text-gray-200">
            <strong>Total Fines:</strong> ${fines.total_fine.toFixed(2)}
          </p>

          {fines.total_fine > 0 ? (
            <form onSubmit={payFines}>
              <button
                type="submit"
                disabled={paying}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 mb-2"
              >
                {paying ? "Processing..." : "Pay Fines"}
              </button>
            </form>
          ) : (
            <p className="text-center text-green-600 font-semibold">No outstanding fines!</p>
          )}

          <button
            type="button"
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-4"
          >
            Load Payment
          </button>
        </div>
      )}
    </main>
  );
}
