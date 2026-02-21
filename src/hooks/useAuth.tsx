import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  // Bypass authentication - return mock user
  const mockUser = {
    id: "dev-user-id",
    email: "dev@example.com",
  } as User;

  const [user] = useState<User | null>(mockUser);
  const [loading] = useState(false);

  const signOut = async () => {
    // No-op for dev mode
    console.log("Sign out bypassed in dev mode");
  };

  return { user, loading, signOut };
};
