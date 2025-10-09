import { ActivityIndicator } from "@/components/ActivityIndicator";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
	DoctorAppointment,
	DoctorRescheduleRequest,
} from "@/types/appointment";
import { getDisplayStatus, isPast } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatStatusLabel,
	getRescheduleStatusBarStyle,
	getStatusBarStyle,
	getStatusColor,
} from "@/utils/labelHelpers";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DoctorAppointmentRequestsScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;

	const [bookingRequests, setBookingRequests] = useState<DoctorAppointment[]>(
		[]
	);
	const [rescheduleRequests, setRescheduleRequests] = useState<
		DoctorRescheduleRequest[]
	>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [doctorId, setDoctorId] = useState<string | undefined>(userId);

	// Dynamic display toggles
	const [activeTab, setActiveTab] = useState<"booking" | "reschedule">(
		"booking"
	);
	const [statusFilter, setStatusFilter] = useState<string>("pending"); // could be 'pending', 'accepted', 'rejected', 'overdue'
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const [pendingPayload, setPendingPayload] = useState<any>(null); // optional: store item/req
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const flattenDoctorAppointments = (
		appointments: any[]
	): DoctorAppointment[] =>
		(appointments ?? []).map((appt) => {
			const patient = appt.patient ?? {};
			const profile = patient.profiles ?? {};
			return {
				...appt,
				patient: {
					date_of_birth: patient.date_of_birth ?? "",
					full_name: profile.full_name ?? "",
					email: profile.email ?? "",
					phone_number: profile.phone_number ?? "",
					gender: profile.gender ?? "",
				},
				doctor: {
					full_name: appt.doctor?.profiles?.full_name ?? "",
				},
			};
		});

	const flattenRescheduleRequests = (
		requests: any[]
	): DoctorRescheduleRequest[] =>
		(requests ?? []).map((req) => {
			const appointment = req.appointment ?? {};
			// console.log("appointment:", appointment);
			// const patient = appointment.patient ?? {};
			// const doctorProfile = appointment.doctors?.profiles ?? {};
			const doctorProfile =
				appointment.doctor?.profiles ?? appointment.doctor ?? {};
			// console.log("Flattening request:", JSON.stringify(req, null, 2));

			const flattened = {
				...req,
				appointment: {
					...appointment,
					doctor: {
						full_name: doctorProfile.full_name ?? "",
					},
				},
				requested_by: {
					full_name: req.requested_by?.full_name ?? "",
					email: req.requested_by?.email ?? "",
					phone_number: req.requested_by?.phone_number ?? "",
					gender: req.requested_by?.gender ?? "",
				},
			};

			// console.log("Flattened request:", JSON.stringify(flattened, null, 2));
			// console.log("Role:", role);
			return flattened;
		});

	const loadRequests = useCallback(async () => {
		if (!userId) return;

		try {
			let targetDoctorId = userId;
			console.log("TargetDoctorId:", targetDoctorId);

			// Nurse logic
			if (role === "nurse") {
				const { data: nurseData } = await supabase
					.from("nurses")
					.select("assigned_doctor_id")
					.eq("id", userId)
					.single();

				if (nurseData?.assigned_doctor_id)
					targetDoctorId = nurseData.assigned_doctor_id;
				setDoctorId(targetDoctorId);
			}

			// Booking requests
			const { data: scheduleData } = await supabase
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
				.eq("doctor_id", targetDoctorId)
				.order("created_at", { ascending: true });

			// console.log("Past schedule data:", scheduleData);

			setBookingRequests(flattenDoctorAppointments(scheduleData ?? []));

			// Reschedule requests
			// 1) get appointments (ids) for this doctor
			const { data: appts, error: apptErr } = await supabase
				.from("appointments")
				.select("id")
				.eq("doctor_id", targetDoctorId);

			if (apptErr) throw apptErr;

			const appointmentIds = (appts ?? []).map((a: any) => a.id);
			// console.log("appointmentIds:", appointmentIds);

			let rescheduleData = [];
			if (appointmentIds.length > 0) {
				const res = await supabase
					.from("appointment_reschedule_requests")
					.select(
						`
							*,
							appointment:appointment_id (
								id,
								patient_id,
								doctor_id,
								reason,
								notes,
								doctor:doctor_id (
									profiles (
										full_name
									)
								)
							),
							requested_by (
								full_name,
								email,
								phone_number,
								gender
							)
						`
					)
					// .in("appointment_id", appointmentIds)
					.order("created_at", { ascending: true });

				if (res.error) throw res.error;
				rescheduleData = res.data;
			} else {
				// no appointments for this doctor — empty result
				rescheduleData = [];
			}

			const filteredRescheduleData = (rescheduleData ?? []).filter(
				(r) => r.appointment?.doctor_id === targetDoctorId
			);

			// console.log("targetDoctorId:", targetDoctorId);
			// console.log("appointments (first 10):", (appts ?? []).slice(0, 10));
			// console.log("appointmentIds:", appointmentIds);
			// console.log(
			// 	"raw rescheduleData (first 10):",
			// 	(rescheduleData ?? []).slice(0, 10)
			// );
			// console.log("filteredRescheduleData:", filteredRescheduleData);

			setRescheduleRequests(
				flattenRescheduleRequests(filteredRescheduleData ?? [])
			);
		} catch (err) {
			console.error(err);
		} finally {
			setRefreshing(false);
			setLoading(false);
		}
	}, [userId, role]);

	const onRefresh = () => {
		console.log("onRefresh triggered!");
		setRefreshing(true);
		loadRequests();
	};

	useFocusEffect(
		useCallback(() => {
			// setLoading(true);
			loadRequests();

			console.log("Executed loadRequests through useFocusEffect!");
		}, [loadRequests])
	);

	const handleConfirmation = (action: string, payload?: any) => {
		setPendingAction(action);
		setPendingPayload(payload);
		setConfirmVisible(true);
	};

	// const resetState = () => {
	// 	setLoading(false);
	// 	setConfirmVisible(false);
	// 	setPendingAction(null);
	// 	setPendingPayload(null);
	// };

	const onConfirm = async () => {
		if (!pendingAction) return;

		try {
			setLoading(true);

			switch (pendingAction) {
				case "accept_booking":
					await handleAcceptBooking(pendingPayload);
					break;
				case "reject_booking":
					await handleRejectBooking(pendingPayload);
					break;
				case "accept_rescheduling":
					await handleAcceptRescheduling(pendingPayload);
					break;
				case "reject_rescheduling":
					await handleRejectRescheduling(pendingPayload);
					break;
				default:
					break;
			}
		} finally {
			setLoading(false);
			setConfirmVisible(false);
			setPendingAction(null);
			setPendingPayload(null);
		}
	};

	const onCancel = () => {
		setConfirmVisible(false);
		setPendingAction(null);
		setPendingPayload(null);
	};

	const handleAcceptBooking = async (item: DoctorAppointment) => {
		const statusUpdate = await fetch(
			"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateAppointmentStatus",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify({
					id: item.id,
					status: "scheduled",
				}),
			}
		);

		if (!statusUpdate.ok) {
			const errorBody = await statusUpdate.text();
			console.error("Failed to update appointment status:", errorBody);
			Alert.alert("Error", "Failed to update appointment status.");
			return;
		}
		loadRequests();
	};
	const handleRejectBooking = async (item: DoctorAppointment) => {
		const statusUpdate = await fetch(
			"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateAppointmentStatus",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify({
					id: item.id,
					status: "cancelled",
				}),
			}
		);

		if (!statusUpdate.ok) {
			const errorBody = await statusUpdate.text();
			console.error("Failed to update appointment status:", errorBody);
			Alert.alert("Error", "Failed to cancel appointment.");
			return;
		}
		loadRequests();
	};

	const handleAcceptRescheduling = async (item: DoctorRescheduleRequest) => {
		const statusUpdate = await fetch(
			"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateRescheduleRequestStatus",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify({
					id: item.id,
					appointment_id: item.appointment_id,
					status: "accepted",
					new_starts_at: item.new_starts_at,
					new_ends_at: item.new_ends_at,
				}),
			}
		);

		if (!statusUpdate.ok) {
			const errorBody = await statusUpdate.text();
			console.error("Failed to update reschedule request status:", errorBody);
			Alert.alert("Error", "Failed to accept reschedule request.");
			return;
		}
		loadRequests();
	};
	const handleRejectRescheduling = async (item: DoctorRescheduleRequest) => {
		const statusUpdate = await fetch(
			"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateRescheduleRequestStatus",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify({
					id: item.id,
					appointment_id: item.appointment_id,
					status: "rejected",
					new_starts_at: item.new_starts_at,
					new_ends_at: item.new_ends_at,
				}),
			}
		);

		if (!statusUpdate.ok) {
			const errorBody = await statusUpdate.text();
			console.error("Failed to update reschedule request:", errorBody);
			Alert.alert("Error", "Failed to reject reschedule request.");
			return;
		}
		loadRequests();
	};

	const renderBookingCard = (item: DoctorAppointment) => {
		const displayStatus = getDisplayStatus(item);
		const date = formatKL(item.starts_at, "dd MMM yyyy");
		const startTime = formatKL(item.starts_at, "HH:mm");
		const endTime = formatKL(item.ends_at, "HH:mm");
		const genderPrefix = item.patient?.gender === "female" ? "Ms" : "Mr";
		const patientName = `${genderPrefix} ${
			item.patient?.full_name ?? "Patient"
		}`;
		// console.log("Booking item:", item);

		return (
			<Card
				key={item.id}
				style={styles.card}
				elevation={3}
				onPress={() =>
					router.push(`/(tabs)/doctor-appointment-request/${item.id}`)
				}
			>
				<View style={styles.cardHeader}>
					<View style={getStatusBarStyle(displayStatus, 150)} />
					<View style={styles.cardContent}>
						<Text style={styles.dateText}>
							{date} {startTime} - {endTime}
						</Text>

						{/* Show Assigned Doctor only for nurses */}
						{role === "nurse" && item.doctor?.full_name && (
							<Text style={styles.doctorInfo}>
								Assigned Doctor: Dr {item.doctor?.full_name}
							</Text>
						)}

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
						{item.reason && (
							<Text style={styles.reasonText}>Reason: {item.reason}</Text>
						)}
						{item.notes && (
							<Text style={styles.notesText}>Notes: {item.notes}</Text>
						)}
						{/* Show accept and reject buttons only if pending filter */}
						{statusFilter === "pending" && item.status === "pending" && (
							<View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: "green" }]}
									onPress={() => {
										handleConfirmation("accept_booking", item);
									}}
								>
									<Text style={styles.actionButtonText}>Accept</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: "red" }]}
									onPress={() => {
										handleConfirmation("reject_booking", item);
									}}
								>
									<Text style={styles.actionButtonText}>Reject</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</View>
			</Card>
		);
	};

	const renderRescheduleCard = (req: DoctorRescheduleRequest) => {
		const originalDate = formatKL(req.old_starts_at, "dd MMM yyyy");
		const originalStartTime = formatKL(req.old_starts_at, "HH:mm");
		const originalEndTime = formatKL(req.old_ends_at, "HH:mm");

		const newDate = formatKL(req.new_starts_at, "dd MMM yyyy");
		const newStartTime = formatKL(req.new_starts_at, "HH:mm");
		const newEndTime = formatKL(req.new_ends_at, "HH:mm");

		const genderPrefix = req.requested_by.gender === "female" ? "Ms" : "Mr";
		const patientName = `${genderPrefix} ${
			req.requested_by.full_name ?? "Patient"
		}`;

		return (
			<Card
				key={req.id}
				style={styles.card}
				elevation={3}
				onPress={() =>
					router.push(
						`/(tabs)/doctor-appointment-request/${req.appointment_id}`
					)
				}
			>
				<View style={styles.cardHeader}>
					<View style={getRescheduleStatusBarStyle(req.status, 200)} />
					<View style={styles.cardContent}>
						{/* Show Original and New Appointment */}
						<View style={{ marginBottom: 12 }}>
							<Text
								style={[
									styles.dateText,
									{ fontWeight: "600", marginBottom: 6 },
								]}
							>
								<Text style={{ fontWeight: "600", color: "#555" }}>
									Original:
								</Text>{" "}
								{originalDate} {originalStartTime} - {originalEndTime}
							</Text>
							<Text style={[styles.dateText, { fontWeight: "600" }]}>
								<Text style={{ fontWeight: "600", color: "#555" }}>New:</Text>{" "}
								{newDate} {newStartTime} - {newEndTime}
							</Text>
						</View>

						{/* Show Assigned Doctor only for nurses */}
						{role === "nurse" && req.appointment?.doctor?.full_name && (
							<Text style={styles.doctorInfo}>
								Assigned Doctor: Dr {req.appointment?.doctor?.full_name}
							</Text>
						)}

						<Text style={styles.patientName}>{patientName}</Text>
						<Text style={styles.patientInfo}>
							📞 {req.requested_by?.phone_number ?? "-"}
						</Text>
						<Text style={styles.statusText}>
							Status:{" "}
							<Text style={{ color: getStatusColor(req.status) }}>
								{formatStatusLabel(req.status)}
							</Text>
						</Text>
						{req.appointment.reason && (
							<Text style={styles.reasonText}>
								Reason: {req.appointment.reason}
							</Text>
						)}
						{req.appointment.notes && (
							<Text style={styles.notesText}>
								Notes: {req.appointment.notes}
							</Text>
						)}
						{statusFilter === "pending" && req.status === "pending" && (
							<View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: "green" }]}
									onPress={() => {
										handleConfirmation("accept_rescheduling", req);
									}}
								>
									<Text style={styles.actionButtonText}>Accept</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: "red" }]}
									onPress={() => {
										handleConfirmation("reject_rescheduling", req);
									}}
								>
									<Text style={styles.actionButtonText}>Reject</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</View>
			</Card>
		);
	};

	const filterRequests = () => {
		let filtered: (DoctorAppointment | DoctorRescheduleRequest)[];
		filtered =
			activeTab === "booking"
				? bookingRequests.filter((req) => {
						if (statusFilter === "overdue") {
							return req.status === "pending" && isPast(req.starts_at);
						}
						if (statusFilter === "pending") {
							return req.status === "pending" && !isPast(req.starts_at);
						}
						if (statusFilter === "accepted") {
							return (
								req.status === "scheduled" ||
								req.status === "completed" ||
								req.status === "no_show"
							);
						}
						if (statusFilter === "rejected") {
							return req.status === "cancelled";
						}
						return true;
				  })
				: rescheduleRequests.filter((req) => {
						if (statusFilter === "overdue") {
							return req.status === "pending" && isPast(req.old_starts_at);
						}
						if (statusFilter === "pending") {
							return req.status === "pending" && !isPast(req.old_starts_at);
						}
						if (statusFilter === "accepted") {
							return req.status === "accepted";
						}
						if (statusFilter === "rejected") {
							return req.status === "rejected";
						}
						return true;
				  });

		filtered = [...filtered].sort((a, b) => {
			const aTime =
				activeTab === "booking"
					? new Date((a as DoctorAppointment).starts_at).getTime()
					: new Date((a as DoctorRescheduleRequest).old_starts_at).getTime();
			const bTime =
				activeTab === "booking"
					? new Date((b as DoctorAppointment).starts_at).getTime()
					: new Date((b as DoctorRescheduleRequest).old_starts_at).getTime();

			return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
		});

		return filtered;
	};

	const renderTabButtons = () => (
		<View style={styles.tabContainer}>
			<TouchableOpacity
				onPress={() => setActiveTab("booking")}
				style={{
					flex: 1,
					paddingVertical: 10,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						activeTab === "booking" ? theme.colors.primary : "transparent",
				}}
			>
				<Text
					style={{
						fontSize: 14,
						fontWeight: "600",
						color:
							activeTab === "booking"
								? theme.colors.onPrimary
								: theme.colors.onSurfaceVariant,
					}}
				>
					Booking Requests
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => setActiveTab("reschedule")}
				style={{
					flex: 1,
					paddingVertical: 10,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						activeTab === "reschedule" ? theme.colors.primary : "transparent",
				}}
			>
				<Text
					style={{
						fontSize: 14,
						fontWeight: "600",
						color:
							activeTab === "reschedule"
								? theme.colors.onPrimary
								: theme.colors.onSurfaceVariant,
					}}
				>
					Rescheduling Requests
				</Text>
			</TouchableOpacity>
		</View>
	);

	const renderStatusFilterButtons = () => {
		const filters = ["pending", "accepted", "rejected", "overdue"];
		return (
			<View style={styles.filterContainer}>
				<View style={{ flexDirection: "row", flex: 1 }}>
					{filters.map((f) => (
						<TouchableOpacity
							key={f}
							onPress={() => setStatusFilter(f)}
							style={[
								styles.filterButton,
								{
									backgroundColor:
										statusFilter === f ? getStatusColor(f) : "#e0e0e0",
								},
							]}
						>
							<Text
								style={[
									styles.filterButtonText,
									{ color: statusFilter === f ? "#fff" : "#555" },
								]}
							>
								{f.charAt(0).toUpperCase() + f.slice(1)}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				<IconButton
					icon={
						sortOrder === "asc"
							? "sort-calendar-ascending"
							: "sort-calendar-descending"
					}
					size={24}
					style={{ margin: 0 }}
					onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
				/>
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			{loading && (
				<ActivityIndicator loadingMsg="" overlay={true} size="large" />
			)}
			{renderTabButtons()}
			{renderStatusFilterButtons()}
			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{filterRequests().length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text>No {statusFilter} requests.</Text>
					</View>
				) : (
					filterRequests().map((item) =>
						activeTab === "booking"
							? renderBookingCard(item as DoctorAppointment)
							: renderRescheduleCard(item as DoctorRescheduleRequest)
					)
				)}
			</ScrollView>

			<ConfirmationDialog
				visible={confirmVisible}
				title="Confirm Action"
				messagePrimary={
					pendingAction?.includes("accept")
						? "Are you sure you want to accept this request?"
						: "Are you sure you want to reject this request?"
				}
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	tabContainer: {
		flexDirection: "row",
		marginHorizontal: 16,
		marginTop: 24,
		marginBottom: 24,
		borderRadius: 12,
		backgroundColor: "#f2f2f2",
		overflow: "hidden",
	},
	tabButton: {
		flex: 1,
		paddingVertical: 10,
		backgroundColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
	},
	// tabButtonActive: {
	// 	backgroundColor: "#6200ee",
	// },
	tabButtonText: {
		fontSize: 14,
		fontWeight: "600",
		// color: "#555",
	},
	// tabButtonTextActive: {
	// 	color: "#fff",
	// },

	filterContainer: {
		flexDirection: "row",
		marginHorizontal: 16,
		marginBottom: 12,
		alignItems: "center",
		justifyContent: "space-between",
	},
	filterButton: {
		flex: 1,
		marginHorizontal: 3,
		paddingVertical: 8,
		backgroundColor: "#e0e0e0",
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	// filterButtonActive: {
	// 	backgroundColor: "#6200ee",
	// },
	filterButtonText: {
		fontSize: 12,
		fontWeight: "500",
		// color: "#555",
		textTransform: "capitalize",
	},
	// filterButtonTextActive: {
	// 	color: "#fff",
	// },

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
	emptyContainer: { alignItems: "center", marginVertical: 16 },
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
	notesText: { fontSize: 14, color: "#444", marginBottom: 4 },
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
	doctorInfo: {
		fontSize: 14,
		fontWeight: "600",
		color: "#444",
		marginBottom: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
});
