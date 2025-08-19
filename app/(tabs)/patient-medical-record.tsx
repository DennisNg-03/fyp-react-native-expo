import { ActivityIndicator } from "@/components/ActivityIndicator";
import { RecordTypeMenu } from "@/components/RecordTypeMenu";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord } from "@/types/medicalRecord";
import { blobToBase64 } from "@/utils/fileHelpers";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import {
	Button,
	Card,
	IconButton,
	Text,
	TextInput,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientMedicalRecordScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [recordType, setRecordType] = useState<string>();
	const [recordTitle, setRecordTitle] = useState("");
	const [recordDate, setRecordDate] = useState<Date>(new Date());
	const [showPicker, setShowPicker] = useState(false);
	const [selectedImages, setSelectedImages] = useState<string[]>([]);
	const [selectedDocuments, setSelectedDocuments] = useState<
		{ uri: string; name: string }[]
	>([]);

	useEffect(() => {
		if (!session?.user.id) return;

		const fetchRecords = async () => {
			try {
				setLoading(true);
				const res = await fetch(
					`https://zxyyegizcgbhctjjoido.functions.supabase.co/getMedicalRecordPatient?uid=${session.user.id}`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					}
				);

				if (!res.ok) {
					const text = await res.text();
					console.error("Failed to fetch records", text);
					return;
				}

				const { recordsWithUrls } = await res.json();
				// console.log("Records with Urls:", recordsWithUrls);
				setRecords(recordsWithUrls ?? []);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchRecords();
	}, [session?.access_token, session?.user.id]);

	const handleUploadRecord = async () => {
		if (!recordType) {
			Alert.alert("Alert", "Please select a record type before proceeding to upload medical record!");
			return;
		}
		setUploadModalVisible(true);
	};

	const handleTakePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			alert("Permission to access camera is required!");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			quality: 1,
			aspect: [16, 9],
		});

		if (!result.canceled) {
			setSelectedImages((prev) => [...prev, result.assets[0].uri]);
		}
	};

	const handleUploadImage = async () => {
		// Ask for permission to access media library
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			alert("Permission to access media library is required!");
			return;
		}

		// Open image picker
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [16, 9],
			quality: 1, // highest quality
		});

		if (!result.canceled) {
			setSelectedImages((prev) => [...prev, result.assets[0].uri]);
		}
	};

	const handleAttachFile = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: ["application/pdf", "application/msword", "text/plain"],
			copyToCacheDirectory: true,
		});

		if (!result.canceled && result.assets.length > 0) {
			setSelectedDocuments((prev) => [
				...prev,
				...result.assets.map((asset) => ({ uri: asset.uri, name: asset.name })),
			]);
		}
	};

	const handleSaveRecord = async () => {
		if (!session) {
			console.error("User not authenticated");
			return;
		}

		const images = selectedImages ?? [];
		if (images.length === 0) return;

		try {
			setSaving(true);
			// Loop through all selected images
			const filesToUpload = await Promise.all(
				selectedImages.map(async (uri) => {
					const response = await fetch(uri);
					const blob = await response.blob();
					const base64 = await blobToBase64(blob);
					return {
						name: uri.split("/").pop()!, // filename
						blobBase64: base64,
					};
				})
			);
			// console.log("Files to upload:", filesToUpload);

			// Call Edge Function to upload all images and get signed URLs
			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/uploadMedicalRecord",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						files: filesToUpload,
						title: recordTitle,
						date: recordDate.toISOString().split("T")[0],
						uid: session?.user.id,
						record_type: recordType,
					}),
				}
			);

			console.log("Uploaded images to Supabase:", res);

			if (!res.ok) {
				const errorBody = await res.text(); // or res.json() if you know JSON is returned
				console.error("Upload failed:", res.status, res.statusText, errorBody);
				return;
			}

			const { uploadedUrls } = await res.json();
			console.log("Uploaded Urls:", uploadedUrls);

			// Call OCR Edge Function for each uploaded file if needed
			let combinedOcrText = "";
			for (const url of uploadedUrls) {
				console.log("url:", url);
				const geminiResponse = await fetch(
					"https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session?.access_token}`,
						},
						body: JSON.stringify({
							signedUrl: url,
							title: recordTitle,
							date: recordDate,
							record_type: recordType,
						}),
					}
				);

				const json = await geminiResponse.json();
				console.log("Gemini Response json:", json);
				const ocrText = json?.ocrText ?? ""; // fallback to empty string
				console.log("OCR Text:", ocrText);
				combinedOcrText += ocrText + "\n\n";
				console.log("Combined OCR Text:", combinedOcrText);
			}

			setRecords((prev) => [
				{
					id: Date.now().toString(),
					title: recordTitle,
					date: recordDate.toISOString().split("T")[0],
					record_type: recordType,
					user_id: session.user.id,
					file_paths: images,
					signed_urls: images, // Array of local previews
				},
				...prev,
			]);
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setSaving(false);
			setUploadModalVisible(false);
			setRecordTitle("");
			setRecordDate(new Date());
			setSelectedImages([]);
		}
	};

	if (loading) {
		return <ActivityIndicator />;
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView style={styles.container}>
				<View style={styles.uploadForm}>
					<RecordTypeMenu
						selectedType={recordType}
						setSelectedType={setRecordType}
					/>
					{/* Upload Button */}
					<Button
						mode="contained"
						icon="upload"
						onPress={handleUploadRecord}
						loading={loading}
						style={styles.uploadButton}
					>
						Upload Medical Record
					</Button>
				</View>
				{/* Medical Records List */}
				<View style={{ marginTop: 20 }}>
					{records.length === 0 ? (
						<View style={styles.center}>
							<Text
								variant="bodyMedium"
								style={{ color: theme.colors.onSurface }}
							>
								No medical records uploaded yet.
							</Text>
						</View>
					) : (
						records.map((record) => (
							<Card
								key={record.id}
								style={styles.card}
								onPress={() => console.log("Open record:", record.id)}
							>
								<Card.Title
									title={record.title}
									subtitle={`${record.date}${
										"record_type" in record ? " • " + record.record_type : ""
									}`}
								/>
								<Card.Content>
									{record.signed_urls?.length > 0 && (
										<Image
											source={{ uri: record.signed_urls[0] }}
											style={{
												width: "100%",
												height: 150,
												borderRadius: 8,
												marginBottom: 10,
											}}
											resizeMode="cover"
										/>
									)}
								</Card.Content>
							</Card>
						))
					)}
				</View>
			</ScrollView>

			{/* Popup Modal for Uploading Medical Records */}
			<Modal
				visible={uploadModalVisible}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setUploadModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text variant="titleMedium" style={styles.modalTitle}>
							New Medical Record
						</Text>
						<TextInput
							label="Title"
							mode="outlined"
							value={recordTitle}
							onChangeText={setRecordTitle}
							style={styles.input}
						/>

						<View style={styles.dateTimePicker}>
							<TextInput
								label="Date"
								mode="outlined"
								value={recordDate.toDateString()}
								onFocus={() => setShowPicker(true)} // open picker on focus
								readOnly
							/>

							<DateTimePicker
								value={recordDate}
								mode="date"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								onChange={(event, selectedDate) => {
									setShowPicker(false);
									if (selectedDate) setRecordDate(selectedDate);
								}}
							/>
						</View>

						{selectedImages && selectedImages.length > 0 && (
							<ScrollView horizontal style={{ marginBottom: 10 }}>
								{selectedImages.map((uri, index) => (
									<Image
										key={index}
										source={{ uri }}
										style={{
											width: 150,
											height: 150,
											borderRadius: 8,
											marginRight: 10,
										}}
										resizeMode="cover"
									/>
								))}
							</ScrollView>
						)}
						<View style={styles.uploadButtonRow}>
							<IconButton
								mode="outlined"
								icon="camera"
								onPress={handleTakePhoto}
								style={styles.uploadButton}
							/>
							<IconButton
								mode="outlined"
								icon="image-multiple"
								onPress={handleUploadImage}
								style={styles.uploadButton}
							/>
							<IconButton
								mode="outlined"
								icon="file-document-multiple"
								onPress={handleAttachFile}
								style={styles.uploadButton}
							/>
						</View>
						<View style={styles.actionButtonRow}>
							<Button
								mode="outlined"
								onPress={() => setUploadModalVisible(false)}
								style={styles.actionButton}
							>
								Cancel
							</Button>
							<Button
								mode="contained"
								onPress={handleSaveRecord}
								style={styles.actionButton}
							>
								Save
							</Button>
						</View>
						{saving && (
							<View style={styles.loadingOverlay}>
								<ActivityIndicator />
								<Text style={styles.savingMsg}>Saving...</Text>
							</View>
						)}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 15,
	},
	card: {
		marginBottom: 15,
	},
	center: {
		alignItems: "center",
		marginTop: 40,
	},
	uploadForm: {
		padding: 16,
		backgroundColor: "#fff",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		marginBottom: 20,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		padding: 20,
	},
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 20,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255,255,255,0.8)",
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		borderRadius: 8,
	},
	savingMsg: {
		marginTop: 2,
	},
	modalTitle: {
		textAlign: "center",
		marginBottom: 5,
	},
	dateTimePicker: {
		marginBottom: 10,
	},
	input: {
		marginBottom: 16,
	},
	button: {
		marginBottom: 10,
	},
	uploadButtonRow: {
		flexDirection: "row",
		flexWrap: "wrap", // allows buttons to wrap to next line
		justifyContent: "space-between",
		gap: 10, // spacing between buttons (RN >= 0.70 supports gap)
		marginBottom: 10,
	},
	uploadButton: {
		flex: 1,
		minWidth: 100,
		marginVertical: 5,
	},
	actionButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 16,
	},
	actionButton: {
		flex: 1,
		marginHorizontal: 4,
	},
});
