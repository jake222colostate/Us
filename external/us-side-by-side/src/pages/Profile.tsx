import { MapPin, Settings } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData } from "@/hooks/useProfileData";

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, isLoading } = useProfileData();

  const maxDistance = useMemo(() => profile?.maxDistanceMiles ?? 25, [profile?.maxDistanceMiles]);

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="safe-top mx-auto max-w-md px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="mx-auto max-w-md space-y-4 px-4 py-4">
          {[1, 2].map((key) => (
            <Card key={key} className="p-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </Card>
          ))}
        </main>
      </div>
    );
  }

  const initials = profile?.user.name.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="safe-top mx-auto max-w-md px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 min-h-[44px] min-w-[44px]"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="mb-4 h-24 w-24 border-4 border-primary">
              <AvatarImage src={profile?.user.avatarUrl} alt={profile?.user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">
              {profile?.user.name}
              {profile?.user.age ? `, ${profile.user.age}` : ""}
            </h2>
            {profile?.location && (
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => navigate("/edit-profile")}
                className="min-h-[48px]"
                variant="outline"
              >
                Edit Profile
              </Button>
              <Button
                onClick={() => void logout()}
                className="min-h-[48px]"
                variant="secondary"
              >
                Sign out
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            Distance Preference
          </h3>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Maximum Distance</span>
                <span className="font-semibold text-foreground">{maxDistance} miles</span>
              </div>
              <Slider value={[maxDistance]} max={100} min={1} step={1} disabled className="w-full" />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll see people within {maxDistance} miles of your location.
            </p>
          </div>
        </Card>

        {profile?.bio && (
          <Card className="p-6">
            <h3 className="mb-3 font-semibold text-foreground">About Me</h3>
            <p className="text-muted-foreground">{profile.bio}</p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
