import { useState } from "react";
import { FaApple, FaWindows, FaGithub } from "react-icons/fa";

const VERSION = import.meta.env.VITE_APP_VERSION;

const MACOS_DOWNLOAD_URL =
  "https://github.com/espetro/calca/releases/latest/download/stable-macos-arm64-Calca.dmg";

const WIN_DOWNLOAD_URL =
  "https://github.com/espetro/calca/releases/latest/download/stable-win-x64-Calca-Setup.zip";

type OsOption = "macos" | "windows";

const selectedCtaStyle = (_: OsOption, expected: OsOption) =>
  _ === expected ? "text-foreground" : "text-muted-foreground hover:text-foreground";

export default function Hero() {
  const [selectedOS, setSelectedOS] = useState<OsOption>("macos");

  const downloadUrl = selectedOS === "macos" ? MACOS_DOWNLOAD_URL : WIN_DOWNLOAD_URL;

  return (
    <section className="mx-auto w-[95%] max-w-[1000px] px-4 pt-16 pb-8 text-center sm:pt-20 sm:pb-12">
      <h1 className="text-3xl font-normal capitalize leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
        Design with Words.
        <br />
        Iterate with AI.
      </h1>

      <p className="mx-auto mt-5 max-w-[78%] text-base leading-8 text-muted-foreground sm:max-w-[600px]">
        Describe your vision in plain English. Get multiple polished HTML/CSS design variations on
        an infinite canvas — no design skills required.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-lg"
        >
          {selectedOS === "macos" ? (
            <FaApple className="h-5 w-5" />
          ) : (
            <FaWindows className="h-5 w-5" />
          )}
          Download For {selectedOS === "macos" ? "macOS" : "Windows"}
        </a>

        <a
          href="https://github.com/espetro/calca"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-card-foreground transition-all hover:bg-secondary"
        >
          <FaGithub className="h-5 w-5" />
          Star On Github
        </a>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">v{VERSION}</p>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedOS("macos")}
          className={`transition-colors ${selectedCtaStyle(selectedOS, "macos")}`}
          aria-label="Download for macOS"
        >
          <FaApple className="h-5 w-5" />
        </button>
        <button
          onClick={() => setSelectedOS("windows")}
          className={`transition-colors ${selectedCtaStyle(selectedOS, "windows")}`}
          aria-label="Download for Windows"
        >
          <FaWindows className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
