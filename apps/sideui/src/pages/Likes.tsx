import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

type LikeItem = {
  id: string;
  name: string;
  avatar: string;
  time?: string;
};

const mapNotificationToLike = (notification: ReturnType<typeof useNotifications>["notifications"][number]): LikeItem => {
  const payload = notification.payload as
    | {
        profile?: { display_name?: string; photo_urls?: string[] };
      }
    | undefined;

  return {
    id: notification.id,
    name: payload?.profile?.display_name ?? "Someone",
    avatar: payload?.profile?.photo_urls?.[0] ?? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    time: notification.created_at ?? undefined,
  };
};

const Likes = () => {
  const { notifications, isLoading } = useNotifications();
  const received = notifications.filter((item) => item.kind === "like").map(mapNotificationToLike);
  const sent = notifications.filter((item) => item.kind === "like:sent").map(mapNotificationToLike);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Likes</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <Tabs defaultValue="received" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Who Likes You</TabsTrigger>
            <TabsTrigger value="sent">Your Likes</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : received.length > 0 ? (
              received.map((like) => (
                <Card key={like.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={like.avatar} alt={like.name} loading="lazy" />
                      <AvatarFallback>{like.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{like.name}</p>
                      {like.time && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(like.time).toLocaleString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-10 w-10 rounded-full">
                        <X className="h-5 w-5" />
                      </Button>
                      <Button size="icon" className="h-10 w-10 rounded-full">
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No new likes yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : sent.length > 0 ? (
              sent.map((like) => (
                <Card key={like.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={like.avatar} alt={like.name} loading="lazy" />
                      <AvatarFallback>{like.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{like.name}</p>
                      {like.time && (
                        <p className="text-sm text-muted-foreground">Liked {new Date(like.time).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You haven't liked anyone yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Likes;
