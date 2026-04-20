import { useState, useRef } from 'react';
import { CheckCheck, Shield, Trash2 } from 'lucide-react';
import type { Chat } from '../../api/chatStore';
import { ChatAvatar } from './ChatAvatar';
import { relTime, formatLastMsg, getProposalLabel } from './helpers';

interface ChatRowProps {
  chat: Chat;
  onOpen: (c: Chat) => void;
  onDelete?: (chatId: string) => void;
  isSelected?: boolean;
}

const DRAG_THRESHOLD = 8;
const MIN_SWIPE = 70;
const MAX_DRAG = 100;

export function ChatRow({ chat, onOpen, onDelete, isSelected }: ChatRowProps) {
  const hasUnread = (chat.unread || 0) > 0;
  const contact = chat.contact;
  const proposalLabel = getProposalLabel(chat);

  // ── Swipe state ──
  const [dragOffset, setDragOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const startXRef = useRef(0);
  const endXRef = useRef(0);
  const didDragRef = useRef(false);
  const swipedRef = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const x = e.targetTouches[0].clientX;
    startXRef.current = x;
    endXRef.current = x;
    didDragRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const cur = e.targetTouches[0].clientX;
    endXRef.current = cur;
    const offset = startXRef.current - cur;
    if (offset > DRAG_THRESHOLD) {
      didDragRef.current = true;
      setIsDragging(true);
    }
    setDragOffset(Math.max(0, Math.min(offset, MAX_DRAG)));
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    const offset = startXRef.current - endXRef.current;
    if (offset > MIN_SWIPE) {
      swipedRef.current = true;
      setSwiped(true);
    } else if (didDragRef.current) {
      swipedRef.current = false;
      setSwiped(false);
    }
    setDragOffset(0);
  };

  const handleClick = () => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    if (swipedRef.current || swiped) {
      swipedRef.current = false;
      setSwiped(false);
      return;
    }
    onOpen(chat);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => { onDelete?.(chat.id); }, 280);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        opacity: isDeleting ? 0 : 1,
        transform: isDeleting ? 'scaleY(0.9)' : 'scaleY(1)',
        transition: 'opacity 0.28s, transform 0.28s',
      }}
    >
      {/* Swipe delete background */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 rounded-l-2xl transition-all duration-300 ${swiped ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
      >
        <button onClick={handleDelete} className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <Trash2 className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-bold">Удалить</span>
        </button>
      </div>

      {/* Row content */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left select-none cursor-pointer outline-none focus:outline-none relative"
        style={{
          transform: swiped ? 'translateX(-80px)' : `translateX(-${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.4,0,.2,1)',
          background: isSelected ? 'rgba(91,163,245,0.08)' : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeftWidth: 3,
          borderLeftStyle: 'solid',
          borderLeftColor: isSelected ? '#5ba3f5' : 'transparent',
        }}
      >
        {/* Bottom separator */}
        <div className="absolute bottom-0 left-4 right-0 h-px" style={{ backgroundColor: '#1a2a3a' }} />

        {/* Desktop hover delete */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            opacity: isHovered && !swiped ? 1 : 0,
            transform: `translateY(-50%) scale(${isHovered && !swiped ? 1 : 0.8})`,
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          <button
            className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#f87171]"
            style={{ background: '#2d1616', border: '1px solid #4d2020' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3d1a1a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2d1616'; }}
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
            Удалить
          </button>
        </div>

        {/* Avatar */}
        <ChatAvatar contact={contact} hasUnread={hasUnread} />

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <div className="flex justify-between items-baseline gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className={`text-[15px] font-bold truncate ${hasUnread ? 'text-white' : 'text-[#c8d8e8]'}`}>
                {(contact.name || '').trim() || (contact.role === 'driver' ? 'Водитель' : 'Отправитель')}
              </h3>
              {contact.verified && <Shield className="w-3 h-3 text-emerald-400 shrink-0" />}
            </div>
            <span className={`text-[11px] whitespace-nowrap font-semibold shrink-0 ${hasUnread ? 'text-[#5ba3f5]' : 'text-[#607080]'}`}>
              {relTime(chat.lastTs)}
            </span>
          </div>

          {contact.sub && !chat.hasProposal && !chat.proposalStatus && (
            <p className="text-[11px] text-[#607080] font-medium truncate">{contact.sub}</p>
          )}

          <div className="flex justify-between items-center gap-2 mt-0.5">
            <p className={`text-[13px] truncate leading-snug ${hasUnread ? 'text-[#d0dde8] font-medium' : 'text-[#607080]'}`}>
              {formatLastMsg(chat)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {proposalLabel && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-black border"
                  style={proposalLabel.style}
                >
                  {proposalLabel.text}
                </span>
              )}
              {hasUnread ? (
                <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#5ba3f5] flex items-center justify-center">
                  <span className="text-[11px] font-black text-white leading-none">{chat.unread}</span>
                </div>
              ) : (
                <CheckCheck className="w-4 h-4 text-[#5ba3f5]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}