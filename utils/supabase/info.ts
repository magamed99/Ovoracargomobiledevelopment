// Supabase project constants — hardcoded for production builds.
// Values also available in utils/supabase/info.tsx (Figma Make target).
export const projectId: string = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ?? 'mkbcjxnoeevtkzaqcpsh'; // pragma: allowlist secret
export const publicAnonKey: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rYmNqeG5vZWV2dGt6YXFjcHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzIyNjIsImV4cCI6MjA4ODEwODI2Mn0.Xs69UZv49GxjWcJesdQ05brrEVFQYYNKydVqkIGoJJE'; // pragma: allowlist secret
