import ConfirmationDialog from "@/components/ConfirmationDialog";
import { HealthcareProviderDropdown } from "@/components/HealthcareProviderDropdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Divider, List, Switch, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacySettingsScreen() {
	const { session } = useAuth();
	const userId = session?.user.id;
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [selectedProvider, setSelectedProvider] = useState<string | undefined>(
		undefined
	);
	const [doctorAccessList, setDoctorAccessList] = useState<
		{ doctor_id: string; doctor_name: string; granted: boolean }[]
	>([]);
	const [pendingToggle, setPendingToggle] = useState<{
		doctor_id: string;
		grant: boolean;
	} | null>(null);
	const [dialogVisible, setDialogVisible] = useState(false);

	// const loadDoctorsAccess = async (providerId: string) => {
	// 	if (!session) return;
	// 	setLoading(true);
	// 	try {
	// 		const { data, error } = await supabase
	// 			.from("patient_access")
	// 			.select(
	// 				"doctor_id, grant_status, created_at, doctor:doctor_id(provider_id, profiles(full_name))"
	// 			)
	// 			.eq("patient_id", userId)
	// 			.order("created_at", { ascending: false });
	// 		if (error) throw error;

	// 		const latestAccessMap: Record<string, any> = {};
	// 		(data ?? []).forEach((row: any) => {
	// 			if (!latestAccessMap[row.doctor_id]) {
	// 				latestAccessMap[row.doctor_id] = row;
	// 			}
	// 		});

	// 		const filteredDoctors = Object.values(latestAccessMap)
	// 			.filter((row: any) => row.doctor?.provider_id === providerId)
	// 			.map((row: any) => ({
	// 				doctor_id: row.doctor_id,
	// 				doctor_name: row.doctor?.profiles?.full_name ?? "Unknown",
	// 				granted: row.grant_status,
	// 			}));

	// 		setDoctorAccessList(filteredDoctors);
	// 	} catch (err) {
	// 		console.error(err);
	// 		Alert.alert("Error", "Failed to load doctor access.");
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	const loadDoctorsAccess = async (providerId: string) => {
		if (!session) return;
		setLoading(true);

		try {
			const { data: doctorsData, error: doctorsError } = await supabase
				.from("doctors")
				.select(`id, profiles(full_name), provider_id`)
				.eq("provider_id", providerId);

			if (doctorsError) throw doctorsError;

			// Fetch patient_access for current user for these doctors
			const doctorIds = doctorsData?.map((d) => d.id) ?? [];
			const { data: accessData, error: accessError } = await supabase
				.from("patient_access")
				.select("doctor_id, grant_status, created_at")
				.eq("patient_id", userId)
				.in("doctor_id", doctorIds)
				.order("created_at", { ascending: false });

			if (accessError) throw accessError;

			// Map latest access per doctor
			const latestAccessMap: Record<string, any> = {};
			(accessData ?? []).forEach((row: any) => {
				if (!latestAccessMap[row.doctor_id]) {
					latestAccessMap[row.doctor_id] = row;
				}
			});

			const combinedDoctors = (doctorsData ?? []).map((doc: any) => ({
				doctor_id: doc.id,
				doctor_name: doc.profiles?.full_name ?? "Unknown",
				provider_id: doc.provider_id,
				granted: latestAccessMap[doc.id]?.grant_status ?? false, // If no record found in "patient_access", it means false
			}));

			// Sort alphabetically by doctor_name
			combinedDoctors.sort((a, b) =>
				a.doctor_name.localeCompare(b.doctor_name)
			);

			// Combine doctor info with access status
			// const combined = (doctorsData ?? []).map((doc: any) => ({
			// 	doctor_id: doc.id,
			// 	doctor_name: doc.profiles?.full_name ?? "Unknown",
			// 	granted: latestAccessMap[doc.id]?.grant_status ?? false, // default to false if no record
			// }));

			setDoctorAccessList(combinedDoctors);
		} catch (err) {
			console.error(err);
			Alert.alert("Error", "Failed to load doctor access.");
		} finally {
			setLoading(false);
		}
	};

	const handleToggleAccess = (doctorId: string, grant: boolean) => {
		setPendingToggle({ doctor_id: doctorId, grant });
		setDialogVisible(true);
	};

	const confirmToggleAccess = async () => {
		if (!pendingToggle || !session) {
			setDialogVisible(false);
			return;
		}
		const { doctor_id, grant } = pendingToggle;
		setDialogVisible(false);
		try {
			// Optimistic update
			setDoctorAccessList((prev) =>
				prev.map((d) =>
					d.doctor_id === doctor_id ? { ...d, granted: grant } : d
				)
			);

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/insertPatientAccess",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						patient_id: userId,
						doctor_id,
						grant,
					}),
				}
			);

			if (!res.ok) {
				const text = await res.text();
				console.error("Error saving patient access:", res.status, text);
				// Rollback
				setDoctorAccessList((prev) =>
					prev.map((d) =>
						d.doctor_id === doctor_id ? { ...d, granted: !grant } : d
					)
				);
				return;
			}

			const data = await res.json();
			console.log("Patient access insert data:", data);
		} catch (err: any) {
			console.error(err);
			Alert.alert("Error saving access", err.message);
		} finally {
			setPendingToggle(null);
		}
	};

	useEffect(() => {
		if (selectedProvider) {
			loadDoctorsAccess(selectedProvider);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProvider]);

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 50,
				}}
			>
				<View style={{ paddingHorizontal: 16 }}>
					<List.Section>
						<Text
							style={[styles.pageHeader, { marginTop: 20, marginBottom: 20 }]}
						>
							Select a healthcare provider from the list to grant/revoke access
							towards your medical records.
						</Text>
						{/* <List.Subheader style={styles.pageHeader}>Select a healthcare provider to grant/revoke access towards your medical records</List.Subheader> */}

						{/* Provider Dropdown */}
						<HealthcareProviderDropdown
							selectedProvider={selectedProvider}
							setSelectedProvider={setSelectedProvider}
						/>

						<Divider style={{ marginVertical: 12 }} />

						{/* Doctor list for selected provider */}
						{selectedProvider ? (
							doctorAccessList.length > 0 ? (
								doctorAccessList.map((doc) => (
									<List.Item
										key={doc.doctor_id}
										title={`Dr ${doc.doctor_name}`}
										description={
											doc.granted ? "Access granted" : "Access revoked"
										}
										right={() => (
											<Switch
												value={doc.granted}
												onValueChange={(value) =>
													handleToggleAccess(doc.doctor_id, value)
												}
											/>
										)}
									/>
								))
							) : (
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.onSurfaceVariant,
										marginVertical: 16,
									}}
								>
									No doctors found for this healthcare provider.
								</Text>
							)
						) : null}
					</List.Section>
				</View>
			</ScrollView>

			<ConfirmationDialog
				visible={dialogVisible}
				onCancel={() => setDialogVisible(false)}
				onConfirm={confirmToggleAccess}
				title="Confirm Access Change"
				messagePrimary="Are you sure you want to change this doctor's access?"
				messageSecondary=""
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	pageHeader: {
		fontWeight: "500",
		fontSize: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
});
