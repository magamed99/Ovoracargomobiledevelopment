import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  useEffect(() => {
    // Set viewport meta tag dynamically
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) {
      existingMeta.parentNode?.removeChild(existingMeta);
    }
    document.head.appendChild(meta);

    // Set theme-color for mobile browsers
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#2563eb';
    document.head.appendChild(themeColor);

    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';
  }, []);

  return (
    <ThemeProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка Ovora Cargo...</p>
        </div>
      </div>}>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </Suspense>
    </ThemeProvider>
  );
}