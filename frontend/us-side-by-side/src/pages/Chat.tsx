import { ArrowLeft, MoreVertical, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation, useMessages, useSendMessage } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { toast } = useToast();
  const [message, setMessage] = React.useState("");

  const conversationQuery = useConversation(matchId);
  const messagesQuery = useMessages(matchId);
  const sendMessageMutation = useSendMessage(matchId);

  const conversation = conversationQuery.data;
  const messages = React.useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [messagesQuery.data],
  );

  const handleSend = async () => {
    const body = message.trim();
    if (!body || !matchId) return;

    try {
      await sendMessageMutation.mutateAsync(body);
      setMessage("");
    } catch (error) {
      toast({
        title: "Message failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (conversationQuery.isLoading || messagesQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="safe-top mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 py-4">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-12 w-1/2" />
          ))}
        </main>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">We couldn't find that conversation.</p>
          <Button className="mt-4" onClick={() => navigate("/matches")}>Return to matches</Button>
        </div>
      </div>
    );
  }

  const initials = conversation.participant.name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="safe-top mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/matches")}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage
                src={conversation.participant.avatarUrl}
                alt={conversation.participant.name}
                loading="React.lazy"
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-foreground">{conversation.participant.name}</h1>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" aria-label="More">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isMe = msg.senderId !== conversation.participant.id;
          return (
            <div key={msg.id} className={isMe ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[75%] rounded-2xl px-4 py-2 " +
                  (isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                }
              >
                <p className="text-sm">{msg.body}</p>
                <p
                  className={
                    "mt-1 text-xs " +
                    (isMe ? "text-primary-foreground/70" : "text-muted-foreground")
                  }
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-card pb-safe">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            className="flex-1 min-h-[48px]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="min-h-[48px] min-w-[48px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
