"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

const GREETINGS = [
  "hey, what’s up",
  "yo, what’s going on",
  "hey, what did you need",
  "sup",
  "yo",
  "hey, how’s it going",
  "what’s up",
  "hey, tell me what’s up",
  "yo, what’s on your mind",
  "hey",
];

export function Chat() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingPulse, setTypingPulse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setMessages([{ role: "assistant", content: greeting }]);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, busy]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter(
            (m, i) => !(i === 0 && m.role === "assistant"),
          ),
        }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text();
        throw new Error(msg || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const copy = [...current];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return copy;
        });
      }
    } catch (err) {
      setMessages((current) => {
        const last = current[current.length - 1];
        return last?.role === "assistant" && !last.content
          ? current.slice(0, -1)
          : current;
      });
      setError(
        err instanceof Error ? err.message : "Something broke. Shocking.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <main className="intro-screen">
        <div className="intro-orbit intro-orbit-one" aria-hidden="true" />
        <div className="intro-orbit intro-orbit-two" aria-hidden="true" />
        <section className="intro-content">
          <span className="intro-mark" aria-hidden="true">
            f
          </span>
          <h1 className="intro-title">
            Fred<span>,</span>
          </h1>
          <p className="intro-caption">hes that nigga</p>
          <button
            type="button"
            className="intro-start"
            onClick={() => setStarted(true)}
          >
            press to start
            <span aria-hidden="true">↗</span>
          </button>
        </section>
        <p className="intro-footer">a little chat, no big deal</p>
      </main>
    );
  }

  return (
    <div className="chat-screen mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-6">
      <header className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-white shadow-[0_6px_18px_var(--accent-shadow)]">
            f
          </span>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              fred
            </h1>
            <p className="text-[11px] text-[var(--mute)]">hes that nigga</p>
          </div>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-medium text-[var(--mute)] shadow-sm">
          <span
            className={`size-1.5 rounded-full ${busy ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--online)]"}`}
          />
          {busy ? "typing" : "here"}
        </p>
      </header>

      <div ref={scroller} className="flex-1 space-y-6 overflow-y-auto py-8">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`chat-message flex flex-col ${message.role === "user" ? "items-end pl-12 sm:pl-24" : "items-start pr-8"}`}
          >
            <p className="mb-2 px-1 text-[11px] font-medium text-[var(--mute)]">
              {message.role === "user" ? "you" : "fred"}
            </p>
            <p
              className={`chat-bubble whitespace-pre-wrap text-[15px] leading-7 ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
            >
              {message.content ||
                (busy ? (
                  <span
                    className="typing-dots"
                    role="status"
                    aria-label="fred is typing"
                  >
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  ""
                ))}
            </p>
          </article>
        ))}
      </div>

      {error ? (
        <p className="mb-3 text-[13px] text-[var(--mute)]">{error}</p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className={`chat-composer mb-5 flex items-center gap-3 ${input ? `chat-composer-active ${typingPulse ? "chat-composer-pulse-a" : "chat-composer-pulse-b"}` : ""}`}
      >
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTypingPulse((pulse) => !pulse);
          }}
          placeholder="say something..."
          aria-label="Message Fred"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--mute)]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
          className="send-button flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-medium text-white shadow-[0_6px_18px_var(--accent-shadow)] transition disabled:cursor-not-allowed disabled:bg-[var(--button-disabled)] disabled:shadow-none"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
