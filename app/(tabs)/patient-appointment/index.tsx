import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Appointment } from "@/types/appointment";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatLabel,
	getStatusBarStyle,
	getStatusFontColor,
} from "@/utils/labelHelpers";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, List, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyAppointmentsScreen() {
	const theme = useTheme();
	const { session } = useAuth();
	const userId = session?.user.id;
	const router = useRouter();

	const [upcoming, setUpcoming] = useState<Appointment[]>([]);
	const [past, setPast] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

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
			setLoading(true);

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
			setLoading(false);
			setRefreshing(false);
		}
	}, [userId]);

	// useEffect(() => {
	// 	loadAppointments();
	// }, [loadAppointments]);

	const onRefresh = () => {
		setRefreshing(true);
		loadAppointments();
	};

	useFocusEffect(
		useCallback(() => {
			loadAppointments();
		}, [loadAppointments])
	);

	// useEffect(() => {
	// 	console.log("Upcoming:", upcoming);
	// 	console.log("Past:", past);
	// }, [upcoming, past]);

	const renderAppointmentSummary = (item: Appointment) => {
		const startTime = formatKL(item.starts_at, "HH:mm");
		const endTime = formatKL(item.ends_at, "HH:mm");
		const date = formatKL(item.starts_at, "dd MMM yyyy");
		const displayTime = `${date} ${startTime} - ${endTime}`;

		const docName = item.doctor?.full_name ?? "Doctor";
		const providerName = item.provider?.name ?? "Provider";
		const providerPhone = item.provider?.phone_number ?? "-"; // assuming phone is under doctor
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
				onPress={() => router.push(`/(tabs)/patient-appointment/${item.id}`)}
			>
				<View style={styles.cardHeader}>
					<View style={getStatusBarStyle(item.status)} />
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
								color: getStatusFontColor(item.status ?? ""),
								marginTop: 8,
							}}
						>
							{formatLabel(item.status)}
						</Text>
					</View>
				</View>
			</Card>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			{loading && !refreshing ? (
				<ActivityIndicator loadingMsg="" size="large" />
			) : (
				<ScrollView
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<List.Section>
						<List.Subheader style={styles.sectionHeader}>
							Upcoming Appointments
						</List.Subheader>
						{upcoming.length > 0 ? (
							upcoming.map(renderAppointmentSummary)
						) : (
							<View style={styles.emptyContainer}>
								<Text style={{ color: theme.colors.onSurface }}>
									No upcoming appointments.
								</Text>
							</View>
						)}
					</List.Section>

					<Divider bold={true} style={{ marginHorizontal: 16 }} />

					<List.Section>
						<List.Subheader style={styles.sectionHeader}>
							Past Appointments
						</List.Subheader>
						{past.length > 0 ? (
							past.map(renderAppointmentSummary)
						) : (
							<View style={styles.emptyContainer}>
								<Text style={{ color: theme.colors.onSurface }}>
									No past appointments.
								</Text>
							</View>
						)}
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
	// dateText: {
	// 	fontSize: 13,
	// 	color: "#777",
	// 	marginBottom: 2,
	// },
	statusText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#333",
	},
	emptyContainer: {
		alignItems: "center",
		marginVertical: 16,
	},
	sectionHeader: {
		fontWeight: "700",
		fontSize: 16,
		backgroundColor: "transparent",
		marginBottom: 8,
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
