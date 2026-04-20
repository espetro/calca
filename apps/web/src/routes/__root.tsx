import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-right" offset="40px" toastOptions={{ style: { width: "240px" } }} />
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
