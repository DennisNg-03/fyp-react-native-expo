import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type UserRole = "doctor" | "nurse" | "patient" | "guardian" | null;

interface UserContextProps {
  user: any | null; // Supabase user object
  role: UserRole;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  role: null,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [initialising, setInitialising] = useState(true);
  const pathname = usePathname();
  const [redirected, setRedirected] = useState(false);

  // Auth state listener
  useEffect(() => {
    console.log("[AuthStateChanged] Setting up listener...");

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user ?? null;
      setUser(supabaseUser);

      if (supabaseUser) {
        console.log(`[AuthStateChanged] User logged in. ID: ${supabaseUser.id}`);

        try {
          // Fetch role from profiles (or users) table
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", supabaseUser.id)
            .single();

          if (error) {
            console.error("Error fetching user role", error);
          } else if (data?.role) {
            console.log("[AuthStateChanged] Role fetched:", data.role);
            await AsyncStorage.setItem("userRole", data.role);
            setRole(data.role as UserRole);
          }
        } catch (err) {
          console.error("Error fetching user role", err);
        }
      } else {
        console.log("[AuthStateChanged] No user logged in.");
        await AsyncStorage.removeItem("userRole");
        setRole(null);
      }

      setInitialising(false);
      console.log("[AuthStateChanged] Finished initialising.");
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Redirect logic
  useEffect(() => {
    console.log("[UserProvider] useEffect triggered for redirect logic");

    if (!user) {
      setRedirected(false);
    }

    if (!initialising && user && pathname !== "/(tabs)/home" && !redirected) {
      console.log("[UserProvider] User exists → Navigating to /home");
      setRedirected(true);
      router.replace("/(tabs)/home");
    }
  }, [user, initialising, pathname, redirected]);

  // Load cached role
  useEffect(() => {
    console.log("loadCacheRole useEffect triggered!");
    const loadCachedRole = async () => {
      const cachedRole = await AsyncStorage.getItem("userRole");
      if (cachedRole) {
        console.log("[UserProvider] Loaded cached role:", cachedRole);
        setRole(cachedRole as UserRole);
      }
    };
    loadCachedRole();
  }, []);

  if (initialising) {
    return <ActivityIndicator />;
  }

  return (
    <UserContext.Provider value={{ user, role }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);