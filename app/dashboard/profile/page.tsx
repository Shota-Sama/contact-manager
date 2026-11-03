"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Spinner from "@/components/Spinner";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const [meResponse, contactsResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/contacts"),
        ]);
        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }
        const { user } = await meResponse.json();
        setName(user.name);
        setEmail(user.email);
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          setContactCount(contactsData.contacts.length);
        }
      } catch {
        setError("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update your profile.");

      setName(data.user.name);
      setEmail(data.user.email);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="spinner-lg" label="Loading profile" />
        <p className="subtle-copy text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="app-shell flex-1 px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/dashboard" className="text-link text-sm">← Back to dashboard</Link>

        {/* Gradient banner with avatar */}
        <section className="profile-banner mt-5 overflow-hidden rounded-2xl">
          <div className="profile-banner-bg px-6 pb-6 pt-8 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="avatar-lg">{initialsOf(name)}</span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {name || "Your profile"}
                  </h1>
                  <p className="mt-0.5 text-sm text-blue-100">{email}</p>
                </div>
              </div>
              {contactCount !== null ? (
                <span className="profile-stat">
                  {contactCount} {contactCount === 1 ? "contact" : "contacts"}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-[var(--surface)] sm:px-8">
            <Link href="/dashboard" className="secondary-button action-button !px-4 !py-1.5 text-sm">
              Dashboard
            </Link>
            <Link href="/dashboard/contacts/new" className="secondary-button action-button !px-4 !py-1.5 text-sm">
              + Add contact
            </Link>
          </div>
        </section>

        {/* Form */}
        <section className="panel mt-5 p-6 sm:p-8">
          <p className="eyebrow">Account settings</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Edit your details
          </h2>
          <p className="subtle-copy mt-1 text-sm">Update your name, email address, or password.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <p className="section-heading">Profile details</p>
              <div>
                <label htmlFor="name" className="form-label">Display name</label>
                <input id="name" className="form-input" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="email" className="form-label">Email address</label>
                <input id="email" type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-slate-200 pt-6 dark:border-slate-700">
              <p className="section-heading">Security</p>
              <div>
                <label htmlFor="current-password" className="form-label">Current password</label>
                <input id="current-password" type="password" autoComplete="current-password" className="form-input" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                <p className="subtle-copy mt-2 text-xs">Required to protect changes to your account.</p>
              </div>
              <div>
                <label htmlFor="new-password" className="form-label">New password <span className="font-normal">(optional)</span></label>
                <input id="new-password" type="password" autoComplete="new-password" minLength={6} className="form-input" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
            </div>

            {error ? <p className="alert-error">{error}</p> : null}
            {message ? <p className="alert-success">{message}</p> : null}

            <button type="submit" disabled={saving} className="primary-button action-button w-full sm:w-fit">
              {saving ? (<><Spinner /> Saving...</>) : "Save profile"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
