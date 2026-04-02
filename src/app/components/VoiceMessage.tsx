/**
 * VoiceMessage.tsx
 * Компонент воспроизведения голосового сообщения в чате.
 * Play/pause, seekable waveform, таймер.
 */
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

// Детерминированная псевдо-волна из 28 баров
const BARS = Array.from({ length: 28 }, (_, i) => {
  const v =
    Math.abs(Math.sin(i * 1.7) * 0.55) +
    Math.abs(Math.sin(i * 0.5 + 1.3) * 0.3) +
    0.15;
  return Math.min(1, Math.max(0.12, v));
});

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s) % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface Props {
  audioSrc: string;
  duration: number; // секунды (fallback до загрузки метаданных)
  isMine: boolean;
  isDark: boolean;
}

export function VoiceMessage({ audioSrc, duration, isMine, isDark }: Props) {
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const rafRef         = useRef<number>(0);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);   // 0..1
  const [curTime,   setCurTime]   = useState(0);
  const [realDur,   setRealDur]   = useState(duration);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) setRealDur(audio.duration);
    };
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      setCurTime(0);
      cancelAnimationFrame(rafRef.current);
    };

    return () => {
      audio.pause();
      audio.src = '';
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioSrc]);

  const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = isFinite(audio.duration) ? audio.duration : 1;
    setProgress(audio.currentTime / dur);
    setCurTime(audio.currentTime);
    if (!audio.paused) rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    } else {
      audio.play().catch(() => toast_noop());
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
    setCurTime(audio.currentTime);
  };

  // colours
  const accent    = isMine ? '#ffffffcc' : '#5ba3f5';
  const dim       = isMine ? '#ffffff33' : (isDark ? '#2a4060' : '#d0e8ff');
  const btnBg     = isMine ? '#ffffff18' : (isDark ? '#1a2d3d' : '#e6f2ff');
  const timColor  = isMine ? '#ffffffaa' : (isDark ? '#607080' : '#94a3b8');

  const displayTime = playing ? curTime : realDur;

  return (
    <div className="flex items-center gap-2.5 py-0.5 px-0.5 select-none" style={{ minWidth: 192, maxWidth: 240 }}>
      {/* Play / Pause */}
      <button
        onClick={toggle}
        className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90"
        style={{ width: 36, height: 36, background: btnBg }}
      >
        {playing
          ? <Pause  style={{ width: 15, height: 15, color: accent }} />
          : <Play   style={{ width: 15, height: 15, color: accent, marginLeft: 2 }} />
        }
      </button>

      {/* Waveform + timer */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Bars */}
        <div
          className="flex items-end gap-[2px] cursor-pointer"
          style={{ height: 28 }}
          onClick={handleSeek}
        >
          {BARS.map((h, i) => {
            const filled = (i / BARS.length) < progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${Math.round(h * 100)}%`,
                  background: filled ? accent : dim,
                  minWidth: 2,
                  transition: 'background 0.15s',
                }}
              />
            );
          })}
        </div>

        {/* Timer */}
        <span style={{ fontSize: 10, fontWeight: 600, color: timColor, lineHeight: 1 }}>
          {fmt(displayTime)}
        </span>
      </div>
    </div>
  );
}

// tiny stub to silence lint (toast imported in ChatPage, not here)
function toast_noop() {}
