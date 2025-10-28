import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Heart, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const mockUser = {
  id: "1",
  name: "Sarah",
  age: 26,
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
  images: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
  ],
  location: "New York, NY",
  bio: "Coffee enthusiast ☕ | Adventure seeker 🏔️ | Always looking for the next great story to tell.",
  job: "Marketing Manager",
  company: "Creative Agency",
  school: "NYU",
  interests: ["Coffee", "Hiking", "Photography", "Travel", "Art"],
  distance: "2 miles away",
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        <img
          src={mockUser.images[0]}
          alt={mockUser.name}
          className="w-full h-[60vh] object-cover"
          loading="lazy"
        />
        <div className="absolute top-0 left-0 right-0 p-4 safe-top bg-gradient-to-b from-black/50 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] bg-black/20 hover:bg-black/40 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{mockUser.name}</h1>
            <span className="text-2xl text-muted-foreground">{mockUser.age}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{mockUser.location} • {mockUser.distance}</span>
          </div>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {mockUser.job} at {mockUser.company}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm">{mockUser.school}</span>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground">{mockUser.bio}</p>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {mockUser.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="min-h-[36px] px-4">
                {interest}
              </Badge>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {mockUser.images.slice(1).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${mockUser.name} ${idx + 2}`}
              className="w-full aspect-square object-cover rounded-lg"
              loading="lazy"
            />
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            className="flex-1 h-14 rounded-full"
          >
            <Heart className="h-6 w-6 mr-2" />
            Like
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
          >
            <Flag className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
