import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken, authGoogleCallback } from "@/lib/api";

export default function AuthCallback() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const access_token = search.get("access_token");
    const is_new = search.get("is_new");
    
    try {
      if (access_token) {
        // Direct token from backend redirect
        saveToken(access_token);
        navigate(is_new === "true" ? "/onboarding" : "/");
        return;
      }
      
      // Fallback: check for code parameter (old flow)
      const code = search.get("code");
      if (code) {
        (async () => {
          try {
            const res = await authGoogleCallback(code);
            saveToken(res.access_token);
            navigate(res.is_new ? "/onboarding" : "/");
          } catch (e: any) {
            setError(e?.message || "Login failed");
          }
        })();
        return;
      }
      
      setError("Missing parameters.");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    }
  }, [search, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Signing you in...</p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
