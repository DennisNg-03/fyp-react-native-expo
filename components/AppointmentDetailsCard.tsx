import RescheduleModal from "@/components/RescheduleModal";
import { SupportingDocumentPreview } from "@/components/SupportingDocumentPreview";
import UpdateAppointmentDetailsModal from "@/components/UpdateAppointmentDetailsModal";
import { canReschedule, getDisplayStatus } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatLabel,
	formatStatusLabel,
	getStatusColor,
} from "@/utils/labelHelpers";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Divider, Portal, Text } from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";

export default function AppointmentDetailCard({
	appointment,
	session,
	role,
	showActions = false,
	reload,
}: {
	appointment: any;
	session: any;
	role: string | null;
	showActions?: boolean;
	reload: () => void;
}) {
	// const theme = useTheme();
	const displayStatus = getDisplayStatus(appointment);
	const [updateModalVisible, setUpdateModalVisible] = useState(false);
	const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
	const [saving, setSaving] = useState(false);

	const handleUpdateAppointmentStatus = async (
		newStatus: "no_show" | "completed"
	) => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		try {
			setSaving(true);

			// Update appointment status in "appointments" table
			const statusUpdate = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateAppointmentStatus",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						id: appointment.id,
						status: newStatus,
					}),
				}
			);

			if (!statusUpdate.ok) {
				const errorBody = await statusUpdate.text();
				console.error("Failed to update appointment status:", errorBody);
				return;
			}

			reload();
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card
			style={styles.card}
			key={appointment.id}
			elevation={2}
			onStartShouldSetResponder={() => true} // This is IMPORTANT to ensure the card can be scrolled
		>
			<View
				style={{
					overflow: "hidden",
					borderTopLeftRadius: 12,
					borderTopRightRadius: 12,
				}}
			>
				<View
					style={[
						styles.cardHeader,
						{ backgroundColor: getStatusColor(displayStatus) },
					]}
				>
					<Text variant="headlineSmall" style={styles.statusText}>
						{formatStatusLabel(displayStatus)}
					</Text>
				</View>
			</View>
			<Card.Content>
				<Text style={styles.doctorName}>
					Dr {appointment.doctor?.profiles?.full_name}
				</Text>
				<Text style={styles.speciality}>{appointment.doctor?.speciality}</Text>

				<Divider bold={true} style={styles.divider} />

				<View style={[styles.section, { marginBottom: 8 }]}>
					<Text style={styles.label}>Healthcare Provider</Text>
					<Text style={styles.contentText}>
						{appointment.doctor.provider?.name} (
						{appointment.doctor.provider?.provider_type})
					</Text>
					<Text style={[styles.label, { marginTop: 12 }]}>Address</Text>
					<Text style={styles.contentText}>
						{appointment.doctor.provider?.address}
					</Text>
					{appointment.doctor.provider?.phone_number ? (
						<>
							<Text style={[styles.label, { marginTop: 12 }]}>Phone</Text>
							<Text style={styles.contentText}>
								{appointment.doctor.provider.phone_number}
							</Text>
						</>
					) : null}
				</View>

				<Divider bold={true} style={styles.divider} />

				<View style={styles.section}>
					<Text style={styles.label}>Appointment Time</Text>
					<Text style={styles.contentText}>
						{formatKL(appointment.starts_at, "dd MMM yyyy, HH:mm")} -{" "}
						{formatKL(appointment.ends_at, "HH:mm")}
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.label}>Reason</Text>
					<Text style={styles.contentText}>{appointment.reason || "—"}</Text>
				</View>

				<View style={[styles.section, { marginBottom: 8 }]}>
					<Text style={styles.label}>Notes</Text>
					<Text style={styles.contentText}>{appointment.notes || "—"}</Text>
				</View>

				{(role === "doctor" || role === "nurse") && (
					<>
						<Divider bold={true} style={styles.divider} />

						<View style={styles.section}>
							<Text style={styles.label}>Patient Information</Text>
							<Text style={styles.contentText}>
								Name: {appointment.patient?.profiles?.full_name ?? "—"}
							</Text>
							<Text style={styles.contentText}>
								Email: {appointment.patient?.profiles?.email ?? "—"}
							</Text>
							<Text style={styles.contentText}>
								Phone: {appointment.patient?.profiles?.phone_number ?? "—"}
							</Text>
							<Text style={styles.contentText}>
								Gender: {formatLabel(appointment.patient?.profiles?.gender) ?? "—"}
							</Text>
							<Text style={styles.contentText}>
								Date of Birth:{" "}
								{appointment.patient?.date_of_birth
									? formatKL(appointment.patient.date_of_birth, "dd MMM yyyy")
									: "—"}
							</Text>
						</View>
					</>
				)}

				<Divider bold={true} style={styles.divider} />

				{appointment.for_whom ? (
					<View style={styles.section}>
						<Text style={styles.label}>For Whom</Text>
						<Text style={styles.contentText}>
							{formatLabel(appointment.for_whom)}
						</Text>
					</View>
				) : null}

				{appointment.for_whom === "someone_else" && appointment.other_person ? (
					<View style={styles.section}>
						<Text style={styles.label}>Other Person Details</Text>
						<Text style={styles.contentText}>
							Name: {appointment.other_person.name}
						</Text>
						<Text style={styles.contentText}>
							Gender: {formatLabel(appointment.other_person.gender)}
						</Text>
						<Text style={styles.contentText}>
							Relationship: {appointment.other_person.relationship}
						</Text>
						<Text style={styles.contentText}>
							Date of Birth:{" "}
							{formatKL(appointment.other_person.date_of_birth, "dd MMM yyyy")}
						</Text>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.label}>Past Records Access</Text>
					<Text style={styles.contentText}>
						{role === "patient"
							? appointment.grant_doctor_access
								? "You have allowed the doctor to view your past medical records."
								: "You have not allowed the doctor to view your past medical records."
							: role === "doctor"
							? appointment.grant_doctor_access
								? "Patient has granted you access to view their past medical records."
								: "Patient has not granted you access to view their past medical records."
							: role === "nurse"
							? appointment.grant_doctor_access
								? "Patient has granted access to view their past medical records via the assigned doctor."
								: "Patient has not granted access to view their past medical records via the assigned doctor."
							: ""}
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.label}>Supporting Documents</Text>
					{appointment.supporting_documents &&
					appointment.supporting_documents.length > 0 ? (
						<ScrollView horizontal>
							{appointment.supporting_documents.map(
								(file: any, index: number) => (
									<SupportingDocumentPreview
										key={index}
										file={file}
										signedUrl={file.signed_url}
									/>
								)
							)}
						</ScrollView>
					) : (
						<Text style={styles.contentText}>No documents uploaded</Text>
					)}
				</View>

				{showActions && (
					<View style={styles.actionButtonRow}>
						<Button
							mode="elevated"
							onPress={() => setUpdateModalVisible(true)}
							style={styles.uploadButton}
							disabled={
								displayStatus !== "pending" &&
								displayStatus !== "scheduled" &&
								displayStatus !== "rescheduling" &&
								displayStatus !== "rescheduled"
							} // Only allow update details when the appointment is in these four status
						>
							Update Appointment Details
						</Button>

						<Button
							mode="contained"
							onPress={() => setRescheduleModalVisible(true)}
							disabled={
								!canReschedule(appointment.starts_at) ||
								(displayStatus !== "pending" && displayStatus !== "scheduled") // Allow to reschedule only for pending or scheduled status
							}
						>
							Reschedule
						</Button>
					</View>
				)}

				{/* Show no show and completed buttons only for accepted filter and scheduled/rescheduled status */}

				{role === "nurse" &&
					(appointment.status === "scheduled" ||
						appointment.status === "rescheduled" ||
						appointment.status === "completed" ||
						appointment.status === "no_show") && (
						<View style={styles.actionButtonRow}>
							<Button
								mode="contained"
								onPress={() => handleUpdateAppointmentStatus("no_show")}
								style={styles.uploadButton}
								// style={{ marginBottom: 8 }}
								// textColor={getStatusColor("no_show")}
								textColor="white"
								buttonColor={getStatusColor("no_show")}
								disabled={appointment.status === "no_show"}
							>
								Mark as No Show
							</Button>
							<Button
								mode="contained"
								onPress={() => handleUpdateAppointmentStatus("completed")}
								style={styles.uploadButton}
								// textColor={getStatusColor("completed")}
								textColor="white"
								buttonColor={getStatusColor("completed")}
								disabled={appointment.status === "completed"}
							>
								Mark as Completed
							</Button>
						</View>
					)}
				{/* {role === "nurse" &&
					statusFilter === "accepted" &&
					item.status === "pending" && (
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
					)} */}
			</Card.Content>

			{showActions && (
				<Portal>
					<UpdateAppointmentDetailsModal
						visible={updateModalVisible}
						onClose={() => {
							reload();
							setUpdateModalVisible(false);
						}}
						session={session}
						onRecordSaved={() => {
							reload();
							setUpdateModalVisible(false);
						}}
						appointment={appointment}
					/>
					<RescheduleModal
						visible={rescheduleModalVisible}
						onClose={() => setRescheduleModalVisible(false)}
						session={session}
						onRecordSaved={() => {
							reload();
							setRescheduleModalVisible(false);
						}}
						appointment={appointment}
					/>
				</Portal>
			)}

			{saving && (
				<ActivityIndicator loadingMsg="" overlay={true} size="large" />
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		marginHorizontal: 16,
		marginBottom: 12,
		borderRadius: 12,
		backgroundColor: "white",
	},
	cardHeader: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 4,
	},
	statusText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	doctorName: {
		fontWeight: "bold",
		fontSize: 20,
		marginTop: 8,
		marginBottom: 2,
	},
	speciality: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
	},
	divider: {
		marginBottom: 16,
	},
	section: {
		marginBottom: 16,
	},
	label: {
		fontWeight: "bold",
		marginBottom: 4,
	},
	contentText: {
		marginBottom: 8,
	},
	uploadButton: {
		flex: 1,
		marginBottom: 15,
	},
	actionButtonRow: {
		marginBottom: 20,
	},
});
