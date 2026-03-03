import { create } from 'zustand';
import { Message, Conversation } from '../types';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversation: string | null;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, receiverId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversation: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock conversations
      const mockConversations: Conversation[] = [
        {
          id: 'conv1',
          participants: ['currentUser', 'user1'],
          lastMessage: {
            id: 'msg1',
            senderId: 'user1',
            receiverId: 'currentUser',
            conversationId: 'conv1',
            text: 'Когда выезжаете?',
            read: false,
            createdAt: new Date().toISOString(),
          },
          unreadCount: 1,
          updatedAt: new Date().toISOString(),
        },
      ];

      set({ conversations: mockConversations, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: 'msg1',
          senderId: 'user1',
          receiverId: 'currentUser',
          conversationId,
          text: 'Здравствуйте! Интересует ваша поездка',
          read: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg2',
          senderId: 'currentUser',
          receiverId: 'user1',
          conversationId,
          text: 'Здравствуйте! Да, есть места',
          read: true,
          createdAt: new Date(Date.now() - 3000000).toISOString(),
        },
        {
          id: 'msg3',
          senderId: 'user1',
          receiverId: 'currentUser',
          conversationId,
          text: 'Когда выезжаете?',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];

      set(state => ({
        messages: { ...state.messages, [conversationId]: mockMessages },
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendMessage: async (conversationId, text, receiverId) => {
    try {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'currentUser',
        receiverId,
        conversationId,
        text,
        read: false,
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), newMessage],
        },
      }));

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      throw error;
    }
  },

  setActiveConversation: (id) => set({ activeConversation: id }),

  markAsRead: async (conversationId) => {
    try {
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (error) {
      throw error;
    }
  },
}));
