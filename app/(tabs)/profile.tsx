import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Divider, List, Text, useTheme } from "react-native-paper";

import { type UserRole } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserProfile {
	role: UserRole;
	name: string;
	email: string;
	phone: string;
	avatar?: string;
	// Doctor/Nurse
	medicalId?: string;
	specialisation?: string;
	availability?: string;
	// Patient/Guardian
	dateOfBirth?: string;
	gender?: string;
	bloodType?: string;
	allergies?: string;
	emergencyContact?: string;
	currentMedications: string;
	chronicConditions: string;
	pastSurgeries: string;
	vaccinationStatus: string;
}

export default function ProfileScreen() {
	const theme = useTheme();
	const { role } = useAuth();

	// Doctor user
	// const user: UserProfile = {
	// 	role: "doctor",
	// 	name: "Dr. Sarah Connor",
	// 	email: "sarah.connor@example.com",
	// 	phone: "+1 555 123 456",
	// 	avatar: "",
	// 	medicalId: "MED-987654",
	// 	specialisation: "Cardiology",
	// 	availability: "Mon–Fri, 9am–5pm",
	// };

	const user: UserProfile = {
	role: "patient",
	name: "John Doe",
	email: "john.doe@example.com",
	phone: "+60 12-345 6789",
	avatar: "",
	dateOfBirth: "1990-04-15",
	gender: "Male",
	bloodType: "O+",
	allergies: "Penicillin, Peanuts",
	emergencyContact: "+60 11-987 6543",
	// If you extend UserProfile later to include more medical records
	// you can add them here, e.g.:
	currentMedications: "Metformin, Lisinopril",
	chronicConditions: "Type 2 Diabetes, Hypertension",
	pastSurgeries: "Appendectomy (2015)",
	vaccinationStatus: "Up-to-date"
};

	const handleLogout = async () => {
		try {
			supabase.auth.signOut();
			// if (error) {
			// 	console.log("Error logging out", error);
			// 	return;
			// }
			console.log("Logged out successfully!");
			router.replace("/");
		} catch (err) {
			console.error("Error logging out", err);
		}
	};

	const renderRoleSpecificFields = () => {
		switch (role) {
			case "doctor":
			case "nurse":
				return (
					<>
						<List.Item
							title="Medical ID"
							description={user.medicalId}
							left={(props) => <List.Icon {...props} icon="badge-account" />}
						/>
						<List.Item
							title="Specialisation"
							description={user.specialisation}
							left={(props) => <List.Icon {...props} icon="stethoscope" />}
						/>
						<List.Item
							title="Availability"
							description={user.availability}
							left={(props) => <List.Icon {...props} icon="calendar-clock" />}
						/>
					</>
				);
			// Patient Info
			case "patient":
				return (
					<>
						{/* Basic personal info */}
						<List.Item
							title="Date of Birth"
							description={user?.dateOfBirth}
							left={(props) => <List.Icon {...props} icon="calendar" />}
						/>
						<List.Item
							title="Gender"
							description={user?.gender}
							left={(props) => (
								<List.Icon {...props} icon="gender-male-female" />
							)}
						/>

						{/* Medical record info */}
						<List.Item
							title="Blood Type"
							description={user?.bloodType}
							left={(props) => <List.Icon {...props} icon="water" />}
						/>
						<List.Item
							title="Allergies"
							description={user?.allergies}
							left={(props) => <List.Icon {...props} icon="alert-circle" />}
						/>
						<List.Item
							title="Current Medications"
							description={user?.currentMedications || "None"}
							left={(props) => <List.Icon {...props} icon="pill" />}
						/>
						<List.Item
							title="Chronic Conditions"
							description={user?.chronicConditions || "None"}
							left={(props) => <List.Icon {...props} icon="heart-pulse" />}
						/>
						<List.Item
							title="Past Surgeries"
							description={user?.pastSurgeries || "None"}
							left={(props) => <List.Icon {...props} icon="hospital" />}
						/>
						<List.Item
							title="Vaccination Status"
							description={user?.vaccinationStatus || "Unknown"}
							left={(props) => <List.Icon {...props} icon="needle" />}
						/>

						{/* Emergency info */}
						<List.Item
							title="Emergency Contact"
							description={user?.emergencyContact}
							left={(props) => <List.Icon {...props} icon="phone" />}
						/>
					</>
				);
			case "guardian":
				return (
					<>
						<List.Item
							title="Date of Birth"
							description={user.dateOfBirth}
							left={(props) => <List.Icon {...props} icon="calendar" />}
						/>
						<List.Item
							title="Gender"
							description={user.gender}
							left={(props) => (
								<List.Icon {...props} icon="gender-male-female" />
							)}
						/>
						<List.Item
							title="Blood Type"
							description={user.bloodType}
							left={(props) => <List.Icon {...props} icon="water" />}
						/>
						<List.Item
							title="Allergies"
							description={user.allergies}
							left={(props) => <List.Icon {...props} icon="alert-circle" />}
						/>
						<List.Item
							title="Emergency Contact"
							description={user.emergencyContact}
							left={(props) => <List.Icon {...props} icon="phone" />}
						/>
					</>
				);
			default:
				return null;
		}
	};

	return (
		<SafeAreaView>
			<ScrollView style={{ backgroundColor: theme.colors.background }}>
				<View style={styles.header}>
					<Avatar.Image
						size={100}
						source={
							user.avatar
								? { uri: user.avatar }
								: require("@/assets/images/react-logo.png")
						}
					/>
					<Text variant="headlineSmall" style={{ marginTop: 10 }}>
						{user.name}
					</Text>
					<Text variant="bodyMedium">{role?.toUpperCase() ?? "Undefined"}</Text>
				</View>

				<Divider style={{ marginVertical: 10 }} />

				{/* Common Info */}
				<List.Item
					title="Email"
					description={user.email}
					left={(props) => <List.Icon {...props} icon="email" />}
				/>
				<List.Item
					title="Phone"
					description={user.phone}
					left={(props) => <List.Icon {...props} icon="phone" />}
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
	container: {
		padding: 16,
	},
	card: {
		marginBottom: 16,
	},
	profileHeader: {
		flexDirection: "row",
		alignItems: "center",
	},
	profileText: {
		marginLeft: 16,
		flex: 1,
	},
	header: {
		alignItems: "center",
		paddingVertical: 20,
	},
});
