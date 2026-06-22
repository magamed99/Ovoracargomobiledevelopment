import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, RefreshCw, Loader2, Search, ChevronDown, ChevronUp, Plane, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminChats, getAdminChatMessages } from '../../api/dataApi';
import { AdminPageHeader, HeaderBtn, SkeletonList } from './AdminPageHeader';

function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>только что</span>;
  if (mins < 60) return <span>{mins} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  const days = Math.floor(hrs / 24);
  if (days < 30) return <span>{days} дн. назад</span>;
  return <span>{new Date(iso).toLocaleDateString('ru-RU')}</span>;
}

export function ChatsManagement() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, any[]>>({});
  const [messagesLoading, setMessagesLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminChats();
      setChats(data || []);
    } catch {
      toast.error('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (chatId: string) => {
    const next = expandedId === chatId ? null : chatId;
    setExpandedId(next);
    if (next && !messagesByChat[next]) {
      setMessagesLoading(next);
      try {
        const messages = await getAdminChatMessages(next);
        setMessagesByChat(prev => ({ ...prev, [next]: messages || [] }));
      } catch {
        toast.error('Ошибка загрузки сообщений');
      } finally {
        setMessagesLoading(null);
      }
    }
  };

  const filtered = chats.filter(ch => {
    if (!ch) return false;
    const q = searchQuery.toLowerCase();
    return !q
      || (ch.participants || []).some((p: string) => p.toLowerCase().includes(q))
      || (ch.tripRoute || '').toLowerCase().includes(q)
      || (ch.lastMessage || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Чаты (модерация)"
        subtitle="Просмотр переписки между водителями и отправителями — только чтение"
        icon={MessageSquare}
        gradient="linear-gradient(135deg,#6366f1,#818cf8)"
        accent="#6366f1"
        stats={[{ label: 'Всего чатов', value: chats.length }]}
        actions={<HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>}
      />

      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0f4f8' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по участнику, маршруту, сообщению..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Чаты не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(chat => {
              const isExpanded = expandedId === chat.chatId;
              const isMsgLoading = messagesLoading === chat.chatId;
              const messages = messagesByChat[chat.chatId] || [];
              return (
                <div key={chat.chatId}>
                  <div
                    onClick={() => toggleExpand(chat.chatId)}
                    className="flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eef2ff' }}>
                      <MessageSquare className="w-4 h-4" style={{ color: '#6366f1' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 break-words">
                        {(chat.participants || []).join(' ↔ ') || '—'}
                      </span>
                      {chat.tripRoute && (
                        <p className="text-xs text-gray-400 mt-0.5 break-words">{chat.tripRoute}</p>
                      )}
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      <RelTime iso={chat.lastMessageAt || chat.createdAt} />
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 -mt-1">
                      <div className="rounded-xl p-3 space-y-2 max-h-96 overflow-y-auto" style={{ background: '#f8fafc' }}>
                        {isMsgLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-300 mx-auto" />
                        ) : messages.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">Сообщений нет</p>
                        ) : (
                          messages.map((m: any) => (
                            <div key={m.msgId} className="text-xs bg-white rounded-lg px-3 py-2" style={{ border: '1px solid #f0f4f8' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-700">{m.senderName || m.senderId}</span>
                                <span className="text-gray-400">{m.ts ? new Date(m.ts).toLocaleString('ru-RU') : ''}</span>
                              </div>
                              {m.type === 'proposal' ? (
                                <span className="flex items-center gap-1 text-amber-600"><Plane className="w-3 h-3" /> Предложение по сделке</span>
                              ) : m.type === 'image' ? (
                                <span className="flex items-center gap-1 text-blue-600"><FileImage className="w-3 h-3" /> Изображение</span>
                              ) : (
                                <p className="text-gray-700 break-words">{m.text || '—'}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Показано {filtered.length} из {chats.length} чатов
      </p>
    </div>
  );
}
