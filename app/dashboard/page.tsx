"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Contact } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import ThemeToggle from "@/components/ThemeToggle";
import Spinner from "@/components/Spinner";
import Clock from "@/components/Clock";

type SortOrder = "recent" | "az" | "updated";

export default function DashboardPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meResponse, contactsResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/contacts"),
        ]);

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();
        setUserName(meData.user.name);

        if (!contactsResponse.ok) {
          throw new Error("Unable to load contacts.");
        }

        const contactsData = await contactsResponse.json();
        setContacts(contactsData.contacts);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const filteredContacts = contacts
    .filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="spinner-lg" label="Loading dashboard" />
        <p className="subtle-copy text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 pb-24 sm:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="page-title">
            Dashboard
          </h1>
          <p className="subtle-copy">
            Welcome back, {userName} · {contacts.length}{" "}
            {contacts.length === 1 ? "contact" : "contacts"}
          </p>
        </div>

        <Clock className="hidden text-right sm:block" />

        <div className="flex flex-wrap gap-3">
          <ThemeToggle />
          <Link href="/dashboard/profile" className="secondary-button action-button">
            Profile
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="primary-button action-button hidden sm:inline-flex"
          >
            Add Contact
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="secondary-button logout-button"
          >
            Log Out
          </button>
        </div>
      </div>

      {error ? <p className="alert-error">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Your Contacts
            <span className="subtle-copy ml-2 text-sm font-normal">
              {filteredContacts.length} of {contacts.length}
            </span>
          </h2>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, address..."
              aria-label="Search contacts"
              className="form-input w-full !py-2 text-sm sm:w-64"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              aria-label="Sort contacts"
              className="form-input w-full !py-2 text-sm sm:w-40"
            >
              <option value="recent">Recently added</option>
              <option value="updated">Recently updated</option>
              <option value="az">Name A–Z</option>
            </select>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="subtle-copy px-6 py-14 text-center">
            No contacts yet.{" "}
            <Link
              href="/dashboard/contacts/new"
              className="text-link"
            >
              Add your first contact
            </Link>
            .
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="subtle-copy px-6 py-14 text-center">
            No contacts match &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredContacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4"
              >
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {contact.name}
                    </p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {[contact.email, contact.phone].filter(Boolean).join(" · ")}
                    </p>
                    {contact.address ? (
                      <p className="truncate text-sm text-slate-400 dark:text-slate-500">
                        {contact.address}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      Added {timeAgo(contact.createdAt)}
                      {contact.updatedAt !== contact.createdAt
                        ? ` · updated ${timeAgo(contact.updatedAt)}`
                        : ""}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 sm:inline">
                    View →
                  </span>
                </Link>
                <div className="flex shrink-0 gap-1.5">
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="icon-button"
                      title={`Call ${contact.name}`}
                      aria-label={`Call ${contact.name}`}
                    >
                      📞
                    </a>
                  ) : null}
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="icon-button"
                      title={`Email ${contact.name}`}
                      aria-label={`Email ${contact.name}`}
                    >
                      ✉️
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Floating quick-add for phones */}
      <Link
        href="/dashboard/contacts/new"
        className="primary-button action-button fixed bottom-5 right-5 z-40 rounded-full px-5 py-3 shadow-lg sm:hidden"
      >
        + Add
      </Link>
    </div>
  );
}
