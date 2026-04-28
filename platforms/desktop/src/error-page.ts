// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/error-page.ts
 *
 * Startup error page HTML generator.
 */

import { versionInfo } from "./version";

export function getErrorPageHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Startup Error - Calca</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 500px;
      text-align: center;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b; }
    p { color: #aaa; line-height: 1.6; margin-bottom: 1rem; }
    .version { font-size: 0.875rem; color: #666; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <p>Please try restarting the application. If the problem persists, check the console for more details.</p>
    <div class="version">Calca v${versionInfo.version}</div>
  </div>
</body>
</html>`;
}