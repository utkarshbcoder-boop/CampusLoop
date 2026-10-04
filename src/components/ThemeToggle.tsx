"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm transition hover:bg-white/10"
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}
