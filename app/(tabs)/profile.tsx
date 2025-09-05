import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Divider, List, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorProfile, NurseProfile, PatientProfile } from "@/types/user";

type FlattenedUser =
	| (PatientProfile & { role: "patient" })
	| (DoctorProfile & { role: "doctor" })
	| (NurseProfile & { role: "nurse" });

export default function ProfileScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;
	const [profile, setProfile] = useState<FlattenedUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProfile = async () => {
			if (!userId || !role) return;

			try {
				// First fetch the base profile row from the `profiles` table. This avoids relying on
				// cross-table foreign key naming/relationships in a single select and is more robust.
				const { data: baseProfile, error: baseError } = await supabase
					.from("profiles")
					.select("id, full_name, email, phone_number, gender, avatar_url")
					.eq("id", userId)
					.maybeSingle();

				if (baseError) throw baseError;
				if (!baseProfile) {
					setProfile(null);
					return;
				}

				// Then query role-specific table and merge
				if (role === "patient") {
					const { data: patientData, error: patientError } = await supabase
						.from("patients")
						.select("date_of_birth, insurance_info, medical_history")
						.eq("id", userId)
						.maybeSingle();
					if (patientError) throw patientError;
					setProfile({
						role: "patient",
						...baseProfile,
						...(patientData ?? {}),
					});
					return;
				}

				if (role === "doctor") {
					const { data: doctorData, error: doctorError } = await supabase
						.from("doctors")
						.select(
							"speciality, slot_minutes, timezone, availability, bio, provider_id"
						)
						.eq("id", userId)
						.maybeSingle();

					if (doctorError) throw doctorError;

					setProfile({
						role: "doctor",
						...baseProfile, // has id, full_name, email, phone_number, gender, avatar_url
						...doctorData, // doctor-specific fields
					} as DoctorProfile & { role: "doctor" });

					return;
				}

				if (role === "nurse") {
					const { data: nurseData, error: nurseError } = await supabase
						.from("nurses")
						.select("assigned_doctor_id, provider_id")
						.eq("id", userId)
						.maybeSingle();
					if (nurseError) throw nurseError;
					setProfile({
						role: "doctor",
						...baseProfile, // has id, full_name, email, phone_number, gender, avatar_url
						...nurseData, // nurse-specific fields
					} as DoctorProfile & { role: "doctor" });

					return;
				}
			} catch (err) {
				console.error("Error loading profile:", err);
				setProfile(null);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [userId, role]);

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			console.log("Logged out successfully!");
		} catch (err) {
			console.error("Error logging out", err);
		}
	};

	const renderRoleSpecificFields = () => {
		if (!profile) return null;

		switch (profile.role) {
			case "doctor":
				return (
					<>
						<List.Item
							title="Specialisation"
							description={profile.speciality}
							left={(props) => <List.Icon {...props} icon="stethoscope" />}
						/>
						<List.Item
							title="Availability"
							description={profile.availability}
							left={(props) => <List.Icon {...props} icon="calendar-clock" />}
						/>
						<List.Item
							title="Timezone"
							description={profile.timezone || "Not set"}
							left={(props) => <List.Icon {...props} icon="earth" />}
						/>
					</>
				);

			case "nurse":
				return (
					<>
						<List.Item
							title="Assigned DoctorProfile"
							description={profile.assigned_doctor_id || "None"}
							left={(props) => <List.Icon {...props} icon="account-heart" />}
						/>
					</>
				);

			case "patient":
				return (
					<>
						<List.Item
							title="Date of Birth"
							description={profile.date_of_birth}
							left={(props) => <List.Icon {...props} icon="calendar" />}
						/>
						<List.Item
							title="Insurance Info"
							description={profile.insurance_info || "Not provided"}
							left={(props) => (
								<List.Icon {...props} icon="card-account-details" />
							)}
						/>
						<List.Item
							title="Medical History"
							description={profile.medical_history || "Not provided"}
							left={(props) => <List.Icon {...props} icon="history" />}
						/>
					</>
				);

			default:
				return null;
		}
	};

	if (loading) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<ActivityIndicator />
			</SafeAreaView>
		);
	}

	if (!profile) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text>No profile data found.</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView>
			<ScrollView style={{ backgroundColor: theme.colors.tertiary }}>
				<View style={styles.header}>
					<Avatar.Image
						size={100}
						source={
							profile.avatar_url
								? { uri: profile.avatar_url }
								: require("@/assets/images/default-profile-pic.png")
						}
					/>
					<Text variant="headlineSmall" style={{ marginTop: 10 }}>
						{profile.full_name}
					</Text>
					<Text variant="bodyMedium">{profile.role.toUpperCase()}</Text>
				</View>

				<Divider style={{ marginVertical: 10 }} />

				{/* Common Info */}
				<List.Item
					title="Email"
					description={profile.email}
					left={(props) => <List.Icon {...props} icon="email" />}
				/>
				<List.Item
					title="Phone"
					description={profile.phone_number}
					left={(props) => <List.Icon {...props} icon="phone" />}
				/>
				<List.Item
					title="Gender"
					description={profile.gender}
					left={(props) => <List.Icon {...props} icon="gender-male-female" />}
				/>

				{renderRoleSpecificFields()}

				<Divider style={{ marginVertical: 10 }} />

				{/* Settings */}
				<List.Item
					title="Change Password"
					left={(props) => <List.Icon {...props} icon="lock-reset" />}
				/>
				<List.Item
					title="Notification Preferences"
					left={(props) => <List.Icon {...props} icon="bell" />}
				/>
				<List.Item
					title="Privacy Settings"
					left={(props) => <List.Icon {...props} icon="shield-lock" />}
				/>
				<List.Item
					title="Log out"
					left={(props) => (
						<List.Icon {...props} icon="logout" color={theme.colors.error} />
					)}
					titleStyle={{ color: theme.colors.error }}
					onPress={handleLogout}
				/>

				<Divider style={{ marginBottom: 50 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		alignItems: "center",
		paddingVertical: 20,
	},
});
