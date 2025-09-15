import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Notification } from "@/types/notification";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
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

	// useEffect(() => {
	// 	const fetchNotifications = async () => {
	// 		const { data, error } = await supabase
	// 			.from("notifications")
	// 			.select("*")
	// 			.eq("user_id", session?.user.id)
	// 			.order("created_at", { ascending: false });

	// 		if (error) console.error("Failed to fetch notifications:", error);
	// 		else setNotifications(data ?? []);
	// 	};

	// 	if (session?.user.id) fetchNotifications();
	// }, [session?.user.id]);

	const fetchNotifications = async () => {
		const { data, error } = await supabase
			.from("notifications")
			.select("*")
			.eq("user_id", session?.user.id)
			.order("created_at", { ascending: false });

		if (error) console.error("Failed to fetch notifications:", error);
		else setNotifications(data ?? []);
	};

	useEffect(() => {
		if (!session?.user.id) return;

		const subscription = supabase
			.channel("notifications")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "notifications",
					filter: `user_id=eq.${session.user.id}`,
				},
				(payload) => {
					fetchNotifications(); // re-fetch whenever change occurs
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(subscription);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user.id]);

	const unreadCount = notifications.filter((n) => !n.read_at).length;

	const AppHeader = ({ role }: { role: string | null }) => {
		return (
			<>
				<View
					style={{
						padding: 16,
						borderRadius: 12,
						backgroundColor: theme.colors.surface,
						alignItems: "center",
					}}
				>
					<Image
						source={require("../../assets/images/fyp-logo-1-removebg-preview.png")}
						style={{
							height: 150,
							width: "100%",
							// alignSelf: "center",
							resizeMode: "cover",
							// marginBottom: 8,
						}}
					/>
					<Text
						style={{
							color: theme.colors.primary,
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
			</>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.containerContent}
			>
				<AppHeader role={role} />
				<View style={styles.homePageContainer}>
					{role === "patient" && (
						<PatientHome
							notifications={notifications}
							unreadCount={unreadCount}
						/>
					)}
					{role === "doctor" && <DoctorHome />}
					{role === "nurse" && <NurseHome />}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const PatientHome = ({
	notifications,
	unreadCount,
}: {
	notifications: Notification[];
	unreadCount: number;
}) => {
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
					style={[styles.quickCard, styles.card]}
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
					style={[styles.quickCard, styles.card]}
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
				style={[styles.fullCard, styles.card]}
				onPress={() => router.push("/patient-appointment")}
			>
				<Card.Content style={styles.quickCardContent}>
					<Avatar.Icon size={40} icon="calendar-cursor" />
					<Text variant="titleMedium" style={styles.cardTitle}>
						Upcoming Appointments
					</Text>
				</Card.Content>
			</Card>

			<Card style={[styles.fullCard, styles.card]}>
				<Card.Content>
					<Text variant="titleMedium" style={styles.notificationHeader}>
						Notifications Summary
					</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						You have {unreadCount} unread notification
						{unreadCount !== 1 ? "s" : ""}.
					</Text>
					{unreadCount > 0 && (
						<Badge style={styles.unreadDot}>
							{unreadCount >= 10 ? "9+" : unreadCount}
						</Badge>
					)}
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
						onPress={() => router.replace("/profile/notification")}
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
					style={[styles.quickCard, styles.card]}
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
					style={[styles.quickCard, styles.card]}
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
				style={[styles.fullCard, styles.card]}
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
			<Card
				style={[styles.fullCard, styles.card]}
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
				style={[styles.fullCard, styles.card]}
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
		// flexGrow: 1,
		padding: 16,
		paddingBottom: 32,
		// paddingTop: 150,
		// justifyContent: "flex-start",
	},
	homePageContainer: {
		// marginTop: 50,
	},
	// containerBody: {
	// 	flex: 1,
	// 	justifyContent: "center",
	// },
	sectionHeader: {
		marginBottom: 16,
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
	card: {
		// marginBottom: 12,
		borderRadius: 12,
		backgroundColor: "white",
		elevation: 4,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},
	quickCard: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		paddingVertical: 10,
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
		paddingVertical: 10,
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
	unreadDot: {
		position: "absolute",
		top: 16,
		right: 16,
		backgroundColor: "#D32F2F",
		// color: "white",
	},
	// footerLogo: {
	// 	height: 150,
	// 	width: "100%",
	// 	resizeMode: "contain",
	// 	borderRadius: 12,
	// },
});
