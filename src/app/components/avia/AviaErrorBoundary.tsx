import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, RotateCcw, Plane } from 'lucide-react';

export function AviaErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Что-то пошло не так';
  let detail = 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.';

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Страница не найдена' : `Ошибка ${error.status}`;
    detail = error.statusText || detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060d18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Sora', 'Inter', sans-serif",
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: '#f8717112', border: '1.5px solid #f8717128',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 8px 32px #f8717115',
      }}>
        <AlertTriangle style={{ width: 32, height: 32, color: '#f87171' }} />
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 900, color: '#e2eeff',
        letterSpacing: '-0.4px', marginBottom: 8, textAlign: 'center',
      }}>
        {title}
      </h1>

      <p style={{
        fontSize: 13, color: '#4a6a88', lineHeight: 1.6,
        textAlign: 'center', maxWidth: 360, marginBottom: 28,
      }}>
        {detail}
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 13, cursor: 'pointer',
            background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 16px #0ea5e920',
          }}
        >
          <RotateCcw style={{ width: 14, height: 14 }} />
          Обновить
        </button>
        <button
          onClick={() => navigate('/avia/dashboard', { replace: true })}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 13, cursor: 'pointer',
            background: '#ffffff0a', border: '1px solid #ffffff12',
            color: '#6b8faa', fontSize: 13, fontWeight: 700,
          }}
        >
          <Plane style={{ width: 14, height: 14 }} />
          На главную
        </button>
      </div>

      {/* Error details (dev) */}
      {import.meta.env.DEV && error instanceof Error && error.stack && (
        <pre style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 12,
          background: '#ffffff06', border: '1px solid #ffffff0d',
          fontSize: 10, color: '#3d5a78', maxWidth: 500,
          overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap',
        }}>
          {error.stack}
        </pre>
      )}
    </div>
  );
}

export default AviaErrorBoundary;
