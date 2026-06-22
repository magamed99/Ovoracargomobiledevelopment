import '@testing-library/jest-dom/vitest';

// Edge functions (supabase/functions/**) выполняются на Deno в проде и
// ссылаются на глобальный `Deno.env.get`. Под Vitest (Node) этого глобала
// нет — даём минимальный шим только для тестового процесса, сам код
// edge-функций не меняется.
if (typeof (globalThis as any).Deno === 'undefined') {
  (globalThis as any).Deno = {
    env: {
      get: (key: string) => process.env[key],
    },
  };
}
