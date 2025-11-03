import { useParams } from "react-router-dom";

import FeedCard from "../components/FeedCard";
import { useProfile } from "../hooks/useProfile";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFeed } from "../hooks/useFeed";

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const { profile: currentUser } = useProfile();
  const { profile, loading, error } = useUserProfile(params.id);
  const { reactToPost } = useFeed({ autoLoad: false });

  if (loading) {
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
          <h1>Profile unavailable</h1>
          <p className="text-muted">We couldn’t find this user. They may have gone offline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{profile.display_name}</h1>
        <p className="text-muted">{profile.bio ?? "Ready to collaborate and compare shots."}</p>
      </header>

      <FeedCard
        post={{
          id: `profile-${profile.user_id}`,
          user_id: profile.user_id,
          photo_url: profile.photos[0]?.url ?? "",
          caption: profile.bio,
          location: profile.location,
          created_at: profile.updated_at,
          profile,
        }}
        currentUser={currentUser}
        onReact={reactToPost}
      />

      {error ? <div className="alert alert--error">{error.message}</div> : null}
    </div>
  );
}
