"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Clock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 1000);
    const initial = setTimeout(tick, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, []);

  // Render a stable placeholder on the server; the live clock appears on hydration.
  if (!now) {
    return (
      <div className={`subtle-copy font-mono tabular-nums ${className}`}>
        --:--:--
      </div>
    );
  }

  return (
    <div className={`leading-tight ${className}`}>
      <p className="font-mono text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100 sm:text-xl">
        {formatTime(now)}
      </p>
      <p className="subtle-copy text-xs">{formatDate(now)}</p>
    </div>
  );
}
