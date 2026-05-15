// Figma Make virtual module — real values injected by the platform at build time.
// Fallback to Vite env vars when built outside Figma Make (CI, local builds).
export const projectId: string = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ?? '';
export const publicAnonKey: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';
