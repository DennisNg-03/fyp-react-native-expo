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
						<Text style={styles.label}>Patient Details</Text>
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
								displayStatus !== "rescheduling"
							}
						>
							Update Appointment Details
						</Button>

						<Button
							mode="contained"
							onPress={() => setRescheduleModalVisible(true)}
							disabled={
								!canReschedule(appointment.starts_at) ||
								(displayStatus !== "pending" && displayStatus !== "scheduled")
							}
						>
							Reschedule
						</Button>
					</View>
				)}
			</Card.Content>

			{showActions && (
				<Portal>
					<UpdateAppointmentDetailsModal
						visible={updateModalVisible}
						onClose={() => setUpdateModalVisible(false)}
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
