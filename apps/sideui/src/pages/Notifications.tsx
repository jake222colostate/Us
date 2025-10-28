import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

const notificationIcon = (kind?: string) => {
  switch (kind) {
    case "like":
      return Heart;
    case "match":
      return UserPlus;
    case "message":
      return MessageCircle;
    default:
      return Star;
  }
};

const Notifications = () => {
  const { notifications, isLoading } = useNotifications();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-16 w-16 mx-auto mb-4" />
            <p>No notifications yet. Check back later!</p>
          </div>
        )}

        {notifications.map((notification) => {
          const Icon = notificationIcon(notification.kind);
          const payload = notification.payload as
            | {
                profile?: { display_name?: string; photo_urls?: string[] };
                message?: string;
              }
            | undefined;
          const name = payload?.profile?.display_name ?? "Someone";
          const avatar = payload?.profile?.photo_urls?.[0] ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400";
          const description = payload?.message ?? notification.kind ?? "Activity";

          return (
            <Card key={notification.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarImage src={avatar} alt={name} loading="lazy" />
                    <AvatarFallback>{name?.[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <Icon className="h-3 w-3" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{name}</p>
                  <p className="text-sm text-muted-foreground truncate">{description}</p>
                </div>
                {notification.created_at && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notification.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
