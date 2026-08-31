"use client";

import dynamic from "next/dynamic";
import { FormEvent, useRef, useState } from "react";

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

const ContactMap = dynamic(() => import("./ContactMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800">
      Loading map...
    </div>
  ),
});

export type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
};

type ContactFormProps = {
  initialValues?: Partial<ContactFormValues>;
  submitLabel: string;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const emptyValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  lat: DEFAULT_CENTER[0],
  lng: DEFAULT_CENTER[1],
};

export default function ContactForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
}: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addressStatus, setAddressStatus] = useState("");
  const latestLookup = useRef(0);
  const lastLookupAt = useRef(0);

  async function handleLocationChange(lat: number, lng: number) {
    setValues((current) => ({ ...current, lat, lng }));
    setAddressStatus("Finding address...");

    const lookupId = ++latestLookup.current;
    const wait = Math.max(0, 1000 - (Date.now() - lastLookupAt.current));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastLookupAt.current = Date.now();

    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      if (lookupId !== latestLookup.current) return;

      if (!response.ok || !data.address) {
        setAddressStatus("Address not found. You can enter one manually.");
        return;
      }

      setValues((current) => ({ ...current, address: data.address }));
      setAddressStatus("Address filled from the map. You can edit it if needed.");
    } catch {
      if (lookupId === latestLookup.current) {
        setAddressStatus("Address lookup failed. You can enter one manually.");
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("Delete this contact?")) return;

    setError("");
    setLoading(true);

    try {
      await onDelete();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete contact.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="contact-form-grid">
      <div>
        <label
          htmlFor="name"
          className="form-label"
        >
          Name *
        </label>
        <input
          id="name"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          required
          className="form-input"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="form-label"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          className="form-input"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="form-label"
        >
          Phone
        </label>
        <input
          id="phone"
          value={values.phone}
          onChange={(event) =>
            setValues((current) => ({ ...current, phone: event.target.value }))
          }
          className="form-input"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="address"
          className="form-label"
        >
          Address
        </label>
        <input
          id="address"
          value={values.address}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              address: event.target.value,
            }))
          }
          className="form-input"
        />
      </div>

      </div>
      <div className="map-section">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Location</p>
            <p className="mt-1 text-xs text-slate-500">
          Click the map to set the contact location.
            </p>
          </div>
          <span className="map-status">Optional</span>
        </div>
        <ContactMap
          lat={values.lat}
          lng={values.lng}
          onLocationChange={handleLocationChange}
        />
        {addressStatus ? (
          <p className="mt-3 text-xs text-blue-700">{addressStatus}</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="primary-button action-button"
        >
          {loading ? "Saving..." : submitLabel}
        </button>

        {onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
