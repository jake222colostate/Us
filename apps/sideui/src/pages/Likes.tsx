import { useMatches } from "../hooks/useMatches";
import { formatRelativeTime } from "../lib/format";
import { useToast } from "../hooks/use-toast";

export default function Likes() {
  const { incomingLikes, outgoingLikes, respondToLike, loading, error } = useMatches();
  const { push } = useToast();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Your likes</h1>
        <p className="text-muted">
          Celebrate the people who already love your work and keep an eye on the creatives you’ve sent hearts to.
        </p>
      </header>

      {error ? (
        <div className="alert alert--error">{error.message}. Showing demo data until the connection recovers.</div>
      ) : null}

      <section className="section-grid section-grid--two">
        <div className="page-card">
          <h2>Incoming likes</h2>
          <p className="text-muted text-small">Return the love and unlock a chat instantly.</p>
          <div className="cards-list">
            {incomingLikes.map((like) => (
              <article key={like.id} className="list-item">
                <div className="avatar">
                  <img
                    src={
                      like.profile.photos?.find((photo) => photo.is_primary)?.url ??
                      like.profile.photos?.[0]?.url ??
                      "https://api.dicebear.com/7.x/thumbs/svg?seed=match"
                    }
                    alt={like.profile.display_name}
                  />
                </div>
                <div className="list-item__meta">
                  <span className="list-item__title">{like.profile.display_name}</span>
                  <span className="list-item__subtitle">
                    Sent {formatRelativeTime(like.receivedAt)} · {like.heart.kind === "big" ? "Big like" : "Like"}
                  </span>
                </div>
                <div className="hero-card__cta">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={async () => {
                      await respondToLike(like.id, "accept");
                      push({ title: "It’s a match!", description: `You and ${like.profile.display_name} can now chat.`, variant: "success" });
                    }}
                  >
                    Match
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={async () => {
                      await respondToLike(like.id, "decline");
                      push({ title: "Like dismissed", variant: "info" });
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            ))}
            {!loading && incomingLikes.length === 0 ? (
              <div className="feed-empty">No new likes yet. Stay active in the feed to boost visibility.</div>
            ) : null}
          </div>
        </div>

        <div className="page-card">
          <h2>Outgoing likes</h2>
          <p className="text-muted text-small">See who you’ve already reached out to.</p>
          <div className="cards-list">
            {outgoingLikes.map((like) => (
              <article key={like.id} className="list-item">
                <div className="avatar">
                  <img
                    src={
                      like.profile.photos?.find((photo) => photo.is_primary)?.url ??
                      like.profile.photos?.[0]?.url ??
                      "https://api.dicebear.com/7.x/thumbs/svg?seed=outgoing"
                    }
                    alt={like.profile.display_name}
                  />
                </div>
                <div className="list-item__meta">
                  <span className="list-item__title">{like.profile.display_name}</span>
                  <span className="list-item__subtitle">Sent {formatRelativeTime(like.receivedAt)}</span>
                </div>
                <span className="badge">{like.heart.kind === "big" ? "Big like" : "Like"}</span>
              </article>
            ))}
            {!loading && outgoingLikes.length === 0 ? (
              <div className="feed-empty">You haven’t sent any likes. Explore the feed to start a connection.</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
