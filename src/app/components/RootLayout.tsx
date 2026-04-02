import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * RootLayout — top-level route component inside RouterProvider.
 * All context providers are supplied by App.tsx (wrapping RouterProvider),
 * so they are available both here and in errorElement components.
 * Provides Suspense + ErrorBoundary for lazy route chunks.
 */
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
    </div>
  );
}

export function RootLayout() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}