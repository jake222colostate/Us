import { ArrowLeft, Bell, Shield, Eye, LogOut, Trash2, Users, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    likes: false,
  });
  const [genderPreferences, setGenderPreferences] = useState(() => {
    const saved = localStorage.getItem('genderPreferences');
    return saved ? JSON.parse(saved) : { showMen: true, showWomen: true };
  });

  useEffect(() => {
    localStorage.setItem('genderPreferences', JSON.stringify(genderPreferences));
  }, [genderPreferences]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 safe-top flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            className="min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">Choose your theme</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Show Me</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Men</p>
                <p className="text-sm text-muted-foreground">Show men in your feed</p>
              </div>
              <Switch
                checked={genderPreferences.showMen}
                onCheckedChange={(checked) => 
                  setGenderPreferences({ ...genderPreferences, showMen: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Women</p>
                <p className="text-sm text-muted-foreground">Show women in your feed</p>
              </div>
              <Switch
                checked={genderPreferences.showWomen}
                onCheckedChange={(checked) => 
                  setGenderPreferences({ ...genderPreferences, showWomen: checked })
                }
              />
            </div>

            {!genderPreferences.showMen && !genderPreferences.showWomen && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                ⚠️ Please select at least one option to see profiles
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Matches</p>
                <p className="text-sm text-muted-foreground">Get notified about new matches</p>
              </div>
              <Switch
                checked={notifications.matches}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, matches: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Messages</p>
                <p className="text-sm text-muted-foreground">Get notified about new messages</p>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, messages: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Likes</p>
                <p className="text-sm text-muted-foreground">Get notified when someone likes you</p>
              </div>
              <Switch
                checked={notifications.likes}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, likes: checked })
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Privacy & Safety</h2>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start min-h-[48px]"
              onClick={() => navigate('/safety')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Safety Center
            </Button>
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              <Eye className="h-4 w-4 mr-2" />
              Block List
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start min-h-[48px]"
              onClick={() => navigate('/help')}
            >
              Help & Support
            </Button>
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              Terms of Service
            </Button>
            <Button variant="ghost" className="w-full justify-start min-h-[48px]">
              Privacy Policy
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[48px]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[48px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
