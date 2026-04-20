/**
 * AviaLayout — корневой Layout для AVIA-модуля.
 *
 * Auth guard вынесен в route loader (requireAviaAuth в routes.tsx).
 * Loader выполняется синхронно ДО монтирования компонента, поэтому
 * никакой navigate() в useEffect не нужен — это устраняет infinite loop.
 *
 * Единственный случай, когда нужен navigate здесь — это logout прямо
 * на защищённой странице. Он обрабатывается через useEffect с ref-флагом,
 * который срабатывает максимум один раз.
 */
import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAvia } from './AviaContext';
import { AviaDesktopSidebar } from './AviaDesktopSidebar';
import { AviaMobileNav } from './AviaMobileNav';
import { OfflineBanner } from '../OfflineBanner';

function LoadingSpinner() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid rgba(14,165,233,0.15)',
        borderTopColor: '#0ea5e9',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AviaLayoutInner() {
  const { isAuth, loading } = useAvia();
  const navigate = useNavigate();

  // Этот ref защищает от повторного вызова navigate при logout.
  // Сбрасывается при монтировании (каждый mount = новый компонент).
  const logoutRedirectFired = useRef(false);

  useEffect(() => {
    // Loader уже проверил сессию до монтирования.
    // Здесь обрабатываем только случай logout: isAuth перешёл true → false
    // пока компонент уже был смонтирован.
    if (!loading && !isAuth && !logoutRedirectFired.current) {
      logoutRedirectFired.current = true;
      navigate('/avia', { replace: true });
    }
  }, [loading, isAuth, navigate]);

  // Показываем спиннер только пока AviaContext восстанавливает сессию из localStorage.
  // Loader уже гарантировал наличие сессии — loading будет false очень быстро.
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--avia-bg)',
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Если isAuth=false после loading=false — это logout case, ждём navigate
  if (!isAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--avia-bg)',
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh',
        background: 'var(--avia-bg)',
        display: 'flex',
        overflow: 'hidden',
        paddingLeft: 0,
      }}
    >
      <AviaDesktopSidebar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className="avia-main-wrapper"
      >
        <OfflineBanner />

        <main
          className="avia-scroll-content avia-page-main"
          style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>

        <AviaMobileNav />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .avia-main-wrapper {
            margin-left: var(--avia-sidebar-w);
          }
          .avia-scroll-content {
            padding-bottom: 24px !important;
          }
          .avia-page-main {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export function AviaLayout() {
  return <AviaLayoutInner />;
}
