import { useMemo, useState } from "react";
import { FeedCard } from "@/components/FeedCard";
import { SideBySideModal } from "@/components/SideBySideModal";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFeed } from "@/hooks/useFeed";
import { Skeleton } from "@/components/ui/skeleton";

const Feed = () => {
  const navigate = useNavigate();
  const { posts, isLoading, like, pass, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId) ?? null, [posts, selectedPostId]);

  const handleLike = async (postId: string) => {
    await like(postId);
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handlePass = async (postId: string) => {
    await pass(postId);
    toast({
      title: "Skipped",
      description: "We'll show you someone new soon.",
    });
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleCompare = (postId: string) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleMatch = () => {
    toast({
      title: "It's a Match! 💕",
      description: selectedPost ? `You and ${selectedPost.userName} can now chat!` : "You can now chat!",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border safe-top">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="w-[44px]" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Us
          </h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/notifications')}
            className="min-w-[44px] min-h-[44px]"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-[520px] w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-muted-foreground">No more profiles right now. Check back soon!</p>
          </div>
        )}

        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onPass={handlePass}
            onUserClick={handleUserClick}
            onCompare={handleCompare}
          />
        ))}

        {hasNextPage && (
          <Button
            variant="outline"
            className="w-full min-h-[48px]"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "See more"}
          </Button>
        )}
      </main>

      <SideBySideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userImage="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800"
        matchImage={selectedPost?.image || ""}
        userName="You"
        matchName={selectedPost?.userName || ""}
        onMatch={handleMatch}
      />

      <BottomNav />
    </div>
  );
};

export default Feed;
