import { ActivityIndicator } from "@/components/ActivityIndicator";
import { RecordTypeMenu } from "@/components/RecordTypeMenu";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { SelectedFile } from "@/types/file";
import { MedicalRecord } from "@/types/medicalRecord";
import { blobToBase64 } from "@/utils/fileHelpers";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	View
} from "react-native";
import {
	Button,
	Card,
	Text,
	useTheme
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
	// const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	// const [selectedDocuments, setSelectedDocuments] = useState<
	// 	{ uri: string; name: string }[]
	// >([]);

	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

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
				console.log("Records with Urls:", recordsWithUrls);
				// console.log("Records with Urls (Signed URLs):", JSON.stringify(recordsWithUrls.signed_urls, null, 2));
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
			Alert.alert(
				"Alert",
				"Please select a record type before proceeding to upload medical record!"
			);
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
			setSelectedFiles((prev) => [
				...prev,
				{
					uri: result.assets[0].uri,
					name: result.assets[0].uri.split("/").pop() ?? "photo.jpg",
					type: "image",
				},
			]);
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
			setSelectedFiles((prev) => [
				...prev,
				{
					uri: result.assets[0].uri,
					name: result.assets[0].uri.split("/").pop() ?? "photo.jpg",
					type: "image",
				},
			]);
		}
	};

	const handleAttachFile = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: [
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"text/plain",
			], // Allowed document types
			copyToCacheDirectory: true,
		});

		if (!result.canceled && result.assets.length > 0) {
			setSelectedFiles((prev) => [
				...prev,
				...result.assets.map((asset) => ({
					uri: asset.uri,
					name: asset.name,
					type: "document" as const, // makes it a literal type
				})),
			]);
		}
	};

	const handleCancel = () => {
		setRecordTitle("");
		setRecordDate(new Date());
		setSelectedFiles([]);
		setUploadModalVisible(false);
	};

	const handleSaveRecord = async () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}
		if (!recordTitle || !recordDate) {
			Alert.alert("Alert", "Please fill up all the fields!");
			return;
		}

		const files = selectedFiles ?? [];
		if (files.length === 0) {
			Alert.alert("Alert", "Please attach at least one images/documents!");
			return;
		}

		try {
			setSaving(true);
			// Loop through all selected files
			const filesToUpload = await Promise.all(
				selectedFiles.map(async (file) => {
					const response = await fetch(file.uri);
					const blob = await response.blob();
					const base64 = await blobToBase64(blob);
					return {
						name: file.name,
						blobBase64: base64,
						type: file.type, // optional: keep track if image/doc
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

			console.log("Uploaded medical records to Supabase:", res);

			if (!res.ok) {
				const errorBody = await res.text(); // or res.json()
				console.error("Upload failed:", res.status, res.statusText, errorBody);
				return;
			}

			const { uploadedUrls } = await res.json();
			console.log("Uploaded Urls:", uploadedUrls);
			console.log("Uploaded Signed URLs:", uploadedUrls);

			// Call OCR Edge Function for each uploaded file if needed
			const geminiResponse = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						signedUrls: uploadedUrls, // send the whole array of signed urls
						title: recordTitle,
						date: recordDate,
						record_type: recordType,
					}),
				}
			);

			const json = await geminiResponse.json();
			const ocrText = json?.ocrText ?? "";
			console.log("OCR Response Text:", ocrText);

			setRecords((prev) => [
				{
					id: Date.now().toString(),
					title: recordTitle,
					date: recordDate.toISOString().split("T")[0],
					record_type: recordType,
					patient_id: session.user.id,
					file_paths: files,
					signed_urls: uploadedUrls, // Array of local previews
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
			setSelectedFiles([]);
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
						// style={styles.uploadButton}
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
									{record.file_paths?.some(
										(f) => typeof f !== "string" && f.type === "image"
									) && (
										<Image
											source={{
												uri:
													record.signed_urls?.[
														record.file_paths.findIndex(
															(f): f is SelectedFile =>
																typeof f !== "string" && f.type === "image"
														)
													] ?? "",
											}}
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
			{/* <Modal
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
								maximumDate={new Date()}
								onChange={(_event, selectedDate) => {
									setShowPicker(false);
									if (selectedDate) {
										setRecordDate(selectedDate);
										console.log("Selected Date:", selectedDate);
									}
								}}
							/>
						</View>

						{selectedFiles && selectedFiles.length > 0 && (
							// <ScrollView horizontal style={{ marginBottom: 10 }}>
							// 	{selectedFiles.map((file, index) =>
							// 		file.type === "image" ? (
							// 			// Attached images
							// 			<Image
							// 				key={index}
							// 				source={{ uri: file.uri }}
							// 				style={{
							// 					width: 150,
							// 					height: 150,
							// 					borderRadius: 8,
							// 					marginRight: 10,
							// 				}}
							// 				resizeMode="cover"
							// 			/>
							// 		) : (
							// 			// Attached documents
							// 			<View
							// 				key={index}
							// 				style={{
							// 					width: 150,
							// 					height: 150,
							// 					borderRadius: 8,
							// 					marginRight: 10,
							// 					backgroundColor: "#f0f0f0",
							// 					alignItems: "center",
							// 					justifyContent: "center",
							// 				}}
							// 			>
							// 				<Text>{file.name.toUpperCase()}</Text>
							// 			</View>
							// 		)
							// 	)}
							// </ScrollView>
							<ScrollView horizontal style={{ marginBottom: 10 }}>
								{selectedFiles.map((file, index) => (
									<FilePreview
										key={index}
										file={file}
										onRemove={() =>
											setSelectedFiles((prev) =>
												prev.filter((_, i) => i !== index)
											)
										}
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
								onPress={handleCancel}
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
			</Modal> */}
			<UploadRecordModal
				visible={uploadModalVisible}
				onClose={() => setUploadModalVisible(false)}
				selectedFiles={selectedFiles}
				setSelectedFiles={setSelectedFiles}
				recordTitle={recordTitle}
				setRecordTitle={setRecordTitle}
				recordDate={recordDate}
				setRecordDate={setRecordDate}
				// recordType={recordType}
				handleTakePhoto={handleTakePhoto}
				handleUploadImage={handleUploadImage}
				handleAttachFile={handleAttachFile}
				handleSaveRecord={handleSaveRecord}
				saving={saving}
			/>
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
	// modalOverlay: {
	// 	flex: 1,
	// 	backgroundColor: "rgba(0,0,0,0.5)",
	// 	justifyContent: "center",
	// 	padding: 20,
	// },
	// modalContainer: {
	// 	backgroundColor: "white",
	// 	borderRadius: 8,
	// 	padding: 20,
	// },
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
	// modalTitle: {
	// 	textAlign: "center",
	// 	marginBottom: 5,
	// },
	// dateTimePicker: {
	// 	marginBottom: 10,
	// },
	// input: {
	// 	marginBottom: 16,
	// },
	// uploadButtonRow: {
	// 	flexDirection: "row",
	// 	flexWrap: "wrap", // allows buttons to wrap to next line
	// 	justifyContent: "space-between",
	// 	gap: 10, // spacing between buttons (RN >= 0.70 supports gap)
	// 	marginBottom: 10,
	// },
	// uploadButton: {
	// 	flex: 1,
	// 	minWidth: 100,
	// 	marginVertical: 5,
	// },
	// actionButtonRow: {
	// 	flexDirection: "row",
	// 	justifyContent: "space-between",
	// 	marginTop: 16,
	// },
	// actionButton: {
	// 	flex: 1,
	// 	marginHorizontal: 4,
	// },
});
