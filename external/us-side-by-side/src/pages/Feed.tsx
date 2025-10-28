import { useState } from "react";
import { FeedCard, Post } from "@/components/FeedCard";
import { SideBySideModal } from "@/components/SideBySideModal";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data
const mockPosts: Post[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah",
    userAge: 26,
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    userDistance: 3,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
    caption: "Living my best life ✨",
    isLiked: false,
  },
  {
    id: "2",
    userId: "user2",
    userName: "Emma",
    userAge: 24,
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    userDistance: 5,
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    caption: "Coffee addict ☕",
    isLiked: false,
  },
  {
    id: "3",
    userId: "user3",
    userName: "Alex",
    userAge: 28,
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    userDistance: 7,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
    caption: "Adventure awaits 🌄",
    isLiked: false,
  },
];

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { toast } = useToast();

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isLiked: !post.isLiked } : post
      )
    );

    const post = posts.find((p) => p.id === postId);
    if (post && !post.isLiked) {
      setSelectedPost(post);
      setModalOpen(true);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleCompare = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setModalOpen(true);
    }
  };

  const handleMatch = () => {
    toast({
      title: "It's a Match! 💕",
      description: `You and ${selectedPost?.userName} can now chat!`,
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
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onUserClick={handleUserClick}
            onCompare={handleCompare}
          />
        ))}
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
