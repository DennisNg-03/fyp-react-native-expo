import { ActivityIndicator } from "@/components/ActivityIndicator";
import RescheduleModal from "@/components/RescheduleModal";
import { SupportingDocumentPreview } from "@/components/SupportingDocumentPreview";
import UpdateAppointmentDetailsModal from "@/components/UpdateAppointmentDetailsModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { canReschedule, getDisplayStatus } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import {
	formatLabel,
	formatStatusLabel,
	getStatusColor,
} from "@/utils/labelHelpers";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Keyboard,
	ScrollView,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {
	Button,
	Card,
	Divider,
	Portal,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientAppointmentDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session, role } = useAuth();
	const theme = useTheme();
	const [appointment, setAppointment] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [updateModalVisible, setUpdateModalVisible] = useState(false);
	const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);

	const loadData = async () => {
		if (!id || !session) return;

		setLoading(true);
		try {
			const { data, error } = await supabase
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
						slot_minutes,
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
				.eq("id", id)
				.single();

			console.log("Supabase returned data:", data);
			console.log("Supabase returned error:", error);

			if (!data) return;

			let result = data;

			if (data.supporting_documents?.length > 0) {
				const res = await fetch(
					`https://zxyyegizcgbhctjjoido.functions.supabase.co/getAppointmentDocSignedUrl`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session?.access_token}`,
						},
						body: JSON.stringify({
							supporting_documents: data.supporting_documents,
						}),
					}
				);

				if (!res.ok) {
					console.error(
						"Failed to fetch signed URLs for documents",
						await res.text()
					);
					return;
				}

				const signedUrlData = await res.json();
				const supportingDocsWithUrls =
					signedUrlData?.supporting_documents ?? [];

				result = {
					...data,
					supporting_documents: supportingDocsWithUrls,
				};
			}

			setAppointment(result);
		} catch (e) {
			console.warn("Error fetching appointment:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session, id]);

	useEffect(() => {
		console.log("appointment:", appointment);
	}, [appointment]);

	if (loading || !appointment) {
		return <ActivityIndicator loadingMsg="Fetching appointment record..." />;
	}

	const handleUpdateAppointmentDetails = async () => {
		console.log("");
	};

	const displayStatus = getDisplayStatus(appointment);
	console.log("[id] displayStatus:", displayStatus);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: theme.colors.tertiary,
					// paddingBottom: 10,
					// paddingTop: 20,
				}}
				edges={["left", "right", "bottom"]} // Remove extra spacing due to showm header + SafeAreaView
			>
				<ScrollView
					contentContainerStyle={{ paddingTop: 20, paddingBottom: 55 }}
				>
					<Card
						style={styles.card}
						key={appointment.id}
						elevation={2}
						onStartShouldSetResponder={() => true} // Enable this child respond to scroll, otherwise the Touchable component will affect scrolling
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
							<Text style={styles.speciality}>
								{appointment.doctor?.speciality}
							</Text>

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
								<Text style={styles.contentText}>
									{appointment.reason || "—"}
								</Text>
							</View>

							<View style={[styles.section, { marginBottom: 8 }]}>
								<Text style={styles.label}>Notes</Text>
								<Text style={styles.contentText}>
									{appointment.notes || "—"}
								</Text>
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

							{appointment.other_person ? (
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
										{formatKL(
											appointment.other_person.date_of_birth,
											"dd MMM yyyy"
										)}
									</Text>
								</View>
							) : null}
							<View style={styles.section}>
								<Text style={styles.label}>Supporting Documents</Text>
								{appointment.supporting_documents &&
								appointment.supporting_documents.length > 0 ? (
									<ScrollView
										horizontal
										// style={styles.filePreviewHorizontalScroll}
									>
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
									<View style={{ marginBottom: 10}}>
										<Text style={styles.contentText}>
											No documents uploaded
										</Text>
									</View>
								)}
							</View>

							<Button
								mode="elevated"
								onPress={() => setUpdateModalVisible(true)}
								style={styles.uploadButton}
								disabled={
									!canReschedule(appointment.starts_at) ||
									(displayStatus !== "pending" &&
										displayStatus !== "scheduled" &&
										displayStatus !== "rescheduling")
								} // Only allow reschedule when it passes "canReschedule" and it has pending/scheduled/rescheduling displayStatus
							>
								Update Appointment Details
							</Button>

							<Button
								mode="contained"
								onPress={() => setRescheduleModalVisible(true)}
								disabled={
									!canReschedule(appointment.starts_at) ||
									(displayStatus !== "pending" && displayStatus !== "scheduled")
								} // Only allow reschedule when it passes "canReschedule" and it has pending/scheduled displayStatus
							>
								Reschedule
							</Button>
						</Card.Content>
					</Card>
				</ScrollView>
				<Portal>
					<UpdateAppointmentDetailsModal
						visible={updateModalVisible}
						onClose={() => setUpdateModalVisible(false)}
						session={session}
						onRecordSaved={() => {
							loadData();
							setUpdateModalVisible(false);
						}}
						appointment={appointment}
					/>
					<RescheduleModal
						visible={rescheduleModalVisible}
						onClose={() => setRescheduleModalVisible(false)}
						session={session}
						onRecordSaved={() => {
							loadData();
							setRescheduleModalVisible(false);
						}}
						appointment={appointment}
					/>
				</Portal>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "white",
	},
	statusBar: {
		width: 8,
		borderTopLeftRadius: 8,
		borderBottomLeftRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
	},
	statusBarText: {
		color: "white",
		fontWeight: "bold",
		transform: [{ rotate: "-90deg" }],
		width: 100,
		textAlign: "center",
		fontSize: 12,
		letterSpacing: 1,
	},
	scrollView: {
		// flex: 1,
		// backgroundColor: "white",
		// flexGrow: 1,
	},
	card: {
		marginHorizontal: 16,
		marginBottom: 12,
		borderRadius: 12,
		backgroundColor: "white",
		// overflow: "hidden", // important so the header bar stays within card
	},
	cardHeader: {
		width: "100%",
		// height: 12,
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
	dateTime: {
		fontSize: 16,
		marginTop: 0,
		marginBottom: 3,
	},
	contentText: {
		marginBottom: 8,
	},
	uploadButton: {
		flex: 1,
		marginBottom: 15,
	},
});
