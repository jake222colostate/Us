import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfileData } from "@/hooks/useProfileData";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

const interests = [
  "Hiking",
  "Coffee",
  "Travel",
  "Photography",
  "Music",
  "Art",
  "Fitness",
  "Cooking",
  "Reading",
  "Gaming",
  "Movies",
  "Dancing",
  "Yoga",
  "Sports",
  "Pets",
  "Fashion",
  "Food",
  "Tech",
];

type EditableProfile = {
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  interests: string[];
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, update, upload } = useProfileData();

  const [formData, setFormData] = React.useState<EditableProfile>({
    name: "",
    age: undefined,
    location: "",
    bio: "",
    interests: [],
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.user.name ?? "",
        age: profile.user.age,
        location: profile.location ?? "",
        bio: profile.bio ?? "",
        interests: profile.interests ?? [],
      } as EditableProfile);
    }
  }, [profile]);

  const initials = React.useMemo(() => formData.name.charAt(0).toUpperCase() || "?", [formData.name]);

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        user: {
          name: formData.name,
          age: formData.age,
        },
        location: formData.location,
        bio: formData.bio,
        interests: formData.interests,
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      navigate("/profile");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 px-4 py-4 backdrop-blur-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
        <Button onClick={handleSave} className="min-h-[44px]">
          Save
        </Button>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={profile?.user.avatarUrl} alt={formData.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 rounded-full border-4 border-background bg-primary p-2 text-primary-foreground shadow"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => handleAvatarUpload(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="relative aspect-square">
                <button className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </button>
                {index === 1 && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground shadow"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age ?? ""}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, age: Number(event.target.value) || undefined }))
                }
                className="min-h-[48px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location ?? ""}
              onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio ?? ""}
              onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="min-h-[36px] cursor-pointer px-4"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
