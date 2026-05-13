import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

export default function Header() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (systemDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (newTheme: string) => {
    const html = document.documentElement;
    if (newTheme === "dark") {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <header className="mx-auto mt-3 flex w-full max-w-[1065px] items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <img src="/icon.png" alt="Calca" className="h-6 w-6" />
          <span className="hidden sm:inline">Calca</span>
        </a>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <span className="hidden sm:inline">Get the App</span>
          <FiExternalLink className="h-4 w-4" />
        </a>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-lg p-2 text-foreground transition-colors hover:bg-secondary"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
