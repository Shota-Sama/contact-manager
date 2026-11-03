"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const { user } = await response.json();
        setName(user.name);
        setEmail(user.email);
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
    return <div className="app-shell flex flex-1 items-center justify-center subtle-copy">Loading profile...</div>;
  }

  return (
    <main className="app-shell flex-1 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/dashboard" className="text-link text-sm">← Back to dashboard</Link>
        <section className="panel mt-5 p-6 sm:p-8">
          <p className="eyebrow">Account settings</p>
          <h1 className="page-title">Your profile</h1>
          <p className="subtle-copy mt-2">Update your name, email address, or password.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="form-label">Display name</label>
              <input id="name" className="form-input" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input id="email" type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
              <label htmlFor="current-password" className="form-label">Current password</label>
              <input id="current-password" type="password" className="form-input" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              <p className="subtle-copy mt-2 text-xs">Required to protect changes to your account.</p>
            </div>
            <div>
              <label htmlFor="new-password" className="form-label">New password <span className="font-normal">(optional)</span></label>
              <input id="new-password" type="password" minLength={6} className="form-input" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>

            {error ? <p className="alert-error">{error}</p> : null}
            {message ? <p className="alert-success">{message}</p> : null}

            <button type="submit" disabled={saving} className="primary-button w-full sm:w-fit">
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
