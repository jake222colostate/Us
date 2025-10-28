import { ArrowLeft, Shield, AlertTriangle, Phone, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Safety = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Safety Center</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Your Safety Matters
              </h2>
              <p className="text-sm text-muted-foreground">
                We're committed to creating a safe environment for everyone. Here are some tips to help you stay safe while using our app.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Protect Your Privacy</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                <li>• Don't share personal information too quickly</li>
                <li>• Be cautious about sharing your full name, address, or workplace</li>
                <li>• Keep financial information private</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Watch for Red Flags</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                <li>• Someone asking for money</li>
                <li>• Avoiding meeting in person</li>
                <li>• Inconsistent stories or behavior</li>
                <li>• Pressuring you to move off the app quickly</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Meeting Safely</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-8">
                <li>• Meet in public places</li>
                <li>• Tell a friend where you're going</li>
                <li>• Arrange your own transportation</li>
                <li>• Trust your instincts</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <Button className="w-full min-h-[48px]">
            Report a Safety Concern
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Safety;
