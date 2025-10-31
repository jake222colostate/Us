import { FormEvent, useState } from "react";

import DistanceSlider from "../components/DistanceSlider";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";

export default function EditProfile() {
  const { profile, updateProfile } = useProfile();
  const { push } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [lookingFor, setLookingFor] = useState(profile?.looking_for ?? "everyone");
  const [radius, setRadius] = useState(profile?.radius_km ?? 25);
  const [photos, setPhotos] = useState((profile?.photo_urls ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <div className="page">
        <div className="page-card">
          <p className="text-muted">Complete onboarding to edit your profile.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio,
        looking_for: lookingFor,
        radius_km: radius,
        photo_urls: photos
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean),
      });
      push({ title: "Profile updated", variant: "success" });
    } catch (err) {
      push({ title: "Failed to update profile", description: (err as Error).message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Edit profile</h1>
        <p className="text-muted">Fine-tune how others see you in the discovery feed.</p>
      </header>

      <form className="page-card auth-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="lookingFor">Looking for</label>
            <select
              id="lookingFor"
              value={lookingFor ?? "everyone"}
              onChange={(event) => setLookingFor(event.target.value)}
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Share what you love shooting and how you collaborate."
          />
        </div>

        <div className="form-field">
          <label htmlFor="photos">Photo URLs (one per line)</label>
          <textarea
            id="photos"
            value={photos}
            onChange={(event) => setPhotos(event.target.value)}
            placeholder="https://…"
          />
          <span className="form-hint">First photo becomes your cover in the feed.</span>
        </div>

        <div className="form-field">
          <label>Discovery radius</label>
          <DistanceSlider value={radius} onChange={setRadius} min={5} max={150} />
        </div>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
