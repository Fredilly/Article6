import Link from "next/link";
import { useInternalReset } from "./InternalResetContext";

export default function InternalHeader() {
  const { resetInternalPage } = useInternalReset();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3" aria-label="Internal navigation">
        <Link href="/internal/submissions/new" className="text-sm font-semibold text-gray-900">
          Article6 Internal
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/internal/submissions/new" onClick={resetInternalPage} className="text-forest-700 hover:text-forest-800">
            New submission
          </Link>
        </div>
      </nav>
    </header>
  );
}
