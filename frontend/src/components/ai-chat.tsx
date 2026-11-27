import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { ChatMarkdown } from "@/components/chat-markdown";
import { ApiError } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { aiApi } from "@/lib/queries";
import { currentTableContext } from "@/lib/table-context";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat";

const SUGGESTIONS = ["What's moving today?", "Any watchlist risks?", "Which names look cheap?"];

export function AiChat() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const open = useChatStore((state) => state.open);
  const pending = useChatStore((state) => state.pending);
  const error = useChatStore((state) => state.error);
  const messages = useChatStore((state) => state.messages);
  const toggle = useChatStore((state) => state.toggle);
  const close = useChatStore((state) => state.close);
  const addMessage = useChatStore((state) => state.addMessage);
  const setPending = useChatStore((state) => state.setPending);
  const setError = useChatStore((state) => state.setError);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setDraft("");
    const history = [...useChatStore.getState().messages, { role: "user" as const, content }];
    addMessage({ role: "user", content });
    setPending(true);
    try {
      const context = currentTableContext(pathname);
      const { reply } = await aiApi.chat({ ...context, messages: history });
      addMessage({ role: "assistant", content: reply });
      setPending(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assistant is unavailable right now.");
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col items-end gap-3",
        isDemoMode ? "right-20 bottom-5" : "right-5 bottom-5",
      )}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto glass flex h-[min(70vh,32rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">Tickerly assistant</p>
                <p className="text-[11px] text-white/40">Uses the table in front of you · not advice</p>
              </div>
              <button
                type="button"
                aria-label="Close assistant"
                onClick={close}
                className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2">
              {messages.length === 0 ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-white/55">
                    Ask about movers, the screener, or names on your watchlist.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/70 hover:text-white"
                        onClick={() => void send(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed", {
                      "ml-auto bg-white text-zinc-950": message.role === "user",
                      "bg-white/8 text-white/90": message.role === "assistant",
                    })}
                  >
                    {message.role === "assistant" ? <ChatMarkdown text={message.content} /> : message.content}
                  </div>
                ))
              )}
              {pending ? <p className="text-xs text-white/40">Reading the table…</p> : null}
              {error ? <p className="text-xs text-red-300">{error}</p> : null}
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about these names"
                className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Send"
                className="grid size-11 place-items-center rounded-full bg-white text-zinc-950 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={toggle}
        className="pointer-events-auto grid size-12 place-items-center rounded-full bg-white text-[#0a0518] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  );
}
