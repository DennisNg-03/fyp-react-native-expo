import { ActivityIndicator } from "@/components/ActivityIndicator";
import { auth, db } from "@/lib/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

export type UserRole = "doctor" | "nurse" | "patient" | "guardian" | null;

interface UserContextProps {
	user: User | null;
	role: UserRole;
}

const UserContext = createContext<UserContextProps>({
	user: null,
	role: null,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [role, setRole] = useState<UserRole>(null);
	const [initialising, setinitialising] = useState(true);
	const pathname = usePathname();
	const [redirected, setRedirected] = useState(false);

	// Auth state listener
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			// console.log("[AuthStateChanged] Triggered. User:", firebaseUser);
			setUser(firebaseUser);
			if (firebaseUser) {
				console.log(
					`[AuthStateChanged] User logged in. UID: ${firebaseUser.uid}`
				);

				try {
					const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
					if (docSnap.exists()) {
						const fetchedRole = docSnap.data().role as string;
						console.log("[AuthStateChanged] Role fetched:", fetchedRole);
						await AsyncStorage.setItem("userRole", fetchedRole); // Save role via reactNativePersistence
						setRole(fetchedRole as UserRole);
					} else {
						console.log("docSnap not exist!");
					}
				} catch (err) {
					console.error("Error fetching user role", err);
				}
			} else {
				console.log("[AuthStateChanged] No user logged in.");
				await AsyncStorage.removeItem("userRole");
				setRole(null);
			}
			setinitialising(false);
			console.log("[AuthStateChanged] Finished initialising.");
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		console.log(
			"[UserProvider] useEffect on 'user', 'pathname', 'redirected' change:"
		);
		if (!user) {
			setRedirected(false);
		}

		if (!initialising && user && pathname !== "/(tabs)/home" && !redirected) {
			console.log("[UserProvider] User exists → Navigating to /home");
			setRedirected(true);
			router.replace("/(tabs)/homeScreen");
		}
	}, [user, initialising, pathname, redirected]);

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
