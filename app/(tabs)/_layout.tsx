import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/providers/AuthProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, router, Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const { session, role } = useAuth();
	console.log("Logged in role:", role);

	// Redirect user to login page whenever session is null
	if (!session) {
		return <Redirect href={"/login"} />;
	}

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: { position: "absolute" },
					default: {},
				}),
				tabBarHideOnKeyboard: true,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons name="home" size={28} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="patient-appointment"
				options={{
					title: "My Appointments",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-month-outline"
							size={28}
							color={color}
						/>
					),
					href: role === "patient" ? "/patient-appointment" : null,
				}}
				listeners={({ navigation }) => ({ // *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log(
								"Already on My Appointments tab – ignoring re-press."
							);
							router.replace("/(tabs)/patient-appointment"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="patient-appointment-booking"
				options={{
					title: "Book Appointment",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-check"
							size={28}
							color={color}
						/>
					),
					href: role === "patient" ? "/patient-appointment-booking" : null,
				}}
			/>
			<Tabs.Screen
				name="patient-medical-record"
				options={{
					title: "My Records",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="clipboard-text-outline"
							size={28}
							color={color}
						/>
					),
					href: role === "patient" ? "/patient-medical-record" : null,
				}}
			/>
			<Tabs.Screen
				name="doctor-appointment"
				options={{
					title: "Appointments",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-clock"
							size={28}
							color={color}
						/>
					),
					href: role === "doctor" || role === "nurse" ? "/doctor-appointment" : null,
				}}
				listeners={({ navigation }) => ({ // *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log(
								"Already on Schedules tab – ignoring re-press."
							);
							router.replace("/(tabs)/doctor-appointment"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="doctor-appointment-request"
				options={{
					title: "Appointment Requests",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="inbox-arrow-down-outline"
							size={28}
							color={color}
						/>
					),
					href: role === "doctor" || role === "nurse" ? "/doctor-appointment-request" : null,
				}}
				listeners={({ navigation }) => ({ // *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log(
								"Already on Schedules tab – ignoring re-press."
							);
							router.replace("/(tabs)/doctor-appointment-request"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="doctor-medical-record"
				options={{
					title: "Patient Records",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="account-group-outline"
							size={28}
							color={color}
						/>
					),
					href:
						role === "doctor" || role === "nurse"
							? "/doctor-medical-record"
							: null,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "My Profile",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="account-circle-outline"
							size={28}
							color={color}
						/>
					),
				}}
				listeners={({ navigation }) => ({ // *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log(
								"Already on My Profiles tab – ignoring re-press."
							);
							router.replace("/(tabs)/profile"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="doctor-availability"
				options={{
					title: "Availability",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-clock"
							size={28}
							color={color}
						/>
					),
					// href: "/doctor-availability",
					href:
					  role === "doctor" || role === "nurse" ? "/doctor-availability" : null,
				}}
			/>
			{/* <Tabs.Screen
        name="test"
        options={{
          title: "Test",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="flask-outline" size={28} color={color} />
          ),
        }}
      /> */}
		</Tabs>
	);
}
