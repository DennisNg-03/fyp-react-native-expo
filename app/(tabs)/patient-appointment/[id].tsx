import { ActivityIndicator } from "@/components/ActivityIndicator";
import { SupportingDocumentPreview } from "@/components/SupportingDocumentPreview";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { formatKL } from "@/utils/dateHelpers";
import { formatLabel, getStatusColor } from "@/utils/labelHelpers";
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
	Card,
	Divider,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppointmentDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session, role } = useAuth();
	const theme = useTheme();
	const [appointment, setAppointment] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!id) return;
		if (!session) return;

		const loadData = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from("appointments")
					.select(
						`
          id,
          starts_at,
          ends_at,
          status,
          reason,
          notes,
          for_whom,
          other_person,
          supporting_documents,
          doctors:doctor_id (
            speciality,
            bio,
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

				if (data && data.supporting_documents.length > 0) {
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
					const supportingDocsWithUrls = signedUrlData?.supporting_documents ?? [];

					// console.log("supportingDocsWithUrls:", supportingDocsWithUrls);

					// Replace supporting_documents with those with signed Urls
					result = {
						...data,
						supporting_documents: supportingDocsWithUrls,
					};
				}

				setAppointment(result);

				// setAppointment(data);
			} catch (e) {
				console.warn("Error fetching appointment:", e);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [session, id]);

	if (loading) {
		return <ActivityIndicator loadingMsg="Fetching appointment record..." />;
	}

	const doc = appointment.doctors;
	const provider = doc?.provider;

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: theme.colors.background,
					marginBottom: 10,
				}}
			>
				<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
									{ backgroundColor: getStatusColor(appointment.status) },
								]}
							>
								<Text variant="headlineSmall" style={styles.statusText}>
									{formatLabel(appointment.status)}
								</Text>
							</View>
						</View>
						<Card.Content>
							<Text style={styles.doctorName}>
								Dr {doc?.profiles?.full_name}
							</Text>
							<Text style={styles.speciality}>{doc?.speciality}</Text>

							<View style={[styles.section, { marginBottom: 8 }]}>
								<Text style={styles.label}>Healthcare Provider</Text>
								<Text style={styles.contentText}>
									{provider?.name} ({provider?.provider_type})
								</Text>
								<Text style={[styles.label, { marginTop: 12 }]}>Address</Text>
								<Text style={styles.contentText}>{provider?.address}</Text>
								{provider?.phone_number ? (
									<>
										<Text style={[styles.label, { marginTop: 12 }]}>Phone</Text>
										<Text style={styles.contentText}>
											{provider.phone_number}
										</Text>
									</>
								) : null}
							</View>

							<Divider bold={true} style={styles.divider} />

							<View style={styles.section}>
								<Text style={styles.label}>Appointment Time</Text>
								<Text variant="titleMedium" style={styles.dateTime}>
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
										Gender: {appointment.other_person.gender}
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
													signedUrl={
														file.signed_url
													}
												/>
											)
										)}
									</ScrollView>
								) : null}
							</View>
						</Card.Content>
					</Card>
				</ScrollView>
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
		fontSize: 12,
		textTransform: "uppercase",
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
});
