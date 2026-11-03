import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Clock from "@/components/Clock";

export default function Home() {
  return (
    <div className="app-shell flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <main className="home-panel w-full max-w-4xl overflow-hidden">
        <div className="home-hero">
          <div className="home-badge">CM</div>
          <div>
            <p className="eyebrow">Personal workspace</p>
            <h1 className="page-title">Contact Manager</h1>
            <p className="subtle-copy mt-3 max-w-xl text-lg">
              Keep the people you need close, organized, and easy to find.
            </p>
            <div className="mt-4">
              <Clock />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="feature-card">
            <span className="feature-icon">01</span>
            <h2 className="mt-4 font-semibold text-slate-800 dark:text-slate-100">Contacts</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create, read, update, and delete contacts from your dashboard.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">02</span>
            <h2 className="mt-4 font-semibold text-slate-800 dark:text-slate-100">Locations</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pin a place on the map and fill the address automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-800/50 sm:flex-row sm:justify-end sm:px-8">
          <ThemeToggle />
          <Link
            href="/login"
            className="primary-button action-button px-6"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="secondary-button action-button px-6"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
