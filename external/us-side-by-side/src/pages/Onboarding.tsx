import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";

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

const steps = [
  { id: "photos", label: "Add Your Photos" },
  { id: "details", label: "Tell Us About Yourself" },
  { id: "interests", label: "Your Interests" },
] as const;

type StepId = (typeof steps)[number]["id"];

type FormState = {
  age: string;
  location: string;
  bio: string;
  selectedInterests: string[];
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { progress, isLoading, error, submit } = useOnboarding();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    age: "",
    location: "",
    bio: "",
    selectedInterests: [],
  });

  useEffect(() => {
    if (progress) {
      const completedIndex = progress.steps.findIndex((step) => !step.completed);
      setActiveStepIndex(completedIndex === -1 ? steps.length - 1 : completedIndex);
    }
  }, [progress]);

  const handleSubmitStep = async (stepId: StepId) => {
    const payload: Record<string, unknown> = {};
    if (stepId === "details") {
      payload.age = formState.age;
      payload.location = formState.location;
      payload.bio = formState.bio;
    }
    if (stepId === "interests") {
      payload.interests = formState.selectedInterests;
    }

    try {
      await submit.mutateAsync({ stepId, data: payload });
    } catch (submitError) {
      toast({
        title: "Save failed",
        description:
          submitError instanceof Error ? submitError.message : "Please try again.",
        variant: "destructive",
      });
      throw submitError;
    }
  };

  const handleNext = async () => {
    const step = steps[activeStepIndex];
    await handleSubmitStep(step.id);

    if (activeStepIndex === steps.length - 1) {
      toast({
        title: "You're all set!",
        description: "Welcome to Us—enjoy exploring matches.",
      });
      navigate("/");
      return;
    }

    setActiveStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStepIndex((index) => Math.max(index - 1, 0));
  };

  const toggleInterest = (interest: string) => {
    setFormState((prev) => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interest)
        ? prev.selectedInterests.filter((item) => item !== interest)
        : [...prev.selectedInterests, interest],
    }));
  };

  const progressPercentage = useMemo(
    () => ((activeStepIndex + 1) / steps.length) * 100,
    [activeStepIndex],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Preparing onboarding…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <Card className="p-6">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Unable to load onboarding."}
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const step = steps[activeStepIndex];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{step.label}</h1>
          <p className="text-sm text-muted-foreground">
            Step {activeStepIndex + 1} of {steps.length}
          </p>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {step.id === "photos" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <button
                  key={index}
                  className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary"
                >
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">Add at least 2 photos to continue</p>
          </div>
        )}

        {step.id === "details" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formState.age}
                onChange={(event) => setFormState((prev) => ({ ...prev, age: event.target.value }))}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="New York, NY"
                value={formState.location}
                onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell people about yourself..."
                value={formState.bio}
                onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
                rows={4}
              />
            </div>
          </div>
        )}

        {step.id === "interests" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select at least 3 interests</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant={formState.selectedInterests.includes(interest) ? "default" : "outline"}
                  className="min-h-[36px] cursor-pointer px-4"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {activeStepIndex > 0 && (
            <Button variant="outline" onClick={handleBack} className="min-h-[48px]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <Button onClick={() => void handleNext()} className="flex-1 min-h-[48px]">
            {activeStepIndex === steps.length - 1 ? "Complete" : "Next"}
            {activeStepIndex < steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
