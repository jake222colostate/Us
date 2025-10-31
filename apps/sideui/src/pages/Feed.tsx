import FeedCard from "../components/FeedCard";
import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useToast } from "../hooks/use-toast";

export default function Feed() {
  const { profile } = useProfile();
  const { posts, loading, error, hasMore, loadMore, reactToPost } = useFeed();
  const { push } = useToast();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Discover creatives nearby</h1>
        <p className="text-muted">Compare your energy with potential matches and start a conversation instantly.</p>
      </header>

      {error ? (
        <div className="alert alert--error">
          Something went wrong loading your feed: {error.message}. We applied demo data so you can keep exploring.
        </div>
      ) : null}

      <div className="feed-grid">
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            currentUser={profile}
            onReact={async (postId, action) => {
              await reactToPost(postId, action);
              push({
                title: action === "pass" ? "Skipped" : action === "like" ? "Like sent" : "Big like sent",
                description:
                  action === "pass"
                    ? "We’ll show you someone new."
                    : "We’ve let them know you’re interested!",
                variant: action === "pass" ? "info" : "success",
              });
            }}
          />
        ))}
        {!loading && posts.length === 0 ? (
          <div className="feed-empty">No matches yet. Update your filters or widen your discovery radius.</div>
        ) : null}
      </div>

      <div className="page-card page-card--muted">
        <div className="hero-card__cta">
          {hasMore ? (
            <button type="button" className="btn btn--ghost" onClick={loadMore} disabled={loading}>
              Load more profiles
            </button>
          ) : (
            <span className="text-muted text-small">You’re caught up. Check back soon for new creatives.</span>
          )}
          <button type="button" className="btn btn--secondary" onClick={() => push({ title: "Feed refreshed", variant: "info" })}>
            Refresh suggestions
          </button>
        </div>
      </div>
    </div>
  );
}
