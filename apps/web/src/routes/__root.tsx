import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import queryClient from "@/lib/services/api";
import "../app/globals.css";

const GA_ID = import.meta.env.VITE_GA_ID;

function RootLayout() {
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
