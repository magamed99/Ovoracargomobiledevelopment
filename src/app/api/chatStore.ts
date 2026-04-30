/**
 * chatStore.ts
 * API-first chat engine: Supabase KV — основное хранилище.
 * localStorage — кэш для мгновенного отклика UI и оффлайн-fallback.
 * Все мутации → сначала optimistic update в кэш, потом API.
 * v2 - using getCachedUser from authApi
 */

import {
  initChat as apiInitChat,
  sendMessage as apiSendMessage,
  getChatMessages as apiGetMessages,
  getUserChats as apiGetUserChats,
  markChatRead as apiMarkRead,
  updateChatProposal as apiUpdateProposal,
  deleteChatFromDb,
  deleteMessageFromDb,
} from './dataApi';
import { getCachedUser } from './authApi';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  role: 'driver' | 'sender';
  sub: string;
  rating?: number;
  online: boolean;
  verified: boolean;
  email?: string;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'declined' | 'countered';

export interface ChatProposal {
  id: string;
  cargoType: string;
  weight: string;
  volume: string;
  price: string;
  currency: 'TJS' | 'RUB' | 'USD';
  from: string;
  to: string;
  date: string;
  notes: string;
  status: ProposalStatus;
  vehicleType: string;
  tripId?: string;
  senderEmail?: string;
  senderPhone?: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  departureTime?: string;
}

export interface ChatMessage {
  id: string;           // msgId from server (or opt_* for optimistic)
  type: 'text' | 'proposal' | 'system';
  text?: string;
  proposal?: ChatProposal;
  from: 'driver' | 'sender' | 'system';
  senderId: string;
  time: string;         // HH:mm display
  ts: number;           // unix ms
  read: boolean;
}

export interface Chat {
  id: string;           // chatId
  tripId?: string;
  tripRoute?: string;
  tripData?: any;       // Full trip object for proposal form
  contact: ChatContact;
  lastMessage: string;
  lastTime: string;
  lastTs: number;
  unread: number;
  hasProposal: boolean;
  proposalStatus?: ProposalStatus;
}

// ── Cache keys ─────────────────────────────────────────────────────────────────
const CHATS_KEY  = 'ovora_chats_v2';
const msgKey = (id: string) => `ovora_msgs_v2_${id}`;
const CONTACTS_KEY = 'ovora_chat_contacts_v2'; // { [chatId]: ChatContact }

// ── DOM event ─────────────────────────────────────────────────────────────────
function emit() {
  window.dispatchEvent(new CustomEvent('ovora_chat_update'));
}

// ── Local cache helpers ────────────────────────────────────────────────────────
export function getChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getMessages(chatId: string): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(msgKey(chatId)) || '[]'); }
  catch { return []; }
}

function saveChats(chats: Chat[]) {
  const sorted = [...chats].sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  localStorage.setItem(CHATS_KEY, JSON.stringify(sorted));
}

const MSG_CACHE_LIMIT = 200;

function saveMessages(chatId: string, msgs: ChatMessage[]) {
  // Держим только последние MSG_CACHE_LIMIT сообщений — защита от переполнения localStorage
  const capped = msgs.length > MSG_CACHE_LIMIT ? msgs.slice(-MSG_CACHE_LIMIT) : msgs;
  localStorage.setItem(msgKey(chatId), JSON.stringify(capped));
}

function saveContact(chatId: string, contact: ChatContact) {
  try {
    const map = JSON.parse(localStorage.getItem(CONTACTS_KEY) || '{}');
    map[chatId] = contact;
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(map));
  } catch {}
}

function loadContact(chatId: string): ChatContact | null {
  try {
    const map = JSON.parse(localStorage.getItem(CONTACTS_KEY) || '{}');
    return map[chatId] || null;
  } catch { return null; }
}

function nowTime() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ── Upsert chat in local cache ────────────────────────────────────────────────
function _upsertLocalChat(patch: Partial<Chat> & { id: string }) {
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === patch.id);
  if (idx >= 0) {
    chats[idx] = { ...chats[idx], ...patch };
  } else {
    chats.unshift(patch as Chat);
  }
  saveChats(chats);
}

// ── Map server message → ChatMessage ─────────────────────────────────────────
function _mapServerMsg(m: any, myRole: string, myEmail: string): ChatMessage {
  let fromRole: 'driver' | 'sender' | 'system' = m.from || 'sender';
  if (m.type === 'system') fromRole = 'system';
  return {
    id: m.msgId || m.id,
    type: m.type || 'text',
    text: m.text || undefined,
    proposal: m.proposal || undefined,
    from: fromRole,
    senderId: m.senderId,
    time: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : (m.time || nowTime()),
    ts: m.ts || new Date(m.createdAt || Date.now()).getTime(),
    read: m.read ?? true,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Initialize a chat room.
 * Saves contact to cache, calls API to create/update chatmeta on server.
 */
export async function initChatRoom(
  chatId: string,
  contact: ChatContact,
  tripId?: string,
  tripRoute?: string,
  tripData?: any,
): Promise<Chat> {
  // Save contact locally
  saveContact(chatId, contact);

  const currentUser = getCachedUser();
  const myEmail = currentUser?.email || 'guest';
  const myRole  = sessionStorage.getItem('userRole') || 'sender';
  const myName  = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || (myRole === 'driver' ? 'Водитель' : 'Отправитель')
    : (myRole === 'driver' ? 'Водитель' : 'Отправитель');

  // Optimistic: create chat in local cache if not present
  const existing = getChats().find(c => c.id === chatId);
  if (!existing) {
    const chat: Chat = {
      id: chatId,
      tripId,
      tripRoute,
      tripData,
      contact,
      lastMessage: 'Новый чат',
      lastTime: nowTime(),
      lastTs: Date.now(),
      unread: 0,
      hasProposal: false,
    };
    _upsertLocalChat(chat);
    emit();
  }

  // API call (non-blocking)
  // Store contact info under BOTH emails so each participant can resolve the other
  const myInfo = {
    id: currentUser?.id || myEmail,
    name: myName,
    avatar: currentUser?.avatar || '',
    role: myRole,
    sub: '',
    online: true,
    verified: false,
    email: myEmail,
  };
  const otherInfo = {
    id: contact.id,
    name: contact.name,
    avatar: contact.avatar,
    role: contact.role,
    sub: contact.sub,
    rating: contact.rating,
    online: contact.online,
    verified: contact.verified,
    email: contact.email,
  };
  const contactInfo: Record<string, any> = {
    [myEmail]: otherInfo,                          // initiator sees contact's info
    [contact.email || contact.id]: myInfo,         // contact sees initiator's info
  };
  const senderInfo: Record<string, any> = {
    [contact.email || contact.id]: myInfo,
    [myEmail]: otherInfo,
  };

  apiInitChat(
    chatId,
    [myEmail, contact.email || contact.id].filter(Boolean),
    tripId,
    tripRoute,
    contactInfo,
    senderInfo,
    tripData, // ✅ Pass tripData to API
  ).catch(err => console.warn('[chatStore] initChat API error:', err));

  return existing || getChats().find(c => c.id === chatId)!;
}

/**
 * Send a message. Optimistic insert → then API.
 */
export async function pushMessage(
  chatId: string,
  msg: ChatMessage,
): Promise<ChatMessage[]> {
  const currentUser = getCachedUser();
  const myEmail = currentUser?.email || 'guest';
  const myRole  = sessionStorage.getItem('userRole') || 'sender';
  const myName  = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || (myRole === 'driver' ? 'Водитель' : 'Отправитель')
    : (myRole === 'driver' ? 'Водитель' : 'Отправитель');
  const contact = loadContact(chatId);

  // 1. Optimistic insert into local cache
  const msgs = getMessages(chatId);
  const updated = [...msgs, msg];
  saveMessages(chatId, updated);

  // 2. Update chat preview in local cache
  const preview = msg.type === 'proposal' ? '📋 Новая оферта на перевозку' : (msg.text || '');
  _upsertLocalChat({
    id: chatId,
    lastMessage: preview,
    lastTime: msg.time,
    lastTs: msg.ts,
    ...(msg.type === 'proposal' ? { hasProposal: true, proposalStatus: 'pending' } : {}),
  });
  emit();

  // 3. Sync to API
  const participants = contact?.email
    ? [myEmail, contact.email].filter(Boolean)
    : undefined;

  try {
    const serverMsg = await apiSendMessage({
      chatId,
      senderId: myEmail,
      senderName: myName,
      text: msg.text,
      type: msg.type,
      proposal: msg.proposal,
      from: msg.from,
      participants,
    });
    // ✅ Replace optimistic ID with server-assigned msgId
    // This prevents duplication when fetchMessages() merges server + local messages
    if (serverMsg?.msgId && serverMsg.msgId !== msg.id) {
      const currentMsgs = getMessages(chatId);
      const confirmedMsgs = currentMsgs.map(m =>
        m.id === msg.id ? { ...m, id: serverMsg.msgId } : m
      );
      saveMessages(chatId, confirmedMsgs);
      // No emit — avoid extra re-render; next poll will show consistent state
    }
  } catch (err) {
    console.warn('[chatStore] sendMessage API error:', err);
    // Keep optimistic message — offline mode
  }

  return updated;
}

/**
 * Fetch messages from API, merge with local cache (server is source of truth).
 */
export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const myEmail = getCachedUser()?.email;
  if (!myEmail) return getMessages(chatId);
  const myRole  = sessionStorage.getItem('userRole') || 'sender';

  try {
    const serverMsgs = await apiGetMessages(chatId);
    if (serverMsgs && serverMsgs.length > 0) {
      const mapped = serverMsgs.map((m: any) => _mapServerMsg(m, myRole, myEmail));

      // ── Merge: keep local optimistic messages not yet confirmed by server ──
      // This prevents proposals/messages from disappearing during API latency
      const localMsgs = getMessages(chatId);
      const serverIds = new Set(mapped.map((m: ChatMessage) => m.id));
      // ✅ Also collect proposal IDs from server to deduplicate optimistic proposals
      const serverProposalIds = new Set(
        mapped.filter((m: ChatMessage) => m.proposal?.id).map((m: ChatMessage) => m.proposal!.id)
      );
      const pendingLocal = localMsgs.filter(m => {
        if (serverIds.has(m.id)) return false; // already matched by ID
        if (m.proposal?.id && serverProposalIds.has(m.proposal.id)) return false; // proposal already on server
        return true;
      });
      const merged = [...mapped, ...pendingLocal].sort((a, b) => a.ts - b.ts);

      saveMessages(chatId, merged);
      emit();
      return merged;
    }
  } catch (err) {
    console.warn('[chatStore] getChatMessages API error:', err);
  }

  // Fallback: local cache
  return getMessages(chatId);
}

/**
 * Fetch chats list from API. Server is source of truth.
 */
export async function fetchChats(): Promise<Chat[]> {
  const currentUser = getCachedUser();
  if (!currentUser?.email) return getChats();

  const email = currentUser.email;
  const myRole = sessionStorage.getItem('userRole') || 'sender';

  try {
    const serverChats: any[] = await apiGetUserChats(email);
    if (Array.isArray(serverChats) && serverChats.length === 0) {
      // Server confirmed empty — only clear if local also has no chats,
      // to avoid wiping data on auth errors that return an empty array.
      const local = getChats();
      if (local.length === 0) return [];
      // Keep local chats — server might have returned empty due to session mismatch
      return local;
    }
    if (serverChats && serverChats.length > 0) {
      // Load saved contacts map for enrichment
      const contactsMap: Record<string, ChatContact> = JSON.parse(
        localStorage.getItem(CONTACTS_KEY) || '{}'
      );

      const mapped: Chat[] = serverChats.map((sc: any) => {
        // Try to get contact from saved map, or reconstruct from contactInfo
        const contact: ChatContact = contactsMap[sc.chatId] || (() => {
          const ci = sc.contactInfo?.[email];
          if (ci) return ci as ChatContact;

          // Try senderInfo — find the other participant's name/role
          const otherEmail = (sc.participants || []).find((p: string) => p !== email);
          const otherFromSender = sc.senderInfo?.[email] || sc.senderInfo?.[otherEmail || ''];
          if (otherFromSender?.name) {
            return {
              id: otherFromSender.email || otherEmail || 'unknown',
              name: otherFromSender.name,
              avatar: otherFromSender.avatar || '',
              role: (otherFromSender.role as 'driver' | 'sender') || (myRole === 'driver' ? 'sender' : 'driver'),
              sub: sc.tripRoute || '',
              online: false,
              verified: false,
              email: otherFromSender.email || otherEmail,
            } as ChatContact;
          }

          // Final fallback — generic label, never use tripRoute as name
          return {
            id: 'unknown',
            name: myRole === 'driver' ? 'Отправитель' : 'Водитель',
            avatar: '',
            role: myRole === 'driver' ? 'sender' : 'driver',
            sub: sc.tripRoute || 'Маршрут',
            online: false,
            verified: false,
          } as ChatContact;
        })();

        const lastTs = sc.lastMessageAt ? new Date(sc.lastMessageAt).getTime() : 0;
        return {
          id: sc.chatId,
          tripId: sc.tripId,
          tripRoute: sc.tripRoute,
          tripData: sc.tripData || undefined, // ✅ Include tripData from server
          contact,
          lastMessage: sc.lastMessage || 'Новый чат',
          lastTime: lastTs
            ? new Date(sc.lastMessageAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : nowTime(),
          lastTs,
          unread: sc.unread || 0,
          hasProposal: sc.hasProposal || false,
          proposalStatus: sc.proposalStatus || undefined,
        } as Chat;
      });

      // Merge: keep local-only chats that aren't on server yet (created offline)
      // Exclude any demo/fake chats from local cache
      const serverIds = new Set(mapped.map(c => c.id));
      const localOnly = getChats().filter(c =>
        !serverIds.has(c.id) && !c.id.startsWith('demo_')
      );
      const merged = [...mapped, ...localOnly];
      saveChats(merged);
      emit();
      return merged;
    }
  } catch (err) {
    console.warn('[chatStore] getUserChats API error:', err);
  }

  return getChats();
}

/**
 * Mark messages as read (local + API).
 */
export async function markRead(chatId: string) {
  const email = getCachedUser()?.email || 'guest';

  // Local update
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === chatId);
  if (idx >= 0 && chats[idx].unread > 0) {
    chats[idx].unread = 0;
    saveChats(chats);
    emit();
  }

  // API (non-blocking)
  apiMarkRead(chatId, email).catch(err =>
    console.warn('[chatStore] markChatRead API error:', err)
  );
}

/**
 * Update proposal status: optimistic local + API.
 */
export async function updateProposalStatus(
  chatId: string,
  proposalId: string,
  status: ProposalStatus,
): Promise<ChatMessage[]> {
  const myEmail = getCachedUser()?.email || 'guest';

  // 1. Local optimistic update
  const msgs = getMessages(chatId).map(m => {
    if (m.type === 'proposal' && m.proposal?.id === proposalId) {
      return { ...m, proposal: { ...m.proposal!, status } };
    }
    return m;
  });
  saveMessages(chatId, msgs);

  // 2. Update chat preview locally
  const preview = status === 'accepted'
    ? '✅ Оферта принята'
    : status === 'declined'
    ? '🔄 Оферта отменена отправителем'
    : '❌ Оферта отклонена';
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === chatId);
  if (idx >= 0) {
    chats[idx].proposalStatus = status;
    chats[idx].lastMessage = preview;
    chats[idx].lastTime = nowTime();
    chats[idx].lastTs = Date.now();
    saveChats(chats);
  }
  emit();

  // 3. API call
  apiUpdateProposal(chatId, proposalId, status, myEmail).catch(err =>
    console.warn('[chatStore] updateChatProposal API error:', err)
  );

  return msgs;
}

/**
 * Delete chat from DB (hard delete)!
 * ✅ Удаляет из БД Supabase
 * ✅ Удаляет из localStorage (кэш)
 * ✅ НЕ вернётся при синхронизации!
 */
export async function deleteChat(chatId: string): Promise<void> {
  // 1. Optimistic: Remove from local cache immediately
  const originalChats = getChats();
  const filtered = originalChats.filter((c: Chat) => c.id !== chatId);
  localStorage.setItem(CHATS_KEY, JSON.stringify(filtered));

  // Remove messages from cache
  localStorage.removeItem(msgKey(chatId));

  // Emit update event for UI
  emit();

  // 2. API: Delete from database (hard delete!)
  try {
    await deleteChatFromDb(chatId);
  } catch (err) {
    console.error(`[chatStore] Failed to delete chat from DB:`, err);
    // Rollback: restore original chats array
    localStorage.setItem(CHATS_KEY, JSON.stringify(originalChats));
    emit();
    throw err;
  }
}

/**
 * Delete a single message from chat (hard delete from DB)!
 * ✅ Удаляет из БД Supabase
 * ✅ Удаляет из localStorage (кэш)
 */
export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  // 1. Optimistic: Remove from local cache
  const originalMsgs = getMessages(chatId);
  const msgs = originalMsgs.filter(m => m.id !== messageId);
  saveMessages(chatId, msgs);

  // Update last message in chat list if needed
  const chats = getChats();
  const chatIdx = chats.findIndex(c => c.id === chatId);
  if (chatIdx !== -1 && msgs.length > 0) {
    const lastMsg = msgs[msgs.length - 1];
    chats[chatIdx].lastMessage = lastMsg.text?.replace(/^__IMG__.*$/, '🖼 Фото') || '';
    chats[chatIdx].lastTs = Date.now();
    saveChats(chats);
  }

  // Emit update event
  emit();

  // 2. API: Delete from database
  try {
    await deleteMessageFromDb(chatId, messageId);
  } catch (err) {
    console.error(`[chatStore] Failed to delete message from DB:`, err);
    // Rollback on failure
    saveMessages(chatId, originalMsgs);
    emit();
    throw err;
  }
}