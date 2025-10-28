import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@us/auth";

const interests = [
  "Hiking", "Coffee", "Travel", "Photography", "Music", "Art", 
  "Fitness", "Cooking", "Reading", "Gaming", "Movies", "Dancing",
  "Yoga", "Sports", "Pets", "Fashion", "Food", "Tech"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: "",
    age: "",
    location: "",
    selectedInterests: [] as string[],
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interest)
        ? prev.selectedInterests.filter(i => i !== interest)
        : [...prev.selectedInterests, interest]
    }));
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 && "Add Your Photos"}
            {step === 2 && "Tell Us About Yourself"}
            {step === 3 && "Your Interests"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of 3
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <button
                  key={i}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-muted/50"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Add at least 2 photos to continue
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="New York, NY"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell people about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select at least 3 interests
            </p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.selectedInterests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer min-h-[36px] px-4"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={() => step === 3 ? handleComplete() : setStep(step + 1)}
            className="flex-1 min-h-[48px]"
          >
            {step === 3 ? "Complete" : "Next"}
            {step < 3 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
