"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to log in.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Contact Manager</p>
        <h2 className="page-title">Welcome back</h2>
        <p className="subtle-copy mt-2">Sign in to manage your contacts.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
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
              required
              className="form-input"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="primary-button mt-1 w-full"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="subtle-copy mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-link"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
