"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ContactForm from "@/components/ContactForm";
import type { Contact } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import Spinner from "@/components/Spinner";

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContact() {
      try {
        const response = await fetch(`/api/contacts/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Contact not found.");
        }

        setContact(data.contact);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load contact.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadContact();
  }, [params.id]);

  async function handleSubmit(values: {
    name: string;
    email: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  }) {
    const response = await fetch(`/api/contacts/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to update contact.");
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleDelete() {
    const response = await fetch(`/api/contacts/${params.id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to delete contact.");
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="spinner-lg" label="Loading contact" />
        <p className="subtle-copy text-sm">Loading contact...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10">
        <p className="alert-error">{error || "Contact not found."}</p>
        <Link href="/dashboard" className="text-link text-sm">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link
          href="/dashboard"
          className="text-link text-sm"
        >
          ← Back to dashboard
        </Link>
        <p className="eyebrow mt-6">Edit contact</p>
        <h1 className="page-title">Edit Contact</h1>
      </div>

      <div className="panel p-6 sm:p-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60">
          <p className="font-medium text-slate-700 dark:text-slate-200">Created by</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {contact.createdByName || "Unknown user"}
            {contact.createdByEmail ? ` · ${contact.createdByEmail}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Added {timeAgo(contact.createdAt)}
            {contact.updatedAt !== contact.createdAt
              ? ` · updated ${timeAgo(contact.updatedAt)}`
              : ""}
          </p>
        </div>
        <ContactForm
          initialValues={contact}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
