import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import queryClient from "@/lib/services/api";
import { settingsAtom } from "@/features/settings/state/settings-atoms";
import "../app/globals.css";

const GA_ID = import.meta.env.VITE_GA_ID;

function RootLayout() {
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      if (settings.theme === "dark") {
        root.classList.add("dark");
      } else if (settings.theme === "light") {
        root.classList.remove("dark");
      } else {
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    if (settings.theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [settings.theme]);

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
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Toaster position="bottom-right" offset="40px" toastOptions={{ style: { width: "240px" } }} />
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
