import type { Chat } from '../../api/chatStore';

// ── Relative time ────────────────────────────────────────────────────────────
export function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Сейчас';
  if (diff < 3600_000) return `${Math.floor(diff / 60000)} мин`;
  if (diff < 86400_000) return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 86400_000) return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][new Date(ts).getDay()];
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Format last message ──────────────────────────────────────────────────────
export function formatLastMsg(chat: Chat): string {
  const msg = chat.lastMessage || '';
  if (chat.proposalStatus === 'accepted') return '✅ Оферта принята';
  if (chat.proposalStatus === 'rejected') return '❌ Оферта отклонена';
  if (chat.hasProposal) return '📦 Новая оферта по перевозке';
  if (msg.startsWith('{') || msg.startsWith('[')) return '📎 Детали заявки';
  return msg.replace(/\n+/g, ' ').trim();
}

// ── Initials from name ───────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// ── Proposal label ───────────────────────────────────────────────────────────
export function getProposalLabel(chat: Chat) {
  if (chat.proposalStatus === 'accepted') return { text: 'Принята', style: { background: '#132d20', color: '#34d399', borderColor: '#1a4d32' } };
  if (chat.proposalStatus === 'rejected') return { text: 'Отклонена', style: { background: '#2d1616', color: '#f87171', borderColor: '#4d2020' } };
  if (chat.hasProposal) return { text: 'Оферта', style: { background: '#2d230d', color: '#fbbf24', borderColor: '#4d3a12' } };
  return null;
}
