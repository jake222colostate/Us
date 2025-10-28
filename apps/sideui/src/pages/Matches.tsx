import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";

const Matches = () => {
  const navigate = useNavigate();
  const { matches, isLoading } = useMatches();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No matches yet</h2>
            <p className="text-muted-foreground text-sm">Keep liking posts to find your match!</p>
          </div>
        )}

        {matches.map((match) => (
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
                <p className="font-semibold text-foreground">{match.name}</p>
                {match.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">{match.lastMessage}</p>
                )}
              </div>
              {match.updatedAt && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(match.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </div>
          </Card>
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default Matches;
