/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />
interface ImportMetaEnv {
  readonly VITE_GIT_HASH: string;
  readonly VITE_GA_ID: string;
  readonly VITE_AI_BASE_URL: string;
  readonly VITE_AI_API_KEY: string;
  readonly VITE_AI_MODEL: string;
  readonly VITE_API_BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
