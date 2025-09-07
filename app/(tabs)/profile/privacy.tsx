import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Divider, List, Switch, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacySettingsScreen() {
	const { session } = useAuth();
	const userId = session?.user.id;
	const theme = useTheme();
	const [grantPastAccess, setGrantPastAccess] = useState(false);
	const [loading, setLoading] = useState(true);
	const [doctorAccessList, setDoctorAccessList] = useState<
		{ doctor_id: string; doctor_name: string; granted: boolean }[]
	>([]);

	const loadSettings = async () => {
		if (!session) return;
		setLoading(true);
		try {
			// Fetch user's privacy settings
			const { data, error } = await supabase
				.from("patient_access")
				.select(
					"doctor_id, granted_at, revoked_at, doctor:doctor_id(profiles(full_name))"
				);

			if (error) throw error;

			setDoctorAccessList(
				(data ?? []).map((row: any) => ({
					doctor_id: row.doctor_id,
					doctor_name: row.doctor?.profiles?.full_name ?? "Unknown",
					granted: !row.revoked_at,
				}))
			);

			// Fetch general past access (assuming you store a grant_doctor_access boolean somewhere)
			const { data: appointmentsData, error: apptError } = await supabase
				.from("appointments")
				.select("grant_doctor_access")
				.eq("patient_id", userId)
				.limit(1)
				.single();

			if (!apptError)
				setGrantPastAccess(appointmentsData?.grant_doctor_access ?? false);
		} catch (err) {
			console.error(err);
			Alert.alert("Error", "Failed to load privacy settings.");
		} finally {
			setLoading(false);
		}
	};

	const toggleDoctorAccess = async (doctorId: string, grant: boolean) => {
	
		try {
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
						doctor_id: doctorId,
						grant,
					}),
				}
			);

			if (!res.ok) {
				const text = await res.text();
				console.error("Error saving patient access:", res.status, text);
				return;
			}

			const data = await res.json();
			console.log("Patient access insert data:", data);

			// Update local state
			setDoctorAccessList((prev) =>
				prev.map((d) =>
					d.doctor_id === doctorId ? { ...d, granted: grant } : d
				)
			);
		} catch (err: any) {
			console.error(err);
			Alert.alert("Error saving access", err.message);
		}
	};

	useEffect(() => {
		loadSettings();
	}, []);

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView
				contentContainerStyle={{
					// padding: 20,
					// paddingBottom: 65,
					flexGrow: 1,
					justifyContent: "center",
				}}
			>
				<View style={{ padding: 16 }}>
					<Text variant="headlineSmall" style={{ marginBottom: 16 }}>
						Privacy Settings
					</Text>

					<List.Section>
						<List.Subheader>Medical Record Access</List.Subheader>

						{/* Toggle for past records */}
						<List.Item
							title="Allow doctors to access past medical records"
							right={() => (
								<Switch
									value={grantPastAccess}
									onValueChange={(value) => setGrantPastAccess(value)}
								/>
							)}
						/>

						<Divider />

						{/* Doctor-specific toggles */}
						{doctorAccessList.map((doc) => (
							<List.Item
								key={doc.doctor_id}
								title={`Dr ${doc.doctor_name}`}
								description={doc.granted ? "Access granted" : "Access revoked"}
								right={() => (
									<Switch
										value={doc.granted}
										onValueChange={(value) =>
											toggleDoctorAccess(doc.doctor_id, value)
										}
									/>
								)}
							/>
						))}
					</List.Section>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
