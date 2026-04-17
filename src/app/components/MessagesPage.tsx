import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Search, ArrowLeft, CheckCheck, Shield, Truck, Package,
  MessageSquare, RefreshCw, Trash2, Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  getChats, markRead, fetchChats, deleteChat, Chat,
} from '../api/chatStore';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullIndicator } from './PullIndicator';

// ── Relative time helper ──────────────────────────────────────────────────────
function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)      return 'Сейчас';
  if (diff < 3600_000)    return `${Math.floor(diff / 60000)} мин`;
  if (diff < 86400_000)   return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 86400_000) return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(ts).getDay()];
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 animate-pulse">
      <div className="w-13 h-13 rounded-2xl bg-white/[0.07] shrink-0" style={{ width: 52, height: 52 }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3.5 w-32 rounded-lg bg-white/[0.07]" />
          <div className="h-3 w-10 rounded-lg bg-white/[0.05]" />
        </div>
        <div className="h-3 w-20 rounded-lg bg-white/[0.05]" />
        <div className="h-3 w-48 rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ── Format last message ───────────────────────────────────────────────────────
function formatLastMsg(chat: Chat): string {
  const msg = chat.lastMessage || '';
  if (chat.proposalStatus === 'accepted') return '✅ Оферта принята';
  if (chat.proposalStatus === 'rejected') return '❌ Оферта отклонена';
  if (chat.hasProposal) return '📦 Новая оферта по перевозке';
  if (msg.startsWith('{') || msg.startsWith('[')) return '📎 Детали заявки';
  return msg.replace(/\n+/g, ' ').trim();
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function MessagesPage() {
  const navigate   = useNavigate();
  const userRole   = sessionStorage.getItem('userRole') || 'sender';
  const isDriver   = userRole === 'driver';

  const subtitle  = isDriver ? 'Чаты с отправителями' : 'Чаты с водителями';
  const emptyHint = isDriver
    ? 'Опубликуйте рейс, чтобы отправители начали писать'
    : 'Найдите поездку и напишите водителю';

  const [chats,          setChats]          = useState<Chat[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [syncing,        setSyncing]        = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [selectedChat,   setSelectedChat]   = useState<Chat | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef  = useRef<() => Promise<void>>(async () => {});

  const { containerRef: pullRef, pullY, isRefreshing: isPulling,
    onTouchStart: pullTouchStart, onTouchMove: pullTouchMove, onTouchEnd: pullTouchEnd,
  } = usePullToRefresh({ onRefresh: () => syncRef.current() });

  const loadLocal = useCallback(() => { setChats([...getChats()]); }, []);

  const syncFromApi = useCallback(async () => {
    setSyncing(true);
    try {
      await fetchChats();
      setChats([...getChats()]);
    } catch { /* use cache */ } finally {
      setSyncing(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { syncRef.current = syncFromApi; }, [syncFromApi]);

  useEffect(() => {
    if (!localStorage.getItem('ovora_demo_wiped_v2')) {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === 'ovora_chats_v2' || k === 'ovora_chat_contacts_v2')) keysToDelete.push(k);
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('ovora_demo_wiped_v2', '1');
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a/chats/cleanup-demo`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      ).then(r => r.json()).then(d => {
        console.log('[cleanup-demo] Удалено с сервера:', d.deleted ?? 0);
      }).catch(() => {});
    }

    loadLocal();
    syncFromApi();

    pollRef.current = setInterval(() => {
      if (document.visibilityState !== 'hidden') syncFromApi();
    }, 12_000);

    window.addEventListener('ovora_chat_update', loadLocal);
    window.addEventListener('ovora_user_updated', syncFromApi as EventListener);
    return () => {
      window.removeEventListener('ovora_chat_update', loadLocal);
      window.removeEventListener('ovora_user_updated', syncFromApi as EventListener);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadLocal, syncFromApi, userRole]);

  const filtered = chats
    .filter(c => !c.id.startsWith('demo_'))
    .filter(c =>
      c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalUnread = useMemo(() => chats.reduce((acc, c) => acc + (c.unread || 0), 0), [chats]);

  const openChat = (chat: Chat) => { markRead(chat.id); navigate(`/chat/${chat.id}`); };

  const handleDeleteChat = async (chatId: string) => {
    try {
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (selectedChat?.id === chatId) setSelectedChat(null);
      await deleteChat(chatId);
    } catch (err) {
      console.error('[MessagesPage] Delete chat failed:', err);
      loadLocal();
    }
  };

  // ── Search bar (shared) ──
  const renderSearch = (cls?: string) => (
    <div className={cls}>
      <div
        className="relative flex items-center w-full h-10 sm:h-11 rounded-2xl border overflow-hidden transition-all"
        style={{
          background: searchFocused ? 'rgba(91,163,245,0.08)' : 'rgba(255,255,255,0.05)',
          borderColor: searchFocused ? 'rgba(91,163,245,0.35)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="grid place-items-center h-full w-10 sm:w-11 shrink-0 text-[#607080]">
          <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </div>
        <input
          className="flex-1 h-full border-none outline-none text-[13px] sm:text-[14px] pr-3 sm:pr-4 bg-transparent text-white placeholder-[#607080] font-['Sora']"
          placeholder="Поиск по сообщениям..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="mr-2 sm:mr-3 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] text-[#607080]">✕</span>
          </button>
        )}
      </div>
    </div>
  );

  // ── Chat list renderer ──
  const renderChatList = (listChats: Chat[], mode: 'mobile' | 'desktop') => {
    if (initialLoading && chats.length === 0) {
      return <div className="pt-1">{[1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)}</div>;
    }
    if (!initialLoading && listChats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-8">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
            <MessageSquare className="w-9 h-9 text-[#607080]" />
          </div>
          <div className="text-center">
            <p className="text-[16px] font-black text-white">
              {searchQuery ? 'Ничего не найдено' : 'Нет сообщений'}
            </p>
            {!searchQuery && (
              <p className="text-[13px] text-[#607080] mt-1.5 leading-snug">{emptyHint}</p>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="pt-1">
        {!searchQuery && listChats.length > 0 && (
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">
              Все чаты · {listChats.length}
            </p>
          </div>
        )}
        {listChats.map(chat => (
          <ChatRow
            key={chat.id}
            chat={chat}
            onOpen={mode === 'mobile' ? openChat : (c) => { markRead(c.id); setSelectedChat(c); }}
            onDelete={handleDeleteChat}
            isSelected={mode === 'desktop' && selectedChat?.id === chat.id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="font-['Sora'] bg-[#0e1621]">

      {/* ══════════════════════ MOBILE ══════════════════════════ */}
      <div className="md:hidden flex flex-col" style={{ height: '100dvh' }}>

        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-30 bg-[#0e1621]">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0f2744 0%, #0e1621 60%)' }} />
              <div className="absolute -top-12 sm:-top-16 -right-12 sm:-right-16 w-40 sm:w-52 h-40 sm:h-52 rounded-full"
                style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.20 }} />
            </div>
            <div
              className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4"
              style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 12 }}
            >
              <button onClick={() => navigate('/dashboard')}
                className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all shrink-0">
                <ArrowLeft className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-[20px] sm:text-[22px] font-black text-white leading-tight">Сообщения</h1>
                  {totalUnread > 0 && (
                    <div className="min-w-[20px] sm:min-w-[22px] h-[20px] sm:h-[22px] px-1.5 rounded-full bg-[#5ba3f5] flex items-center justify-center shrink-0">
                      <span className="text-[10px] sm:text-[11px] font-black text-white leading-none">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#607080] mt-0.5 font-semibold">{subtitle}</p>
              </div>
              <button onClick={syncFromApi}
                className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-[#5ba3f5] active:scale-90 transition-all shrink-0">
                <RefreshCw className={`w-4 sm:w-4.5 h-4 sm:h-4.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {renderSearch('relative px-3 sm:px-4 pb-3 sm:pb-4')}
          </div>
        </div>

        {/* ── CHAT LIST ── */}
        <div
          ref={pullRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={pullTouchStart}
          onTouchMove={pullTouchMove}
          onTouchEnd={pullTouchEnd}
        >
          <PullIndicator pullY={pullY} isRefreshing={isPulling} />
          {renderChatList(filtered, 'mobile')}
          <div style={{ height: 'calc(env(safe-area-inset-bottom, 16px) + 80px)', minHeight: 96 }} />
        </div>
      </div>

      {/* ══════════════════════ DESKTOP ═════════════════════════════════════ */}
      <div className="hidden md:flex flex-col" style={{ height: '100dvh' }}>

        {/* ── Compact header ── */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 lg:px-10 py-4" style={{ background: '#0a1520' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #5ba3f5)', boxShadow: '0 4px 16px #1d4ed850' }}>
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-black text-white leading-tight">Сообщения</h1>
                  {totalUnread > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: '#5ba3f5', boxShadow: '0 0 10px #5ba3f540' }}>
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#4a6278] font-semibold">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncing && (
                <span className="text-[11px] text-[#4a6278] font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Обновление…
                </span>
              )}
              <button
                onClick={syncFromApi}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:text-white disabled:opacity-50"
                style={{ background: '#ffffff08', border: '1px solid #ffffff10', color: '#607080' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* ── 2-column body ── */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto flex h-full" style={{ maxHeight: 'calc(100vh - 73px)' }}>

            {/* LEFT: Chat list */}
            <div className="flex flex-col" style={{ width: 400, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {renderSearch('px-4 pt-4 pb-3')}

              {/* Section label */}
              {!searchQuery && filtered.length > 0 && (
                <div className="flex items-center gap-3 px-4 pb-2 shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3d5263]">Все чаты</p>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3d5263]">{filtered.length}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>
                {renderChatList(filtered, 'desktop')}
                <div className="h-4" />
              </div>
            </div>

            {/* RIGHT: Preview panel */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedChat ? (
                <ChatPreview chat={selectedChat} onOpenFull={openChat} onDelete={handleDeleteChat} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: '#ffffff06', border: '1px solid #ffffff0a' }}>
                    <Eye className="w-9 h-9 text-[#2a4060]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-black text-white mb-1">Выберите чат</p>
                    <p className="text-[13px] text-[#4a6278] leading-relaxed max-w-xs">
                      Нажмите на чат слева, чтобы увидеть превью
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat Preview Panel ────────────────────────────────────────────────────────
function ChatPreview({ chat, onOpenFull, onDelete }: {
  chat: Chat;
  onOpenFull: (c: Chat) => void;
  onDelete: (id: string) => void;
}) {
  const contact = chat.contact;
  const hasUnread = (chat.unread || 0) > 0;
  const initials = contact.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex-1 flex flex-col">
      {/* Preview header */}
      <div className="shrink-0 px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
        <div className="relative shrink-0">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} className="object-cover rounded-2xl" style={{ width: 52, height: 52 }} />
          ) : (
            <div className="rounded-2xl flex items-center justify-center font-black text-[15px] text-white shrink-0"
              style={{ width: 52, height: 52, background: hasUnread ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'linear-gradient(135deg,#1e3a5f,#243b55)' }}>
              {initials || '?'}
            </div>
          )}
          {contact.online ? (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400" style={{ border: '2px solid #0e1621' }} />
          ) : (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-xl flex items-center justify-center" style={{ background: contact.role === 'driver' ? '#5ba3f5' : '#10b981', border: '2px solid #0e1621' }}>
              {contact.role === 'driver' ? <Truck className="w-2.5 h-2.5 text-white" /> : <Package className="w-2.5 h-2.5 text-white" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-white truncate">{contact.name || 'Пользователь'}</h2>
            {contact.verified && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          </div>
          {contact.sub && <p className="text-[12px] text-[#607080] mt-0.5 truncate">{contact.sub}</p>}
          <p className="text-[11px] text-[#4a6278] mt-0.5">{contact.online ? '🟢 Онлайн' : `Был(а) ${relTime(chat.lastTs)}`}</p>
        </div>
      </div>

      {/* Preview body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        {/* Last message card */}
        <div className="w-full max-w-md rounded-2xl p-5" style={{ background: '#ffffff05', border: '1px solid #ffffff0a' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3d5263] mb-3">Последнее сообщение</p>
          <p className="text-[14px] text-[#c8daf0] leading-relaxed">{formatLastMsg(chat)}</p>
          <p className="text-[11px] text-[#3d5263] mt-3">{relTime(chat.lastTs)}</p>
        </div>

        {/* Proposal status badge */}
        {(chat.proposalStatus || chat.hasProposal) && (
          <div className="flex items-center gap-2">
            {chat.proposalStatus === 'accepted' && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#132d20', color: '#34d399', border: '1px solid #1a4d32' }}>✅ Оферта принята</span>
            )}
            {chat.proposalStatus === 'rejected' && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#2d1616', color: '#f87171', border: '1px solid #4d2020' }}>❌ Оферта отклонена</span>
            )}
            {!chat.proposalStatus && chat.hasProposal && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#2d230d', color: '#fbbf24', border: '1px solid #4d3a12' }}>📦 Новая оферта</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => onOpenFull(chat)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #5ba3f5)', boxShadow: '0 4px 16px #1d4ed850' }}>
            <MessageSquare className="w-4 h-4" /> Открыть чат
          </button>
          <button onClick={() => onDelete(chat.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:bg-[#3d1a1a] active:scale-95"
            style={{ background: '#2d1616', color: '#f87171', border: '1px solid #4d2020' }}>
            <Trash2 className="w-3.5 h-3.5" /> Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChatRow ───────────────────────────────────────────────────────────────────
function ChatRow({ chat, onOpen, onDelete, isSelected }: {
  chat: Chat;
  onOpen: (c: Chat) => void;
  onDelete?: (chatId: string) => void;
  isSelected?: boolean;
}) {
  if (chat.id.startsWith('demo_')) return null;

  const hasUnread = (chat.unread || 0) > 0;
  const contact   = chat.contact;

  const [dragOffset, setDragOffset] = useState(0);
  const [swiped,     setSwiped]     = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered]   = useState(false);

  const startXRef   = useRef(0);
  const endXRef     = useRef(0);
  const didDragRef  = useRef(false);
  const swipedRef   = useRef(false);

  const DRAG_THRESHOLD = 8;
  const MIN_SWIPE = 70;
  const MAX_DRAG  = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    const x = e.targetTouches[0].clientX;
    startXRef.current = x;
    endXRef.current   = x;
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

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; endXRef.current = e.clientX; didDragRef.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const cur = e.clientX;
    endXRef.current = cur;
    const offset = startXRef.current - cur;
    if (offset > DRAG_THRESHOLD) didDragRef.current = true;
    setDragOffset(Math.max(0, Math.min(offset, MAX_DRAG)));
  };
  const onMouseUp = () => {
    if (!isDragging) return;
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); setIsDeleting(true);
    setTimeout(() => { onDelete?.(chat.id); }, 280);
  };

  const initials = contact.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const proposalLabel =
    chat.proposalStatus === 'accepted' ? { text: 'Принята',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' } :
    chat.proposalStatus === 'rejected' ? { text: 'Отклонена', cls: 'bg-red-500/15 text-red-400 border-red-500/25' } :
    chat.hasProposal                   ? { text: 'Оферта',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' } : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{ opacity: isDeleting ? 0 : 1, transform: isDeleting ? 'scaleY(0.9)' : 'scaleY(1)', transition: 'opacity 0.28s, transform 0.28s' }}
    >
      {/* Delete bg */}
      <div className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 rounded-l-2xl transition-all duration-300 ${swiped ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
        <button onClick={handleDelete} className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <Trash2 className="w-5 h-5 text-white" />
          <span className="text-[9px] text-white font-bold">Удалить</span>
        </button>
      </div>

      {/* Row */}
      <button
        onClick={() => {
          if (didDragRef.current) { didDragRef.current = false; return; }
          if (swipedRef.current || swiped) {
            swipedRef.current = false;
            setSwiped(false);
            return;
          }
          onOpen(chat);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); onMouseUp(); }}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left select-none cursor-pointer outline-none focus:outline-none shadow-none relative"
        style={{
          transform: swiped ? 'translateX(-80px)' : `translateX(-${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(.4,0,.2,1)',
          background: isSelected ? 'rgba(91,163,245,0.08)' : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeft: isSelected ? '3px solid #5ba3f5' : '3px solid transparent',
        }}
      >
        {/* Bottom separator */}
        <div className="absolute bottom-0 left-4 right-0" style={{ height: 1, backgroundColor: '#1a2a3a' }} />

        {/* Desktop hover — delete button */}
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
            onClick={e => { e.stopPropagation(); handleDelete(e); }}
          >
            <Trash2 className="w-3 h-3" />
            Удалить
          </button>
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name}
              className="object-cover rounded-2xl"
              style={{ width: 52, height: 52 }} />
          ) : (
            <div
              className="rounded-2xl flex items-center justify-center font-black text-[15px] text-white"
              style={{
                width: 52, height: 52,
                background: hasUnread
                  ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                  : 'linear-gradient(135deg, #1e3a5f, #243b55)',
              }}
            >
              {initials || '?'}
            </div>
          )}
          {contact.online ? (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0e1621]" />
          ) : (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-xl flex items-center justify-center border-2 border-[#0e1621]"
              style={{ background: contact.role === 'driver' ? '#5ba3f5' : '#10b981' }}
            >
              {contact.role === 'driver'
                ? <Truck className="w-2.5 h-2.5 text-white" />
                : <Package className="w-2.5 h-2.5 text-white" />
              }
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <div className="flex justify-between items-baseline gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className={`text-[15px] font-bold truncate ${hasUnread ? 'text-white' : 'text-[#c8d8e8]'}`}>
                {contact.name || 'Пользователь'}
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
                  style={
                    chat.proposalStatus === 'accepted'
                      ? { background: '#132d20', color: '#34d399', borderColor: '#1a4d32' }
                      : chat.proposalStatus === 'rejected'
                      ? { background: '#2d1616', color: '#f87171', borderColor: '#4d2020' }
                      : { background: '#2d230d', color: '#fbbf24', borderColor: '#4d3a12' }
                  }
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
      </button>
    </div>
  );
}
