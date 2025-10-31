import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <div className="page-card page-card--muted">
        <h1>We lost that page</h1>
        <p className="text-muted">The link may be outdated, but your matches are waiting.</p>
        <div className="hero-card__cta">
          <Link to="/" className="btn btn--primary">
            Return home
          </Link>
          <Link to="/feed" className="btn btn--ghost">
            Explore feed
          </Link>
        </div>
      </div>
    </div>
  );
}
