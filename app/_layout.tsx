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

import { ActivityIndicator } from "@/components/ActivityIndicator";
import AuthProvider from "@/providers/AuthProvider";
import { KeyboardAvoidingView, Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const themeMode = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;
	// const [initialising, setInitialising] = useState(true);
	// const [user, setUser] = useState<User | null>(null);

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
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<PaperProvider theme={theme}>
					<ThemeProvider
						value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
					>
						<AuthProvider>
							<Stack>
								<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
								<Stack.Screen name="+not-found" />
							</Stack>
							<StatusBar style="auto" />
						</AuthProvider>
					</ThemeProvider>
				</PaperProvider>
			</KeyboardAvoidingView>
		</SafeAreaProvider>
	);
}
