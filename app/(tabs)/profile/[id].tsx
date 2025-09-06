import { ActivityIndicator } from "@/components/ActivityIndicator";
import { GenderDropdown } from "@/components/GenderDropdown";
import { SpecialityDropdown } from "@/components/SpecialityDropdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorProfile, FlattenedUser, NurseProfile } from "@/types/user";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const theme = useTheme();
	const { session, role } = useAuth();

	const userId = id ?? session?.user.id;

	const [profile, setProfile] = useState<FlattenedUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Common editable fields
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [gender, setGender] = useState<string | undefined>(undefined);

	// Patient-specific fields
	const [dateOfBirth, setDateOfBirth] = useState<string | undefined>(undefined);
	const [bloodType, setBloodType] = useState<string | undefined>(undefined);
	const [allergies, setAllergies] = useState<string | undefined>(undefined);
	const [currentMedications, setCurrentMedications] = useState<
		string | undefined
	>(undefined);
	const [chronicConditions, setChronicConditions] = useState<
		string | undefined
	>(undefined);
	const [pastSurgeries, setPastSurgeries] = useState<string | undefined>(
		undefined
	);
	const [insuranceInfo, setInsuranceInfo] = useState<string | undefined>(
		undefined
	);
	const [medicalHistory, setMedicalHistory] = useState<string | undefined>(
		undefined
	);
	const [emergencyContact, setEmergencyContact] = useState<string | undefined>(
		undefined
	);

	// Doctor-specific fields
	const [speciality, setSpeciality] = useState<string | undefined>(undefined);
	const [availability, setAvailability] = useState<string | undefined>(
		undefined
	);
	const [timezone, setTimezone] = useState<string | undefined>(undefined);
	const [bio, setBio] = useState<string | undefined>(undefined);

	// Nurse-specific fields
	const [assignedDoctorId, setAssignedDoctorId] = useState<string | undefined>(
		undefined
	);

	useEffect(() => {
		const fetchProfile = async () => {
			if (!userId || !role) return;

			try {
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

				// let patientData: PatientProfile | null = null;
				// let doctorData: DoctorProfile | null = null;
				// let nurseData: NurseProfile | null = null;
				let patientData: any = null;
				let doctorData: any = null;
				let nurseData: any = null;

				// Then query role-specific table and merge
				if (role === "patient") {
					const { data, error } = await supabase
						.from("patients")
						.select(
							"date_of_birth, insurance_info, medical_history, blood_type, allergies, current_medications, chronic_conditions, past_surgeries, emergency_contact"
						)
						.eq("id", userId)
						.maybeSingle();
					if (error) throw error;
					patientData = data;

					setProfile({
						role: "patient",
						...baseProfile,
						...patientData,
					});
					return;
				}

				if (role === "doctor") {
					const { data, error } = await supabase
						.from("doctors")
						.select("speciality, slot_minutes, timezone, bio, provider_id")
						.eq("id", userId)
						.maybeSingle();

					if (error) throw error;
					doctorData = data;

					setProfile({
						role: "doctor",
						...baseProfile,
						...doctorData,
					} as DoctorProfile & { role: "doctor" });

					return;
				}

				if (role === "nurse") {
					const { data, error } = await supabase
						.from("nurses")
						.select("assigned_doctor_id, provider_id")
						.eq("id", userId)
						.maybeSingle();
					if (error) throw error;
					nurseData = data;

					setProfile({
						role: "nurse",
						...baseProfile,
						...nurseData,
					} as NurseProfile & { role: "nurse" });

					return;
				}

				// Initialize state
				setFullName(baseProfile.full_name ?? "");
				setEmail(baseProfile.email ?? "");
				setPhoneNumber(baseProfile.phone_number ?? "");
				setGender(baseProfile.gender ?? undefined);

				if (role === "patient" && patientData) {
					setDateOfBirth(patientData.date_of_birth);
					setBloodType(patientData.blood_type);
					setAllergies(patientData.allergies);
					setCurrentMedications(patientData.current_medications);
					setChronicConditions(patientData.chronic_conditions);
					setPastSurgeries(patientData.past_surgeries);
					setInsuranceInfo(patientData.insurance_info);
					setMedicalHistory(patientData.medical_history);
					setEmergencyContact(patientData.emergency_contact);
				}

				if (role === "doctor" && doctorData) {
					setSpeciality(doctorData.speciality);
					setAvailability(doctorData.availability);
					setTimezone(doctorData.timezone);
					setBio(doctorData.bio);
				}

				if (role === "nurse" && nurseData) {
					setAssignedDoctorId(nurseData.assigned_doctor_id);
				}
			} catch (err) {
				console.error("Failed to fetch profile:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [userId, role]);

	const handleSave = async () => {
		if (!profile) return;
		setSaving(true);

		try {
			// Update base profile
			const { error: profileError } = await supabase
				.from("profiles")
				.update({
					full_name: fullName,
					email,
					phone_number: phoneNumber,
					gender,
				})
				.eq("id", userId);

			if (profileError) throw profileError;

			// Update role-specific tables
			if (role === "patient") {
				const { error: patientError } = await supabase
					.from("patients")
					.update({
						date_of_birth: dateOfBirth,
						blood_type: bloodType,
						allergies,
						current_medications: currentMedications,
						chronic_conditions: chronicConditions,
						past_surgeries: pastSurgeries,
						insurance_info: insuranceInfo,
						medical_history: medicalHistory,
						emergency_contact: emergencyContact,
					})
					.eq("id", userId);

				if (patientError) throw patientError;
			} else if (role === "doctor") {
				const { error: doctorError } = await supabase
					.from("doctors")
					.update({
						speciality,
						availability,
						timezone,
						bio,
					})
					.eq("id", userId);

				if (doctorError) throw doctorError;
			} else if (role === "nurse") {
				const { error: nurseError } = await supabase
					.from("nurses")
					.update({ assigned_doctor_id: assignedDoctorId })
					.eq("id", userId);

				if (nurseError) throw nurseError;
			}

			Alert.alert("Success", "Profile updated successfully!");
			router.back();
		} catch (err) {
			console.error("Error saving profile:", err);
			Alert.alert("Error", "Failed to update profile.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<ActivityIndicator loadingMsg="" overlay={true} size="large" />
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
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 65 }}>
				{/* Common fields */}
				<TextInput
					label="Full Name"
					value={fullName}
					onChangeText={setFullName}
					mode="outlined"
					style={styles.input}
				/>
				<TextInput
					label="Email"
					value={email}
					onChangeText={setEmail}
					mode="outlined"
					style={styles.input}
					keyboardType="email-address"
				/>
				<TextInput
					label="Phone Number"
					value={phoneNumber}
					onChangeText={setPhoneNumber}
					mode="outlined"
					style={styles.input}
					keyboardType="phone-pad"
				/>
				<GenderDropdown selectedGender={gender} setSelectedGender={setGender} />

				{/* Patient fields */}
				{profile.role === "patient" && (
					<>
						<TextInput
							label="Date of Birth"
							value={dateOfBirth}
							onChangeText={setDateOfBirth}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Blood Type"
							value={bloodType}
							onChangeText={setBloodType}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Allergies"
							value={allergies}
							onChangeText={setAllergies}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Current Medications"
							value={currentMedications}
							onChangeText={setCurrentMedications}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Chronic Conditions"
							value={chronicConditions}
							onChangeText={setChronicConditions}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Past Surgeries"
							value={pastSurgeries}
							onChangeText={setPastSurgeries}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Insurance Info"
							value={insuranceInfo}
							onChangeText={setInsuranceInfo}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Medical History"
							value={medicalHistory}
							onChangeText={setMedicalHistory}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Emergency Contact"
							value={emergencyContact}
							onChangeText={setEmergencyContact}
							mode="outlined"
							style={styles.input}
						/>
					</>
				)}

				{/* Doctor fields */}
				{profile.role === "doctor" && (
					<>
						<SpecialityDropdown
							selectedSpeciality={speciality}
							setSelectedSpeciality={setSpeciality}
						/>
						<TextInput
							label="Availability"
							value={availability}
							onChangeText={setAvailability}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Timezone"
							value={timezone}
							onChangeText={setTimezone}
							mode="outlined"
							style={styles.input}
						/>
						<TextInput
							label="Bio"
							value={bio}
							onChangeText={setBio}
							mode="outlined"
							style={styles.input}
							multiline
							numberOfLines={3}
						/>
					</>
				)}

				{/* Nurse fields */}
				{profile.role === "nurse" && (
					<TextInput
						label="Assigned Doctor ID"
						value={assignedDoctorId}
						onChangeText={setAssignedDoctorId}
						mode="outlined"
						style={styles.input}
					/>
				)}

				<Button
					mode="contained"
					onPress={handleSave}
					loading={saving}
					style={{ marginTop: 16 }}
				>
					Save Changes
				</Button>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	input: { marginBottom: 12 },
});
