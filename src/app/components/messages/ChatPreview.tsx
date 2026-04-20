import { MessageSquare, Shield, Trash2 } from 'lucide-react';
import type { Chat } from '../../api/chatStore';
import { ChatAvatar } from './ChatAvatar';
import { relTime, formatLastMsg, getProposalLabel } from './helpers';

interface ChatPreviewProps {
  chat: Chat;
  onOpenFull: (c: Chat) => void;
  onDelete: (id: string) => void;
}

export function ChatPreview({ chat, onOpenFull, onDelete }: ChatPreviewProps) {
  const contact = chat.contact;
  const hasUnread = (chat.unread || 0) > 0;
  const proposalLabel = getProposalLabel(chat);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
        <ChatAvatar contact={contact} hasUnread={hasUnread} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-white truncate">{contact.name || 'Пользователь'}</h2>
            {contact.verified && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          </div>
          {contact.sub && <p className="text-[12px] text-[#607080] mt-0.5 truncate">{contact.sub}</p>}
          <p className="text-[11px] text-[#4a6278] mt-0.5">
            {contact.online ? '🟢 Онлайн' : `Был(а) ${relTime(chat.lastTs)}`}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        {/* Last message card */}
        <div className="w-full max-w-md rounded-2xl p-5" style={{ background: '#ffffff05', border: '1px solid #ffffff0a' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3d5263] mb-3">Последнее сообщение</p>
          <p className="text-[14px] text-[#c8daf0] leading-relaxed">{formatLastMsg(chat)}</p>
          <p className="text-[11px] text-[#3d5263] mt-3">{relTime(chat.lastTs)}</p>
        </div>

        {/* Proposal status */}
        {proposalLabel && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border" style={proposalLabel.style}>
              {chat.proposalStatus === 'accepted' ? '✅' : chat.proposalStatus === 'rejected' ? '❌' : '📦'} {proposalLabel.text}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenFull(chat)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #5ba3f5)', boxShadow: '0 4px 16px #1d4ed850' }}
          >
            <MessageSquare className="w-4 h-4" /> Открыть чат
          </button>
          <button
            onClick={() => onDelete(chat.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:bg-[#3d1a1a] active:scale-95"
            style={{ background: '#2d1616', color: '#f87171', border: '1px solid #4d2020' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
