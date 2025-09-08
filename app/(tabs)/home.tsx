import { useAuth } from "@/providers/AuthProvider";
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
	const { role } = useAuth();

	const AppHeader = ({ role }: { role: string | null }) => {
		return (
			<View
				style={{
					padding: 16,
					borderRadius: 12,
					marginBottom: 16,
					backgroundColor: theme.colors.primary, // bold purple
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
				contentContainerStyle={styles.content}
			>
				<AppHeader role={role} />
				{role === "doctor" && <DoctorHome />}
				{role === "nurse" && <NurseHome />}
				{role === "patient" && <PatientHome />}
			</ScrollView>
		</SafeAreaView>
	);
}

const DoctorHome = () => {
	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			<View style={styles.quickActionsRow}>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="file-document-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Upload Records
						</Text>
					</Card.Content>
				</Card>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="calendar-clock" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Manage Appointments
						</Text>
					</Card.Content>
				</Card>
			</View>
			<Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium">Notifications</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						You have 2 new appointment requests.
					</Text>
					<Badge style={styles.badge}>2</Badge>
				</Card.Content>
			</Card>
		</>
	);
};

const NurseHome = () => {
	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			<View style={styles.quickActionsRow}>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="file-search-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Retrieve Records
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
			</View>
			<Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium">Notifications</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						1 urgent appointment requires attention.
					</Text>
					<Badge style={styles.badge}>1</Badge>
				</Card.Content>
			</Card>
		</>
	);
};

const PatientHome = () => {
	return (
		<>
			<Text variant="titleLarge" style={styles.sectionHeader}>
				Quick Actions
			</Text>
			<View style={styles.quickActionsRow}>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="file-document-outline" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							My Records
						</Text>
					</Card.Content>
				</Card>
				<Card style={styles.quickCard} onPress={() => {}}>
					<Card.Content style={styles.quickCardContent}>
						<Avatar.Icon size={40} icon="calendar-plus" />
						<Text variant="titleMedium" style={styles.cardTitle}>
							Book Appointment
						</Text>
					</Card.Content>
				</Card>
			</View>
			<Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium">Upcoming Appointment</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						Dr. Lim | 20 Aug 2025, 10:00 AM
					</Text>
					<View style={styles.buttonRow}>
						<Button mode="outlined" compact onPress={() => {}}>
							Reschedule
						</Button>
						<Button mode="outlined" compact onPress={() => {}}>
							Cancel
						</Button>
					</View>
				</Card.Content>
			</Card>
			<Card style={styles.fullCard}>
				<Card.Content>
					<Text variant="titleMedium">Notifications</Text>
					<Text variant="bodyMedium" style={styles.subText}>
						You have 3 new updates
					</Text>
					<Badge style={styles.badge}>3</Badge>
				</Card.Content>
			</Card>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
		paddingBottom: 32,
	},
	sectionHeader: {
		marginVertical: 16,
		fontWeight: "600",
		fontSize: 20,
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
		borderRadius: 10,
		alignItems: "center", // keep centering at card level
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
	},
	fullCard: {
		marginBottom: 16,
		borderRadius: 10,
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	subText: {
		marginTop: 4,
		marginBottom: 8,
		color: "gray",
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	badge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#FF5252",
		color: "white",
	},
});
