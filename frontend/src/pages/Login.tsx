import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authGoogleStart } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { url } = await authGoogleStart();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-chat-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="border border-border/60 rounded-xl p-6 bg-background/80 dark:bg-background/60 backdrop-blur shadow-sm">
          <div className="flex items-center justify-center mb-3">
            <img src="/app-logo.svg" alt="MailChat" className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold mb-4 text-center">Welcome to MailChat</h2>
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90" onClick={handleGoogle} disabled={loading}>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
