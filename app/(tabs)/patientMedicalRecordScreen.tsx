import { useUser } from "@/hooks/useUser";
import { createMedicalRecord, MedicalRecord } from "@/services/medicalRecord";
import { blobToBase64 } from "@/utils/fileHelpers";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
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
	const { user } = useUser();
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [recordTitle, setRecordTitle] = useState("");
	const [recordDate, setRecordDate] = useState<Date>(new Date());
	const [showPicker, setShowPicker] = useState(false);
	const [selectedImages, setSelectedImages] = useState<string[]>([]);
	const [selectedDocuments, setSelectedDocuments] = useState<
		{ uri: string; name: string }[]
	>([]);

	const [debugOutput, setDebugOutput] = useState<string | null>(null);

	// Placeholder: fetch medical records from backend
	useEffect(() => {
		setRecords([
			{
				id: "1",
				title: "Blood Test - Jan 2025",
				date: "2025-01-15",
				imageUrls: ["https://via.placeholder.com/150"],
				userUid: "Test",
			},
			{
				id: "2",
				title: "MRI Scan - Feb 2025",
				date: "2025-02-10",
				imageUrls: ["https://via.placeholder.com/150"],
				userUid: "Test",
			},
		]);
	}, []);

	const handleUploadRecord = async () => {
		setUploadModalVisible(true);
		// Request permission to access photos
		// const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
		// if (!result.canceled) {
		//   setUploading(true);
		//   // Upload to backend (Firebase/Supabase/etc.)
		//   // After upload, add to state:
		//   setRecords(prev => [
		//     ...prev,
		//     {
		//       id: Date.now().toString(),
		//       title: "New Medical Record",
		//       date: new Date().toISOString().split("T")[0],
		//       imageUrl: result.assets[0].uri,
		//     }
		//   ]);
		//   setUploading(false);
		// }
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
		if (!user) {
			console.error("User not authenticated");
			return;
		}

		const images = selectedImages ?? [];
  	if (images.length === 0) return;

		try {
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
		console.log("Files to upload:", filesToUpload);

    // Call Edge Function to upload all images and get signed URLs
    const res = await fetch("https://zxyyegizcgbhctjjoido.functions.supabase.co/uploadMedicalRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: filesToUpload,
        title: recordTitle,
        date: recordDate.toISOString().split("T")[0],
        uid: user.uid,
      }),
    });

		console.log("Uploaded images to Supabase:", res);

    const { uploadedUrls } = await res.json();
		console.log("Uploaded Urls:", uploadedUrls);

    // Call OCR Edge Function for each uploaded file if needed
    let combinedOcrText = "";
    for (const url of uploadedUrls) {
      const geminiResponse = await fetch(
        "https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: url, // or send fileName if your OCR Edge Function expects path in storage
            title: recordTitle,
            date: recordDate,
          }),
        }
      );

      const json = await geminiResponse.json();
			const ocrText = json?.ocrText ?? ""; // fallback to empty string
			console.log("OCR Text:", ocrText);
			combinedOcrText += ocrText + "\n\n";
			console.log("Combined OCR Text:", combinedOcrText);
    }

			// Save the image metadata in Firebase
			await createMedicalRecord({
				title: recordTitle,
				date: recordDate.toISOString().split("T")[0],
				imageUrls: uploadedUrls,
				ocrText: combinedOcrText,
				userUid: user.uid,
			});

			// Update local state
			setRecords((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					title: recordTitle,
					date: recordDate.toISOString().split("T")[0],
					imageUrls: images, // Array of local previews
					userUid: user.uid,
				},
			]);
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setUploadModalVisible(false);
			setRecordTitle("");
			setRecordDate(new Date());
			setSelectedImages([]);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView style={styles.container}>
				{/* Upload Button */}
				<Button
					mode="contained"
					icon="upload"
					onPress={handleUploadRecord}
					loading={uploading}
					style={styles.uploadButton}
				>
					Upload Medical Record
				</Button>

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
								<Card.Title title={record.title} subtitle={record.date} />
								<Card.Content>
									{record.imageUrls.length > 0 && (
										<Image
											source={{ uri: record.imageUrls[0] }}
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
						{debugOutput && (
							<View style={{ padding: 10, backgroundColor: "#eee" }}>
								<Text style={{ fontFamily: "monospace" }}>{debugOutput}</Text>
							</View>
						)}
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

							{/* {showPicker && ( */}
							<DateTimePicker
								value={recordDate}
								mode="date"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								onChange={(event, selectedDate) => {
									setShowPicker(false);
									if (selectedDate) setRecordDate(selectedDate);
								}}
							/>
							{/* )} */}
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
