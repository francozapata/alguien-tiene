"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getOrCreateProfile } from "@/services/profiles";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

const PUBLIC_PATHS = ["/legal/terminos", "/legal/privacidad", "/legal/seguridad", "/figus/tyc"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const profile = await getOrCreateProfile(firebaseUser);
          const needsTerms = !profile.terms_accepted || !profile.is_adult_confirmed;

          if (needsTerms && !PUBLIC_PATHS.some((path) => pathname?.startsWith(path))) {
            router.push("/figus/tyc");
          }
        } catch (error) {
          console.error("No se pudo sincronizar el perfil:", error);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [router, pathname]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
