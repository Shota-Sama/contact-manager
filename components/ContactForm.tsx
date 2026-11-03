"use client";

import dynamic from "next/dynamic";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import ConfirmDialog from "./ConfirmDialog";

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

const ContactMap = dynamic(() => import("./ContactMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 sm:h-80">
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

type AddressSuggestion = {
  address: string;
  lat: number;
  lng: number;
};

type ContactFormProps = {
  initialValues?: Partial<ContactFormValues>;
  submitLabel: string;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onSaveAndContinue?: (values: ContactFormValues) => Promise<void>;
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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ContactForm({
  initialValues,
  submitLabel,
  onSubmit,
  onSaveAndContinue,
  onDelete,
}: ContactFormProps) {
  const isEditing = Boolean(initialValues);
  const [values, setValues] = useState<ContactFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedStatus, setSavedStatus] = useState("");
  const [addressStatus, setAddressStatus] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [copiedField, setCopiedField] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const latestLookup = useRef(0);
  const latestSearch = useRef(0);
  const lastLookupAt = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced address autocomplete (type -> closest matches).
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const query = values.address.trim();

    searchTimer.current = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const searchId = ++latestSearch.current;
      try {
        const response = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        if (searchId !== latestSearch.current) return;
        if (response.ok && Array.isArray(data.results)) {
          setSuggestions(data.results);
          setActiveSuggestion(data.results.length > 0 ? 0 : -1);
          setShowSuggestions(true);
        }
      } catch {
        // Suggestions are optional — ignore failures silently.
      }
    }, 400);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [values.address]);

  function selectSuggestion(suggestion: AddressSuggestion) {
    setValues((current) => ({
      ...current,
      address: suggestion.address,
      lat: suggestion.lat,
      lng: suggestion.lng,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    setAddressStatus("Location set from search. The map moved to this address.");
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        event.preventDefault();
        selectSuggestion(suggestions[activeSuggestion]);
      }
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  async function copyField(field: string, text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

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

  async function submitForm() {
    setShowSuggestions(false);
    setError("");
    setSavedStatus("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitForm();
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submitForm();
    }
  }

  async function handleSaveAndContinue() {
    if (!onSaveAndContinue) return;
    setShowSuggestions(false);
    setError("");
    setSavedStatus("");
    setLoading(true);

    try {
      await onSaveAndContinue(values);
      setValues({ ...emptyValues });
      setAddressStatus("");
      setSavedStatus("Saved! Ready for the next contact.");
    } catch (continueError) {
      setError(
        continueError instanceof Error
          ? continueError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleteError("");
    setLoading(true);

    try {
      await onDelete();
    } catch (deleteError) {
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete contact.",
      );
      setLoading(false);
    }
  }

  const previewName = values.name.trim() || "New contact";

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="contact-form">
      {/* Live preview chip */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        <span className="feature-icon !rounded-full">{initialsOf(values.name)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {previewName}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {[values.email, values.phone].filter(Boolean).join(" · ") ||
              "Details appear here as you type"}
          </p>
        </div>
        <span className="ml-auto hidden shrink-0 text-xs text-slate-400 dark:text-slate-500 sm:inline">
          Ctrl/⌘ + Enter to save
        </span>
      </div>

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
          autoFocus={!isEditing}
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
        <div className="relative">
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({ ...current, email: event.target.value }))
            }
            className={`form-input${values.email ? " pr-11" : ""}`}
          />
          {values.email ? (
            <button
              type="button"
              onClick={() => void copyField("email", values.email)}
              className="copy-button"
              title="Copy email"
              aria-label="Copy email"
            >
              {copiedField === "email" ? "✓" : "⧉"}
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="form-label"
        >
          Phone
        </label>
        <div className="relative">
          <input
            id="phone"
            value={values.phone}
            onChange={(event) =>
              setValues((current) => ({ ...current, phone: event.target.value }))
            }
            className={`form-input${values.phone ? " pr-11" : ""}`}
          />
          {values.phone ? (
            <button
              type="button"
              onClick={() => void copyField("phone", values.phone)}
              className="copy-button"
              title="Copy phone number"
              aria-label="Copy phone number"
            >
              {copiedField === "phone" ? "✓" : "⧉"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative sm:col-span-2">
        <label
          htmlFor="address"
          className="form-label"
        >
          Address
        </label>
        <div className="relative">
          <input
            id="address"
            value={values.address}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                address: event.target.value,
              }))
            }
            onKeyDown={handleAddressKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Type an address, pick a suggestion..."
            autoComplete="off"
            className={`form-input${values.address ? " pr-11" : ""}`}
          />
          {values.address ? (
            <button
              type="button"
              onClick={() => void copyField("address", values.address)}
              className="copy-button"
              title="Copy address"
              aria-label="Copy address"
            >
              {copiedField === "address" ? "✓" : "⧉"}
            </button>
          ) : null}
        </div>
        {showSuggestions && suggestions.length > 0 ? (
          <ul className="address-suggestions" role="listbox">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.lat},${suggestion.lng}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeSuggestion}
                  className={`address-suggestion${index === activeSuggestion ? " active" : ""}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveSuggestion(index)}
                >
                  {suggestion.address}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      </div>
      <div className="map-section">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Location</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Click the map to set the location, or pick an address suggestion above.
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
          <p className="mt-3 text-xs text-blue-700 dark:text-blue-400">{addressStatus}</p>
        ) : null}
      </div>

      {savedStatus ? <p className="alert-success">{savedStatus}</p> : null}
      {error ? <p className="alert-error">{error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <button
          type="submit"
          disabled={loading}
          className="primary-button action-button"
        >
          {loading ? (<><Spinner /> Saving...</>) : submitLabel}
        </button>

        {onSaveAndContinue ? (
          <button
            type="button"
            onClick={() => void handleSaveAndContinue()}
            disabled={loading}
            className="secondary-button action-button"
            title="Save this contact and clear the form for the next one"
          >
            {loading ? <Spinner /> : null}
            Save &amp; add another
          </button>
        ) : null}

        {onDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete contact"
        message="This contact will be permanently removed. This action cannot be undone."
        confirmLabel="Delete contact"
        busy={loading}
        error={deleteError}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </form>
  );
}
