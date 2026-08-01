import Link from "next/link";

export default function InternalHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3" aria-label="Internal navigation">
        <Link href="/internal/submissions" className="text-sm font-semibold text-gray-900">
          Article6 Internal
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/internal/submissions" className="text-gray-600 hover:text-gray-900">
            Submissions
          </Link>
          <Link href="/internal/submissions/new" className="text-forest-700 hover:text-forest-800">
            New submission
          </Link>
          <form action="/api/internal/signout" method="post">
            <button type="submit" className="text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
