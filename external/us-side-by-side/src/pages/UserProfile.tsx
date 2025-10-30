import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Flag, GraduationCap, Heart, MapPin, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserProfile } from "@/lib/api/endpoints";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(userId as string),
    enabled: Boolean(userId),
  });

  const profile = profileQuery.data;
  const fallbackName = useMemo(() => profile?.user.name ?? "User", [profile?.user.name]);
  const heroImage = profile?.photos?.[0];
  const gallery = profile?.photos?.slice(1) ?? [];

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Skeleton className="h-[60vh] w-full" />
        <main className="mx-auto max-w-md space-y-4 px-4 py-6">
          {[1, 2, 3].map((key) => (
            <Card key={key} className="p-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-2 h-4 w-full" />
            </Card>
          ))}
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">We couldn't find that profile.</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        {heroImage ? (
          <img src={heroImage} alt={profile.user.name} className="h-[60vh] w-full object-cover" loading="lazy" />
        ) : (
          <Skeleton className="h-[60vh] w-full" />
        )}
        <div className="safe-top absolute left-0 right-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] bg-black/20 text-white hover:bg-black/40"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <h1 className="text-3xl font-bold text-foreground">{profile.user.name}</h1>
            {profile.user.age && <span className="text-2xl text-muted-foreground">{profile.user.age}</span>}
          </div>
          {(profile.location || profile.user.distanceMiles) && (
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {profile.location}
                {profile.user.distanceMiles ? ` • ${profile.user.distanceMiles} miles away` : ""}
              </span>
            </div>
          )}
        </div>

        {(profile.user.bio || profile.user.company) && (
          <Card className="space-y-3 p-4">
            {profile.user.company && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm">{profile.user.company}</span>
              </div>
            )}
            {profile.user.school && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm">{profile.user.school}</span>
              </div>
            )}
          </Card>
        )}

        {profile.bio && (
          <Card className="p-4">
            <h2 className="mb-2 font-semibold text-foreground">About</h2>
            <p className="text-muted-foreground">{profile.bio}</p>
          </Card>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="min-h-[36px] px-4">
                  {interest}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`${fallbackName} photo ${index + 2}`}
                className="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full" aria-label="Pass">
            <X className="h-6 w-6" />
          </Button>
          <Button className="h-14 flex-1 rounded-full" aria-label="Like">
            <Heart className="mr-2 h-6 w-6" /> Like
          </Button>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full" aria-label="Report">
            <Flag className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
