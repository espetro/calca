/**
 * platforms/desktop/src/constants.ts
 *
 * Application constants for the Calca desktop app.
 */

export const PORT = parseInt(process.env.CALCA_PORT ?? "3847", 10);
export const HOST = "localhost";
export const MIN_WIDTH = 1136;
export const MIN_HEIGHT = 428;

/** @deprecated DON'T use a dev url, but rather a prod url */
export const VITE_DEV_URL = "http://localhost:5173";
