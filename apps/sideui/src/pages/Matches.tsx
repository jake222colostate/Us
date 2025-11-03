import { useNavigate } from "react-router-dom";

import { useMatches } from "../hooks/useMatches";
import { formatPercent, formatRelativeTime } from "../lib/format";

export default function Matches() {
  const navigate = useNavigate();
  const { matches, incomingLikes, loading, error } = useMatches();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Your matches</h1>
        <p className="text-muted">
          Creative sparks are flying. Share your favorite shots and start planning a shoot together.
        </p>
      </header>

      {error ? (
        <div className="alert alert--error">{error.message}. Demo data is displayed until we reconnect.</div>
      ) : null}

      <section className="page-card">
        <h2>Active matches</h2>
        <div className="cards-list">
          {matches.map((match) => (
            <article key={match.id} className="list-item">
              <div className="avatar">
                <img
                  src={
                    match.profile.photos?.find((photo) => photo.is_primary)?.url ??
                    match.profile.photos?.[0]?.url ??
                    "https://api.dicebear.com/7.x/thumbs/svg?seed=match"
                  }
                  alt={match.profile.display_name}
                />
              </div>
              <div className="list-item__meta">
                <span className="list-item__title">{match.profile.display_name}</span>
                <span className="list-item__subtitle">
                  Matched {formatRelativeTime(match.match.created_at)}
                  {match.lastMessagePreview ? ` · "${match.lastMessagePreview}"` : ""}
                </span>
              </div>
              <div className="hero-card__cta">
                {match.compatibilityScore ? (
                  <span className="badge">{formatPercent(match.compatibilityScore, 0)} vibe match</span>
                ) : null}
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => navigate(`/chat?thread=${match.threadId ?? match.id}`)}
                >
                  Open chat
                </button>
              </div>
            </article>
          ))}
          {!loading && matches.length === 0 ? (
            <div className="feed-empty">No matches yet. Say hello in the feed or respond to your incoming likes.</div>
          ) : null}
        </div>
      </section>

      <section className="page-card page-card--muted">
        <h2>Likes waiting for you</h2>
        <p className="text-muted text-small">
          You have {incomingLikes.length} like{incomingLikes.length === 1 ? "" : "s"} ready to become matches.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => navigate("/likes")}>Review likes</button>
      </section>
    </div>
  );
}
