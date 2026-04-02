import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';

/* ─── Города маршрута (оптимизированы для мобилок и ПК) ─── */
const CITIES = [
  { id: 'spb',           name: 'Петербург',     x: 380, y: 250, color: '#34d399', r: 4,   capital: false },
  { id: 'moscow',        name: 'Москва',        x: 480, y: 330, color: '#5ba3f5', r: 7,   capital: true  },
  { id: 'kazan',         name: 'Казань',        x: 580, y: 380, color: '#a78bfa', r: 4,   capital: false },
  { id: 'yekaterinburg', name: 'Екатеринбург',  x: 650, y: 360, color: '#60a5fa', r: 4,   capital: false },
  { id: 'novosibirsk',   name: 'Новосибирск',   x: 720, y: 480, color: '#60a5fa', r: 4.5, capital: false },
  { id: 'almaty',        name: 'Алматы',        x: 640, y: 600, color: '#34d399', r: 5,   capital: false },
  { id: 'tashkent',      name: 'Ташкент',       x: 480, y: 650, color: '#f97316', r: 5,   capital: false },
  { id: 'dushanbe',      name: 'Душанбе',       x: 450, y: 730, color: '#fbbf24', r: 7,   capital: true  },
];

/* ─── Маршруты ─── */
const ROUTES = [
  { from: 'moscow',       to: 'spb',             color: '#5ba3f5', dur: 4.0, delay: 0.5 },
  { from: 'moscow',       to: 'kazan',           color: '#a78bfa', dur: 4.5, delay: 1.0 },
  { from: 'kazan',        to: 'yekaterinburg',   color: '#60a5fa', dur: 4.0, delay: 2.0 },
  { from: 'yekaterinburg',to: 'novosibirsk',     color: '#60a5fa', dur: 5.5, delay: 0.8 },
  { from: 'novosibirsk',  to: 'almaty',          color: '#34d399', dur: 6.0, delay: 1.5 },
  { from: 'almaty',       to: 'tashkent',        color: '#f97316', dur: 4.8, delay: 0.3 },
  { from: 'tashkent',     to: 'dushanbe',        color: '#fbbf24', dur: 4.2, delay: 1.2 },
  { from: 'dushanbe',     to: 'moscow',          color: '#fbbf24', dur: 9.0, delay: 2.5 },
  { from: 'tashkent',     to: 'moscow',          color: '#f97316', dur: 8.5, delay: 4.0 },
  { from: 'kazan',        to: 'almaty',          color: '#a78bfa', dur: 7.0, delay: 3.2 },
];

function getCity(id: string) {
  return CITIES.find(c => c.id === id)!;
}

function curvePath(ax: number, ay: number, bx: number, by: number) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy);
  const curve = len * 0.25;
  const cx1 = mx - (dy / len) * curve;
  const cy1 = my + (dx / len) * curve;
  return `M ${ax} ${ay} Q ${cx1} ${cy1} ${bx} ${by}`;
}

/* ─── Движущаяся точка ─── */
function TravelDot({ from, to, color, dur, delay }: {
  from: string; to: string; color: string; dur: number; delay: number;
}) {
  const dotRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    const glow = glowRef.current;
    if (!path || !dot) return;

    const total = path.getTotalLength();
    let startTs: number | null = null;
    let raf: number;
    let delayDone = false;
    let delayStart: number | null = null;
    const delayMs = delay * 1000;
    const durMs = dur * 1000;

    const tick = (ts: number) => {
      if (!delayDone) {
        if (delayStart === null) delayStart = ts;
        if (ts - delayStart < delayMs) {
          raf = requestAnimationFrame(tick);
          return;
        }
        delayDone = true;
        startTs = ts;
      }
      if (startTs === null) startTs = ts;
      const t = ((ts - startTs) % durMs) / durMs;
      const pt = path.getPointAtLength(t * total);

      // Avoid direct React state updates for 60fps performance
      dot.setAttribute('cx', String(pt.x));
      dot.setAttribute('cy', String(pt.y));
      if (glow) {
        glow.setAttribute('cx', String(pt.x));
        glow.setAttribute('cy', String(pt.y));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dur, delay]);

  const a = getCity(from);
  const b = getCity(to);
  const d = curvePath(a.x, a.y, b.x, b.y);

  return (
    <g>
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      <circle ref={glowRef} r={8} fill={color} fillOpacity={0.15} cx={-999} cy={-999} />
      <circle ref={dotRef} r={3.5} fill={color} cx={-999} cy={-999} filter="url(#dotGlow)" />
    </g>
  );
}

/* ─── Линия маршрута ─── */
function RouteArc({ from, to, color, delay }: {
  from: string; to: string; color: string; delay: number;
}) {
  const a = getCity(from);
  const b = getCity(to);
  const d = curvePath(a.x, a.y, b.x, b.y);
  
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeOpacity={0.25}
      strokeLinecap="round"
      strokeDasharray="6 8"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2.2, delay: 0.2 + delay * 0.15, ease: 'easeOut' }}
    />
  );
}

/* ─── Город ─── */
function CityNode({ city, idx }: { city: typeof CITIES[0]; idx: number }) {
  return (
    <g>
      {/* Двойной пульс для городов */}
      <motion.circle
        cx={city.x} cy={city.y} r={city.r + 14}
        fill="none" stroke={city.color} strokeWidth={1}
        style={{ transformOrigin: `${city.x}px ${city.y}px` }}
        initial={{ scale: 0.2, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: idx * 0.3 }}
      />
      <motion.circle
        cx={city.x} cy={city.y} r={city.r + 6}
        fill="none" stroke={city.color} strokeWidth={1}
        style={{ transformOrigin: `${city.x}px ${city.y}px` }}
        initial={{ scale: 0.2, opacity: 0.6 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: idx * 0.3 + 0.8 }}
      />
      
      {/* Точка города */}
      <circle cx={city.x} cy={city.y} r={city.r} fill={city.color} filter="url(#cityGlow)" />
      <circle cx={city.x} cy={city.y} r={city.r * 0.4} fill="#ffffff" fillOpacity={0.9} />
      
      {/* Название */}
      <text
        x={city.x}
        y={city.y - city.r - 10}
        textAnchor="middle"
        fill={city.color}
        fontSize={city.capital ? 12 : 10}
        fontWeight={800}
        fontFamily="'Sora', sans-serif"
        fillOpacity={0.9}
        letterSpacing={0.5}
      >
        {city.name}
      </text>
    </g>
  );
}

/* ─── Рандомные точки на фоне для декора ─── */
function BackgroundNodes() {
  const nodes = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      r: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      dur: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <g opacity={0.3}>
      {nodes.map(n => (
        <motion.circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill="#5ba3f5"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: n.dur, repeat: Infinity, delay: n.delay, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

export function MapBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: '#060d16' }}>
      
      {/* 1. Глубокий градиент на фоне (без rgba в motion) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, #0e203b 0%, #060d16 80%)',
        opacity: 0.8,
      }} />

      {/* 2. Анимированная сетка для кибер-логистики */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(#5ba3f5 1px, transparent 1px), linear-gradient(90deg, #5ba3f5 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.03,
      }} />

      {/* 3. Векторная карта логистики (viewBox 0 0 1000 1000 адаптируется под любой экран) */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#060d16" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Свечение в центре активной зоны (СНГ) */}
        <circle cx={550} cy={450} r={400} fill="url(#centerGlow)" />

        {/* Фоновые узлы логистической сети (декор) */}
        <BackgroundNodes />

        {/* Текстовые водяные знаки (названия регионов) */}
        <motion.text
          x={400} y={500}
          textAnchor="middle"
          fill="#475569"
          fontSize={24}
          fontWeight={800}
          fontFamily="'Sora', sans-serif"
          letterSpacing={14}
          style={{ transformOrigin: '400px 500px', transform: 'rotate(-30deg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 1.5, duration: 2 }}
        >
          LOGISTICS
        </motion.text>
        <motion.text
          x={650} y={750}
          textAnchor="middle"
          fill="#475569"
          fontSize={20}
          fontWeight={800}
          fontFamily="'Sora', sans-serif"
          letterSpacing={10}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 2.0, duration: 2 }}
        >
          NETWORK
        </motion.text>

        {/* Линии маршрутов */}
        {ROUTES.map((r, i) => (
          <RouteArc key={i} from={r.from} to={r.to} color={r.color} delay={i} />
        ))}

        {/* Точки городов */}
        {CITIES.map((city, idx) => (
          <CityNode key={city.id} city={city} idx={idx} />
        ))}

        {/* Анимация движущихся грузов */}
        {ROUTES.map((r, i) => (
          <TravelDot key={i} from={r.from} to={r.to} color={r.color} dur={r.dur} delay={r.delay} />
        ))}
      </svg>

      {/* 4. Градиентное затемнение внизу и вверху для интеграции с UI */}
      <div style={{
        position: 'absolute', inset: '0 0 auto 0', height: '15vh',
        backgroundImage: 'linear-gradient(180deg, #060d16 0%, transparent 100%)',
        opacity: 0.9,
      }} />
      <div style={{
        position: 'absolute', inset: 'auto 0 0 0', height: '35vh',
        backgroundImage: 'linear-gradient(0deg, #060d16 0%, #060d16 20%, transparent 100%)',
        opacity: 0.9,
      }} />
    </div>
  );
}
