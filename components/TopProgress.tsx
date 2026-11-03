"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TopProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Show the bar on every navigation/load, then let it finish and hide.
    const show = setTimeout(() => setVisible(true), 60);
    const hide = setTimeout(() => setVisible(false), 900);
    timers.current.push(show, hide);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [pathname]);

  return (
    <div
      className={`top-progress ${visible ? "top-progress-active" : ""}`}
      aria-hidden="true"
    />
  );
}
