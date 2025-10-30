import { useMemo } from "react";
import { clsx } from "clsx";
import { Heart, MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface Post {
  id: string;
  caption?: string;
  mediaUrl: string;
  liked: boolean;
  distanceMiles?: number;
  author: {
    id: string;
    name: string;
    age?: number;
    avatarUrl?: string;
  };
}

interface FeedCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onCompare: (postId: string) => void;
}

export const FeedCard = ({ post, onLike, onUserClick, onCompare }: FeedCardProps) => {
  const initials = useMemo(() => post.author.name.charAt(0).toUpperCase(), [post.author.name]);

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onUserClick(post.author.id)}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-foreground">
              {post.author.name}
              {post.author.age ? `, ${post.author.age}` : ""}
            </p>
            {post.distanceMiles !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{post.distanceMiles} miles away</span>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="relative">
        <img
          src={post.mediaUrl}
          alt={post.author.name}
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className="-ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center p-2 transition-transform hover:scale-110 active:scale-95"
            aria-label={post.liked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={clsx(
                "h-7 w-7",
                post.liked
                  ? "fill-primary text-primary"
                  : "text-foreground hover:text-primary",
              )}
            />
          </button>
          {post.distanceMiles !== undefined && (
            <Badge variant="secondary" className="font-normal">
              <MapPin className="mr-1 h-3 w-3" />
              {post.distanceMiles}mi
            </Badge>
          )}
        </div>
        {post.caption && (
          <p className="text-sm text-foreground">
            <span className="font-semibold">{post.author.name}</span> {post.caption}
          </p>
        )}
        <button
          onClick={() => onCompare(post.id)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary py-3 px-4 font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
          aria-label="Compare photos side by side"
        >
          <Heart className="h-5 w-5 fill-current" />
          <span className="text-sm sm:text-base">Compare Photos Side by Side</span>
        </button>
      </div>
    </Card>
  );
};
