import React from "react";

export default function LibrarianLogin() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4 min-h-screen">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 w-full">
        <header className="flex flex-col items-center gap-9">
          <h1 className="text-3xl font-semibold text-center">Welcome, Administrator</h1>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <p className="leading-6 text-gray-700 dark:text-gray-200 text-center">
              Librarian Options
            </p>
            <div className="space-y-3">
              <a
                href="/books"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-green-700"
              >
                Search Books
              </a>
              <a
                href="/lib-fines"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-green-700"
              >
                Check / Update Fines
              </a>
            </div>
          </nav>
        </div>
        <div className="w-full flex justify-center mt-auto pb-2">
          <a
            href="/"
            className="block text-center rounded p-3 bg-gray-800 text-white hover:bg-gray-900 w-[300px]"
          >
            Back to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}
