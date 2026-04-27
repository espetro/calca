declare namespace Bun {
  interface ServeOptions {
    fetch: (request: Request) => Response | Promise<Response>;
    port?: number;
    idleTimeout?: number;
  }
  function serve(options: ServeOptions): void;
}
