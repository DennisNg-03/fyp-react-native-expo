import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import {
	PropsWithChildren,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

type AuthData = {
	session: Session | null;
	role: string | null;
};

const AuthContext = createContext<AuthData>({
	session: null,
	role: null,
});

export default function AuthProvider({ children }: PropsWithChildren) {
	const [session, setSession] = useState<Session | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [initialising, setInitialising] = useState(true);

	useEffect(() => {
		console.log("Auth Provider is mounted!");

		// fetch initial session and role
		const fetchSessionAndRole = async () => {
			const { data } = await supabase.auth.getSession();
			setSession(data.session);

			if (data.session?.user) {
				await fetchRole(data.session.user.id);
			} else {
				setRole(null);
			}
			setInitialising(false);
		};

		const fetchRole = async (userId: string) => {
			const { data: profile, error } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", userId)
				.single();

			if (error) {
				console.error("Error fetching profile role:", error);
				setRole(null);
			} else {
				setRole(profile?.role ?? null);
			}
		};

		// call it once on mount
		fetchSessionAndRole();

		// subscribe to auth changes
		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, newSession) => {
				console.log("Auth state changed:", _event, newSession);
				setSession(newSession);

				if (newSession?.user) {
					fetchRole(newSession.user.id);
				} else {
					setRole(null); // this is key! reset role on logout
				}
			}
		);

		// cleanup listener on unmount
		return () => {
			listener.subscription.unsubscribe();
		};
	}, []);

	if (initialising) {
		return <ActivityIndicator />;
	}

	return (
		<AuthContext.Provider value={{ session, role }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
