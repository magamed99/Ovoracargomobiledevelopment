import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sentry } from '../config/sentry';
import { recoverFromStaleChunk } from '../utils/staleChunkRecovery';

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  let message = 'Что-то пошло не так';
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? 'Страница не найдена' : `Ошибка ${error.status}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const isStaleChunk = /dynamically imported module/i.test(message);

  useEffect(() => {
    if (!isStaleChunk) Sentry.captureException(error);
  }, [error, isStaleChunk]);

  // Auto-recover once: чистим кеши + снимаем SW и перезагружаемся за свежим
  // app shell, чтобы не оставлять пользователя на этом экране. Защита от
  // цикла — внутри recoverFromStaleChunk (таймстамп).
  useEffect(() => {
    if (isStaleChunk) void recoverFromStaleChunk();
  }, [isStaleChunk]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 font-['Sora'] ${
        isDark ? 'bg-[#0d1521] text-white' : 'bg-[#f6f7f8] text-[#0f172a]'
      }`}
    >
      {/* Icon */}
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
        isDark ? 'bg-red-500/15' : 'bg-red-50'
      }`}>
        <AlertTriangle className="w-9 h-9 text-red-500" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-extrabold mb-2 text-center">Произошла ошибка</h1>
      <p className={`text-sm text-center mb-8 max-w-xs leading-relaxed ${
        isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'
      }`}>
        {message}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => { if (isStaleChunk) void recoverFromStaleChunk(true); else window.location.reload(); }}
          className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#1978e5] text-white text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          Перезагрузить
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex items-center justify-center gap-2 h-12 rounded-2xl border text-sm font-bold ${
            isDark
              ? 'border-[#1e2d3a] text-[#94a3b8] hover:bg-[#1e2d3a]'
              : 'border-[#e2e8f0] text-[#64748b] hover:bg-white'
          }`}
        >
          <Home className="w-4 h-4" />
          На главную
        </button>
      </div>
    </div>
  );
}
