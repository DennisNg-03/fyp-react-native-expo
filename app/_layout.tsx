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
	// const myTheme = useTheme();
	const themeMode = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;
	// const [initialising, setInitialising] = useState(true);
	// const [user, setUser] = useState<User | null>(null);

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const theme = {
		...themeMode,
		// colors: {
		// 	...myTheme.colors,
		// 	background: myTheme.colors.onPrimary,
		// }
	};

	// if (!loaded) {
	// 	return <ActivityIndicator />;
	// }

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
						{!loaded && (
							<ActivityIndicator />
						)}
					</ThemeProvider>
				</PaperProvider>
			</KeyboardAvoidingView>
		</SafeAreaProvider>
	);
}
