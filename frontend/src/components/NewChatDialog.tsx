import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, UserPlus, Send } from "lucide-react";
import { createConversation, createInvite, userExists } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chatId: string) => void;
}

export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userExistsResult, setUserExistsResult] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if user exists when email changes
  useEffect(() => {
    if (!isValidEmail(email)) {
      setUserExistsResult(null);
      return;
    }

    const checkUser = async () => {
      setCheckingUser(true);
      try {
        const result = await userExists(email.trim());
        setUserExistsResult(result.exists);
      } catch (error) {
        setUserExistsResult(null);
      } finally {
        setCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(checkUser, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleCreateChat = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const convo = await createConversation({ participants: [email.trim()] });
      onChatCreated(convo.id);
      onOpenChange(false);
      setEmail("");
      setUserExistsResult(null);
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      toast({ title: "Error", description: error?.message || 'Failed to start conversation', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await createInvite(email.trim());
      toast({ title: "Invite sent", description: `We invited ${email.trim()} to join MailChat.` });
      onOpenChange(false);
      setEmail("");
      setUserExistsResult(null);
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      toast({ title: "Error", description: error?.message || 'Failed to send invite', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageCircle className="h-5 w-5 text-gmail-blue" />
            Start New Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-gmail-red to-gmail-blue flex items-center justify-center">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Enter any email address to start chatting or send an invite
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-base sm:text-sm h-12 sm:h-10"
            />
            {checkingUser && isValidEmail(email) && (
              <p className="text-xs text-muted-foreground">Checking user...</p>
            )}
            {userExistsResult !== null && isValidEmail(email) && !checkingUser && (
              <p className="text-xs text-muted-foreground">
                {userExistsResult ? "✓ User found - ready to message" : "✗ User not found - can send invite"}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 sm:h-10"
              disabled={loading}
            >
              Cancel
            </Button>
            
            {userExistsResult === true && (
              <Button
                onClick={handleCreateChat}
                disabled={!isValidEmail(email) || loading}
                className="flex-1 h-12 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Message"}
              </Button>
            )}
            
            {userExistsResult === false && (
              <Button
                onClick={handleSendInvite}
                disabled={!isValidEmail(email) || loading}
                className="flex-1 h-12 sm:h-10 bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Sending..." : "Invite"}
              </Button>
            )}
            
            {userExistsResult === null && isValidEmail(email) && !checkingUser && (
              <Button
                onClick={handleCreateChat}
                disabled={loading}
                className="flex-1 h-12 sm:h-10 bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90"
              >
                {loading ? "Checking..." : "Start Chat"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}