import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface AviaLikeDislikeBadgeProps {
  likes: number;
  dislikes: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function AviaRatingBadge({ likes, dislikes, size = 'sm', onClick }: AviaLikeDislikeBadgeProps) {
  const total = likes + dislikes;

  if (total === 0) {
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: size === 'md' ? '4px 10px' : '2px 7px',
          borderRadius: 8, border: '1px solid #ffffff10',
          background: '#ffffff06',
          fontSize: size === 'md' ? 11 : 10,
          color: '#3d5268', fontWeight: 600,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <ThumbsUp style={{ width: size === 'md' ? 11 : 9, height: size === 'md' ? 11 : 9, color: '#3d5268' }} />
        Нет отзывов
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      title={`${likes} лайков / ${dislikes} дизлайков`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: size === 'md' ? 6 : 4,
        padding: size === 'md' ? '4px 12px' : '2px 8px',
        borderRadius: 8,
        border: '1px solid #ffffff12',
        background: '#ffffff08',
        fontSize: size === 'md' ? 12 : 10,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Likes */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#34d399' }}>
        <ThumbsUp style={{
          width: size === 'md' ? 12 : 10,
          height: size === 'md' ? 12 : 10,
          color: '#34d399',
          fill: likes > 0 ? '#34d399' : 'transparent',
        }} />
        {likes}
      </span>

      <span style={{ color: '#1e3040', fontSize: size === 'md' ? 10 : 8 }}>/</span>

      {/* Dislikes */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#ef4444' }}>
        <ThumbsDown style={{
          width: size === 'md' ? 12 : 10,
          height: size === 'md' ? 12 : 10,
          color: '#ef4444',
          fill: dislikes > 0 ? '#ef4444' : 'transparent',
        }} />
        {dislikes}
      </span>
    </span>
  );
}
