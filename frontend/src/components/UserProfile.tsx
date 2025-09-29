import { useState, useEffect } from "react";
import { User, Edit3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMe, updateProfile, clearToken } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      setDisplayName(userData.display_name || "");
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      await loadUserProfile(); // Reload user data
      setShowEditProfile(false);
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    window.location.href = "/";
  };

  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="hover:bg-primary/10">
        <User className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-gradient-to-br from-gmail-red to-gmail-blue text-white text-xs">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.display_name || "No name set"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowEditProfile(true)}>
            <Edit3 className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-gmail-red to-gmail-blue text-white text-xl font-semibold">
                  {getInitials(displayName) || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground text-center">
                Avatar generated from your initials
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="text-center"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="text-center bg-muted"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditProfile(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={!displayName.trim() || loading}
                className="flex-1 bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}