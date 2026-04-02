import React from 'react';

// ── Shimmer keyframes injected once ──
const shimmerCSS = `
@keyframes avia-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #ffffff04 0%, #ffffff0c 40%, #ffffff04 80%)',
  backgroundSize: '800px 100%',
  animation: 'avia-shimmer 1.6s ease-in-out infinite',
  borderRadius: 8,
};

const card: React.CSSProperties = {
  background: '#0b1929',
  border: '1px solid #ffffff0d',
  borderRadius: 20,
  overflow: 'hidden',
};

function S({ w, h, r, style }: { w: number | string; h: number; r?: number; style?: React.CSSProperties }) {
  return <div style={{ ...shimmer, width: w, height: h, borderRadius: r ?? 8, flexShrink: 0, ...style }} />;
}

// ── Hero skeleton ──
function HeroSkeleton() {
  return (
    <div style={{ ...card, padding: '24px 20px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <S w={88} h={88} r={44} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <S w={140} h={16} r={6} />
          <S w={100} h={10} r={5} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <S w={72} h={22} r={11} />
          <S w={90} h={22} r={11} />
          <S w={80} h={22} r={11} />
        </div>
      </div>
      {/* Completeness bar */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <S w={120} h={8} r={4} />
          <S w={28} h={8} r={4} />
        </div>
        <S w="100%" h={4} r={99} />
        <S w={100} h={8} r={4} style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}

// ── QuickActions skeleton ──
function QuickActionsSkeleton() {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <S w={12} h={12} r={3} />
        <S w={100} h={8} r={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#ffffff04', border: '1px solid #ffffff08' }}>
            <S w={36} h={36} r={11} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <S w={60} h={10} r={5} />
              <S w={80} h={8} r={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Passport trigger skeleton ──
function PassportSkeleton() {
  return (
    <div style={{ ...card, borderRadius: 18, padding: '15px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <S w={46} h={46} r={14} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <S w={140} h={12} r={5} />
          <S w={180} h={9} r={4} />
        </div>
        <S w={70} h={22} r={11} />
      </div>
    </div>
  );
}

// ── Collapsible section skeleton (PersonalData / Reviews / Security) ──
function SectionSkeleton({ iconColor = '#ffffff08' }: { iconColor?: string }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px' }}>
        <S w={34} h={34} r={10} style={{ background: iconColor }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <S w={110} h={11} r={5} />
          <S w={150} h={8} r={4} />
        </div>
        <S w={16} h={16} r={4} />
      </div>
    </div>
  );
}

// ── Stats skeleton ──
function StatsSkeleton() {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <S w={12} h={12} r={3} />
        <S w={70} h={8} r={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 14, background: '#ffffff04', border: '1px solid #ffffff08' }}>
            <S w={30} h={30} r={9} />
            <S w={24} h={18} r={5} />
            <S w={36} h={7} r={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Logout skeleton ──
function LogoutSkeleton() {
  return (
    <div style={{ ...card, borderRadius: 16, padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.08)' }}>
      <S w={160} h={12} r={6} />
    </div>
  );
}

// ── Main export ──
export function AviaProfileSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--avia-bg)', fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{shimmerCSS}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(14px, 4vw, 20px) clamp(16px, 5vw, 28px)',
        borderBottom: '1px solid #ffffff07',
      }}>
        <S w={70} h={28} r={9} />
        <S w={100} h={14} r={6} />
        <div style={{ width: 70 }} />
      </div>

      {/* Content */}
      <div style={{ padding: 'clamp(16px, 4vw, 24px)', maxWidth: 1100, margin: '0 auto' }}>
        <div className="avia-profile-grid">
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HeroSkeleton />
            <QuickActionsSkeleton />
            <PassportSkeleton />
            <SectionSkeleton iconColor="#fbbf2408" />
            <LogoutSkeleton />
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatsSkeleton />
            <SectionSkeleton iconColor="#0ea5e908" />
            <SectionSkeleton iconColor="#34d39908" />
          </div>
        </div>
      </div>
    </div>
  );
}
