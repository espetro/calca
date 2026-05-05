import React from "react";

export default function Screenshot() {
  return (
    <section className="mx-auto w-[95%] max-w-[1000px] px-4 py-8">
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-glow via-transparent to-glow-secondary opacity-50" />
        <img
          src="/calca/screenshot.png"
          alt="Calca app screenshot showing the AI design canvas with generated HTML/CSS variations"
          className="relative h-auto w-full object-cover"
          loading="eager"
          width="1200"
          height="800"
        />
      </div>
    </section>
  );
}
