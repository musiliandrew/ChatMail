import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
