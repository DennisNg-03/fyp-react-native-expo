import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function MedicalRecordLayout() {
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
				options={{ title: "Medical Records", headerShown: false }}
			/>
			<Stack.Screen
				name="record-details"
				options={{ title: "Record Details", headerShown: true }}
			/>
		</Stack>
	);
}
