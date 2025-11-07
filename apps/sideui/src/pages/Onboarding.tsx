import { FormEvent, useEffect, useState } from "react";

import type { Gender, LookingFor } from "@us/types";

import DistanceSlider from "../components/DistanceSlider";
import { ENABLE_DEMO_DATA } from "../config";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../auth";
import { upsertUserSettings } from "../api/settings";
import { getSupabaseClient } from "../api/supabase";
import { ApiError } from "../api/client";
import { GENDER_OPTIONS, LOOKING_FOR_OPTIONS } from "../lib/profile";

const steps = ["Basics", "Preferences", "Safety"] as const;

type Step = (typeof steps)[number];

export default function Onboarding() {
  const supabase = getSupabaseClient();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { push } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [radius, setRadius] = useState(profile?.radius_km ?? 25);
  const [lookingFor, setLookingFor] = useState<LookingFor>(profile?.looking_for ?? "everyone");
  const [gender, setGender] = useState<Gender | "">(profile?.gender ?? "");
  const [commitment, setCommitment] = useState("collaboration");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setRadius(profile?.radius_km ?? 25);
    setLookingFor(profile?.looking_for ?? "everyone");
    setGender(profile?.gender ?? "");
  }, [profile?.display_name, profile?.bio, profile?.radius_km, profile?.looking_for, profile?.gender]);

  const goToNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio,
        radius_km: radius,
        looking_for: lookingFor,
        gender: gender || null,
      });

      if (user?.id && supabase) {
        await upsertUserSettings(user.id, { commitment });
      } else if (!ENABLE_DEMO_DATA) {
        throw new ApiError("Supabase client is not configured", 503, null);
      }

      push({ title: "Welcome!", description: "Your preferences are saved.", variant: "success" });
    } catch (err) {
      push({ title: "Could not complete onboarding", description: (err as Error).message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Let’s personalize your experience</h1>
        <p className="text-muted">A few quick questions help us surface matches you’ll love collaborating with.</p>
      </header>

      <nav className="tag-list">
        {steps.map((step) => (
          <span key={step} className={`tag${step === currentStep ? "" : " text-muted"}`}>
            {step}
          </span>
        ))}
      </nav>

      <form className="page-card auth-card" onSubmit={handleSubmit}>
        {currentStep === "Basics" ? (
          <>
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
                required
              >
                <option value="">Choose the option that fits best</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell people how you capture magic."
              />
            </div>
          </>
        ) : null}

        {currentStep === "Preferences" ? (
          <>
            <div className="form-field">
              <label htmlFor="lookingFor">Looking for</label>
              <select id="lookingFor" value={lookingFor} onChange={(event) => setLookingFor(event.target.value as LookingFor)}>
                {LOOKING_FOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Discovery radius</label>
              <DistanceSlider value={radius} min={5} max={150} onChange={setRadius} />
            </div>
          </>
        ) : null}

        {currentStep === "Safety" ? (
          <div className="form-field">
            <label htmlFor="commitment">What are you here for?</label>
            <select id="commitment" value={commitment} onChange={(event) => setCommitment(event.target.value)}>
              <option value="collaboration">Creative collaboration</option>
              <option value="dating">Dating & chemistry</option>
              <option value="networking">Networking & friendships</option>
            </select>
            <span className="form-hint">We use this to fine-tune your feed and conversation starters.</span>
          </div>
        ) : null}

        <div className="hero-card__cta">
          {currentStep !== steps[0] ? (
            <button type="button" className="btn btn--ghost" onClick={goToPrev}>
              Back
            </button>
          ) : null}
          {currentStep !== steps[steps.length - 1] ? (
            <button type="button" className="btn btn--secondary" onClick={goToNext}>
              Continue
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Saving…" : "Finish"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
