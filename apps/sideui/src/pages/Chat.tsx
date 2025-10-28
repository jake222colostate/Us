import { ArrowLeft, Send, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";

const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [message, setMessage] = useState("");
  const { header, messages, isLoading, send, sending } = useChat(matchId);

  const handleSend = async () => {
    if (!message.trim() || !matchId) return;
    await send(message);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 safe-top flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/matches')}
              className="min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {header ? (
              <>
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={header.avatar} alt={header.name} loading="lazy" />
                  <AvatarFallback>{header.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-semibold text-foreground">{header.name}</h1>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
              </>
            ) : (
              <Skeleton className="h-10 w-24 rounded-full" />
            )}
          </div>
          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-3/4 rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>Say hi to start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.isSelf ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm">{msg.body}</p>
              {msg.createdAt && (
                <p className={`text-xs mt-1 ${msg.isSelf ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        ))}
      </main>

      <div className="sticky bottom-0 bg-card border-t border-border pb-safe">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 min-h-[48px]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="min-w-[48px] min-h-[48px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
