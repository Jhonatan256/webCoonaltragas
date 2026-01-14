import { useContext } from "react";
import AuthContext from "./_internalAuthContext";

export default function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
