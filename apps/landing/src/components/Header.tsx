import React, { useState, useEffect } from "react";
import { FaSun, FaMoon, FaGithub } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

import { LINKS } from "../lib/site";
import { Mark } from "./Mark";

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <a
          href="/"
          className="inline-flex items-center rounded-lg px-2 py-1.5 text-foreground transition-colors hover:bg-secondary"
          aria-label="calca home"
        >
          <Mark withWordmark size={26} />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#formats"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Formats
          </a>
          <a
            href="#try"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Try it
          </a>
          <a
            href="#open-layer"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Open layer
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="calca on GitHub"
          >
            <FaGithub className="h-5 w-5" />
          </a>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <FaSun className="h-4.5 w-4.5" />
            ) : (
              <FaMoon className="h-4.5 w-4.5" />
            )}
          </button>
          <a
            href={LINKS.app}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
          >
            Try the demo
            <FiArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
