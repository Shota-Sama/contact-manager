"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ContactForm from "@/components/ContactForm";

export default function NewContactPage() {
  const router = useRouter();

  async function handleSubmit(values: {
    name: string;
    email: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
  }) {
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to create contact.");
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="app-shell flex-1 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-link text-sm"
        >
          ← Back to dashboard
        </Link>
        <p className="eyebrow mt-6">New contact</p>
        <h1 className="page-title">Add someone to your list</h1>
        <p className="subtle-copy mt-2">Add the basics first, then drop a pin if you know their location.</p>
      </div>

      <div className="contact-editor">
        <aside className="contact-editor-aside">
          <span className="feature-icon">+</span>
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Contact details</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">A name is all you need. Email, phone, address, and a map pin are optional.</p>
          <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-200">Quick tip</p>
            <p className="mt-1">Click anywhere on the map to fill the closest address automatically.</p>
          </div>
        </aside>
        <div className="contact-editor-form">
        <ContactForm submitLabel="Create Contact" onSubmit={handleSubmit} />
        </div>
      </div>
      </div>
    </div>
  );
}
