import { Navigate } from "react-router-dom";
import { ChatLayout } from "@/components/ChatLayout";

export default function RootGate() {
  const consent = typeof window !== 'undefined' ? localStorage.getItem("mc_consent") : null;
  if (!consent) return <Navigate to="/splash" replace />;

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
  if (!token) return <Navigate to="/login" replace />;

  return <ChatLayout />;
}
