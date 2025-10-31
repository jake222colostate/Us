import { Link } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { formatDate, formatRelativeTime } from "../lib/format";

export default function Profile() {
  const { profile, loading } = useProfile();

  if (loading && !profile) {
    return (
      <div className="page">
        <div className="page-card" aria-busy="true">
          <p className="text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="page-card">
          <h1>No profile yet</h1>
          <p className="text-muted">Complete onboarding to unlock your personalized feed.</p>
          <Link to="/onboarding" className="btn btn--primary">
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{profile.display_name}</h1>
        <p className="text-muted">
          Member since {formatDate(profile.created_at)} · Last updated {formatRelativeTime(profile.updated_at)}
        </p>
        <div className="hero-card__cta">
          <Link to="/profile/edit" className="btn btn--secondary">
            Edit profile
          </Link>
          <Link to="/settings" className="btn btn--ghost">
            Discovery settings
          </Link>
        </div>
      </header>

      <section className="page-card">
        <h2>About</h2>
        <p className="text-muted">{profile.bio ?? "Tell others what inspires your photography."}</p>
        <div className="tag-list">
          {profile.gender ? <span className="tag">{profile.gender}</span> : null}
          {profile.looking_for ? <span className="tag">Looking for {profile.looking_for}</span> : null}
          <span className="tag">Radius {profile.radius_km} km</span>
        </div>
      </section>

      <section className="page-card">
        <h2>Gallery</h2>
        <div className="photo-grid">
          {profile.photo_urls.map((url, index) => (
            <figure key={url}>
              <img src={url} alt={`Gallery item ${index + 1}`} loading="lazy" />
              <figcaption>Shot #{index + 1}</figcaption>
            </figure>
          ))}
          {profile.photo_urls.length === 0 ? (
            <div className="feed-empty">No photos yet. Add at least one to shine in the feed.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
