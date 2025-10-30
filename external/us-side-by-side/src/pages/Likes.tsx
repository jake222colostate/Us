import { useMemo } from "react";
import { Heart, X } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLikes } from "@/hooks/useLikes";

const Likes = () => {
  const { data, isLoading, error } = useLikes();

  const received = useMemo(() => data?.received ?? [], [data?.received]);
  const sent = useMemo(() => data?.sent ?? [], [data?.sent]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="safe-top mx-auto max-w-md px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Likes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((key) => (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
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
              {error instanceof Error ? error.message : "Unable to load likes."}
            </p>
          </Card>
        )}

        {!isLoading && !error && (
          <Tabs defaultValue="received" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">Who Likes You</TabsTrigger>
              <TabsTrigger value="sent">Your Likes</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-3">
              {received.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">No new likes yet</p>
                </div>
              ) : (
                received.map((like) => {
                  const initials = like.user.name.charAt(0).toUpperCase();
                  return (
                    <Card key={like.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                          <AvatarImage src={like.user.avatarUrl} alt={like.user.name} loading="lazy" />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{like.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Liked {new Date(like.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full" aria-label="Pass">
                            <X className="h-5 w-5" />
                          </Button>
                          <Button size="icon" className="h-10 w-10 rounded-full" aria-label="Like back">
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-3">
              {sent.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">You haven't liked anyone yet.</p>
                </div>
              ) : (
                sent.map((like) => {
                  const initials = like.user.name.charAt(0).toUpperCase();
                  return (
                    <Card key={like.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                          <AvatarImage src={like.user.avatarUrl} alt={like.user.name} loading="lazy" />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{like.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {new Date(like.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Likes;
