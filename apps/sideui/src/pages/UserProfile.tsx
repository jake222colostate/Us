import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  X,
  Flag,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@us/auth";

const fallbackImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
];

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile, isLoading } = useUserProfile(userId);
  const displayName = profile?.display_name ?? "Someone";
  const targetUserId = profile?.user_id ?? userId ?? "";
  const age = profile?.birthdate
    ? Math.max(18, Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : undefined;
  const photoUrls = profile?.photo_urls && profile.photo_urls.length > 0 ? profile.photo_urls : fallbackImages;
  const interestList = Array.isArray((profile as { interests?: unknown } | undefined)?.interests)
    ? ((profile as { interests?: string[] }).interests ?? [])
    : [];
  const canShowLocation = profile?.location?.latitude != null && profile?.location?.longitude != null;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId) throw new Error("Missing user id");
      await api.feed.likeUser(targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast({
        title: "Sent a like",
        description: `We'll let ${displayName} know you're interested.`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to send like";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    },
  });

  const passMutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId) throw new Error("Missing user id");
      await api.feed.passUser(targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
      toast({ title: "Profile skipped", description: "We'll show you more matches soon." });
      navigate(-1);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to skip profile";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    },
  });

  const handleFlag = () => {
    toast({
      title: "Report coming soon",
      description: "We're still wiring this up. For now, email support@us.app if something looks off.",
    });
  };

  const isBusy = isLoading || likeMutation.isPending || passMutation.isPending;
  const canInteract = Boolean(targetUserId) && !isBusy;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        {isLoading ? (
          <Skeleton className="w-full h-[60vh]" />
        ) : (
          <img
            src={photoUrls[0]}
            alt={displayName}
            className="w-full h-[60vh] object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute top-0 left-0 right-0 p-4 safe-top bg-gradient-to-b from-black/50 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] bg-black/20 hover:bg-black/40 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            {age && <span className="text-2xl text-muted-foreground">{age}</span>}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {canShowLocation
                ? `${profile?.location?.latitude?.toFixed(2)}, ${profile?.location?.longitude?.toFixed(2)}`
                : "Somewhere nearby"}
            </span>
          </div>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {profile?.looking_for
                ? `Looking for ${profile.looking_for}`
                : "Looking to meet someone new"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {profile?.radius_km ? `Prefers ${profile.radius_km}km radius` : "Adjust your distance in settings"}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground">{profile?.bio ?? "No bio yet."}</p>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {interestList.length > 0 ? (
              interestList.map((interest) => (
                <Badge key={interest} variant="secondary" className="min-h-[36px] px-4">
                  {interest}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="min-h-[36px] px-4">
                Add interests to show your vibe
              </Badge>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {photoUrls.slice(1).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${displayName} ${idx + 2}`}
              className="w-full aspect-square object-cover rounded-lg"
              loading="lazy"
            />
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            disabled={!canInteract}
            onClick={() => passMutation.mutateAsync().catch(() => {})}
          >
            {passMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <X className="h-6 w-6" />}
          </Button>
          <Button
            className="flex-1 h-14 rounded-full"
            disabled={!canInteract}
            onClick={() => likeMutation.mutateAsync().catch(() => {})}
          >
            {likeMutation.isPending ? (
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            ) : (
              <Heart className="h-6 w-6 mr-2" />
            )}
            {likeMutation.isPending ? "Sending" : "Like"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleFlag}
          >
            <Flag className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
