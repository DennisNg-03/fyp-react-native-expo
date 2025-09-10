import ConfirmationDialog from "@/components/ConfirmationDialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorProfile, FlattenedUser, NurseProfile } from "@/types/user";
import {
	ALLOWED_IMAGE_TYPES,
	blobToBase64,
	MAX_FILE_SIZE,
} from "@/utils/fileHelpers";
import { formatLabel } from "@/utils/labelHelpers";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
	Avatar,
	Divider,
	IconButton,
	List,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;
	const [profile, setProfile] = useState<FlattenedUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [pendingAvatarFile, setPendingAvatarFile] = useState<
		ImagePicker.ImagePickerAsset | undefined
	>(undefined);

	const flattenDoctorData = (doctorData: any): DoctorProfile => {
		return {
			...doctorData,
			provider_name: doctorData?.provider?.name ?? null,
		};
	};

	const flattenNurseData = (nurseData: any): NurseProfile => {
		return {
			...nurseData,
			assigned_doctor_name:
				nurseData?.assigned_doctor?.profiles?.full_name ?? null,
			provider_name: nurseData?.provider?.name ?? null,
		};
	};

	const fetchProfile = useCallback(async () => {
		if (!userId || !role) {
			console.log("userId:", userId);
			console.log("role:", role);
		}
		setLoading(true);

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
					.select(
						"date_of_birth, blood_type, allergies, current_medications, chronic_conditions, past_surgeries, emergency_contact"
					)
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
						`
							speciality,
							slot_minutes,
							bio,
							provider_id,
							provider:provider_id (
								name
							)
						`
					)
					.eq("id", userId)
					.maybeSingle();

				if (doctorError) throw doctorError;

				const flattenedDoctorProfile = flattenDoctorData(doctorData);

				setProfile({
					role: "doctor",
					...baseProfile, // has id, full_name, email, phone_number, gender, avatar_url
					...flattenedDoctorProfile,
				} as DoctorProfile & { role: "doctor" });

				return;
			}

			if (role === "nurse") {
				const { data: nurseData, error: nurseError } = await supabase
					.from("nurses")
					.select(
						`
							assigned_doctor_id,
							provider_id,
							assigned_doctor:assigned_doctor_id (
								profiles(
									full_name
								)
							),
							provider:provider_id (
								name
							)
						`
					)
					.eq("id", userId)
					.maybeSingle();
				if (nurseError) throw nurseError;

				const flattenedNurseProfile = flattenNurseData(nurseData);
				console.log("flattenedNurseProfile:", flattenedNurseProfile);

				setProfile({
					role: "nurse",
					...baseProfile, // has id, full_name, email, phone_number, gender, avatar_url
					...flattenedNurseProfile,
				} as NurseProfile & { role: "nurse" });

				return;
			}
		} catch (err) {
			console.error("Error loading profile:", err);
			setProfile(null);
		} finally {
			setLoading(false);
		}
	}, [userId, role]);

	useEffect(() => {
		console.log("Fetched profile:", profile);
	}, [profile]);

	useFocusEffect(
		useCallback(() => {
			fetchProfile();
			console.log("Executed fetchProfile through useFocusEffect!");
		}, [fetchProfile])
	);

	const handleAttachAvatar = async () => {
		console.log("handleAttachAvatar pressed!");
		if (!userId || !session) return;
		// Ask for permission to access media library
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission to access media library is required!");
			return;
		}

		// Open image picker
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			quality: 0.8,
			selectionLimit: 20,
			...(Platform.OS === "android"
				? {
						allowsEditing: true,
						aspect: [16, 9],
				  }
				: {}), // The aspect attribute doesnt work on IOS, so disable it on IOS
		});

		if (!result.canceled) {
			for (const file of result.assets) {
				const ext = file.uri.split(".").pop()?.toLowerCase();
				const fileName =
					file.fileName ?? file.uri.split("/").pop() ?? "unknown";

				console.log("Media library image file size:", fileName, file.fileSize);

				if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
					Alert.alert(
						"Unsupported file type. Only JPG, PNG, WEBP, HEIC, HEIF are allowed."
					);
					return;
				}

				if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
					Alert.alert(
						`File too large. Maximum allowed size per file is {MAX_FILE_SIZE / (1024 * 1024)} MB.`
					);
					return;
				}

				setDialogVisible(true);
				setPendingAvatarFile(file);
			}
		}
	};

	const handleUpsertAvatar = async (file: ImagePicker.ImagePickerAsset) => {
		if (!userId || !session) return;

		try {
			setLoading(true);
			// const ext = file.uri.split(".").pop()?.toLowerCase();
			const fileName = file.fileName ?? file.uri.split("/").pop() ?? "unknown";

			const response = await fetch(file.uri);
			const blob = await response.blob();
			const base64 = await blobToBase64(blob);

			const fileToUpload = {
				name: fileName,
				blobBase64: base64,
				type: blob.type,
			};

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/uploadAvatar",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({ uid: userId, avatar_file: fileToUpload }),
				}
			);

			if (!res.ok) {
				const errorBody = await res.text();
				console.error("Upload failed:", res.status, res.statusText, errorBody);
				Alert.alert(
					"Upload failed",
					"Could not upload avatar. Please try again."
				);
				return;
			}

			const { avatar_url } = await res.json();
			console.log("Updated New Avatar URL:", avatar_url);

			setProfile((prev) => prev && { ...prev, avatar_url });
		} catch (err) {
			console.error("Error uploading avatar:", err);
			Alert.alert(
				"Upload failed",
				"Could not upload avatar. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			if (session?.user.id) {
				await supabase
					.from("user_device_tokens")
					.delete()
					.eq("user_id", session.user.id);
			}
			const { error } = await supabase.auth.signOut({ scope: "local" });
			if (error) {
				console.error("Error signing out!");
			}

			// router.replace("/login");
			console.log("Logged out successfully!");
		} catch (err) {
			console.error("Error logging out", err);
		} finally {
			setDeleteDialogVisible(false);
		}
	};

	const renderRoleSpecificFields = () => {
		if (!profile) return null;

		switch (profile.role) {
			case "doctor":
				return (
					<>
						<List.Item
							title="Healthcare Provider"
							description={
								typeof profile.provider_name === "string"
									? profile.provider_name
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="hospital" />}
						/>
						<List.Item
							title="Specialisation"
							description={
								typeof profile.speciality === "string"
									? profile.speciality
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="stethoscope" />}
						/>
						<List.Item
							title="Availability"
							description={
								typeof profile.availability === "string"
									? profile.availability
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="calendar-clock" />}
						/>
						<List.Item
							title="Bio"
							description={
								typeof profile.bio === "string" ? profile.bio : "Not provided"
							}
							left={(props) => (
								<List.Icon {...props} icon="information-outline" />
							)}
						/>
					</>
				);

			case "nurse":
				return (
					<>
						<List.Item
							title="Healthcare Provider"
							description={
								typeof profile.provider_name === "string"
									? profile.provider_name
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="hospital" />}
						/>
						<List.Item
							title="Assigned Doctor Name"
							description={
								typeof profile.assigned_doctor_name === "string"
									? `Dr ${profile.assigned_doctor_name}`
									: "Not provided"
							}
							left={(props) => (
								<List.Icon {...props} icon="account-supervisor" />
							)}
						/>
					</>
				);

			case "patient":
				return (
					<>
						<List.Item
							title="Date of Birth"
							description={
								typeof profile.date_of_birth === "string" &&
								profile.date_of_birth !== ""
									? profile.date_of_birth
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="calendar" />}
						/>
						<List.Item
							title="Blood Type"
							description={
								typeof profile.blood_type === "string" &&
								profile.blood_type !== ""
									? profile.blood_type
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="water" />}
						/>
						<List.Item
							title="Allergies"
							description={
								typeof profile.allergies === "string" &&
								profile.allergies !== ""
									? profile.allergies
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="alert-circle" />}
						/>
						<List.Item
							title="Current Medications"
							description={
								typeof profile.current_medications === "string" &&
								profile.current_medications !== ""
									? profile.current_medications
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="pill" />}
						/>
						<List.Item
							title="Chronic Conditions"
							description={
								typeof profile.chronic_conditions === "string" &&
								profile.chronic_conditions !== ""
									? profile.chronic_conditions
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="heart-pulse" />}
						/>
						<List.Item
							title="Past Surgeries"
							description={
								typeof profile.past_surgeries === "string" &&
								profile.past_surgeries !== ""
									? profile.past_surgeries
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="hospital" />}
						/>
						{/* <List.Item
							title="Insurance Info"
							description={
								typeof profile.insurance_info === "string" && profile.insurance_info !== ""
									? profile.insurance_info
									: "Not provided"
							}
							left={(props) => (
								<List.Icon {...props} icon="card-account-details" />
							)}
						/> */}
						{/* <List.Item
							title="Medical History"
							description={
								typeof profile.medical_history === "string"
									? profile.medical_history
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="history" />}
						/> */}
						{/* Emergency info */}
						<List.Item
							title="Emergency Contact"
							description={
								typeof profile.emergency_contact === "string"
									? profile.emergency_contact
									: "Not provided"
							}
							left={(props) => <List.Icon {...props} icon="phone-alert" />}
						/>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			<ScrollView style={{ backgroundColor: theme.colors.tertiary }}>
				<View style={styles.header}>
					<View style={{ position: "relative", alignItems: "center" }}>
						<Avatar.Image
							size={100}
							source={
								profile?.avatar_url
									? { uri: profile?.avatar_url }
									: require("@/assets/images/default-profile-pic.png")
							}
						/>
						<IconButton
							icon="camera-plus"
							size={20}
							style={styles.avatarEditButton}
							onPress={handleAttachAvatar}
						/>
					</View>
					{/* Profile full_name */}
					<Text variant="headlineSmall">
						{profile?.role === "doctor"
							? `Dr ${profile.full_name}`
							: profile?.role === "nurse"
							? `${profile.full_name}`
							: // ? `Nurse ${profile.full_name}`
							  profile?.full_name ?? ""}
					</Text>
					<Text variant="bodyMedium">
						{typeof profile?.role === "string"
							? profile.role.toUpperCase()
							: ""}
					</Text>
					<IconButton
						icon="square-edit-outline"
						size={26}
						onPress={() => router.push(`/profile/${profile?.id}`)}
						style={styles.editButton}
						accessibilityLabel="Edit profile"
					/>
				</View>

				<Divider style={{ marginVertical: 10 }} />

				{/* Common Info */}
				<List.Item
					title="Email"
					description={profile?.email ?? "Not provided"}
					left={(props) => <List.Icon {...props} icon="email" />}
				/>
				<List.Item
					title="Phone"
					description={profile?.phone_number ?? "Not provided"}
					left={(props) => <List.Icon {...props} icon="phone" />}
				/>
				<List.Item
					title="Gender"
					description={
						typeof formatLabel(profile?.gender) === "string"
							? formatLabel(profile?.gender)
							: "Not provided"
					}
					left={(props) => <List.Icon {...props} icon="gender-male-female" />}
				/>

				{renderRoleSpecificFields()}

				<Divider style={{ marginVertical: 10 }} />

				{/* Settings */}
				{/* <List.Item
					title="Change Password"
					left={(props) => <List.Icon {...props} icon="lock-reset" />}
				/> */}
				{role === "patient" && (
					<>
						<List.Item
							title="Notifications"
							left={(props) => <List.Icon {...props} icon="bell" />}
							onPress={() => router.push("/profile/notification")}
						/>
						<List.Item
							title="Privacy Settings"
							left={(props) => <List.Icon {...props} icon="shield-lock" />}
							onPress={() => router.push("/profile/privacy")}
						/>
					</>
				)}
				<List.Item
					title="Log out"
					left={(props) => (
						<List.Icon {...props} icon="logout" color={theme.colors.error} />
					)}
					titleStyle={{ color: theme.colors.error }}
					onPress={() => setDeleteDialogVisible(true)}
				/>

				<Divider style={{ marginBottom: 50 }} />
			</ScrollView>

			<ConfirmationDialog
				visible={dialogVisible}
				onCancel={() => setDialogVisible(false)}
				onConfirm={() => {
					if (pendingAvatarFile) {
						handleUpsertAvatar(pendingAvatarFile);
						setDialogVisible(false);
					}
				}}
				title="Update Profile Picture"
				messagePrimary="Are you sure you want to change your profile picture?"
				messageSecondary=""
			/>

			<ConfirmationDialog
				visible={deleteDialogVisible}
				onCancel={() => setDeleteDialogVisible(false)}
				onConfirm={() => {
					handleLogout();
				}}
				title="Logout Confirmation"
				messagePrimary="Are you sure you want to log out from your account?"
				messageSecondary=""
			/>

			{/* {loading && (
				<ActivityIndicator loadingMsg="" overlay={true} size="large" />
			)} */}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		alignItems: "center",
		paddingVertical: 20,
		position: "relative", // needed for absolute positioning
	},
	editButton: {
		position: "absolute",
		top: 10,
		right: 10,
	},
	avatarEditButton: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: "rgba(255, 255, 255, .2)",
		borderRadius: 50,
	},
});
