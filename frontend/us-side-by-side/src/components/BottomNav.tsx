import { Heart, Home, Star, User } from "lucide-react";
import * as RRD from "react-router-dom";
import * as React from "react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const location = RRD.useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Feed" },
    { path: "/likes", icon: Star, label: "Likes" },
    { path: "/matches", icon: Heart, label: "Matches" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
      <div className="max-w-md mx-auto px-6 py-3 pb-1">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <RRD.Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex min-h-[60px] min-w-[60px] flex-col items-center justify-center gap-1 p-2 transition-colors",
                  "active:scale-95 transition-transform",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-6 w-6", isActive && "fill-primary")} />
                <span className="text-xs font-medium">{item.label}</span>
              </RRD.Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
