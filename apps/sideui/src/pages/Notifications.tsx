import { useNotifications } from "../hooks/useNotifications";
import { formatRelativeTime } from "../lib/format";

export default function Notifications() {
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Notifications</h1>
        <p className="text-muted">Stay up to date with your matches, messages, and safety tips.</p>
        <div className="hero-card__cta">
          <button type="button" className="btn btn--ghost" onClick={markAllAsRead} disabled={notifications.length === 0}>
            Mark all as read
          </button>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error.message}</div> : null}

      <section className="page-card">
        {loading && notifications.length === 0 ? <p className="text-muted">Loading notifications…</p> : null}
        <div className="table-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card${notification.read ? "" : " unread"}`}
            >
              <div className="notification-icon">
                {notification.kind === "match" ? "💞" : notification.kind === "message" ? "💬" : "✨"}
              </div>
              <div>
                <strong>{notification.title}</strong>
                <p className="text-small text-muted">{notification.body}</p>
                <p className="text-small text-muted">{formatRelativeTime(notification.createdAt)}</p>
              </div>
              {!notification.read ? (
                <button type="button" className="btn btn--secondary" onClick={() => markAsRead(notification.id)}>
                  Mark read
                </button>
              ) : null}
            </article>
          ))}
          {!loading && notifications.length === 0 ? (
            <div className="feed-empty">No notifications yet. Likes, matches, and safety updates will appear here.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
