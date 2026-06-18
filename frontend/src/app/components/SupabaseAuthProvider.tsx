"use client";
import React, { useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { usePipelineStore } from "../../store/pipelineStore";

export default function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = usePipelineStore();

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          isLoggedIn: true,
          role: session.user.email === "adityakakad10@gmail.com" ? "admin" : "user",
        };
        localStorage.setItem("cleanml_user", JSON.stringify(user));
        setUser(user);
      } else {
        localStorage.removeItem("cleanml_user");
        setUser(null);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user = {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          isLoggedIn: true,
          role: session.user.email === "adityakakad10@gmail.com" ? "admin" : "user",
        };
        localStorage.setItem("cleanml_user", JSON.stringify(user));
        setUser(user);
      } else {
        localStorage.removeItem("cleanml_user");
        setUser(null);
      }

      if (event === "PASSWORD_RECOVERY") {
        // Redirect to password reset page
        window.location.href = "/reset-password";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return <>{children}</>;
}
