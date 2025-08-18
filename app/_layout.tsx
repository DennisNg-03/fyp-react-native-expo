import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator } from "@/components/ActivityIndicator";
import { UserProvider } from "@/hooks/useUser";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const themeMode = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;
	// const [initialising, setInitialising] = useState(true);
	// const [user, setUser] = useState<User | null>(null);
	// const { user, role } = useUser();

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const theme = {
		...themeMode,
	};

	// Listen for auth state changes
	// useEffect(() => {
	//   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
	//     setUser(currentUser);
	//     if (initialising) setInitialising(false);
	//   });
	//   return unsubscribe;
	// }, []);

	// // Redirect if logged in successfully
	// useEffect(() => {
	//   if (user) {
	//     router.replace("/(tabs)/home");
	//   }
	// }, [user]);

	// useEffect(() => {
	// 	console.log("[UserProvider] useEffect on 'user' change:", user);

	// 	if (user) {
	// 		console.log("[UserProvider] User exists → Navigating to /home");
	// 		router.replace("/(tabs)/home");
	// 	} else {
	// 		console.log(
	// 			"[UserProvider] No user → Staying on current route or go to login"
	// 		);
	// 	}
	// }, [user]);

	// useEffect(() => {
	// 	if (user) {
	// 		router.replace("/(tabs)/home");
	// 	}
	// }, [user]);

	if (!loaded) {
		return <ActivityIndicator />;
	}

	return (
		<SafeAreaProvider>
			<PaperProvider theme={theme}>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<UserProvider>
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name="+not-found" />
						</Stack>
						<StatusBar style="auto" />
					</UserProvider>
				</ThemeProvider>
			</PaperProvider>
		</SafeAreaProvider>
	);
}
