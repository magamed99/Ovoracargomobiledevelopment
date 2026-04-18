import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Phone, Send, Paperclip,
  CheckCheck, Check, FileText, X,
  Shield, Star, Mic, Trash2, Copy,
  MapPin, MoreVertical, UserX, Eraser, StopCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { ProposalCard } from './ProposalCard';
import { ProposalFormModal } from './ProposalFormModal';
import { VoiceMessage } from './VoiceMessage';
import { toast } from 'sonner';
import {
  getChats, getMessages, pushMessage, markRead,
  updateProposalStatus, fetchMessages, deleteMessage,
  deleteChat,
  ChatMessage, ChatProposal, ChatContact, ProposalStatus,
} from '../api/chatStore';

// ── SwipeableMessage Component ─────────────────────────────────────────────────
interface SwipeableMessageProps {
  messageId: string;
  isMine: boolean;
  isDark: boolean;
  onDelete: (id: string) => void;
  onCopy: () => void;
  children: React.ReactNode;
}

function SwipeableMessage({ messageId, isMine, isDark, onDelete, onCopy, children }: SwipeableMessageProps) {
  const [startX, setStartX] = useState(0);
  const [endX, setEndX] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [revealed, setRevealed] = useState<'delete' | 'copy' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const minSwipeDistance = 60;
  const maxSwipeDistance = 100;

  // ── Touch Events (для телефонов) ────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    setEndX(0);
    setStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const current = e.targetTouches[0].clientX;
    setEndX(current);
    const diff = startX - current;
    
    // Limit swipe distance
    if (isMine) {
      // For my messages: swipe left to delete
      setSwipeOffset(Math.max(0, Math.min(diff, maxSwipeDistance)));
    } else {
      // For their messages: swipe right to copy
      setSwipeOffset(Math.min(0, Math.max(diff, -maxSwipeDistance)));
    }
  };

  const onTouchEnd = () => {
    if (!startX || !endX) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = startX - endX;
    
    if (isMine && distance > minSwipeDistance) {
      // Swipe left on my message → delete
      setRevealed('delete');
      setSwipeOffset(maxSwipeDistance);
    } else if (!isMine && distance < -minSwipeDistance) {
      // Swipe right on their message → copy
      setRevealed('copy');
      setSwipeOffset(-maxSwipeDistance);
    } else {
      // Reset
      setSwipeOffset(0);
      setRevealed(null);
    }
  };

  // ── Mouse Events (window-level для корректной работы drag) ──────────────────
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const current = e.clientX;
      setEndX(current);
      const diff = startX - current;
      
      // Limit swipe distance
      if (isMine) {
        setSwipeOffset(Math.max(0, Math.min(diff, maxSwipeDistance)));
      } else {
        setSwipeOffset(Math.min(0, Math.max(diff, -maxSwipeDistance)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      if (!startX || !endX) {
        setSwipeOffset(0);
        return;
      }
      
      const distance = startX - endX;
      
      if (isMine && distance > minSwipeDistance) {
        setRevealed('delete');
        setSwipeOffset(maxSwipeDistance);
      } else if (!isMine && distance < -minSwipeDistance) {
        setRevealed('copy');
        setSwipeOffset(-maxSwipeDistance);
      } else {
        setSwipeOffset(0);
        setRevealed(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, endX, isMine, minSwipeDistance, maxSwipeDistance]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setEndX(0);
    setStartX(e.clientX);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(messageId);
    }, 200);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    // Reset swipe
    setTimeout(() => {
      setSwipeOffset(0);
      setRevealed(null);
    }, 300);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons (revealed on swipe) */}
      {isMine ? (
        // Delete button (right side, for my messages)
        <div className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500 transition-transform duration-200 ${
          revealed === 'delete' ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-full h-full px-4"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        // Copy button (left side, for their messages)
        <div className={`absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-blue-500 transition-transform duration-200 ${
          revealed === 'copy' ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-full h-full px-4"
          >
            <Copy className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Message content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        className={`transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
          isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          transform: `translateX(${isMine ? -swipeOffset : -swipeOffset}px)`,
          transition: endX === 0 ? 'transform 0.2s ease' : 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Main ChatPage ──────────────────────────────────────────────────────────────
export function ChatPage() {
  const navigate = useNavigate();
  const { id: chatId } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: currentUser } = useUser(); // ✅ Используем UserContext
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userRole = sessionStorage.getItem('userRole') || 'sender';
  const isDriver = userRole === 'driver';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contact, setContact] = useState<ChatContact | null>(null);
  const [tripId, setTripId] = useState<string | undefined>(undefined);
  const [tripData, setTripData] = useState<any>(null); // ✅ Store full trip object
  const [inputText, setInputText] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [expandedMsg, setExpandedMsg] = useState<ChatMessage | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef   = useRef<MediaStream | null>(null);
  const fileReaderRef    = useRef<FileReader | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingProposalRef = useRef(false); // ✅ Guard against double proposal send

  // ── Load chat data ───────────────────────────────────────────────────────────
  const loadMessages = useCallback(() => {
    if (!chatId) return;
    const msgs = getMessages(chatId);
    setMessages([...msgs]);
    markRead(chatId);
  }, [chatId]);

  const syncMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const fresh = await fetchMessages(chatId);
      setMessages([...fresh]);
      markRead(chatId);
    } catch { /* use local cache */ }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    // Find contact from chats list
    const chat = getChats().find(c => c.id === chatId);
    if (chat) {
      setContact(chat.contact);
      setTripId(chat.tripId);
      setTripData(chat.tripData); // ✅ Get tripData from chat
    }

    // 1. Instant render from cache
    loadMessages();

    // 2. Sync from API
    syncMessages();

    // 3. Poll every 4s for new messages from server
    pollRef.current = setInterval(syncMessages, 4_000);

    window.addEventListener('ovora_chat_update', loadMessages);
    return () => {
      window.removeEventListener('ovora_chat_update', loadMessages);
      if (pollRef.current) clearInterval(pollRef.current);
      // Освобождаем микрофон при размонтировании (защита от утечки stream)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
        mediaRecorderRef.current = null;
      }
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      // Отменяем FileReader при размонтировании
      if (fileReaderRef.current) {
        fileReaderRef.current.onload = null;
        try { fileReaderRef.current.abort(); } catch {}
        fileReaderRef.current = null;
      }
    };
  }, [chatId, loadMessages, syncMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── File attach ──────────────────────────────────────────────────────────────
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    const sizeStr = file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} КБ`
      : `${(file.size / (1024 * 1024)).toFixed(1)} МБ`;

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      fileReaderRef.current = reader;
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const msg: ChatMessage = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: 'text',
          text: `__IMG__${dataUrl}__NAME__${file.name} (${sizeStr})`,
          from: userRole as 'driver' | 'sender',
          senderId: currentUser?.email || userRole,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          ts: Date.now(),
          read: false,
        };
        pushMessage(chatId, msg);
        // ✅ Removed loadMessages() - event will handle it
      };
      reader.readAsDataURL(file);
    } else {
      const msg: ChatMessage = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'text',
        text: `📎 ${file.name} (${sizeStr})`,
        from: userRole as 'driver' | 'sender',
        senderId: currentUser?.email || userRole,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now(),
        read: false,
      };
      pushMessage(chatId, msg);
      // ✅ Removed loadMessages() - event will handle it
    }
    e.target.value = '';
  };

  // ── Voice recording (hold to record) ─────────────────────────────────────────
  const startVoiceRecord = async () => {
    if (isVoiceRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      voiceChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsVoiceRecording(true);
      setVoiceSeconds(0);
      voiceTimerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000);
    } catch {
      toast.error('Нет доступа к микрофону');
    }
  };

  const stopVoiceRecord = (cancel = false) => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    mr.onstop = () => {
      // Stop all tracks to release mic
      mr.stream.getTracks().forEach(t => t.stop());
      if (cancel || voiceChunksRef.current.length === 0) {
        setIsVoiceRecording(false);
        return;
      }
      const dur = voiceSeconds || 1;
      const blob = new Blob(voiceChunksRef.current, { type: mr.mimeType });
      const reader = new FileReader();
      fileReaderRef.current = reader;
      reader.onload = () => {
        const base64 = reader.result as string;
        if (!chatId) { setIsVoiceRecording(false); return; }
        const msg: ChatMessage = {
          id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: 'text',
          text: `__VOICE__${base64}__DUR__${dur}`,
          from: userRole as 'driver' | 'sender',
          senderId: currentUser?.email || userRole,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          ts: Date.now(),
          read: false,
        };
        pushMessage(chatId, msg);
        setIsVoiceRecording(false);
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
    mediaRecorderRef.current = null;
  };

  // Prevent context menu on long press
  const handleMicContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // ── Send text message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !chatId || sending) return;
    setSending(true);
    setInputText('');

    const msg: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'text',
      text,
      from: userRole as 'driver' | 'sender',
      senderId: currentUser?.email || userRole,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      ts: Date.now(),
      read: false,
    };

    pushMessage(chatId, msg);
    // ✅ Removed loadMessages() - event will handle it
    setSending(false);
  };

  // ── Send proposal (driver only) ──────────────────────────────────────────────
  const sendProposal = async (data: Omit<ChatProposal, 'id' | 'status'>, requestedCapacity?: { seats: number; children: number; cargoKg: number }) => {
    if (!chatId || !contact) return;
    if (isSendingProposalRef.current) return; // ✅ Prevent double send
    isSendingProposalRef.current = true;

    console.log('[ChatPage] sendProposal called', { chatId, data });

    try {
      const proposal: ChatProposal = {
        ...data,
        id: `prop_${Date.now()}`,
        status: 'pending',
      };

      const msg: ChatMessage = {
        id: `pm_${Date.now()}`,
        type: 'proposal',
        proposal,
        from: userRole as 'driver' | 'sender',
        senderId: currentUser?.email || userRole,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now(),
        read: false,
      };

      pushMessage(chatId, msg);
      setShowProposalForm(false);
      toast.success('Оферта отправлена водителю');
    } finally {
      isSendingProposalRef.current = false; // ✅ Всегда сбрасываем, даже при ошибке
    }
  };

  // ── Counter proposal (driver only) ───────────────────────────────────────────
  const [counterProposalId, setCounterProposalId] = useState<string | null>(null);

  const handleCounter = (proposalId: string) => {
    setCounterProposalId(proposalId);
    setShowProposalForm(true);
  };

  const submitProposalWrapper = async (data: Omit<ChatProposal, 'id' | 'status'>, capacity?: { seats: number; children: number; cargoKg: number }) => {
    if (counterProposalId && chatId) {
      await updateProposalStatus(chatId, counterProposalId, 'countered');
      setCounterProposalId(null);
    }
    await sendProposal(data, capacity);
  };

  // ── Accept proposal (driver only) ────────────────────────────────────────────
  const handleAccept = async (proposalId: string) => {
    if (!chatId) return;
    const updated = await updateProposalStatus(chatId, proposalId, 'accepted');
    setMessages([...updated]);

    // Save active shipment for tracking
    const proposal = updated.find(m => m.proposal?.id === proposalId)?.proposal;
    if (proposal) {
      localStorage.setItem('ovora_active_shipment', JSON.stringify({
        proposalId, ...proposal,
        contactName: contact?.name,
        contactAvatar: contact?.avatar,
        senderPhone: proposal.senderPhone || proposal.senderEmail, // телефон из оферты, fallback на email
      }));
    }

    // Invalidate local trip cache so next open shows updated capacity
    if (tripId) {
      const invalidate = (key: string) => {
        try {
          const arr: any[] = JSON.parse(localStorage.getItem(key) || '[]');
          // Remove cached trip so it will be re-fetched from server
          const filtered = arr.filter((t: any) => String(t.id) !== String(tripId));
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch { /* ignore */ }
      };
      invalidate('ovora_published_trips');
      invalidate('ovora_all_trips');
      window.dispatchEvent(new Event('ovora_trip_update'));
    }

    // System message
    setTimeout(() => {
      const sys: ChatMessage = {
        id: `sys_${Date.now()}`,
        type: 'system',
        text: '🎉 Договор подтверждён! Водитель приступит к перевозке.',
        from: 'system',
        senderId: 'system',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now(),
        read: true,
      };
      if (chatId) {
        pushMessage(chatId, sys);
        // ✅ Removed loadMessages() - event will handle it
      }
      toast.success('Оферта принята! Перевозка подтверждена. 🎉');
    }, 350);
  };

  // ── Reject proposal ────────────────────────────────────────────────────────
  const handleReject = async (proposalId: string) => {
    if (!chatId) return;
    const updated = await updateProposalStatus(chatId, proposalId, 'rejected');
    setMessages([...updated]);
    toast.error('Оферта отклонена');
  };

  // ── Cancel proposal (sender only) ──────────────────────────────────────────
  const handleCancel = async (proposalId: string) => {
    if (!chatId) return;
    const updated = await updateProposalStatus(chatId, proposalId, 'declined');
    setMessages([...updated]);
    toast.success('Оферта отменена');
  };

  // ── Delete message ──────────────────────────────────────────────────────────
  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId) return;
    try {
      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await deleteMessage(chatId, messageId);
      toast.success('Сообщение удалено');
    } catch (err) {
      console.error('[ChatPage] Delete message failed:', err);
      toast.error('Ошибка удаления');
      // Rollback - reload messages
      loadMessages();
    }
  };

  // ── Copy message ──────────────────────────────────────────────────────────
  const handleCopyMessage = (text: string) => {
    if (text.startsWith('__IMG__')) {
      toast.error('Нельзя копировать изображения');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  // ── Chat-level actions (header menu) ─────────────────────────────────────
  const handleDeleteChat = async () => {
    if (!chatId) return;
    setShowChatMenu(false);
    try {
      await deleteChat(chatId);
      toast.success('Чат удалён');
      navigate('/messages');
    } catch (err) {
      console.error('[ChatPage] Delete chat failed:', err);
      toast.error('Ошибка удаления чата');
    }
  };

  const handleClearChat = () => {
    if (!chatId) return;
    setShowChatMenu(false);
    setMessages([]);
    // Clear messages from localStorage
    try {
      const key = `ovora_messages_${chatId}`;
      localStorage.removeItem(key);
    } catch { /* ignore */ }
    toast.success('Переписка очищена');
  };

  const handleBlockUser = () => {
    setShowChatMenu(false);
    toast.error(`${contact?.name || 'Пользователь'} заблокирован`);
  };

  // ── Render helpers ───────────────────────────────────────────────────────────
  const myBubble  = 'bg-[#1978e5] text-white';
  const herBubble = isDark ? 'bg-[#1e2d3d] text-white' : 'bg-[#f0f2f5] text-[#0f172a]';

  if (!contact) {
    return (
      <div className={`fixed inset-0 z-[60] flex items-center justify-center ${isDark ? 'bg-[#0e1621]' : 'bg-white'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-[#1978e5] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-40 flex flex-col pb-0 font-['Sora'] ${isDark ? 'bg-[#0e1621]' : 'bg-white'}`}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 border-b shrink-0 ${ isDark ? 'bg-[#0e1621] border-[#1e2d3d]' : 'bg-white border-[#f0f2f5]' } px-[16px] pt-[20px] pb-[12px]`}>
        <button
          onClick={() => navigate('/messages')}
          className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors ${
            isDark ? 'text-[#8a9bb0] hover:text-white' : 'text-[#6b7280] hover:text-[#0f172a]'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar — синий для водителя-контакта, изумрудный для отправителя-контакта */}
        <div className="relative shrink-0">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              contact.role === 'driver'
                ? isDark ? 'bg-[#1978e5]/20 text-[#5ba3f5]' : 'bg-[#1978e5]/10 text-[#1978e5]'
                : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
            }`}>
              {contact.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          {/* Онлайн-индикатор */}
          {contact.online && (
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${isDark ? 'border-[#0e1621]' : 'border-white'}`} />
          )}
          {/* Иконка роли поверх аватара */}
          <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
            contact.role === 'driver'
              ? isDark ? 'bg-[#1e2d3d] border border-[#1978e5]/40' : 'bg-white border border-[#1978e5]/30'
              : isDark ? 'bg-[#1e2d3d] border border-emerald-500/40' : 'bg-white border border-emerald-500/30'
          }`}>
            {contact.role === 'driver' ? '🚛' : '📦'}
          </div>
        </div>

        {/* Info — адаптивная подпись для каждой роли */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className={`text-[14px] font-bold truncate ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{contact.name}</h2>
            {contact.verified && <Shield className="w-3 h-3 text-emerald-400 shrink-0" />}
          </div>

          {/* Водитель-контакт (текущий пользователь — отправитель): маршрут + рейтинг */}
          {contact.role === 'driver' ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              {contact.sub && (
                <span className={`text-[11px] truncate ${isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]'}`}>{contact.sub}</span>
              )}
              {contact.rating && (
                <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>⭐ {contact.rating}</span>
              )}
            </div>
          ) : (
            /* Отправитель-контакт (текущий пользователь — водитель): груз */
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
              }`}>Отправитель</span>
              {contact.sub && (
                <span className={`text-[11px] truncate ${isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]'}`}>{contact.sub}</span>
              )}
            </div>
          )}
        </div>

        {/* Кнопка действия: маршрут для водителя, телефон для отправителя */}
        {isDriver ? (
          <button
            onClick={() => tripId && navigate(`/trip/${tripId}`)}
            title="Посмотреть поездку"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'text-[#5ba3f5] hover:bg-[#1978e5]/15'
                : 'text-[#1978e5] hover:bg-[#1978e5]/10'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </button>
        ) : (
          <button
            title="Позвонить"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'text-[#6b7f94] hover:bg-white/10'
                : 'text-[#94a3b8] hover:bg-black/5'
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* ⋮ Menu button */}
        <div className="relative" ref={chatMenuRef}>
          <button
            onClick={() => setShowChatMenu(v => !v)}
            title="Действия"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark
                ? 'text-[#8a9bb0] hover:text-white hover:bg-white/10'
                : 'text-[#6b7280] hover:text-[#0f172a] hover:bg-black/5'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown */}
          {showChatMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChatMenu(false)}
              />
              <div
                className="absolute right-0 top-10 z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[180px]"
                style={{
                  background: isDark ? '#1a2738' : '#ffffff',
                  border: isDark ? '1px solid #253347' : '1px solid #e5e7eb',
                }}
              >
                {/* Очистить чат */}
                <button
                  onClick={handleClearChat}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-colors text-left ${
                    isDark ? 'text-[#c8d8e8] hover:bg-white/5' : 'text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  <Eraser className="w-4 h-4 text-[#5ba3f5] shrink-0" />
                  Очистить чат
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: isDark ? '#253347' : '#f0f2f5' }} />

                {/* Заблокировать */}
                <button
                  onClick={handleBlockUser}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-colors text-left ${
                    isDark ? 'text-[#fbbf24] hover:bg-white/5' : 'text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <UserX className="w-4 h-4 shrink-0" />
                  Заблокировать
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: isDark ? '#253347' : '#f0f2f5' }} />

                {/* Удалить чат */}
                <button
                  onClick={handleDeleteChat}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-colors text-left ${
                    isDark ? 'text-[#f87171] hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  Удалить чат
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isMine = msg.from === userRole || msg.from === 'system' && false;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center px-4"
                >
                  <div className={`px-4 py-1.5 text-[11px] font-medium text-center max-w-[85%] ${
                    isDark ? 'bg-[#1e2d3d] text-[#6b7f94]' : 'bg-[#f0f2f5] text-[#6b7280]'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              );
            }

            if (msg.type === 'proposal' && msg.proposal) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4"
                >
                  <ProposalCard
                    proposal={msg.proposal}
                    isDriver={isDriver}
                    isDark={isDark}
                    onAccept={() => handleAccept(msg.proposal!.id)}
                    onReject={() => handleReject(msg.proposal!.id)}
                    onCancel={() => handleCancel(msg.proposal!.id)}
                    onCounter={() => handleCounter(msg.proposal!.id)}
                  />
                </motion.div>
              );
            }

            // Text bubble with swipe actions
            return (
              <SwipeableMessage
                key={msg.id}
                messageId={msg.id}
                isMine={isMine}
                isDark={isDark}
                onDelete={handleDeleteMessage}
                onCopy={() => handleCopyMessage(msg.text || '')}
              >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-2 px-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMine && (
                  <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
                    {contact.avatar
                      ? <img src={contact.avatar} className="w-full h-full object-cover" />
                      : <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-[#1978e5]/20 text-[#1978e5]' : 'bg-[#e6f2f6] text-[#1978e5]'}`}>{contact.name.slice(0,2).toUpperCase()}</div>
                    }
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    onClick={() => {
                      if (!msg.text) return;
                      if (msg.text.startsWith('__IMG__')) {
                        const dataUrl = msg.text.replace(/^__IMG__/, '').replace(/__NAME__.*$/, '');
                        setExpandedImage(dataUrl);
                      } else if (!msg.text.startsWith('__VOICE__') && msg.text.length > 60) {
                        setExpandedMsg(msg);
                      }
                    }}
                    className={`px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${isMine ? myBubble : herBubble} ${msg.text && (msg.text.startsWith('__IMG__') || (!msg.text.startsWith('__VOICE__') && msg.text.length > 60)) ? 'cursor-pointer active:opacity-80' : ''}`}
                  >
                    {msg.text?.startsWith('__VOICE__') ? (() => {
                      const inner = msg.text.replace(/^__VOICE__/, '');
                      const durMatch = inner.match(/__DUR__(\d+)$/);
                      const dur = durMatch ? parseInt(durMatch[1]) : 1;
                      const audioSrc = inner.replace(/__DUR__\d+$/, '');
                      return (
                        <VoiceMessage
                          audioSrc={audioSrc}
                          duration={dur}
                          isMine={isMine}
                          isDark={isDark}
                        />
                      );
                    })() : msg.text?.startsWith('__IMG__') ? (() => {
                      const dataUrl = msg.text.replace(/^__IMG__/, '').replace(/__NAME__.*$/, '');
                      const name = msg.text.replace(/^__IMG__.*__NAME__/, '');
                      return (
                        <div className="flex flex-col gap-1.5 -mx-1">
                          <img src={dataUrl} alt={name} className="max-w-[220px] rounded-xl object-cover" style={{ maxHeight: 180 }} />
                          <span className={`text-[11px] px-1 opacity-70`}>{name}</span>
                        </div>
                      );
                    })() : msg.text}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] px-1 ${isDark ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>
                    <span>{msg.time}</span>
                    {isMine && (msg.read
                      ? <CheckCheck className="w-3 h-3 text-[#1978e5]" />
                      : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </motion.div>
              </SwipeableMessage>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR ──────────────────────────────────────────────────── */}
      <div className={`shrink-0 px-3 py-3 border-t flex flex-col gap-2 ${ isDark ? 'bg-[#0d1521]/90 border-white/5' : 'bg-white/90 border-black/5' }`} style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {/* Sender-only: quick offer button */}
        {!isDriver && (
          <button
            onClick={() => setShowProposalForm(true)}
            className={`w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[13px] font-bold border-2 border-dashed transition-all ${
              isDark
                ? 'border-[#1978e5]/40 text-[#1978e5] hover:bg-[#1978e5]/10'
                : 'border-[#1978e5]/30 text-[#1978e5] hover:bg-[#1978e5]/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            Отправить оферту
          </button>
        )}

        <div className="flex items-end gap-2">
          {/* Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 ${
              isDark ? 'text-[#475569] hover:bg-white/10' : 'text-[#94a3b8] hover:bg-black/5'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileAttach}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />

          {/* Textarea / Recording indicator */}
          <div className={`flex-1 min-w-0 flex items-end rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-[#1978e5]/30 ${
            isDark ? 'bg-[#1a2c32] border-[#253840]' : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}>
            {isVoiceRecording ? (
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className={`text-[13px] font-semibold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                  Запись...
                </span>
                <span className={`text-[13px] font-mono ml-auto ${isDark ? 'text-[#607080]' : 'text-[#94a3b8]'}`}>
                  {`${Math.floor(voiceSeconds / 60)}:${String(voiceSeconds % 60).padStart(2, '0')}`}
                </span>
                <button
                  onMouseDown={e => { e.preventDefault(); stopVoiceRecord(true); }}
                  onTouchStart={e => { e.preventDefault(); stopVoiceRecord(true); }}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Написать сообщение..."
                maxLength={2000}
                className={`flex-1 bg-transparent outline-none text-sm px-3.5 py-2.5 resize-none max-h-24 ${
                  isDark ? 'text-white placeholder-[#475569]' : 'text-[#0f172a] placeholder-[#94a3b8]'
                }`}
                style={{ lineHeight: '1.5' }}
              />
            )}
          </div>

          {/* Send / Mic */}
          {inputText.trim() ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSend}
              disabled={sending}
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white shadow-lg transition-all active:scale-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#2693ff,#1978e5)', boxShadow: '0 4px 14px rgba(25,120,229,.4)' }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          ) : isVoiceRecording ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onMouseUp={() => stopVoiceRecord(false)}
              onTouchEnd={e => { e.preventDefault(); stopVoiceRecord(false); }}
              onContextMenu={handleMicContextMenu}
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white shadow-lg relative"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,.45)' }}
            >
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              <StopCircle className="w-5 h-5 relative z-10" />
            </motion.button>
          ) : (
            <button
              onMouseDown={startVoiceRecord}
              onTouchStart={e => { e.preventDefault(); startVoiceRecord(); }}
              onMouseUp={() => stopVoiceRecord(false)}
              onTouchEnd={e => { e.preventDefault(); stopVoiceRecord(false); }}
              onMouseLeave={() => { if (isVoiceRecording) stopVoiceRecord(false); }}
              onContextMenu={handleMicContextMenu}
              className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 select-none ${
                isDark ? 'text-[#475569] hover:bg-white/10' : 'text-[#94a3b8] hover:bg-black/5'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── FULL-SCREEN IMAGE VIEWER ────────────────────────────────────── */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black"
            onClick={() => setExpandedImage(null)}
          >
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <motion.img
              src={expandedImage}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-full object-contain select-none"
              style={{ touchAction: 'pinch-zoom' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPANDED MESSAGE MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {expandedMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            onClick={() => setExpandedMsg(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-h-[75vh] rounded-t-3xl flex flex-col shadow-2xl ${isDark ? 'bg-[#131f2b]' : 'bg-white'}`}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-[#334155]' : 'bg-[#cbd5e1]'}`} />
              </div>
              {/* Header */}
              <div className={`flex items-center justify-between px-5 pb-3 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <div>
                  <p className={`text-xs font-semibold ${isDark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                    {expandedMsg.from === userRole ? 'Вы' : contact.name}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>{expandedMsg.time}</p>
                </div>
                <button
                  onClick={() => setExpandedMsg(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1e3040] text-[#94a3b8]' : 'bg-[#f1f5f9] text-[#64748b]'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
                  {expandedMsg.text}
                </p>
              </div>
              <div className="h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PROPOSAL FORM ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProposalForm && (
          <ProposalFormModal
            isDark={isDark}
            contact={contact}
            tripId={tripId}
            tripData={tripData} // ✅ Pass trip data
            onClose={() => setShowProposalForm(false)}
            onSend={submitProposalWrapper}
          />
        )}
      </AnimatePresence>
    </div>
  );
}