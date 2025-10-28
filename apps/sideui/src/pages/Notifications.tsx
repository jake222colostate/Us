import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Star } from "lucide-react";

const notifications = [
  {
    id: "1",
    type: "match",
    user: "Sarah",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    message: "You have a new match!",
    time: "2m ago",
    icon: Heart,
  },
  {
    id: "2",
    type: "message",
    user: "Emma",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    message: "Sent you a message",
    time: "1h ago",
    icon: MessageCircle,
  },
  {
    id: "3",
    type: "like",
    user: "Jessica",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    message: "Liked your post",
    time: "3h ago",
    icon: Star,
  },
];

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card
              key={notification.id}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarImage src={notification.avatar} alt={notification.user} loading="lazy" />
                    <AvatarFallback>{notification.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <Icon className="h-3 w-3" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {notification.user}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {notification.time}
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
