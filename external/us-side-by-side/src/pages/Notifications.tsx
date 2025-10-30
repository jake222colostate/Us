import type { ComponentType } from "react";
import { useMemo } from "react";
import { Heart, MessageCircle, Star, UserPlus } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  match: Heart,
  message: MessageCircle,
  like: Star,
  follow: UserPlus,
};

const Notifications = () => {
  const { notifications, isLoading, error } = useNotifications();

  const items = useMemo(() => notifications ?? [], [notifications]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="safe-top mx-auto max-w-md px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-4 py-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((key) => (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-4 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Unable to load notifications."}
            </p>
          </Card>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">You're all caught up!</p>
          </Card>
        )}

        {items.map((notification) => {
          const Icon = iconMap[notification.type] ?? Star;
          const initials = notification.title.charAt(0).toUpperCase();
          return (
            <Card
              key={notification.id}
              className="cursor-pointer p-4 transition-transform transition-colors hover:bg-muted/50 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1 text-primary-foreground">
                    <Icon className="h-3 w-3" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{notification.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{notification.body}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
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
