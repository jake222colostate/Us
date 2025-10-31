import { FormEvent, useEffect, useState } from "react";

import DistanceSlider from "../components/DistanceSlider";
import { ENABLE_DEMO_DATA } from "../config";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../auth";
import { fetchUserSettings, upsertUserSettings } from "../api/settings";
import { getSupabaseClient } from "../api/supabase";
import { ApiError, normalizeError } from "../api/client";

export default function Settings() {
  const supabase = getSupabaseClient();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { push } = useToast();

  const [radius, setRadius] = useState(profile?.radius_km ?? 25);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [safeMode, setSafeMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(Boolean(user?.id));

  useEffect(() => {
    if (typeof profile?.radius_km === "number") {
      setRadius(profile.radius_km);
    }
  }, [profile?.radius_km]);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      if (!user?.id) {
        setLoadingSettings(false);
        return;
      }

      if (!supabase) {
        if (!ENABLE_DEMO_DATA) {
          push({ title: "Settings unavailable", description: "Supabase is not configured", variant: "error" });
        }
        setLoadingSettings(false);
        return;
      }

      try {
        const settings = await fetchUserSettings(user.id);
        if (!cancelled && settings) {
          setEmailUpdates(settings.email_updates);
          setPushNotifications(settings.push_notifications);
          setSafeMode(settings.safe_mode);
        }
      } catch (err) {
        if (!cancelled) {
          const apiErr = normalizeError(err);
          push({ title: "Could not load settings", description: apiErr.message, variant: "error" });
        }
      } finally {
        if (!cancelled) setLoadingSettings(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id, push]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ radius_km: radius });

      if (user?.id && supabase) {
        await upsertUserSettings(user.id, {
          email_updates: emailUpdates,
          push_notifications: pushNotifications,
          safe_mode: safeMode,
        });
      } else if (!ENABLE_DEMO_DATA) {
        throw new ApiError("Supabase client is not configured", 503, null);
      }

      push({ title: "Settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      push({ title: "Unable to save settings", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="text-muted">Control discovery preferences and how you stay in touch.</p>
      </header>

      <form className="page-card auth-card" onSubmit={handleSubmit} aria-busy={saving || loadingSettings}>
        <div className="form-field">
          <label>Discovery radius</label>
          <DistanceSlider value={radius} min={5} max={150} onChange={setRadius} />
        </div>

        <div className="form-field">
          <label className="text-small">
            <input
              type="checkbox"
              checked={emailUpdates}
              onChange={(event) => setEmailUpdates(event.target.checked)}
            />
            &nbsp; Email me when someone likes my photo
          </label>
        </div>

        <div className="form-field">
          <label className="text-small">
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(event) => setPushNotifications(event.target.checked)}
            />
            &nbsp; Push notifications on new matches
          </label>
        </div>

        <div className="form-field">
          <label className="text-small">
            <input type="checkbox" checked={safeMode} onChange={(event) => setSafeMode(event.target.checked)} />
            &nbsp; Enable safe meeting reminders
          </label>
          <span className="form-hint">We’ll send gentle prompts with safety best practices before every meet-up.</span>
        </div>

        <button type="submit" className="btn btn--primary" disabled={saving || loadingSettings}>
          {saving ? "Saving…" : loadingSettings ? "Loading…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}
