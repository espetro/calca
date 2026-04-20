import { createFileRoute } from "@tanstack/react-router";

function IndexRoute() {
  return <div>Hello</div>;
}

export const Route = createFileRoute("/")({
  component: IndexRoute,
});
