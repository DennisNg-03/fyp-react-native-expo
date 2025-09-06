import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Appointment } from "@/types/appointment";
import { getDisplayStatus } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatStatusLabel,
	getStatusBarStyle,
	getStatusColor,
} from "@/utils/labelHelpers";
import { useNavigationState } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

export default function PatientAppointmentsScreen() {
	const theme = useTheme();
	const { session } = useAuth();
	const userId = session?.user.id;

	const [upcoming, setUpcoming] = useState<Appointment[]>([]);
	const [past, setPast] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [showUpcoming, setShowUpcoming] = useState(true);
	const [showPast, setShowPast] = useState(false);
	const [upcomingSortOrder, setUpcomingSortOrder] = useState<"asc" | "desc">("asc");
	const [pastSortOrder, setPastSortOrder] = useState<"asc" | "desc">("desc");
	const [upcomingFilter, setUpcomingFilter] = useState<string | null>(null);
	const [pastFilter, setPastFilter] = useState<string | null>(null);

	const routes = useNavigationState((state) => state.routes);
	useEffect(() => {
		console.log(
			"Navigation state routes:",
			routes.map((r) => r.name)
		);
	}, [routes]);

	const flattenAppointments = (appointments: any[]): Appointment[] => {
		return (appointments ?? []).map((appointment) => {
			const doc = appointment.doctor; // Supabase returns object with arrays
			const doctorProfile = doc?.profiles ?? {};
			const doctorProvider = doc?.provider ?? {};

			return {
				...appointment,
				doctor: {
					speciality: doc?.speciality ?? "",
					full_name: doctorProfile.full_name ?? "",
					email: doctorProfile.email ?? "",
					phone_number: doctorProfile.phone_number ?? "",
				},
				provider: {
					name: doctorProvider.name ?? "",
					provider_type: doctorProvider.provider_type ?? "",
					address: doctorProvider.address ?? "",
					phone_number: doctorProvider.phone_number ?? "",
				},
			};
		});
	};

	const loadAppointments = useCallback(async () => {
		try {
			console.log("loadAppointments triggered!");
			// setLoading(true);

			const { data: upcomingData } = await supabase
				.from("appointments")
				.select(
					`
				  id,
				  doctor_id,
				  patient_id,
				  starts_at,
				  ends_at,
				  status,
				  reason,
				  notes,
				  for_whom,
				  other_person,
				  supporting_documents,
				  doctor:doctor_id (
						speciality,
						profiles(full_name, email, phone_number),
						provider:provider_id (
							name,
							provider_type,
							address,
							phone_number
							)
						)
					`
				)
				.eq("patient_id", userId)
				.gte("ends_at", new Date().toISOString())
				.order("starts_at", { ascending: true });

			setUpcoming(flattenAppointments(upcomingData ?? []));

			const { data: pastData } = await supabase
				.from("appointments")
				.select(
					`
				  id,
				  doctor_id,
				  patient_id,
				  starts_at,
				  ends_at,
				  status,
				  reason,
				  notes,
				  for_whom,
				  other_person,
				  supporting_documents,
				  doctor:doctor_id (
					speciality,
					profiles(full_name, email, phone_number),
					provider:provider_id (
						name,
						provider_type,
						address,
						phone_number
					  )
				  )
				`
				)
				.eq("patient_id", userId)
				.lt("ends_at", new Date().toISOString())
				.order("starts_at", { ascending: false });

			setPast(flattenAppointments(pastData ?? []));
		} catch (e) {
			console.warn(e);
		} finally {
			// setLoading(false);
			setRefreshing(false);
		}
	}, [userId]);

	// useEffect(() => {
	// 	loadAppointments();
	// }, [loadAppointments]);

	const onRefresh = () => {
		console.log("onRefresh triggered!");
		setRefreshing(true);
		loadAppointments();
	};

	useFocusEffect(
		useCallback(() => {
			// setLoading(true);
			loadAppointments();

			// const timeout = setTimeout(() => {
			// 	setLoading(false);
			// }, 300);

			console.log("Executed loadAppointments through useFocusEffect!");
			// return () => clearTimeout(timeout);
		}, [loadAppointments])
	);

	const sortedUpcoming = [...upcoming]
		.filter((item) => (upcomingFilter ? item.status === upcomingFilter : true))
		.sort((a, b) =>
			upcomingSortOrder === "asc"
				? new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
				: new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
		);

	const sortedPast = [...past]
		.filter((item) => (pastFilter ? item.status === pastFilter : true))
		.sort((a, b) =>
			pastSortOrder === "asc"
				? new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
				: new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
		);

	const renderAppointmentSummary = (item: Appointment) => {
		const displayStatus = getDisplayStatus(item);
		console.log("displayStatus:", displayStatus);
		const startTime = formatKL(item.starts_at, "HH:mm");
		const endTime = formatKL(item.ends_at, "HH:mm");
		const date = formatKL(item.starts_at, "dd MMM yyyy");
		const displayTime = `${date} ${startTime} - ${endTime}`;

		const docName = item.doctor?.full_name ?? "Doctor";
		const providerName = item.provider?.name ?? "Provider";
		const providerPhone = item.provider?.phone_number ?? "-";
		const providerAddress = item.provider?.address ?? "-";
		const reason = item.reason ?? "-";

		return (
			<Card
				style={{
					marginHorizontal: 16,
					marginBottom: 12,
					borderRadius: 12,
					backgroundColor: "white",
				}}
				elevation={2}
				key={item.id}
				onPress={() => router.push(`/(tabs)/patient-appointment/${item.id}`)} // MUST use router.push here, otherwise Back button won't be shown
			>
				<View style={styles.cardHeader}>
					<View style={getStatusBarStyle(displayStatus)} />
					<View style={styles.cardContent}>
						<Text variant="titleMedium" style={styles.docName}>
							Dr {docName}
						</Text>

						<Text style={styles.providerName}>{providerName}</Text>

						{/* Make the time more prominent */}
						<Text
							style={[
								styles.dateText,
								{
									fontSize: 14,
									color: "#333",
									fontWeight: "600",
									marginVertical: 8,
								},
							]}
						>
							{displayTime}
						</Text>

						{/* Add a bit more spacing for provider details */}
						<Text style={[styles.providerDetails, { marginVertical: 8 }]}>
							{providerAddress}
						</Text>
						<Text style={[styles.providerDetails, { marginVertical: 8 }]}>
							📞 {providerPhone}
						</Text>

						<Text style={[styles.reasonText, { marginVertical: 8 }]}>
							Reason: {reason}
						</Text>

						{/* <Text style={styles.statusText}>{formatLabel(item.status)}</Text> */}
						<Text
							style={{
								fontSize: 14,
								fontWeight: "600",
								textAlign: "center",
								color: getStatusColor(displayStatus ?? ""),
								marginTop: 8,
							}}
						>
							{formatStatusLabel(displayStatus)}
						</Text>
					</View>
				</View>
			</Card>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			{loading && !refreshing ? (
				<ActivityIndicator loadingMsg="" size="large" />
			) : (
				<ScrollView
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					{/* Upcoming Section */}
					<List.Section style={{ marginTop: 10 }}>
						<View style={styles.sectionRow}>
							<List.Subheader
								style={styles.sectionHeader}
								onPress={() => setShowUpcoming(!showUpcoming)}
							>
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

						{showUpcoming &&
							(sortedUpcoming.length > 0 ? (
								sortedUpcoming.map(renderAppointmentSummary)
							) : (
								<View style={styles.emptyContainer}>
									<Text style={{ color: theme.colors.onSurface }}>
										No upcoming appointments.
									</Text>
								</View>
							))}
					</List.Section>

					<Divider bold={true} style={{ marginHorizontal: 16 }} />

					{/* Past Section */}
					<List.Section>
						<View style={styles.sectionRow}>
							<List.Subheader
								style={styles.sectionHeader}
								onPress={() => setShowPast(!showPast)}
							>
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
										setPastSortOrder(
											pastSortOrder === "asc" ? "desc" : "asc"
										)
									}
								/>
							</View>
						</View>

						{showPast &&
							(sortedPast.length > 0 ? (
								sortedPast.map(renderAppointmentSummary)
							) : (
								<View style={styles.emptyContainer}>
									<Text style={{ color: theme.colors.onSurface }}>
										No past appointments.
									</Text>
								</View>
							))}
					</List.Section>
				</ScrollView>
			)}
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
	docName: {
		fontWeight: "700",
		fontSize: 16,
		marginBottom: 2,
	},
	providerName: {
		fontSize: 14,
		color: "#555",
		marginBottom: 2,
	},
	statusText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#333",
	},
	emptyContainer: {
		alignItems: "center",
		marginVertical: 16,
	},
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
	},
	sectionHeader: {
		fontWeight: "700",
		fontSize: 16,
		// backgroundColor: "transparent",
		// marginBottom: 8,
	},
	dateText: {
		fontSize: 14, // bigger
		color: "#333", // darker
		fontWeight: "600", // semi-bold
		marginBottom: 6,
	},
	providerDetails: {
		fontSize: 13,
		color: "#555",
		marginBottom: 4, // slightly more spacing
	},
	reasonText: {
		fontSize: 14,
		color: "#333",
		fontStyle: "italic",
		marginBottom: 6,
	},
});
