import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function ProfileLayout() {
	const theme = useTheme();
	return (
		// intialRouteName is to prevent entering Details page when clicking tab bar button
		<Stack
			initialRouteName="index"
			screenOptions={{
				headerShown: false,
				headerStyle: {
					backgroundColor: theme.colors.primaryContainer, // background colour of header
				},
				headerTintColor: theme.colors.primary, // text/icon colour
				headerTitleStyle: {
					// fontWeight: "bold",
					fontSize: 18,
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{ title: "My Profile", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{ title: "", headerShown: true }}
			/>
			<Stack.Screen
				name="notification"
				options={{ title: "Notifications", headerShown: true }}
			/>
			<Stack.Screen
				name="privacy"
				options={{ title: "Privacy Settings", headerShown: true }}
			/>
		</Stack>
	);
}
