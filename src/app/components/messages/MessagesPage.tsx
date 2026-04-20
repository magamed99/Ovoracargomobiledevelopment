import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Chat } from '../../api/chatStore';
import { useMessages } from '../../hooks/useMessages';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullIndicator } from '../PullIndicator';
import { MessagesHeader } from './MessagesHeader';
import { SearchBar } from './SearchBar';
import { ChatRow } from './ChatRow';
import { EmptyState } from './EmptyState';
import { RowSkeleton } from './RowSkeleton';

// ── Chat list (shared between mobile & desktop) ─────────────────────────────
function ChatList({
  chats,
  initialLoading,
  searchQuery,
  emptyHint,
  mode,
  selectedChatId,
  onOpen,
  onDelete,
}: {
  chats: Chat[];
  initialLoading: boolean;
  searchQuery: string;
  emptyHint: string;
  mode: 'mobile' | 'desktop';
  selectedChatId?: string;
  onOpen: (c: Chat) => void;
  onDelete: (id: string) => void;
}) {
  if (initialLoading && chats.length === 0) {
    return <div className="pt-1">{[1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)}</div>;
  }

  if (!initialLoading && chats.length === 0) {
    return <EmptyState isSearch={!!searchQuery} hint={emptyHint} />;
  }

  return (
    <div className="pt-1">
      {!searchQuery && chats.length > 0 && (
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          {mode === 'mobile' ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">
              Все чаты · {chats.length}
            </p>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3d5263]">Все чаты</p>
              <div className="flex-1 h-px bg-white/[0.05] mx-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3d5263]">{chats.length}</p>
            </>
          )}
        </div>
      )}
      {chats.map(chat => (
        <ChatRow
          key={chat.id}
          chat={chat}
          onOpen={onOpen}
          onDelete={onDelete}
          isSelected={mode === 'desktop' && selectedChatId === chat.id}
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function MessagesPage() {
  const navigate = useNavigate();
  const msg = useMessages();

  const subtitle = msg.isDriver ? 'Чаты с отправителями' : 'Чаты с водителями';
  const emptyHint = msg.isDriver
    ? 'Опубликуйте рейс, чтобы отправители начали писать'
    : 'Найдите поездку и напишите водителю';

  const { containerRef: pullRef, pullY, isRefreshing: isPulling,
    onTouchStart: pullTouchStart, onTouchMove: pullTouchMove, onTouchEnd: pullTouchEnd,
  } = usePullToRefresh({ onRefresh: () => msg.syncRef.current() });

  const openChatMobile = (chat: Chat) => { msg.openChat(chat); navigate(`/chat/${chat.id}`); };
  const openChatDesktop = (chat: Chat) => { msg.openChat(chat); navigate(`/chat/${chat.id}`); };

  return (
    <div className="font-['Sora'] bg-[#0e1621] min-h-screen">

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">
        <div className="sticky top-0 z-30 bg-[#0e1621]">
          <MessagesHeader
            variant="mobile"
            totalUnread={msg.totalUnread}
            subtitle={subtitle}
            syncing={msg.syncing}
            onBack={() => navigate('/dashboard')}
            onSync={msg.syncFromApi}
          />
          <SearchBar value={msg.searchQuery} onChange={msg.setSearchQuery} className="relative px-3 sm:px-4 pb-3 sm:pb-4" />
        </div>

        <div
          ref={pullRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={pullTouchStart}
          onTouchMove={pullTouchMove}
          onTouchEnd={pullTouchEnd}
        >
          <PullIndicator pullY={pullY} isRefreshing={isPulling} />
          <ChatList
            chats={msg.filtered}
            initialLoading={msg.initialLoading}
            searchQuery={msg.searchQuery}
            emptyHint={emptyHint}
            mode="mobile"
            onOpen={openChatMobile}
            onDelete={msg.handleDeleteChat}
          />
          <div style={{ height: 'calc(env(safe-area-inset-bottom, 16px) + 80px)', minHeight: 96 }} />
        </div>
      </div>

      {/* ══════════════ DESKTOP ══════════════ */}
      <div className="hidden md:flex flex-col min-h-screen">
        <MessagesHeader
          variant="desktop"
          totalUnread={msg.totalUnread}
          subtitle={subtitle}
          syncing={msg.syncing}
          onSync={msg.syncFromApi}
        />

        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto flex h-full" style={{ maxHeight: 'calc(100vh - 73px)' }}>
            {/* Left: Chat list */}
            <div className="flex flex-col" style={{ width: 400, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <SearchBar value={msg.searchQuery} onChange={msg.setSearchQuery} className="px-4 pt-4 pb-3" />

              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>
                <ChatList
                  chats={msg.filtered}
                  initialLoading={msg.initialLoading}
                  searchQuery={msg.searchQuery}
                  emptyHint={emptyHint}
                  mode="desktop"
                  onOpen={openChatDesktop}
                  onDelete={msg.handleDeleteChat}
                />
                <div className="h-4" />
              </div>
            </div>

            {/* Right: empty state */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: '#ffffff06', border: '1px solid #ffffff0a' }}>
                  <Eye className="w-9 h-9 text-[#2a4060]" />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-black text-white mb-1">Выберите чат</p>
                  <p className="text-[13px] text-[#4a6278] leading-relaxed max-w-xs">
                    Нажмите на чат слева, чтобы открыть переписку
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}