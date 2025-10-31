import { Link } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useMatches } from "../hooks/useMatches";
import { formatRelativeTime } from "../lib/format";

export default function Index() {
  const { profile } = useProfile();
  const { posts } = useFeed();
  const { matches, incomingLikes } = useMatches();

  const highlighted = posts.slice(0, 2);

  return (
    <div className="page">
      <section className="page-card hero-card">
        <h1>Bring your story to life side-by-side</h1>
        <p className="text-muted">
          Compare your photos with a potential match in seconds. Build chemistry with visual conversations
          designed for creatives.
        </p>
        <div className="hero-card__cta">
          <Link to="/feed" className="btn btn--primary">
            Open discovery feed
          </Link>
          <Link to="/matches" className="btn btn--secondary">
            View matches
          </Link>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <strong>{matches.length}</strong>
          <span>Active matches</span>
        </div>
        <div className="stat-card">
          <strong>{incomingLikes.length}</strong>
          <span>New likes waiting</span>
        </div>
        <div className="stat-card">
          <strong>{profile?.radius_km ?? 25} km</strong>
          <span>Discovery radius</span>
        </div>
      </section>

      <section className="page-card">
        <h2>Spotlight</h2>
        <p className="text-muted text-small">A quick peek at creatives ready to match right now.</p>
        <div className="feed-grid">
          {highlighted.map((post) => (
            <article key={post.id} className="list-item">
              <div className="avatar">
                <img src={post.photo_url} alt={post.profile?.display_name ?? "Potential match"} loading="lazy" />
              </div>
              <div className="list-item__meta">
                <span className="list-item__title">{post.profile?.display_name ?? "Potential match"}</span>
                <span className="list-item__subtitle">Updated {formatRelativeTime(post.created_at)}</span>
              </div>
              <Link to="/feed" className="btn btn--ghost" aria-label="Open feed to view profile">
                View
              </Link>
            </article>
          ))}
          {highlighted.length === 0 ? (
            <div className="feed-empty">
              No one in the spotlight yet. Head to your feed to discover creatives nearby.
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-card page-card--muted">
        <h2>Ready for your next shoot?</h2>
        <p className="text-muted">
          Keep your profile fresh with a curated gallery and update preferences to stay aligned with your dream
          match.
        </p>
        <div className="hero-card__cta">
          <Link to="/profile/edit" className="btn btn--secondary">
            Refresh profile
          </Link>
          <Link to="/settings" className="btn btn--ghost">
            Tune discovery settings
          </Link>
        </div>
      </section>
    </div>
  );
}
