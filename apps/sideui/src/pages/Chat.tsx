import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { useChat } from "../hooks/useChat";
import { formatRelativeTime } from "../lib/format";

export default function Chat() {
  const { profile } = useProfile();
  const [params, setParams] = useSearchParams();
  const initialThread = params.get("thread");
  const {
    threads,
    messages,
    activeThreadId,
    selectThread,
    sendMessage,
    loadingThreads,
    loadingMessages,
    error,
  } = useChat(profile?.user_id, initialThread);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (initialThread && initialThread !== activeThreadId) {
      selectThread(initialThread);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialThread]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeThreadId || !draft.trim()) return;
    await sendMessage(activeThreadId, draft.trim());
    setDraft("");
  };

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
    const next = new URLSearchParams(params);
    next.set("thread", threadId);
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Chats</h1>
        <p className="text-muted">Keep the energy flowing with collaborative planning and shared inspiration.</p>
      </header>

      {error ? <div className="alert alert--error">{error.message}</div> : null}

      <div className="chat-layout">
        <aside className="page-card">
          <h2>Threads</h2>
          {loadingThreads && threads.length === 0 ? <p className="text-muted">Loading your conversations…</p> : null}
          <div className="chat-threads">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`chat-thread${thread.id === activeThreadId ? " active" : ""}`}
                onClick={() => handleSelectThread(thread.id)}
              >
                <div className="avatar">
                  <img
                    src={
                      thread.partner.photos?.find((photo) => photo.is_primary)?.url ??
                      thread.partner.photos?.[0]?.url ??
                      "https://api.dicebear.com/7.x/thumbs/svg?seed=chat"
                    }
                    alt={thread.partner.display_name}
                  />
                </div>
                <div className="chat-thread__meta">
                  <span className="chat-thread__title">{thread.partner.display_name}</span>
                  {thread.lastMessage ? (
                    <span className="chat-thread__preview">{thread.lastMessage.body}</span>
                  ) : (
                    <span className="chat-thread__preview">Share your first idea!</span>
                  )}
                </div>
                {thread.unreadCount > 0 ? <span className="chat-unread">{thread.unreadCount}</span> : null}
              </button>
            ))}
            {!loadingThreads && threads.length === 0 ? (
              <div className="feed-empty">Matches appear here once you both say yes.</div>
            ) : null}
          </div>
        </aside>

        <section className="page-card chat-window">
          {activeThread ? (
            <>
              <header className="page-header">
                <h2>{activeThread.partner.display_name}</h2>
                <p className="text-muted text-small">
                  Match created {formatRelativeTime(activeThread.createdAt)} · {activeThread.unreadCount} unread
                </p>
              </header>

              <div className="message-list" aria-busy={loadingMessages}>
                {messages.map((message) => (
                  <div key={message.id} className={`message-row${message.isMine ? " mine" : ""}`}>
                    <div className="message-bubble">
                      <span>{message.body}</span>
                      <div className="message-time">{formatRelativeTime(message.sentAt)}</div>
                    </div>
                  </div>
                ))}
                {!loadingMessages && messages.length === 0 ? (
                  <div className="feed-empty">Start the conversation by sharing a concept or reference photo.</div>
                ) : null}
              </div>

              <form className="message-composer" onSubmit={handleSubmit}>
                <textarea
                  placeholder="Send a message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="feed-empty">Select a match on the left to start chatting.</div>
          )}
        </section>
      </div>
    </div>
  );
}
