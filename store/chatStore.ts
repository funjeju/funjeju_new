import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type ChatTab = 'docent' | 'weather';

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  activeTab: ChatTab;
  loading: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setOpen: (open: boolean, tab?: ChatTab) => void;
  setTab: (tab: ChatTab) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  activeTab: 'docent',
  loading: false,
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }],
    })),
  setOpen: (open, tab) => set((s) => ({ isOpen: open, activeTab: tab ?? s.activeTab })),
  setTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));
