import { ArrowLeft, Send, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockMatches = {
  "1": {
    name: "Sarah",
    age: 26,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  },
  "2": {
    name: "Emma",
    age: 24,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
  },
};

const mockMessages = [
  { id: "1", text: "Hey! How's it going?", sender: "them", time: "2:30 PM" },
  { id: "2", text: "Hi! I'm doing great, thanks for asking!", sender: "me", time: "2:32 PM" },
  { id: "3", text: "I saw you're into hiking too!", sender: "them", time: "2:33 PM" },
];

const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const match = mockMatches[matchId as keyof typeof mockMatches];

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "me" as const,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
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
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={match.avatar} alt={match.name} loading="lazy" />
              <AvatarFallback>{match.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-foreground">{match.name}</h1>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.sender === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {msg.time}
              </p>
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
            disabled={!message.trim()}
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
