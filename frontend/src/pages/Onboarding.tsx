import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getMe, updateProfile } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        if (me.display_name) {
          navigate("/");
          return;
        }
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ display_name: name.trim() });
      navigate("/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-chat-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="border border-border rounded-xl p-6 bg-card/90 backdrop-blur shadow-sm">
          <div className="flex items-center justify-center mb-3">
            <img src="/app-logo.svg" alt="MailChat" className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold mb-4 text-center">Set up your profile</h2>
          
          <div className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-gmail-red to-gmail-blue text-white text-xl font-semibold">
                  {getInitials(name) || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground text-center">
                Your avatar will be generated from your initials
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your full name"
                className="text-center"
              />
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90" 
              onClick={handleSave} 
              disabled={loading || !name.trim()}
            >
              {loading ? "Setting up..." : "Save and Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
