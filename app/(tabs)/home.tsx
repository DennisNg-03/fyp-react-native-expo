import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Notification } from "@/types/notification";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();

	const [notifications, setNotifications] = useState<Notification[]>([]);

	useEffect(() => {
		const fetchNotifications = async () => {
			const { data, error } = await supabase
				.from("notifications")
				.select("*")
				.eq("user_id", session?.user.id)
				.order("created_at", { ascending: false })
				.limit(5);

			if (error) console.error("Failed to fetch notifications:", error);
			else setNotifications(data ?? []);
		};

		if (session?.user.id) fetchNotifications();
	}, [session?.user.id]);

	const AppHeader = ({ role }: { role: string | null }) => {
		return (
			<View
				style={{
					padding: 16,
					borderRadius: 12,
					marginBottom: 16,
					backgroundColor: theme.colors.primary,
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					margin: 16,
				}}
			>
				<Text
					style={{
						color: theme.colors.onPrimary,
						fontWeight: "800",
						fontSize: 24,
						marginBottom: 6,
					}}
				>
					MediNexis
				</Text>
				<Text
					style={{
						color: theme.colors.onPrimary,
						fontWeight: "500",
						fontSize: 14,
					}}
				>
					Welcome,{" "}
					{role === "doctor"
						? "Doctor"
						: role === "nurse"
						? "Nurse"
						: "Patient"}
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.containerContent}
			>
				<AppHeader role={role} />
				{role === "patient" && <PatientHome notifications={notifications} />}
				{role === "doctor" && <DoctorHome />}
				{role === "nurse" && <NurseHome />}
			</ScrollView>
		</SafeAreaView>
	);
}

const PatientHome = ({ notifications }: { notifications: Notification[] }) => {
	// const upcomingAppointment = notifications.find((n) =>
	// 	n.title.toLowerCase().includes("appointment")
	// );

	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			<View style={styles.quickActionsRow}>
				<Card
					style={styles.quickCard}
					onPress={() => router.push("/medical-record")}
				>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="clipboard-text-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							My Records
						</Text>
					</Card.Content>
				</Card>
				<Card
					style={styles.quickCard}
					onPress={() => router.push("/patient-appointment-booking")}
				>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="calendar-clock-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Book Appointment
						</Text>
					</Card.Content>
				</Card>
			</View>

			<Card
				style={styles.fullCard}
				onPress={() => router.push("/patient-appointment")}
			>
				<Card.Content style={styles.quickCardContent}>
					<Avatar.Icon size={40} icon="calendar-cursor" />
					<Text variant="titleMedium" style={styles.cardTitle}>
						Upcoming Appointments
					</Text>
				</Card.Content>
			</Card>

			<Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.notificationHeader}>
						Notifications Summary
					</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						You have {notifications.length} new notification
						{notifications.length !== 1 ? "s" : ""}.
					</Text>
					<Badge style={styles.badge}>{notifications.length}</Badge>
					{/* {upcomingAppointment ? (
						<View>
							<Text variant="titleMedium" style={{ marginTop: 12 }}>
								Next Appointment Notification
							</Text>
							<Text variant="bodyMedium" style={styles.subText}>
								{upcomingAppointment.title}
							</Text>
							<Text variant="bodySmall" style={{ color: "gray" }}>
								{upcomingAppointment.body}
							</Text>
						</View>
					) : null} */}
					<Button
						mode="text"
						style={{ marginTop: 4, alignSelf: "center" }}
						onPress={() => router.push("/profile/notification")}
						contentStyle={{ margin: 0 }}
						labelStyle={{ marginHorizontal: 15, marginVertical: 4 }}
					>
						View All
					</Button>
				</Card.Content>
			</Card>
		</>
	);
};

const DoctorHome = () => {
	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			<View style={styles.quickActionsRow}>
				<Card
					style={styles.quickCard}
					onPress={() => router.push("/medical-record")}
				>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="clipboard-text-search-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							View Patient Records
						</Text>
					</Card.Content>
				</Card>
				<Card
					style={styles.quickCard}
					onPress={() => router.push("/doctor-appointment")}
				>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="calendar-multiselect" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Manage Appointments
						</Text>
					</Card.Content>
				</Card>
			</View>
			<Card
				style={styles.fullCard}
				onPress={() => router.push("/doctor-appointment-request")}
			>
				<Card.Content style={styles.quickCardContent}>
					<Avatar.Icon size={40} icon="calendar-edit" />
					<Text variant="titleMedium" style={styles.cardTitle}>
						Review Appointment Booking & Rescheduling Requests
					</Text>
				</Card.Content>
			</Card>

			{/* <Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.notificationHeader}>Notifications Summary</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						You have 2 new appointment requests.
					</Text>
					<Badge style={styles.badge}>2</Badge>
				</Card.Content>
			</Card> */}
		</>
	);
};

const NurseHome = () => {
	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			{/* <View style={styles.quickActionsRow}>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="clipboard-text-search" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							View Patient Records
						</Text>
					</Card.Content>
				</Card>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="calendar-month-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Monitor Appointments
						</Text>
					</Card.Content>
				</Card>
			</View> */}
			<Card
				style={styles.fullCard}
				onPress={() => router.push("/medical-record")}
			>
				<Card.Content style={styles.quickCardContent}>
					<Avatar.Icon size={40} icon="clipboard-text-search" />
					<Text variant="titleMedium" style={styles.cardTitle}>
						View Patient Records
					</Text>
				</Card.Content>
			</Card>
			<Card
				style={styles.fullCard}
				onPress={() => router.push("/doctor-appointment-request")}
			>
				<Card.Content style={styles.quickCardContent}>
					<Avatar.Icon size={40} icon="calendar-edit" />
					<Text variant="titleMedium" style={styles.cardTitle}>
						Review Appointment Booking & Rescheduling Requests
					</Text>
				</Card.Content>
			</Card>

			{/* <Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.notificationHeader}>Notifications Summary</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						1 urgent appointment requires attention.
					</Text>
					<Badge style={styles.badge}>1</Badge>
				</Card.Content>
			</Card> */}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	containerContent: {
		flexGrow: 1,
		padding: 16,
		paddingBottom: 32,
		justifyContent: "center",
	},
	// containerBody: {
	// 	flex: 1,
	// 	justifyContent: "center",
	// },
	sectionHeader: {
		marginVertical: 16,
		fontWeight: "600",
		fontSize: 20,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
	notificationHeader: {
		marginBottom: 8,
		fontWeight: "600",
		fontSize: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
	quickActionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
		marginBottom: 16,
		alignItems: "stretch",
	},
	quickCard: {
		flex: 1,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
	},
	quickCardContent: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
	},
	cardTitle: {
		marginTop: 8,
		textAlign: "center",
		lineHeight: 20,
	},
	fullCard: {
		marginBottom: 16,
		borderRadius: 12,
		// paddingVertical: 8,
		// paddingHorizontal: 8,
	},
	subText: {
		marginTop: 4,
		marginBottom: 4,
		color: "grey",
		textAlign: "center",
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	badge: {
		position: "absolute",
		top: 16,
		right: 16,
		backgroundColor: "red",
		// color: "white",
	},
});
