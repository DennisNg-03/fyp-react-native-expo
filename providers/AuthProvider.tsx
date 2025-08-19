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
		const fetchSessionAndRole = async () => {
			const { data } = await supabase.auth.getSession();
			console.log("Fetched session data:", data);
			setSession(data.session);
			setInitialising(false);

			if (data.session?.user) {
				const { data: profile, error } = await supabase
					.from("profiles")
					.select("role")
					.eq("id", data.session.user.id)
					.single();

				if (error) {
					console.error("Error fetching profile role:", error);
				} else {
					setRole(profile?.role ?? null);
				}
			}
		};

		fetchSessionAndRole();
		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
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
