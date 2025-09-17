import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Redirect, router, Tabs } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const { session, role } = useAuth();

	useEffect(() => {
		const registerPushToken = async () => {
			if (!session?.user.id) return;

			// Ask for permissions
			const { status } = await Notifications.requestPermissionsAsync();
			if (status !== "granted") {
				console.log("Push notification permissions not granted");
				return;
			}

			// Get Expo token
			const { data: tokenData } = await Notifications.getExpoPushTokenAsync();
			const pushToken = tokenData;

			if (!pushToken) return;
			// console.log("Expo push token:", pushToken);

			// Save / update token in Supabase
			await supabase.from("user_device_tokens").upsert({
				user_id: session.user.id,
				token: pushToken,
			});
		};

		registerPushToken();
	}, [session?.user.id]);
	console.log("Logged in role:", role);

	useEffect(() => {
		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowBanner: true,
				shouldShowList: true,
				shouldPlaySound: true,
				shouldSetBadge: true,
			}),
		});
	}, []);

	Notifications.addNotificationReceivedListener((notification) => {
		console.log("Foreground notification:", notification);
	});

	Notifications.addNotificationResponseReceivedListener((response) => {
		console.log(
			"Tapped notification:",
			response.notification.request.content.data
		);
		const { appointment_id, type } = response.notification.request.content.data;

		if (typeof appointment_id === "string") {
			if (
				type === "appointment_accepted" ||
				type === "appointment_rejected" ||
				type === "appointment_reminder_today" ||
				type === "appointment_reminder_2days"
			) {
				router.push(`/(tabs)/patient-appointment/${appointment_id}`);
			}
		} else {
			console.warn("Invalid appointment_id:", appointment_id);
		}
	});

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
				animation: "fade",
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
					title: "Appointments",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-month"
							size={28}
							color={color}
						/>
					),
					href: role === "patient" ? "/patient-appointment" : null,
				}}
				listeners={({ navigation }) => ({
					// *** This code prevents the stack flickering issue when clicking tab button on Details page
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
					title: "Booking",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-clock"
							size={28}
							color={color}
						/>
					),
					href: role === "patient" ? "/patient-appointment-booking" : null,
				}}
			/>
			<Tabs.Screen
				name="doctor-appointment"
				options={{
					title: "Appointments",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-month"
							size={28}
							color={color}
						/>
					),
					href: role === "doctor" ? "/doctor-appointment" : null,
				}}
				listeners={({ navigation }) => ({
					// *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log("Already on Schedules tab – ignoring re-press.");
							router.replace("/(tabs)/doctor-appointment"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="doctor-appointment-request"
				options={{
					title: "Requests",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="calendar-edit"
							size={28}
							color={color}
						/>
					),
					href:
						role === "doctor" || role === "nurse"
							? "/doctor-appointment-request"
							: null,
				}}
				listeners={({ navigation }) => ({
					// *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log("Already on Schedules tab – ignoring re-press.");
							router.replace("/(tabs)/doctor-appointment-request"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="medical-record"
				options={{
					title: role === "patient" ? "My Records" : "Past Records",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name={
								role === "patient"
									? "clipboard-text-outline"
									: "clipboard-text-search-outline"
							}
							size={28}
							color={color}
						/>
					),
					href: "/medical-record",
					// href: role === "patient" ? "/patient-medical-record" : null,
				}}
				listeners={({ navigation }) => ({
					// *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log("Already on Schedules tab – ignoring re-press.");
							router.replace("/(tabs)/medical-record"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "My Profile",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="account-circle"
							size={28}
							color={color}
						/>
					),
					href: "/(tabs)/profile",
				}}
				listeners={({ navigation }) => ({
					// *** This code prevents the stack flickering issue when clicking tab button on Details page
					tabPress: (e) => {
						if (navigation.isFocused()) {
							e.preventDefault();
							console.log("Already on My Profiles tab – ignoring re-press.");
							router.replace("/(tabs)/profile"); // MUST use router.replace here, otherwise it will form a long list of nav routes, making Back function not working
						}
					},
				})}
			/>
			{/* <Tabs.Screen
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
					href:
						role === "doctor" || role === "nurse"
							? "/doctor-availability"
							: null,
				}}
			/> */}
		</Tabs>
	);
}
