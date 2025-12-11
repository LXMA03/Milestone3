import { Link } from "react-router";

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4 min-h-screen">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 w-full">
        <header className="flex flex-col items-center gap-9">
          <h1 className="text-3xl font-semibold text-center">Welcome to the Library!</h1>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <p className="leading-6 text-gray-700 dark:text-gray-200 text-center">
              What&apos;s next?
            </p>
            <div className="space-y-3">
              <Link
                to="/books"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-blue-700"
              >
                Search Books
              </Link>
              <Link
                to="/checkout"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-green-700"
              >
                Checkout Book
              </Link>
              <Link
                to="/checkin"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-green-700"
              >
                Checkin Book
              </Link>
              <Link
                to="/fines"
                className="block text-center rounded p-3 bg-blue-600 text-white hover:bg-green-700"
              >
                Check Fines
              </Link>
            </div>
          </nav>
        </div>
        <div className="w-full flex justify-center mt-auto pb-2">
          <Link
            to="/librarian-login"
            className="block text-center rounded p-3 bg-gray-800 text-white hover:bg-gray-900 w-[300px]"
          >
            Librarian Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Welcome;
