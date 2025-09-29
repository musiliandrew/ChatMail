import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Splash() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!accepted) return;
    localStorage.setItem("mc_consent", "yes");
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-chat-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg text-center">
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3">
            <img src="/app-logo.svg" alt="MailChat" className="h-10 w-10" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-gmail-red to-gmail-blue bg-clip-text text-transparent">
              MailChat
            </h1>
          </div>
          <p className="mt-3 italic text-sm text-muted-foreground">Identify Fast, Lets Chat !</p>
        </div>

        <div className="mx-auto max-w-md border border-border/60 rounded-xl p-6 bg-background/80 dark:bg-background/60 backdrop-blur text-left space-y-5 shadow-sm">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={accepted}
              onCheckedChange={(v)=>setAccepted(Boolean(v))}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label htmlFor="consent" className="text-sm leading-6 text-foreground">
              I agree to the Terms and Privacy Policy. I understand email is used as my identity and
              I may be contacted by email for app functionality.
            </label>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-gmail-red to-gmail-blue hover:opacity-90"
            onClick={handleContinue}
            disabled={!accepted}
          >
            Continue
          </Button>
        </div>

        <div className="mt-12 text-xs text-muted-foreground">
          Developed by {" "}
          <a className="underline hover:text-foreground" href="https://portfolio-ik-k1i1.vercel.app/" target="_blank" rel="noreferrer">
            Musili Andrew
          </a>
        </div>
      </div>
    </div>
  );
}
