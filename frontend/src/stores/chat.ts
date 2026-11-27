import { create } from "zustand";

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatState = {
  open: boolean;
  pending: boolean;
  error: string | null;
  messages: ChatMessage[];
  toggle: () => void;
  close: () => void;
  setPending: (pending: boolean) => void;
  setError: (error: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  open: false,
  pending: false,
  error: null,
  messages: [],
  toggle: () => set((state) => ({ open: !state.open, error: null })),
  close: () => set({ open: false }),
  setPending: (pending) => set({ pending }),
  setError: (error) => set({ error, pending: false }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message], error: null })),
  clear: () => set({ messages: [], error: null }),
}));
