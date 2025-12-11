import type { Route } from "./+types/checkout";
import { useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Checkout Book" }, { name: "description", content: "Checkout a book from the library" }];
}

export default function Checkout() {
  // Checkout form
  const [isbn, setIsbn] = useState("");
  const [cardId, setCardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // New borrower registration form
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regSsn, setRegSsn] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isbn.trim() || !cardId.trim()) {
      setError("Please enter both ISBN and Borrower ID");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setMessage(null);

    try {
      // Accept either "000001" or "ID000001" and normalize to integer (1)
      let numericPart = cardId.trim().replace(/^ID/i, '').replace(/^0+/, '');
      if (numericPart === '') numericPart = '0';
      const numericCardId = parseInt(numericPart, 10);
      if (Number.isNaN(numericCardId)) {
        throw new Error('Invalid Borrower ID');
      }

      const res = await fetch("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: isbn.trim(), card_id: numericCardId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setMessage(data.message || "Book checked out successfully!");
        setIsbn("");
        setCardId("");
      } else {
        setError(data.message || "Checkout failed");
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!regName.trim() || !regSsn.trim() || !regAddress.trim()) {
      setRegError("Name, SSN, and address are required");
      return;
    }

    setRegLoading(true);
    setRegError(null);
    setRegSuccess(false);
    setRegMessage(null);

    try {
      // For simplicity, use the SSN as a basis for card_id or let backend assign one
      // In this case, we'll let the backend auto-generate or assign
      const res = await fetch("http://localhost:3000/api/borrower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: 0, // backend may auto-assign or ignore this
          ssn: regSsn.trim(),
          bname: regName.trim(),
          address: regAddress.trim(),
          phone: regPhone.trim() || "",
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = await res.json();

      if (data.success) {
        setRegSuccess(true);
        setRegMessage(data.message || "Borrower account created successfully!");
        setRegName("");
        setRegSsn("");
        setRegAddress("");
        setRegPhone("");
        setShowRegister(false);
      } else {
        setRegError(data.message || "Registration failed");
      }
    } catch (err: any) {
      setRegError(err?.message ?? String(err));
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Checkout Book</h1>
        <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Back to Home
        </Link>
      </div>

      {/* Checkout Section */}
      <section className="mb-8">
        <form onSubmit={handleCheckout} className="mb-6 flex gap-2">
          <input
            className="flex-1 p-2 border rounded"
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="ISBN"
            disabled={loading}
          />
          <input
            className="flex-1 p-2 border rounded"
            type="text"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            placeholder="Borrower ID"
            disabled={loading}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400" disabled={loading}>
            {loading ? "Processing…" : "Checkout"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            <p className="font-semibold">Unable to checkout</p>
            <p>{error}</p>
          </div>
        )}

        {success && message && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
            <p className="font-semibold">Success</p>
            <p>{message}</p>
          </div>
        )}
      </section>

      {/* New Borrower Registration Section */}
      <section className="border-t pt-8">
        <button
          type="button"
          onClick={() => setShowRegister(!showRegister)}
          className="mb-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          {showRegister ? "Hide" : "New Borrower? Register Here"}
        </button>

        {showRegister && (
          <div className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Create a New Borrower Account</h3>
            <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  className="w-full p-2 border rounded"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full name"
                  disabled={regLoading}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Social Security Number (SSN) *</label>
                <input
                  className="w-full p-2 border rounded"
                  type="text"
                  value={regSsn}
                  onChange={(e) => setRegSsn(e.target.value)}
                  placeholder="SSN"
                  disabled={regLoading}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  className="w-full p-2 border rounded"
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street address"
                  disabled={regLoading}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                <input
                  className="w-full p-2 border rounded"
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Phone number"
                  disabled={regLoading}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  disabled={regLoading}
                >
                  {regLoading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>

            {regError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-semibold">Error</p>
                <p>{regError}</p>
              </div>
            )}

            {regSuccess && regMessage && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <p className="font-semibold">Success</p>
                <p>{regMessage}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
