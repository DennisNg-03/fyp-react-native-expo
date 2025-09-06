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
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
	const [pendingAvatarFile, setPendingAvatarFile] = useState<
		ImagePicker.ImagePickerAsset | undefined
	>(undefined);

	useEffect(() => {
		const fetchProfile = async () => {
			if (!userId || !role) return;
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
							"date_of_birth, insurance_info, medical_history, blood_type, allergies, current_medications, chronic_conditions, past_surgeries, emergency_contact"
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
						.select("speciality, slot_minutes, timezone, bio, provider_id")
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
						role: "nurse",
						...baseProfile, // has id, full_name, email, phone_number, gender, avatar_url
						...nurseData, // nurse-specific fields
					} as NurseProfile & { role: "nurse" });

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

	useEffect(() => {
		console.log("Fetched profile:", profile);
	}, [profile]);

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
			const ext = file.uri.split(".").pop()?.toLowerCase();
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
							description={profile.availability || "Not provided"}
							left={(props) => <List.Icon {...props} icon="calendar-clock" />}
						/>
						<List.Item
							title="Timezone"
							description={profile.timezone || "Not provided"}
							left={(props) => <List.Icon {...props} icon="earth" />}
						/>
						<List.Item
							title="Bio"
							description={profile.bio || "Not provided"}
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
							title="Assigned DoctorProfile"
							description={profile.assigned_doctor_id || "Not provided"}
							left={(props) => <List.Icon {...props} icon="account-heart" />}
						/>
					</>
				);

			case "patient":
				return (
					<>
						<List.Item
							title="Date of Birth"
							description={profile.date_of_birth || "Not provided"}
							left={(props) => <List.Icon {...props} icon="calendar" />}
						/>
						<List.Item
							title="Blood Type"
							description={profile.blood_type || "Not provided"}
							left={(props) => <List.Icon {...props} icon="water" />}
						/>
						<List.Item
							title="Allergies"
							description={profile.allergies || "Not provided"}
							left={(props) => <List.Icon {...props} icon="alert-circle" />}
						/>
						<List.Item
							title="Current Medications"
							description={profile.current_medications || "Not provided"}
							left={(props) => <List.Icon {...props} icon="pill" />}
						/>
						<List.Item
							title="Chronic Conditions"
							description={profile.chronic_conditions || "Not provided"}
							left={(props) => <List.Icon {...props} icon="heart-pulse" />}
						/>
						<List.Item
							title="Past Surgeries"
							description={profile.past_surgeries || "Not provided"}
							left={(props) => <List.Icon {...props} icon="hospital" />}
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
						{/* Emergency info */}
						<List.Item
							title="Emergency Contact"
							description={profile.emergency_contact || "Not provided"}
							left={(props) => <List.Icon {...props} icon="phone" />}
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
					<Text variant="headlineSmall" style={{ marginTop: 10 }}>
						{profile?.full_name}
					</Text>
					<Text variant="bodyMedium">{profile?.role.toUpperCase()}</Text>
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
					description={profile?.email}
					left={(props) => <List.Icon {...props} icon="email" />}
				/>
				<List.Item
					title="Phone"
					description={profile?.phone_number}
					left={(props) => <List.Icon {...props} icon="phone" />}
				/>
				<List.Item
					title="Gender"
					description={formatLabel(profile?.gender)}
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
