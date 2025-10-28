import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockLikes = [
  {
    id: "1",
    name: "Jessica",
    age: 25,
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
    time: "2h ago",
  },
  {
    id: "2",
    name: "Sophie",
    age: 24,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    time: "5h ago",
  },
];

const myLikes = [
  {
    id: "3",
    name: "Mia",
    age: 26,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    time: "1d ago",
  },
];

const Likes = () => {
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
            {mockLikes.length > 0 ? (
              mockLikes.map((like) => (
                <Card key={like.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={like.avatar} alt={like.name} loading="lazy" />
                      <AvatarFallback>{like.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {like.name}, {like.age}
                      </p>
                      <p className="text-sm text-muted-foreground">{like.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full"
                      >
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
            {myLikes.map((like) => (
              <Card key={like.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={like.avatar} alt={like.name} loading="lazy" />
                    <AvatarFallback>{like.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {like.name}, {like.age}
                    </p>
                    <p className="text-sm text-muted-foreground">Liked {like.time}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Likes;
