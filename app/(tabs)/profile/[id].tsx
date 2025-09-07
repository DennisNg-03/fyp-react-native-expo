import { ActivityIndicator } from "@/components/ActivityIndicator";
import CustomDatePicker from "@/components/CustomDatePicker";
import { DoctorDropdown } from "@/components/DoctorDropdown";
import { GenderDropdown } from "@/components/GenderDropdown";
import { HealthcareProviderDropdown } from "@/components/HealthcareProviderDropdown";
import { SpecialityDropdown } from "@/components/SpecialityDropdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorProfile, FlattenedUser, NurseProfile } from "@/types/user";
import { formatKL } from "@/utils/dateHelpers";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";
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
	const [healthcareProvider, setHealthcareProvider] = useState<
		string | undefined
	>(undefined);
	const [speciality, setSpeciality] = useState<string | undefined>(undefined);
	// const [availability, setAvailability] = useState<string | undefined>(
	// 	undefined
	// );
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
				}

				if (role === "doctor") {
					const { data, error } = await supabase
						.from("doctors")
						.select("speciality, slot_minutes, bio, provider_id")
						.eq("id", userId)
						.maybeSingle();

					if (error) throw error;
					doctorData = data;

					setProfile({
						role: "doctor",
						...baseProfile,
						...doctorData,
					} as DoctorProfile & { role: "doctor" });
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
					// setAvailability(doctorData.availability);
					setBio(doctorData.bio);
					setHealthcareProvider(doctorData.provider_id);
				}

				if (role === "nurse" && nurseData) {
					setHealthcareProvider(nurseData.provider_id);
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

	useEffect(() => {
		console.log("profile:", profile);
	}, [profile]);

	useEffect(() => {
		console.log("dob:", dateOfBirth);
	}, [dateOfBirth]);

	const handleSave = async () => {
		if (!profile || !session) return;

		if (!fullName || !phoneNumber) {
			Alert.alert("Alert", "You must fill in Full Name and Phone Number!");
			return;
		}

		try {
			setSaving(true);
			const payload: any = {
				user_id: userId,
				full_name: fullName,
				email,
				phone_number: phoneNumber,
				gender,
				role,
			};

			// Add role-specific fields
			if (role === "patient") {
				payload.date_of_birth = dateOfBirth;
				payload.blood_type = bloodType;
				payload.allergies = allergies;
				payload.current_medications = currentMedications;
				payload.chronic_conditions = chronicConditions;
				payload.past_surgeries = pastSurgeries;
				payload.insurance_info = insuranceInfo;
				payload.medical_history = medicalHistory;
				payload.emergency_contact = emergencyContact;
			} else if (role === "doctor") {
				payload.speciality = speciality;
				// payload.availability = availability;
				payload.bio = bio;
				payload.provider_id = healthcareProvider;
			} else if (role === "nurse") {
				payload.assigned_doctor_id = assignedDoctorId;
				payload.provider_id = healthcareProvider;
			}

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateUserProfile",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.access_token}`,
					},
					body: JSON.stringify(payload),
				}
			);

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText);
			}

			Alert.alert("Success", "Profile updated successfully!");
			router.back();
		} catch (err: any) {
			console.error("Error updating profile:", err);
			Alert.alert("Error", err.message || "Failed to update profile.");
		} finally {
			setSaving(false);
		}
	};

	if (saving) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<ActivityIndicator
					loadingMsg="Saving your profile details.."
					overlay={true}
					size="large"
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView
				contentContainerStyle={{
					padding: 20,
					paddingBottom: 65,
					flexGrow: 1,
					justifyContent: "center",
				}}
			>
				{/* Common fields */}
				<TextInput
					label="Full Name"
					value={fullName}
					onChangeText={setFullName}
					placeholder="E.g. John Doe"
					mode="outlined"
					autoComplete="off"
					autoCorrect={false}
					spellCheck={false}
					maxLength={50}
					style={styles.input}
					contentStyle={{
						textAlign: undefined, // To prevent ellipsis from not working
					}}
				/>
				<TextInput
					label="Email"
					value={email}
					onChangeText={setEmail}
					mode="outlined"
					autoCapitalize="none"
					keyboardType="email-address"
					autoComplete="off"
					autoCorrect={false}
					spellCheck={false}
					maxLength={50}
					style={styles.input}
					contentStyle={{
						textAlign: undefined, // To prevent ellipsis from not working
					}}
					disabled
				/>
				<TextInput
					label="Phone Number"
					value={phoneNumber}
					onChangeText={setPhoneNumber}
					placeholder="E.g. +60123456789"
					mode="outlined"
					keyboardType="phone-pad"
					autoComplete="tel"
					autoCorrect={false}
					spellCheck={false}
					maxLength={20}
					style={styles.input}
					contentStyle={{
						textAlign: undefined, // To prevent ellipsis from not working
					}}
				/>
				<GenderDropdown selectedGender={gender} setSelectedGender={setGender} />

				{/* Patient fields */}
				{profile?.role === "patient" && (
					<>
						<CustomDatePicker
							label="Date of Birth"
							value={dateOfBirth ? new Date(dateOfBirth) : undefined}
							onChange={(date) => setDateOfBirth(formatKL(date, "yyyy-MM-dd"))} // If not store in KL timezone, error will occur
							parent="form"
							mode="dob"
						/>
						<TextInput
							label="Blood Type"
							value={bloodType}
							onChangeText={setBloodType}
							placeholder="E.g. A+"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={10}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
						/>
						<TextInput
							label="Allergies"
							value={allergies}
							onChangeText={setAllergies}
							placeholder="E.g. Penicillin, Pollen"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={200}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							multiline={true}
							numberOfLines={3}
						/>
						<TextInput
							label="Current Medications"
							value={currentMedications}
							onChangeText={setCurrentMedications}
							placeholder="E.g. Metformin 500mg daily"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={200}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							multiline={true}
							numberOfLines={3}
						/>
						<TextInput
							label="Chronic Conditions"
							value={chronicConditions}
							onChangeText={setChronicConditions}
							placeholder="E.g. Hypertension, Diabetes"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={200}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							multiline={true}
							numberOfLines={3}
						/>
						<TextInput
							label="Past Surgeries"
							value={pastSurgeries}
							onChangeText={setPastSurgeries}
							placeholder="E.g. Appendectomy 2015"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={200}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							multiline={true}
							numberOfLines={3}
						/>
						<TextInput
							label="Insurance Info"
							value={insuranceInfo}
							onChangeText={setInsuranceInfo}
							placeholder="E.g. AIA Health Plan 2025"
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={100}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
						/>
						{/* <TextInput
							label="Medical History"
							value={medicalHistory}
							onChangeText={setMedicalHistory}
							mode="outlined"
							style={styles.input}
						/> */}
						<TextInput
							label="Emergency Contact"
							value={emergencyContact}
							onChangeText={setEmergencyContact}
							placeholder="E.g. +60123456789"
							mode="outlined"
							style={styles.input}
							keyboardType="phone-pad"
							autoComplete="tel"
							autoCorrect={false}
							spellCheck={false}
							maxLength={20}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
						/>
					</>
				)}

				{(profile?.role === "doctor" || profile?.role === "nurse") && (
					<HealthcareProviderDropdown
						selectedProvider={healthcareProvider}
						setSelectedProvider={setHealthcareProvider}
					/>
				)}
				{/* Doctor fields */}
				{profile?.role === "doctor" && (
					<>
						<SpecialityDropdown
							selectedSpeciality={speciality}
							setSelectedSpeciality={setSpeciality}
						/>
						{/* <TextInput
							label="Availability"
							value={availability}
							onChangeText={setAvailability}
							mode="outlined"
							style={styles.input}
						/> */}
						<TextInput
							label="Bio"
							value={bio}
							onChangeText={setBio}
							mode="outlined"
							style={styles.input}
							autoComplete="off"
							autoCorrect={false}
							spellCheck={false}
							maxLength={200}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							multiline={true}
							numberOfLines={3}
						/>
					</>
				)}

				{/* Nurse fields */}
				{profile?.role === "nurse" && (
					<DoctorDropdown
						providerId={profile.provider_id}
						selectedDoctorId={assignedDoctorId}
						setSelectedDoctor={setAssignedDoctorId}
					/>
				)}

				<Button mode="contained" onPress={handleSave} style={{ marginTop: 16 }}>
					Save Changes
				</Button>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	input: { marginBottom: 12 },
});
