import { Navigate } from "react-router-dom";

export default function RequireConsent({ children }: { children: JSX.Element }) {
  const consent = typeof window !== 'undefined' ? localStorage.getItem("mc_consent") : null;
  if (!consent) {
    return <Navigate to="/splash" replace />;
  }
  return children;
}
