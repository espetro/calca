import {
  optIn,
  optOut,
  trackAppSessionEnd,
  trackAppSessionStart,
  trackProviderChanged,
  trackSettingsModelChanged,
  trackThemeChanged,
} from "@app/analytics";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "#/shared/components/ui/tooltip";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools }))
);

import { settingsAtom } from "#/features/settings/state/settings-atoms";
import queryClient from "#/lib/services/api";
import { useMountEffect } from "#/shared/utils/use-mount-effect";
import { UpdateNotification } from "#/widgets/update-notification/UpdateNotification";

import "../app/globals.css";

const GA_ID = import.meta.env.VITE_GA_ID;

function RootLayout() {
  const settings = useAtomValue(settingsAtom);
  const [devtoolsReady, setDevtoolsReady] = useState(false);

  const prevProviderRef = useRef(settings.providerType);
  const prevModelRef = useRef(settings.model);
  const prevThemeRef = useRef(settings.theme);

  // oxlint-disable-next-line react-hooks/rules-of-hooks -- External DOM sync reacting to settings atom change. Conditional mediaQuery listener requires useEffect.
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      if (settings.theme === "dark") {
        root.classList.add("dark");
      } else if (settings.theme === "light") {
        root.classList.remove("dark");
      } else {
        root.classList.toggle("dark", mediaQuery.matches);
      }
    };

    applyTheme();

    if (settings.theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [settings.theme]);

  useMountEffect(function mountDevtools() {
    setDevtoolsReady(true);
  });

  useMountEffect(function trackSessionLifecycle() {
    const stored = localStorage.getItem("calca:last_session_end");
    const previousDuration = stored ? Date.now() - parseInt(stored, 10) : undefined;
    trackAppSessionStart(previousDuration);

    const handleBeforeUnload = () => {
      const sessionStart = localStorage.getItem("calca:session_start");
      const duration = sessionStart ? Date.now() - parseInt(sessionStart, 10) : 0;
      localStorage.setItem("calca:last_session_end", Date.now().toString());
      const designsCreated = parseInt(localStorage.getItem("calca:designs_created") || "0", 10);
      trackAppSessionEnd(duration, designsCreated);
    };

    localStorage.setItem("calca:session_start", Date.now().toString());
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  // oxlint-disable-next-line react-hooks/rules-of-hooks -- External analytics service sync on state change.
  useEffect(() => {
    if (!settings.analyticsEnabled) {
      optOut();
    } else {
      optIn();
    }
  }, [settings.analyticsEnabled]);

  // oxlint-disable-next-line react-hooks/rules-of-hooks -- Analytics side-effect reacting to settings atom change.
  useEffect(
    function trackProviderChange() {
      const prev = prevProviderRef.current;
      const curr = settings.providerType;
      if (prev !== undefined && prev !== curr) {
        trackProviderChanged(prev || "none", curr || "none");
      }
      prevProviderRef.current = curr;
    },
    [settings.providerType],
  );

  // oxlint-disable-next-line react-hooks/rules-of-hooks -- Analytics side-effect reacting to settings atom change.
  useEffect(
    function trackModelChange() {
      const prev = prevModelRef.current;
      const curr = settings.model;
      if (prev !== undefined && prev !== curr) {
        trackSettingsModelChanged(prev, curr);
      }
      prevModelRef.current = curr;
    },
    [settings.model],
  );

  // oxlint-disable-next-line react-hooks/rules-of-hooks -- Analytics side-effect reacting to settings atom change.
  useEffect(
    function trackThemeChange() {
      const prev = prevThemeRef.current;
      const curr = settings.theme;
      if (prev !== undefined && prev !== curr) {
        trackThemeChanged(prev, curr);
      }
      prevThemeRef.current = curr;
    },
    [settings.theme],
  );

  return (
    <>
      {GA_ID && (
        <>
          <script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script id="gtag-init">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </script>
        </>
      )}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <Outlet />
          {devtoolsReady && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            </Suspense>
          )}
        </TooltipProvider>
      </QueryClientProvider>
      <Toaster position="bottom-right" offset="40px" toastOptions={{ style: { width: "240px" } }} />
      <UpdateNotification />
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
