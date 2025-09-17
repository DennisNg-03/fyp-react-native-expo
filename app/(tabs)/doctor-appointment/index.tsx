import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorAppointment } from "@/types/appointment";
import { getDisplayStatus } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatStatusLabel,
	getStatusBarStyle,
	getStatusColor,
} from "@/utils/labelHelpers";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
	Card,
	Divider,
	IconButton,
	List,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DoctorAppointmentScreen() {
	const theme = useTheme();
	const { session } = useAuth();
	const userId = session?.user.id;

	const [upcoming, setUpcoming] = useState<DoctorAppointment[]>([]);
	const [past, setPast] = useState<DoctorAppointment[]>([]);
	// const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const [showUpcoming, setShowUpcoming] = useState(true);
	const [showPast, setShowPast] = useState(false);
	const [upcomingSortOrder, setUpcomingSortOrder] = useState<"asc" | "desc">(
		"asc"
	);
	const [pastSortOrder, setPastSortOrder] = useState<"asc" | "desc">("desc");

	// Flatten DoctorAppointment after Supabase query
	const flattenDoctorAppointments = (
		appointments: any[]
	): DoctorAppointment[] => {
		return (appointments ?? []).map((appt) => {
			const patient = appt.patient ?? {};
			const patientProfile = patient.profiles ?? {}; // "profiles" is table name
			const doctorProfile = patient.profiles ?? {}; // "profiles" is table name

			// Look for the accepted reschedule requests
			// const acceptedRescheduleRequest = (appt.reschedule_requests as AppointmentRescheduleRequest[] ?? [])
      // .find((r) => r.status === "accepted");

			// const starts_at = acceptedRescheduleRequest?.new_starts_at ?? appt.starts_at;
			// const ends_at = acceptedRescheduleRequest?.new_ends_at ?? appt.ends_at;

			// console.log("Appointment id:", appt.id);
			// console.log("  original starts_at:", appt.starts_at, "ends_at:", appt.ends_at);
			// console.log("  reschedule_requests:", JSON.stringify(appt.reschedule_requests ?? [], null, 2));
			// console.log("  acceptedRescheduleRequest:", acceptedRescheduleRequest ? JSON.stringify(acceptedRescheduleRequest, null, 2) : "none");
			// console.log("  effective starts_at:", starts_at, "ends_at:", ends_at);

			return {
				...appt,
				// starts_at,
				// ends_at,
				patient: {
					date_of_birth: patient.date_of_birth ?? "",
					full_name: patientProfile.full_name ?? "",
					email: patientProfile.email ?? "",
					phone_number: patientProfile.phone_number ?? "",
					gender: patientProfile.gender ?? "",
				},
				doctor: {
					// speciality: appt.doctor?.speciality ?? "",
					full_name: doctorProfile.full_name ?? "",
				},
			};
		});
	};

	const loadAppointments = useCallback(async () => {
		if (!userId) return;

		// Must not setRefreshing = true here, it will cause RefreshControl to render weirdly
		try {
			const now = new Date().toISOString();

			const { data: upcomingData } = await supabase
				.from("appointments")
				.select(
					`
						*,
						patient:patient_id (
							date_of_birth,
							profiles (
								full_name,
								email,
								phone_number,
								gender
							)
						),
						doctor:doctor_id (
							profiles (
								full_name
							)
						)
					`
				)
				.eq("doctor_id", userId)
				.in("status", ["completed", "scheduled", "no_show", "rescheduled"]) // Only display appointments with these statuses
				.gte("ends_at", now)
				.order("starts_at", { ascending: true });

			// console.log("Upcoming raw data:", upcomingData);
			setUpcoming(flattenDoctorAppointments(upcomingData ?? []));

			const { data: pastData } = await supabase
				.from("appointments")
				.select(
					`
						*,
						patient:patient_id (
							date_of_birth,
							profiles (
								full_name,
								email,
								phone_number,
								gender
							)
						),
						doctor:doctor_id (
							profiles (
								full_name
							)
						)
					`
				)
				.eq("doctor_id", userId)
				.in("status", ["completed", "scheduled", "no_show", "rescheduled"])
				.lt("ends_at", now)
				.order("starts_at", { ascending: false });

			// console.log("Past raw data:", pastData);
			setPast(flattenDoctorAppointments(pastData ?? []));

			// console.log("appointments sample:", JSON.stringify((pastData || []).slice(0, 5), null, 2));
		} catch (err) {
			console.error("Error loading appointments:", err);
		} finally {
			setRefreshing(false);
		}
	}, [userId]);

	const onRefresh = () => {
		console.log("onRefresh triggered!");
		setRefreshing(true);
		loadAppointments();
	};

	useFocusEffect(
		useCallback(() => {
			// setLoading(true);
			loadAppointments();

			console.log("Executed loadAppointments through useFocusEffect!");
		}, [loadAppointments])
	);

	// useEffect(() => {
	// 	console.log("Past data:", past);
	// }, [past]);

	const sortedUpcoming = [...upcoming].sort((a, b) => {
		if (upcomingSortOrder === "asc") {
			return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
		} else {
			return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
		}
	});

	const sortedPast = [...past].sort((a, b) => {
		if (pastSortOrder === "asc") {
			return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
		} else {
			return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
		}
	});

	const renderAppointmentCard = (item: DoctorAppointment) => {
		const displayStatus = getDisplayStatus(item);
		const date = formatKL(item.starts_at, "dd MMM yyyy");
		const startTime = formatKL(item.starts_at, "HH:mm");
		const endTime = formatKL(item.ends_at, "HH:mm");

		// Map gender to prefix
		const genderPrefix = item.patient?.gender === "female" ? "Ms" : "Mr";
		const patientName = `${genderPrefix} ${
			item.patient?.full_name ?? "Patient"
		}`;

		return (
			<Card
				key={item.id}
				style={styles.card}
				elevation={3}
				onPress={() => router.push(`/(tabs)/doctor-appointment/${item.id}`)}
			>
				<View style={styles.cardHeader}>
					<View style={getStatusBarStyle(displayStatus, 150)} />

					<View style={styles.cardContent}>
						<Text style={styles.dateText}>
							{date} {startTime} - {endTime}
						</Text>

						<Text style={styles.patientName}>{patientName}</Text>
						<Text style={styles.patientInfo}>
							📞 {item.patient?.phone_number ?? "-"}
						</Text>

						<Text style={styles.statusText}>
							Status:{" "}
							<Text style={{ color: getStatusColor(displayStatus) }}>
								{formatStatusLabel(displayStatus)}
							</Text>
						</Text>

						<Text style={styles.reasonText}>
							Reason: {item?.reason || "Not provided"}
						</Text>
						<Text style={styles.notesText}>
							Notes: {item?.notes || "Not provided"}
						</Text>
					</View>
				</View>
			</Card>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<List.Section style={{ marginTop: 10 }}>
					<View style={styles.sectionRow}>
						<List.Subheader style={styles.pageHeader}>
							Upcoming Appointments
						</List.Subheader>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							<IconButton
								icon={showUpcoming ? "chevron-down" : "chevron-right"}
								size={24}
								onPress={() => setShowUpcoming(!showUpcoming)}
							/>
							<IconButton
								icon={
									upcomingSortOrder === "asc"
										? "sort-calendar-ascending"
										: "sort-calendar-descending"
								}
								size={24}
								onPress={() =>
									setUpcomingSortOrder(
										upcomingSortOrder === "asc" ? "desc" : "asc"
									)
								}
							/>
						</View>
					</View>
					{showUpcoming ? (
						sortedUpcoming.length > 0 ? (
							sortedUpcoming.map(renderAppointmentCard)
						) : (
							<View style={styles.emptyContainer}>
								<Text>No upcoming appointments.</Text>
							</View>
						)
					) : null}
				</List.Section>

				<Divider bold style={{ marginHorizontal: 16 }} />

				<List.Section>
					<View style={styles.sectionRow}>
						<List.Subheader style={styles.pageHeader}>
							Past Appointments
						</List.Subheader>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							<IconButton
								icon={showPast ? "chevron-down" : "chevron-right"}
								size={24}
								onPress={() => setShowPast(!showPast)}
							/>
							<IconButton
								icon={
									pastSortOrder === "asc"
										? "sort-calendar-ascending"
										: "sort-calendar-descending"
								}
								size={24}
								onPress={() =>
									setPastSortOrder(pastSortOrder === "asc" ? "desc" : "asc")
								}
							/>
						</View>
					</View>
					{showPast ? (
						sortedPast.length > 0 ? (
							sortedPast.map(renderAppointmentCard)
						) : (
							<View style={styles.emptyContainer}>
								<Text>No past appointments.</Text>
							</View>
						)
					) : null}
				</List.Section>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	card: {
		marginHorizontal: 16,
		marginBottom: 12,
		borderRadius: 12,
		backgroundColor: "white",
		elevation: 4,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
	},
	cardContent: {
		flex: 1,
	},
	dateText: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 6,
		color: "#111",
	},
	pageHeader: {
		fontWeight: "700",
		fontSize: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
	},
	emptyContainer: {
		alignItems: "center",
		marginVertical: 16,
	},
	// dateText: {
	// 	fontSize: 14, // bigger
	// 	color: "#333", // darker
	// 	fontWeight: "600", // semi-bold
	// 	marginBottom: 6,
	// },
	providerDetails: {
		fontSize: 13,
		color: "#555",
		marginBottom: 4, // slightly more spacing
	},
	notesText: {
		fontSize: 14,
		color: "#444",
		marginBottom: 4,
	},
	statusText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
		marginTop: 6,
		marginBottom: 6,
	},
	reasonText: {
		fontSize: 14,
		color: "#333",
		fontStyle: "italic",
		marginBottom: 4,
	},
	patientName: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 2,
		color: "#222",
	},
	patientInfo: {
		fontSize: 14,
		color: "#555",
		marginVertical: 6,
	},
});
