import * as React from "react";
import * as RRD from "react-router-dom";
import { ArrowLeft, MessageCircle, Shield, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help = () => {
  const navigate = RRD.useNavigate();

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
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Help</h2>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              <Shield className="h-4 w-4 mr-2" />
              Safety Tips
            </Button>
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              <Settings className="h-4 w-4 mr-2" />
              Account Help
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I create a profile?</AccordionTrigger>
              <AccordionContent>
                After signing up, you'll be guided through our onboarding process where you can add photos, write your bio, and select your interests.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How does matching work?</AccordionTrigger>
              <AccordionContent>
                Browse through posts in your feed. When you like someone's post and they like yours back, it's a match! You can then start chatting.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How do I report someone?</AccordionTrigger>
              <AccordionContent>
                You can report any user by going to their profile and tapping the report button. We take safety seriously and review all reports.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I change my location?</AccordionTrigger>
              <AccordionContent>
                Yes! Go to Settings → Edit Profile to update your location. Your distance preferences can be adjusted in Profile → Distance Preference.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>How do I delete my account?</AccordionTrigger>
              <AccordionContent>
                Go to Settings → Delete Account. Please note this action is permanent and cannot be undone.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </main>
    </div>
  );
};

export default Help;
