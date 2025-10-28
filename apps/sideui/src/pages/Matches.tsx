import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockMatches = [
  {
    id: "1",
    name: "Sarah",
    age: 26,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    lastMessage: "Hey! How's it going?",
    time: "2m ago",
  },
  {
    id: "2",
    name: "Emma",
    age: 24,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    lastMessage: "Thanks for matching! 😊",
    time: "1h ago",
  },
];

const Matches = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {mockMatches.length > 0 ? (
          mockMatches.map((match) => (
            <Card 
              key={match.id} 
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/chat/${match.id}`)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarImage src={match.avatar} alt={match.name} loading="lazy" />
                  <AvatarFallback>{match.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {match.name}, {match.age}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {match.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{match.time}</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No matches yet
            </h2>
            <p className="text-muted-foreground text-sm">
              Keep liking posts to find your match!
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Matches;
