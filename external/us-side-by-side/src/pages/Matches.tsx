import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches } from "@/hooks/useMatches";

const Matches = () => {
  const navigate = useNavigate();
  const { matches, isLoading, error } = useMatches();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="safe-top mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/feed")}
            className="text-xs"
          >
            Back to feed
          </Button>
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
              {error instanceof Error ? error.message : "Failed to load matches."}
            </p>
          </Card>
        )}

        {!isLoading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">No matches yet</h2>
            <p className="text-sm text-muted-foreground">
              Keep exploring the feed to find new connections.
            </p>
          </div>
        )}

        {matches.map((match) => {
          const initials = match.user.name.charAt(0).toUpperCase();
          const lastMessageTime = match.lastMessageAt
            ? formatDistanceToNow(new Date(match.lastMessageAt), { addSuffix: true })
            : undefined;

          return (
            <Card
              key={match.id}
              className="cursor-pointer p-4 transition-transform transition-colors hover:bg-muted/50 active:scale-[0.98]"
              onClick={() => navigate(`/chat/${match.id}`)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarImage src={match.user.avatarUrl} alt={match.user.name} loading="lazy" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {match.user.name}
                    {match.user.age ? `, ${match.user.age}` : ""}
                  </p>
                  {match.lastMessage && (
                    <p className="truncate text-sm text-muted-foreground">{match.lastMessage}</p>
                  )}
                </div>
                {lastMessageTime && (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {lastMessageTime}
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

export default Matches;
