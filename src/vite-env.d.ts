/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YANDEX_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Figma Make virtual module — injected at build time
declare module '/utils/supabase/info' {
  export const projectId: string;
  export const publicAnonKey: string;
}

// Yandex Metrica global
interface Window {
  ym?: (counterId: number, method: string, ...args: unknown[]) => void;
}
