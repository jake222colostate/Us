import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Gender, LookingFor, ProfilePhoto } from "@us/types";

import DistanceSlider from "../components/DistanceSlider";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import { uploadProfilePhoto, setPrimaryPhoto, removePhoto } from "../api/photos";
import { GENDER_OPTIONS, LOOKING_FOR_OPTIONS, getLookingForLabel } from "../lib/profile";

export default function EditProfile() {
  const { profile, updateProfile, setProfile, refresh } = useProfile();
  const { push } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [lookingFor, setLookingFor] = useState<LookingFor>(profile?.looking_for ?? "everyone");
  const [radius, setRadius] = useState(profile?.radius_km ?? 25);
  const [gender, setGender] = useState<Gender | "">(profile?.gender ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [primaryUpdatingId, setPrimaryUpdatingId] = useState<string | null>(null);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setLookingFor(profile?.looking_for ?? "everyone");
    setRadius(profile?.radius_km ?? 25);
    setGender(profile?.gender ?? "");
  }, [profile?.display_name, profile?.bio, profile?.looking_for, profile?.radius_km, profile?.gender]);

  const photos = useMemo(() => {
    if (!profile?.photos) return [];
    return [...profile.photos].sort((a, b) => {
      if (a.is_primary === b.is_primary) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.is_primary ? -1 : 1;
    });
  }, [profile?.photos]);

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
        gender: gender || null,
      });
      push({ title: "Profile updated", variant: "success" });
    } catch (err) {
      push({ title: "Failed to update profile", description: (err as Error).message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const shouldBePrimary = (profile.photos?.length ?? 0) === 0;
      const uploaded = await uploadProfilePhoto({
        userId: profile.user_id,
        file,
        isPrimary: shouldBePrimary,
      });

      setProfile({
        ...profile,
        photos: shouldBePrimary
          ? [uploaded, ...(profile.photos ?? []).map((photo) => ({ ...photo, is_primary: false }))]
          : [...(profile.photos ?? []), uploaded],
      });

      void refresh();

      push({ title: "Photo uploaded", description: shouldBePrimary ? "Set as your primary photo." : "Added to your gallery.", variant: "success" });
    } catch (err) {
      push({ title: "Upload failed", description: (err as Error).message, variant: "error" });
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleMakePrimary = async (photo: ProfilePhoto) => {
    if (!profile || photo.is_primary) return;
    setPrimaryUpdatingId(photo.id);
    try {
      await setPrimaryPhoto(profile.user_id, photo.id);
      setProfile({
        ...profile,
        photos: (profile.photos ?? []).map((item) => ({
          ...item,
          is_primary: item.id === photo.id,
        })),
      });
      void refresh();
      push({ title: "Primary photo updated", variant: "success" });
    } catch (err) {
      push({ title: "Could not update primary photo", description: (err as Error).message, variant: "error" });
    } finally {
      setPrimaryUpdatingId(null);
    }
  };

  const handleRemovePhoto = async (photo: ProfilePhoto) => {
    if (!profile) return;
    setRemovingPhotoId(photo.id);
    try {
      await removePhoto(profile.user_id, photo.id);
      setProfile({
        ...profile,
        photos: (profile.photos ?? []).filter((item) => item.id !== photo.id),
      });
      void refresh();
      push({ title: "Photo removed", variant: "success" });
    } catch (err) {
      push({ title: "Could not remove photo", description: (err as Error).message, variant: "error" });
    } finally {
      setRemovingPhotoId(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Edit profile</h1>
        <p className="text-muted">Fine-tune how others see you in the discovery feed.</p>
      </header>

      <section className="page-card">
        <div className="section-heading">
          <h2>Profile photos</h2>
          <p className="text-muted">Upload a clear photo to boost trust and help people recognize you.</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: "none" }}
        />

        <div className="photo-manager__toolbar">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? "Uploading…" : "Upload photo"}
          </button>
          <span className="text-muted text-small">Use JPG or PNG images up to 10 MB.</span>
        </div>

        <div className="photo-manager__grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-manager__item">
              <div className="photo-manager__preview">
                <img src={photo.url} alt="Profile gallery item" loading="lazy" />
                {photo.is_primary ? <span className="badge photo-manager__badge">Primary photo</span> : null}
              </div>
              <div className="photo-manager__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleMakePrimary(photo)}
                  disabled={photo.is_primary || primaryUpdatingId === photo.id}
                >
                  {photo.is_primary ? "Current primary" : primaryUpdatingId === photo.id ? "Updating…" : "Make primary"}
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => handleRemovePhoto(photo)}
                  disabled={removingPhotoId === photo.id}
                >
                  {removingPhotoId === photo.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {photos.length === 0 ? (
          <div className="feed-empty">No photos yet. Add at least one to shine in discovery.</div>
        ) : null}
      </section>

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
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={gender ?? ""}
              onChange={(event) => setGender(event.target.value as Gender | "")}
            >
              <option value="">Select your gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="lookingFor">Looking for</label>
            <select
              id="lookingFor"
              value={lookingFor ?? "everyone"}
              onChange={(event) => setLookingFor(event.target.value as LookingFor)}
            >
              {LOOKING_FOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          <label>Discovery radius</label>
          <DistanceSlider value={radius} onChange={setRadius} min={5} max={150} />
        </div>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <p className="text-small text-muted">
          Current discovery preference: {getLookingForLabel(lookingFor) ?? "Everyone"}
        </p>
      </form>
    </div>
  );
}
