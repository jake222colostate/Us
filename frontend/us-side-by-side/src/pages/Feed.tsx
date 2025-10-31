import { Bell, RefreshCw } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FeedCard } from "@/components/FeedCard";
import type { Post as FeedPost } from "@/components/FeedCard";
import { SideBySideModal } from "@/components/SideBySideModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/hooks/useFeed";
import { useToast } from "@/hooks/use-toast";
import * as RRD from "react-router-dom";
import * as React from "react";

const Feed = () => {
  const navigate = RRD.useNavigate();
  const { toast } = useToast();
  const {
    posts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    reactionMutation,
    matchMutation,
  } = useFeed();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<FeedPost | null>(null);

  const handleReaction = (post: FeedPost, action: "like" | "dislike") => {
    reactionMutation.mutate(
      { postId: post.id, action },
      {
        onSuccess: () => {
          if (action === "like") {
            setSelectedPost(post);
            setModalOpen(true);
          }
        },
        onError: (error) => {
          toast({
            title: "Action failed",
            description:
              error instanceof Error ? error.message : "We couldn't update your reaction.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleMatch = async () => {
    if (!selectedPost) return;
    try {
      await matchMutation.mutateAsync(selectedPost.id);
      toast({
        title: "It's a match!",
        description: `You and ${selectedPost.author.name} can start chatting.`,
      });
      setModalOpen(false);
    } catch (error) {
      toast({
        title: "Match failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderedPosts = React.useMemo(() => posts ?? [], [posts]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <div className="w-[44px]" />
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Us
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/notifications")}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((key) => (
              <Card key={key} className="overflow-hidden">
                <div className="space-y-4 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="aspect-[4/5] w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && renderedPosts.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-lg font-semibold text-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground">
              Check back soon—new matches are on the way!
            </p>
            <Button
              variant="outline"
              className="mt-4 inline-flex items-center gap-2"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </Card>
        )}

        {renderedPosts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onLike={(postId) => {
              if (post.id === postId) {
                handleReaction(post, post.liked ? "dislike" : "like");
              }
            }}
            onUserClick={(userId) => navigate(`/user/${userId}`)}
            onCompare={() => {
              setSelectedPost(post);
              setModalOpen(true);
            }}
          />
        ))}

        {hasNextPage && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage ? "Loading more…" : "Load more"}
          </Button>
        )}
      </main>

      <SideBySideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userImage={selectedPost?.author.avatarUrl ?? ""}
        matchImage={selectedPost?.mediaUrl ?? ""}
        userName="You"
        matchName={selectedPost?.author.name ?? ""}
        onMatch={handleMatch}
      />

      <BottomNav />
    </div>
  );
};

export default Feed;
