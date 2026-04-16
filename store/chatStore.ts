import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  loading: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  loading: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }],
    })),
  setOpen: (open) => set({ isOpen: open }),
  setLoading: (loading) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));
