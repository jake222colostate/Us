import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, MapPin, Edit, LogOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [maxDistance, setMaxDistance] = useState([25]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 min-w-[44px] min-h-[44px]"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-primary mb-4">
              <AvatarImage
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800"
                alt="Your profile"
              />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{user?.name}, 25</h2>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button 
              onClick={() => navigate('/edit-profile')}
              className="gap-2 min-h-[48px] mt-4" 
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Distance Preference
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Maximum Distance</span>
                <span className="font-semibold text-foreground">{maxDistance[0]} miles</span>
              </div>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll see people within {maxDistance[0]} miles of your location
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-3">About Me</h3>
          <p className="text-muted-foreground">
            Love coffee, hiking, and good conversation. Looking for someone to explore the city with!
          </p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
