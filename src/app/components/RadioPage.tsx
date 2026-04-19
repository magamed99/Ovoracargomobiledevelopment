import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Radio, Send, Truck, Package,
  Users, Wifi, WifiOff, ChevronRight, Hash,
  Zap, AlertTriangle, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };

interface Channel {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
}

interface Message {
  id: string;
  channelId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  text: string;
  ts: number;
  createdAt: string;
}

function timeShort(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function dateLine(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/* ─── Channel List ──────────────────────────────────────────────────────────── */
function ChannelList({ channels, onSelect }: { channels: Channel[]; onSelect: (c: Channel) => void }) {
  const ICONS: Record<string, typeof Zap> = {
    'ch-sos': AlertTriangle,
    'ch-lars': Shield,
  };

  return (
    <div style={{ background: '#0E1621', minHeight: '100vh', fontFamily: "'Sora', sans-serif" }}>
      {/* Top banner */}
      <div style={{ background: 'linear-gradient(135deg,#0d1e38,#0a1628)', padding: '20px 16px 18px', borderBottom: '1px solid #0d2035' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, background: 'linear-gradient(135deg,#1a47c8,#2f8fe0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px #1a47c855' }}>
            <Radio style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>Рация Ovora</h1>
            <p style={{ fontSize: 12, color: '#4a6880', marginTop: 3 }}>Текстовые каналы для дальнобойщиков</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#052015', border: '1px solid #0a3020', borderRadius: 10, padding: '5px 10px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>В сети</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px' }}>
        {/* Info card */}
        <div style={{ background: 'linear-gradient(135deg,#0f2448,#091428)', border: '1px solid #1a3560', borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wifi style={{ width: 20, height: 20, color: '#5ba3f5', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#7a9ab8', lineHeight: 1.5 }}>
            Выберите канал и общайтесь с водителями на маршруте. Сообщения хранятся 24 часа.
          </p>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: '#2a4060', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Каналы</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {channels.map((ch, i) => {
            const SpecialIcon = ICONS[ch.id];
            return (
              <motion.button
                key={ch.id}
                onClick={() => onSelect(ch)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'linear-gradient(145deg,#0d1929,#091420)',
                  border: `1px solid #1a2d45`,
                  borderRadius: 18, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all .15s',
                }}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.01, borderColor: ch.color + '44' }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Channel icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                  background: ch.color + '18', border: `1px solid ${ch.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {ch.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>{ch.name}</p>
                  <p style={{ fontSize: 12, color: '#4a6880', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.desc}</p>
                </div>

                <ChevronRight style={{ width: 16, height: 16, color: '#2a4060', flexShrink: 0 }} />
              </motion.button>
            );
          })}
        </div>

        {/* Rules */}
        <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 14, background: '#080f1a', border: '1px solid #0d2035' }}>
          <p style={{ fontSize: 12, color: '#3a5070', lineHeight: 1.7 }}>
            📋 <strong style={{ color: '#4a6880' }}>Правила:</strong> Уважайте участников · Только тематические сообщения · Запрещена реклама и грубость
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat View ─────────────────────────────────────────────────────────────── */
function ChatView({ channel, onBack }: { channel: Channel; onBack: () => void }) {
  const userEmail = sessionStorage.getItem('ovora_user_email') || '';
  const userRole  = sessionStorage.getItem('userRole') || 'sender';
  const isDriver  = userRole === 'driver';

  const rawName = sessionStorage.getItem('ovora_user_name') || userEmail.split('@')[0] || 'Аноним';
  const userName = rawName;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [connected, setConnected] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/radio/channels/${channel.id}/messages`, { headers: H });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setConnected(true);
      }
    } catch { setConnected(false); }
  }, [channel.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Poll every 5 seconds
  useEffect(() => {
    const t = setInterval(loadMessages, 5_000);
    return () => clearInterval(t);
  }, [loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!userEmail) { toast.error('Необходима авторизация'); return; }
    setSending(true);
    setText('');
    try {
      const res = await fetch(`${BASE}/radio/channels/${channel.id}/messages`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ userEmail, userName, userRole, text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadMessages();
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
      setText(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  let lastDate = '';
  for (const m of messages) {
    const d = dateLine(m.ts);
    if (d !== lastDate) { grouped.push({ date: d, msgs: [] }); lastDate = d; }
    grouped[grouped.length - 1].msgs.push(m);
  }

  return (
    <div style={{ background: '#0E1621', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#0a1220', borderBottom: '1px solid #0d2035', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: 11, background: '#0a1828', border: '1px solid #1a2d45', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: 16, height: 16, color: '#7a9ab8' }} />
        </button>

        <div style={{ width: 40, height: 40, borderRadius: 13, background: channel.color + '18', border: `1px solid ${channel.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {channel.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>{channel.name}</p>
          <p style={{ fontSize: 11, color: '#4a6880', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            {connected
              ? <><Wifi style={{ width: 10, height: 10, color: '#22c55e' }} /><span style={{ color: '#22c55e' }}>Подключён</span></>
              : <><WifiOff style={{ width: 10, height: 10, color: '#ef4444' }} /><span style={{ color: '#ef4444' }}>Нет соединения</span></>
            }
            <span>· обновление каждые 5с</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0a1828', border: '1px solid #1a2d45', borderRadius: 9, padding: '5px 10px' }}>
          <Hash style={{ width: 11, height: 11, color: channel.color }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: channel.color }}>{messages.length}</span>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>{channel.emoji}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Канал пока пуст</p>
            <p style={{ fontSize: 13, color: '#3a5070' }}>Будьте первым! Напишите сообщение водителям на маршруте.</p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            {/* Date divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#0d2035' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2a4060', padding: '3px 10px', borderRadius: 100, background: '#080f1a', border: '1px solid #0d2035' }}>{group.date}</span>
              <div style={{ flex: 1, height: 1, background: '#0d2035' }} />
            </div>

            {group.msgs.map((msg, i) => {
              const isMe = msg.userEmail === userEmail;
              const isSameUser = i > 0 && group.msgs[i-1].userEmail === msg.userEmail;
              const msgIsDriver = msg.userRole === 'driver';

              return (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, marginBottom: isSameUser ? 3 : 10, alignItems: 'flex-end' }}>
                  {/* Avatar */}
                  {!isMe && !isSameUser && (
                    <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: msgIsDriver ? 'linear-gradient(135deg,#1a47c8,#2f8fe0)' : 'linear-gradient(135deg,#047857,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {msgIsDriver ? <Truck style={{ width: 13, height: 13, color: '#fff' }} /> : <Package style={{ width: 13, height: 13, color: '#fff' }} />}
                    </div>
                  )}
                  {!isMe && isSameUser && <div style={{ width: 30, flexShrink: 0 }} />}

                  <div style={{ maxWidth: '72%' }}>
                    {!isMe && !isSameUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: msgIsDriver ? '#5ba3f5' : '#34d399' }}>{msg.userName}</span>
                        <span style={{ fontSize: 10, color: '#2a4060', background: msgIsDriver ? '#0a1e40' : '#071a10', border: `1px solid ${msgIsDriver ? '#1a3560' : '#0a2a18'}`, borderRadius: 5, padding: '1px 6px' }}>
                          {msgIsDriver ? '🚛 Водитель' : '📦 Отправитель'}
                        </span>
                      </div>
                    )}
                    <div style={{
                      padding: '10px 13px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isMe ? 'linear-gradient(135deg,#1a47c8,#2566cc)' : '#0d1929',
                      border: isMe ? 'none' : '1px solid #1a2d45',
                      boxShadow: isMe ? '0 4px 16px #1a47c830' : 'none',
                    }}>
                      <p style={{ fontSize: 14, color: isMe ? '#e8f4ff' : '#c0d4e8', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                      <p style={{ fontSize: 10, color: isMe ? '#93c5fd60' : '#2a4060', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>{timeShort(msg.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input — drivers only */}
      {isDriver ? (
        <div style={{ background: '#080f1a', borderTop: '1px solid #0d2035', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          {/* Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg,#1a47c8,#2f8fe0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck style={{ width: 10, height: 10, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 11, color: '#3a5070' }}>Вы пишете как <strong style={{ color: '#5a8ab0' }}>{userName}</strong> (Водитель)</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Написать в канал..."
              maxLength={500}
              style={{ flex: 1, background: '#0d1929', border: '1px solid #1a2d45', borderRadius: 14, padding: '12px 16px', color: '#c0d4e8', fontSize: 14, outline: 'none', transition: 'border-color .15s' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2a5090'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#1a2d45'; }}
            />
            <button onClick={send} disabled={sending || !text.trim()}
              style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: text.trim() ? 'linear-gradient(135deg,#1a47c8,#2f8fe0)' : '#0a1828',
                border: `1px solid ${text.trim() ? 'transparent' : '#1a2d45'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all .2s',
                boxShadow: text.trim() ? '0 4px 16px #1a47c840' : 'none',
              }}>
              <Send style={{ width: 18, height: 18, color: text.trim() ? '#fff' : '#1a3050' }} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#080f1a', borderTop: '1px solid #0d2035', padding: '14px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🚛</span>
          <span style={{ fontSize: 12, color: '#5a8ab0', textAlign: 'center', lineHeight: 1.4 }}>
            Только водители могут писать в этот канал
          </span>
        </div>
      )}
    </div>
  );
}

const RUSSIA_CHANNEL: Channel = {
  id: 'ch-russia',
  name: 'Россия',
  emoji: '🇷🇺',
  color: '#5ba3f5',
  desc: 'Общий канал водителей по России',
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export function RadioPage() {
  const navigate = useNavigate();
  return (
    <AnimatePresence mode="wait">
      <motion.div key="russia" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
        <ChatView channel={RUSSIA_CHANNEL} onBack={() => navigate(-1)} />
      </motion.div>
    </AnimatePresence>
  );
}

export default RadioPage;
