// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/constants.ts
 *
 * Application constants for the Calca desktop app.
 */

export const PORT = 3001;
export const HOST = "127.0.0.1";
export const MIN_WIDTH = 1136;
export const MIN_HEIGHT = 428;

export const isDev = process.env.NODE_ENV !== "production";
export const VITE_DEV_URL = "http://localhost:5173";