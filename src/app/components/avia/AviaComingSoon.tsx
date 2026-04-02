import { useNavigate } from 'react-router';
import { ArrowLeft, Plane } from 'lucide-react';
import { motion } from 'motion/react';

export function AviaComingSoon() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#060d18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Sora', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #0ea5e920 0%, transparent 70%)',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 20, left: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          borderRadius: 12,
          border: '1px solid #ffffff12',
          background: '#ffffff08',
          color: '#8ea8b8',
          fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        Назад
      </motion.button>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            width: 80, height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 0 1px #0ea5e940, 0 12px 40px #0ea5e933',
          }}
        >
          <Plane style={{ width: 36, height: 36, color: '#fff' }} />
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 7vw, 40px)',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-1px',
          margin: '0 0 8px',
          lineHeight: 1.1,
        }}>
          Ovora <span style={{ color: '#38bdf8' }}>AVIA</span>
        </h1>

        <p style={{
          fontSize: 14,
          color: '#6b8299',
          lineHeight: 1.6,
          maxWidth: 320,
          margin: '0 auto 32px',
        }}>
          Авиагруз Россия &#8596; Таджикистан. Модуль находится в разработке и скоро будет доступен.
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Курьер', 'Отправитель', 'Гибкие роли'].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: '#0ea5e912',
                border: '1px solid #0ea5e925',
                fontSize: 12,
                fontWeight: 600,
                color: '#38bdf8',
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
