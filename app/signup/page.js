"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create account.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Contact Manager</p>
        <h2 className="page-title">Create your account</h2>
        <p className="subtle-copy mt-2">Start organizing the people you need to reach.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label
              htmlFor="name"
              className="form-label"
            >
              Name:
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              className="form-input"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="form-label"
            >
              Email:
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              className="form-input"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="form-label"
            >
              Password:
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="form-input"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="primary-button mt-1 w-full"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="subtle-copy mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-link"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
