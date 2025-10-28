import { useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAge: number;
  userAvatar: string;
  userDistance: number;
  image: string;
  caption?: string;
  isLiked: boolean;
}

interface FeedCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onCompare: (postId: string) => void;
}

export const FeedCard = ({ post, onLike, onUserClick, onCompare }: FeedCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = () => {
    setIsAnimating(true);
    onLike(post.id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => onUserClick(post.userId)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={post.userAvatar} alt={post.userName} />
            <AvatarFallback>{post.userName[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-foreground">
              {post.userName}, {post.userAge}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{post.userDistance} miles away</span>
            </div>
          </div>
        </button>
      </div>

      <div className="relative">
        <img
          src={post.image}
          alt={post.userName}
          className="w-full aspect-[4/5] object-cover"
          loading="lazy"
        />
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-24 w-24 text-primary fill-primary animate-scale-in" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="transition-transform hover:scale-110 active:scale-95 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label={post.isLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`h-7 w-7 ${
                post.isLiked
                  ? "fill-primary text-primary"
                  : "text-foreground hover:text-primary"
              }`}
            />
          </button>
          <Badge variant="secondary" className="font-normal">
            <MapPin className="h-3 w-3 mr-1" />
            {post.userDistance}mi
          </Badge>
        </div>
        {post.caption && (
          <p className="text-sm text-foreground">
            <span className="font-semibold">{post.userName}</span> {post.caption}
          </p>
        )}
        <button
          onClick={() => onCompare(post.id)}
          className="w-full min-h-[48px] py-3 px-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md touch-manipulation"
          aria-label="Compare photos side by side"
        >
          <Heart className="h-5 w-5 fill-current" />
          <span className="text-sm sm:text-base">Compare Photos Side by Side</span>
        </button>
      </div>
    </Card>
  );
};
