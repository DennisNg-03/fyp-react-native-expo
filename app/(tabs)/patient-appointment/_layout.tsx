import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function PatientAppointmentLayout() {
	const theme = useTheme();
	return (
		// intialRouteName is to prevent entering Details page when clicking tab bar button
		<Stack
			initialRouteName="index"
			screenOptions={{
				headerShown: false,
				headerStyle: {
					backgroundColor: "#5f1991ff", // background colour of header
				},
				headerTintColor: theme.colors.onSecondary, // text/icon colour
				headerTitleStyle: {
					fontWeight: "bold",
					fontSize: 18,
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{ title: "My Appointments", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{ title: "Appointment Details", headerShown: true }}
			/>
		</Stack>
	);
}
