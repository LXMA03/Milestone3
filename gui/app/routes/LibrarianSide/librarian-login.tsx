import React, { useState } from "react";
import { Link } from "react-router";

const DEMO_USERNAME = "test123";
const DEMO_PASSWORD = "test";

export default function LibrarianLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid credentials. Try username "test123" and password "test".');
      setIsAuthenticated(false);
    }
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4 min-h-screen">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 w-full">
        <header className="flex flex-col items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
            Librarian Portal
          </p>
          <h1 className="text-3xl font-semibold text-center">Welcome, Administrator</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-md">
            Use the demo credentials below to explore librarian tools for searching books and managing
            fines.
          </p>
        </header>

        {/* Login Card */}
        {!isAuthenticated && (
          <div className="max-w-md w-full px-4">
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Demo login:
                  <span className="ml-1 font-mono">{DEMO_USERNAME}</span>
                  <span className="mx-1">/</span>
                  <span className="font-mono">{DEMO_PASSWORD}</span>
                </p>

                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                >
                  Sign in
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Authenticated state: librarian actions */}
        {isAuthenticated && (
          <div className="max-w-[360px] w-full space-y-6 px-4">
            <div className="rounded-3xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-50">
              <p className="font-semibold">Signed in</p>
              <p>Welcome back! You can now access librarian tools below.</p>
            </div>

            <nav className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80 space-y-4">
              <p className="leading-6 text-gray-700 dark:text-gray-200 text-center text-sm">
                Librarian Options
              </p>
              <div className="space-y-3">
                <Link
                  to="/books"
                  className="block text-center rounded-lg p-3 text-sm font-medium bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Search Books
                </Link>
                <Link
                  to="/lib-fines"
                  className="block text-center rounded-lg p-3 text-sm font-medium bg-sky-600 text-white shadow-sm transition hover:bg-sky-700"
                >
                  Check / Update Fines
                </Link>
              </div>
            </nav>
          </div>
        )}

        <div className="w-full flex justify-center mt-auto pb-2">
          <Link
            to="/"
            className="block text-center rounded-lg p-3 bg-gray-800 text-white hover:bg-gray-900 w-[300px] text-sm font-medium shadow-sm"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
