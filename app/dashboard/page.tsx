"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Contact } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="page-title">
            Dashboard
          </h1>
          <p className="subtle-copy">
            Welcome back, {userName}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/profile" className="secondary-button action-button">
            Profile
          </Link>
          <Link
            href="/dashboard/contacts/new"
            className="primary-button action-button"
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

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Your Contacts
          </h2>
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
        ) : (
          <ul className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {contact.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {[contact.email, contact.phone].filter(Boolean).join(" · ")}
                    </p>
                    {contact.address ? (
                      <p className="text-sm text-slate-400">
                        {contact.address}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-blue-600">View contact</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
