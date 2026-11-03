"use client";

import { FormEvent, useState } from "react";
import Spinner from "./Spinner";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  requirePassword?: boolean;
  passwordLabel?: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (currentPassword: string) => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  requirePassword = false,
  passwordLabel = "Current password",
  busy = false,
  error = "",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [password, setPassword] = useState("");

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm(password);
  }

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={busy ? undefined : onCancel}
    >
      <div className="dialog-panel" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow !text-red-500">⚠ {title}</p>
        <p className="subtle-copy mt-2 text-sm">{message}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {requirePassword ? (
            <div>
              <label htmlFor="confirm-password" className="form-label">
                {passwordLabel}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoFocus
              />
            </div>
          ) : null}

          {error ? <p className="alert-error">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="secondary-button action-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || (requirePassword && !password)}
              className="danger-button action-button"
            >
              {busy ? (<><Spinner /> Working...</>) : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
