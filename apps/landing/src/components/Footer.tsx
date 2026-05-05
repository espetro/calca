import React from "react";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-36 w-full border-t border-border bg-card/60">
      <div className="mx-auto w-[95%] max-w-[1000px] px-4 py-10">
        <nav className="flex flex-row flex-wrap justify-center gap-4">
          <a
            href="/calca/"
            className="text-sm underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Home
          </a>
          <a
            href="https://github.com/espetro/calca/blob/main/PRIVACY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Privacy Policy
          </a>
          <a
            href="https://github.com/espetro/calca#features"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Features
          </a>
          <a
            href="https://github.com/espetro/calca#documentation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Docs
          </a>
        </nav>

        <nav className="mt-6 flex justify-center">
          <a
            href="https://github.com/espetro/calca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="GitHub repository"
          >
            <FaGithub className="h-5 w-5" />
          </a>
        </nav>

        <aside className="mt-4 text-center text-sm text-muted-foreground">
          <p>Calca — Design with Words. Iterate with AI.</p>
        </aside>
      </div>
    </footer>
  );
}
