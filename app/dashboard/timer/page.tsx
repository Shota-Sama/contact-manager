"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type Mode = "stopwatch" | "countdown";

const PRESETS_MINUTES = [1, 5, 10, 15, 25, 60];

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}.${tenths}`;
}

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("stopwatch");

  // Stopwatch state
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAtRef = useRef(0);
  const baseRef = useRef(0);
  const nowRef = useRef(0);

  // Countdown state
  const [countdownTotal, setCountdownTotal] = useState(0); // ms
  const [countdownEnd, setCountdownEnd] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("5");
  const [finished, setFinished] = useState(false);

  // Tick — derive everything from timestamps so there is no drift.
  useEffect(() => {
    const interval = setInterval(() => {
      nowRef.current = Date.now();
      if (running) {
        setElapsed(baseRef.current + (Date.now() - startedAtRef.current));
      }
      if (countdownEnd !== null) {
        const remaining = countdownEnd - Date.now();
        if (remaining <= 0) {
          setCountdownTotal(0);
          setCountdownEnd(null);
          setFinished(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([200, 100, 200]);
          }
        } else {
          setCountdownTotal(remaining);
          setFinished(false);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [running, countdownEnd]);

  // Restore persisted state on mount.
  useEffect(() => {
    try {
      nowRef.current = Date.now();
      const savedSw = localStorage.getItem("cm-stopwatch");
      if (savedSw) {
        const parsed = JSON.parse(savedSw) as {
          base?: number;
          running?: boolean;
          startedAt?: number;
          laps?: number[];
        };
        baseRef.current = parsed.base ?? 0;
        startedAtRef.current = parsed.startedAt ?? Date.now();
        setElapsed(baseRef.current);
        setRunning(Boolean(parsed.running));
        setLaps(Array.isArray(parsed.laps) ? parsed.laps : []);
      }
      const savedCd = localStorage.getItem("cm-countdown");
      if (savedCd) {
        const parsed = JSON.parse(savedCd) as { end?: number | null };
        if (parsed.end) {
          setCountdownEnd(parsed.end);
          setCountdownTotal(Math.max(0, parsed.end - Date.now()));
        }
      }
    } catch {
      // Ignore corrupted storage.
    }
  }, []);

  function persistStopwatch(next: {
    base: number;
    running: boolean;
    startedAt: number;
    laps: number[];
  }) {
    try {
      localStorage.setItem("cm-stopwatch", JSON.stringify(next));
    } catch {}
  }

  function toggleStopwatch() {
    if (running) {
      const now = baseRef.current + (nowRef.current - startedAtRef.current);
      baseRef.current = now;
      setElapsed(now);
      setRunning(false);
      persistStopwatch({ base: now, running: false, startedAt: startedAtRef.current, laps });
    } else {
      startedAtRef.current = nowRef.current;
      setRunning(true);
      persistStopwatch({ base: baseRef.current, running: true, startedAt: startedAtRef.current, laps });
    }
  }

  function resetStopwatch() {
    baseRef.current = 0;
    startedAtRef.current = nowRef.current;
    setElapsed(0);
    setRunning(false);
    setLaps([]);
    persistStopwatch({ base: 0, running: false, startedAt: nowRef.current, laps: [] });
  }

  function addLap() {
    const current = running
      ? baseRef.current + (nowRef.current - startedAtRef.current)
      : elapsed;
    setLaps((currentLaps) => {
      const next = [...currentLaps, current];
      persistStopwatch({ base: baseRef.current, running, startedAt: startedAtRef.current, laps: next });
      return next;
    });
  }

  function startCountdown(minutes: number) {
    const ms = Math.max(1, Math.round(minutes * 60 * 1000));
    const end = nowRef.current + ms;
    setCountdownEnd(end);
    setCountdownTotal(ms);
    setFinished(false);
    try {
      localStorage.setItem("cm-countdown", JSON.stringify({ end }));
    } catch {}
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  function pauseCountdown() {
    setCountdownEnd(null);
    try {
      localStorage.setItem("cm-countdown", JSON.stringify({ end: null }));
    } catch {}
  }

  function resetCountdown() {
    setCountdownEnd(null);
    setCountdownTotal(0);
    setFinished(false);
    try {
      localStorage.removeItem("cm-countdown");
    } catch {}
  }

  const countdownRunning = countdownEnd !== null;
  const display =
    mode === "stopwatch" ? formatClock(elapsed) : formatClock(countdownTotal);

  return (
    <div className="app-shell mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-link text-sm">
            ← Back to dashboard
          </Link>
          <p className="eyebrow mt-4">Focus tools</p>
          <h1 className="page-title">Timer</h1>
          <p className="subtle-copy mt-2">
            Stopwatch and countdown — works the same on phone and desktop.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <section className="panel p-5 sm:p-8">
        {/* Mode switch */}
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
          {(
            [
              ["stopwatch", "⏱ Stopwatch"],
              ["countdown", "⏳ Countdown"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                mode === value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Big display */}
        <p
          className={`mt-8 text-center font-mono font-bold tabular-nums tracking-tight ${
            finished ? "text-red-500 dark:text-red-400" : "text-slate-900 dark:text-slate-50"
          }`}
          style={{ fontSize: "clamp(2.75rem, 12vw, 5.5rem)" }}
          aria-live="polite"
        >
          {display}
        </p>
        <p className="subtle-copy mt-2 text-center text-sm">
          {mode === "countdown"
            ? finished
              ? "⏰ Time's up!"
              : countdownRunning
                ? "Counting down..."
                : "Pick a time below to start"
            : running
              ? "Stopwatch running..."
              : elapsed > 0
                ? "Paused"
                : "Ready"}
        </p>

        {mode === "stopwatch" ? (
          <>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={toggleStopwatch}
                className="primary-button action-button px-8"
              >
                {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
              </button>
              <button
                type="button"
                onClick={addLap}
                disabled={!running && elapsed === 0}
                className="secondary-button action-button disabled:opacity-50"
              >
                Lap
              </button>
              <button
                type="button"
                onClick={resetStopwatch}
                disabled={elapsed === 0 && laps.length === 0}
                className="secondary-button logout-button disabled:opacity-50"
              >
                Reset
              </button>
            </div>
            {laps.length > 0 ? (
              <ul className="mx-auto mt-6 max-w-xs divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700">
                {laps.map((lap, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="subtle-copy">Lap {index + 1}</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {formatClock(lap)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {PRESETS_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => startCountdown(minutes)}
                  className="secondary-button action-button !px-4 !py-2 text-sm"
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <input
                type="number"
                min={1}
                max={999}
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                aria-label="Custom minutes"
                className="form-input w-24 !py-2 text-center text-sm"
              />
              <span className="subtle-copy text-sm">minutes</span>
              <button
                type="button"
                onClick={() =>
                  startCountdown(Number(customMinutes) || 5)
                }
                className="primary-button action-button px-6"
              >
                Start custom
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {countdownRunning ? (
                <button
                  type="button"
                  onClick={pauseCountdown}
                  className="secondary-button action-button"
                >
                  Pause
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetCountdown}
                disabled={countdownTotal === 0 && !countdownRunning && !finished}
                className="secondary-button logout-button disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
