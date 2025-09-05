import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

import { ActivityIndicator } from "@/components/ActivityIndicator";
import AuthProvider from "@/providers/AuthProvider";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { KeyboardAvoidingView, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
	// const myTheme = useTheme();
	// const themeMode = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;

	const colorScheme = useColorScheme();
	const { theme } = useMaterial3Theme();
	const baseTheme =
		colorScheme === "dark"
			? { ...MD3DarkTheme, colors: theme.dark }
			: { ...MD3LightTheme, colors: theme.light };

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const paperTheme = {
		...baseTheme,
		roundness: 10,
		colors: {
			...baseTheme.colors,
			tertiary: baseTheme.colors.background, // Apply the default background colour, the rest of the system will depend on this as background
			background: baseTheme.colors.onPrimary, // React-native-paper-dropdown's field bg colour depends on this
			// surfaceVariant: baseTheme.colors.surface,
			// onSurfaceVariant: baseTheme.colors.surface,
			// secondary: baseTheme.colors.surface,
			// secondaryContainer: baseTheme.colors.surface,
			// surface: baseTheme.colors.surface,
			// tertiaryContainer: baseTheme.colors.surface,
		},
	};

	// const theme = {
	// 	...themeMode,
	// 	colors: {
	// 		...myTheme.colors,
	// 		background: myTheme.colors.onPrimary,
	// 	}
	// };

	// if (!loaded) {
	// 	return <ActivityIndicator />;
	// }
	return (
		<SafeAreaProvider>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={-80} // Temporary fix for undesired white space on top of keyboard
			>
				<GestureHandlerRootView>
					<PaperProvider theme={paperTheme}>
						<ThemeProvider
							value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
						>
							<AuthProvider>
								<Stack>
									<Stack.Screen
										name="(tabs)"
										options={{ headerShown: false }}
									/>
									<Stack.Screen name="index" options={{ headerShown: false }} />
									<Stack.Screen name="login" options={{ headerShown: false }} />
									<Stack.Screen
										name="register"
										options={{ headerShown: false }}
									/>
									<Stack.Screen name="+not-found" />
								</Stack>
							</AuthProvider>
							{!loaded && <ActivityIndicator />}
						</ThemeProvider>
					</PaperProvider>
				</GestureHandlerRootView>
			</KeyboardAvoidingView>
		</SafeAreaProvider>
	);
}
