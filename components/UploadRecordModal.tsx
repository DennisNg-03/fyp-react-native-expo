import {
	AdditionalMedicalRecordField,
	CompulsoryFields,
	MedicalRecord,
	PatientFields,
	ProviderFields,
	RecordFields,
	SelectedFile,
} from "@/types/medicalRecord";
import { parseDateToISO } from "@/utils/dateHelpers";
import { blobToBase64 } from "@/utils/fileHelpers";
import { Session } from "@supabase/supabase-js";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
	Button,
	Divider,
	IconButton,
	Modal,
	ProgressBar,
	Text,
	TextInput,
	useTheme,
} from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";
import CustomDatePicker from "./CustomDatePicker";
import { FilePreview } from "./FilePreview";
import { formatLabel, RecordTypeMenu } from "./RecordTypeMenu";

interface UploadRecordModalProps {
	visible: boolean;
	onClose: () => void;
	session: Session | null;
	onRecordSaved: (record: MedicalRecord) => void;
}

export default function UploadRecordModal({
	visible,
	onClose,
	session,
	onRecordSaved,
}: UploadRecordModalProps) {
	// const [files, setFiles] = useState<SelectedFile[]>([]);
	const theme = useTheme();
	const [recordType, setRecordType] = useState<string>();
	const [ocrData, setOcrData] = useState<
		Partial<Record<AdditionalMedicalRecordField, string>>
	>({});
	const [step, setStep] = useState<"upload" | "confirm" | "prefill">("upload");
	const [recordTitle, setRecordTitle] = useState("");
	// const [recordDate, setRecordDate] = useState<Date>(new Date());
	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
	const [saving, setSaving] = useState(false);
	const multilineFields = new Set([
		"diagnosis",
		"procedures",
		"medications",
		"address",
		"healthcare_provider_address",
		"notes",
	]);
	const isDateField = (field: string) => field.toLowerCase().includes("date");
	const ALLOWED_IMAGE_TYPES = ["png", "jpg", "jpeg", "webp", "heic", "heif"]; // These are the supported image types by Gemini
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

	const handleTakePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			alert("Permission to access camera is required!");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
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
				console.log("Camera image file size:", fileName, file.fileSize);

				if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
					alert(
						"Unsupported file type. Only JPG, PNG, WEBP, HEIC, HEIF are allowed."
					);
					return;
				}

				if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
					alert("File too large. Maximum allowed size per file is 10 MB.");
					return; // stop if any file is too big
				}
			}

			// If all files passed, then only add them
			setSelectedFiles((prev) => [
				...prev,
				...result.assets.map((file) => {
					const ext = file.uri.split(".").pop()?.toLowerCase();
					return {
						uri: file.uri,
						name: file.fileName ?? file.uri.split("/").pop() ?? "photo.jpeg",
						type: `image/${ext}` as string,
					};
				}),
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
				for (const file of result.assets) {
					const ext = file.uri.split(".").pop()?.toLowerCase();

					const fileName =
						file.fileName ?? file.uri.split("/").pop() ?? "unknown";
					console.log(
						"Media library image file size:",
						fileName,
						file.fileSize
					);

					if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
						alert(
							"Unsupported file type. Only JPG, PNG, WEBP, HEIC, HEIF are allowed."
						);
						return;
					}

					if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
						alert("File too large. Maximum allowed size per file is 10 MB.");
						return; // stop if any file is too big
					}
				}

				if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
					alert(
						"Unsupported file type. Only JPG, PNG, WEBP, HEIC, HEIF are allowed."
					);
					return;
				}

				if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
					alert("File too large. Maximum allowed size per file is 10 MB.");
					return; // stop if any file is too big
				}
			}

			// If all files passed, then only add them
			setSelectedFiles((prev) => [
				...prev,
				...result.assets.map((file) => {
					const ext = file.uri.split(".").pop()?.toLowerCase();
					return {
						uri: file.uri,
						name: file.fileName ?? file.uri.split("/").pop() ?? "photo.jpeg",
						type: `image/${ext}` as string,
					};
				}),
			]);
		}
	};

	const handleAttachFile = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: ["application/pdf", "text/plain"], // Allowed document types
			copyToCacheDirectory: true,
		});

		if (!result.canceled && result.assets.length > 0) {
			const filteredAssets = result.assets.filter(
				(asset) => asset.size && asset.size <= MAX_FILE_SIZE
			);

			filteredAssets.forEach((file) => {
				const fileName = file.name ?? file.uri.split("/").pop() ?? "unknown";
				console.log("File size:", fileName, file.size);
			});

			if (filteredAssets.length < result.assets.length) {
				alert("File too large. Maximum allowed size per file is 10 MB.");
				return;
			}
			setSelectedFiles((prev) => [
				...prev,
				...result.assets.map((asset) => ({
					uri: asset.uri,
					name: asset.name,
					type: "document" as string,
				})),
			]);
		}
	};

	const handleCancel = () => {
		setRecordTitle("");
		setRecordType("");
		setSelectedFiles([]);
		setOcrData({});
		onClose(); // Call parent to hide this modal
		setStep("upload");
	};

	const handleNext = () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}
		if (!recordTitle || !recordType) {
			Alert.alert("Alert", "Please fill up all the fields!");
			return;
		}
		const files = selectedFiles ?? [];
		if (files.length === 0) {
			Alert.alert("Alert", "Please attach at least one image / document!");
			return;
		}

		setStep("confirm");
	};

	const handleOcr = async () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}
		if (!recordTitle || !recordType) {
			Alert.alert("Alert", "Please fill up all the fields!");
			return;
		}

		const files = selectedFiles ?? [];
		if (files.length === 0) {
			setStep("prefill");
			// Alert.alert("Alert", "Please attach at least one image / document!");
			return;
		}

		try {
			setSaving(true);
			const filesToUpload = await Promise.all(
				selectedFiles.map(async (file) => {
					const response = await fetch(file.uri);
					const blob = await response.blob();
					const base64 = await blobToBase64(blob);
					return {
						name: file.name,
						blobBase64: base64,
						type: blob.type, // to be passed to Gemini API
					};
				})
			);

			const ocrRes = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						files: filesToUpload,
						title: recordTitle,
						record_type: recordType, // No need to format as label when calling OCR
					}),
				}
			);

			if (!ocrRes.ok) {
				const errorBody = await ocrRes.text(); // or res.json()
				console.error(
					"OCR Edge function failed:",
					ocrRes.status,
					ocrRes.statusText,
					errorBody
				);
				return;
			}

			const data = await ocrRes.json();
			console.log("OCR Extracted Data:", data?.extracted_data);

			setOcrData(data?.extracted_data ?? {});
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setSaving(false);
			setStep("prefill");
		}
	};

	const handleSave = async () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		const missingField = CompulsoryFields.find((field) => !ocrData[field]); // It's only record_date now
		if (!recordTitle || !recordType || missingField) {
			Alert.alert("Alert", "Please fill up all the fields!");
			return;
		}

		const files = selectedFiles ?? [];
		if (files.length === 0) {
			Alert.alert("Alert", "Please attach at least one image / document!");
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
						type: blob.type,
					};
				})
			);

			// console.log("Files to upload:", filesToUpload);

			const processedOcrData = Object.fromEntries(
				Object.entries(ocrData).map(([key, value]) => {
					if (!value) return [key, value]; // keep null/undefined data as-is

					// These fields would be arrays split by newline
					if (["diagnosis", "procedures", "medications"].includes(key)) {
						const arr = value
							.split("\n")
							.map((s) => s.trim())
							.filter(Boolean);
						return [key, arr];
					}

					return [key, value]; // straight return other fields
				})
			);

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
						uid: session?.user.id,
						record_type: formatLabel(recordType),
						...processedOcrData,
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

			onRecordSaved({
				id: Date.now().toString(),
				title: recordTitle,
				record_type: recordType,
				patient_id: session.user.id,
				file_paths: files,
				signed_urls: uploadedUrls, // Array of local previews
				...processedOcrData,
			});
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			handleCancel();
			setSaving(false);
			setStep("upload");
		}
	};

	return (
		<Modal
			visible={visible}
			dismissable={false}
			onDismiss={onClose}
			contentContainerStyle={styles.modalContainer}
		>
			<ScrollView
				contentContainerStyle={{
					paddingVertical: 10,
					paddingHorizontal: 8,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Text variant="titleMedium" style={styles.modalTitle}>
					{step === "upload" && "New Medical Record"}
					{step === "confirm" && "Confirm Upload"}
					{step === "prefill" && "Review Record"}
				</Text>

				{step === "upload" && (
					<>
						<ProgressBar
							progress={0}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>
						<TextInput
							label="Title"
							mode="outlined"
							value={recordTitle}
							onChangeText={setRecordTitle}
							style={[styles.input, { backgroundColor: theme.colors.onPrimary}]}
							autoComplete="off"
						/>
						<RecordTypeMenu
							selectedType={recordType}
							setSelectedType={setRecordType}
						/>

						{/* <CustomDatePicker
							label="Record Date"
							value={recordDate}
							onChange={setRecordDate}
						/> */}

						{selectedFiles.length > 0 && (
							<ScrollView horizontal style={styles.filePreviewHorizontalScroll}>
								{selectedFiles.map((file, index) => (
									<FilePreview
										key={index}
										file={file}
										onRemove={() =>
											setSelectedFiles((prev: SelectedFile[]) =>
												prev.filter((f) => f.uri !== file.uri)
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
						<Text
							variant="labelSmall"
							style={{
								marginTop: 10,
								marginBottom: 5,
								marginHorizontal: 5,
								color: theme.colors.onSurfaceVariant, // muted color
							}}
						>
							Supported image types:{"\n"}PNG, JPG, JPEG, WEBP, HEIC, HEIF.
						</Text>
						<Text
							variant="labelSmall"
							style={{
								marginBottom: 10,
								marginHorizontal: 5,
								color: theme.colors.onSurfaceVariant, // muted color
							}}
						>
							For attached files (PDF or TXT), PDFs usually give higher text extraction accuracy.
						</Text>

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
								onPress={handleOcr}
								style={styles.actionButton}
							>
								Next
							</Button>
						</View>
					</>
				)}
				{step === "prefill" && (
					<>
						<ProgressBar
							progress={0.33}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>
						<TextInput
							label="Title"
							mode="outlined"
							value={recordTitle}
							onChangeText={setRecordTitle}
							style={[styles.input, { backgroundColor: theme.colors.onPrimary}]}
							autoComplete="off"
						/>
						<RecordTypeMenu
							selectedType={recordType}
							setSelectedType={setRecordType}
						/>

						{CompulsoryFields.map((field) => (
							<CustomDatePicker
								key={field}
								label={formatLabel(field)}
								value={ocrData[field] ? new Date(ocrData[field]) : undefined}
								onChange={(date) =>
									setOcrData((prev) => ({
										...prev,
										[field]: parseDateToISO(date),
									}))
								}
							/>
						))}

						{/* Patient Section */}
						<Text style={styles.sectionTitle}>Patient Details</Text>
						<Divider style={styles.divider} />
						{PatientFields.map((field) =>
							isDateField(field) ? (
								<CustomDatePicker
									key={field}
									label={formatLabel(field)}
									value={ocrData[field] ? new Date(ocrData[field]) : undefined}
									onChange={(date) =>
										setOcrData((prev) => ({
											...prev,
											[field]: parseDateToISO(date),
										}))
									}
								/>
							) : (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={[styles.input, { backgroundColor: theme.colors.onPrimary}]}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 5 : 1}
								/>
							)
						)}

						{/* Provider Section */}
						<Text style={styles.sectionTitle}>Healthcare Provider Details</Text>
						<Divider style={styles.divider} />
						{ProviderFields.map((field) =>
							isDateField(field) ? (
								<CustomDatePicker
									key={field}
									label={formatLabel(field)}
									value={ocrData[field] ? new Date(ocrData[field]) : undefined}
									onChange={(date) =>
										setOcrData((prev) => ({
											...prev,
											[field]: parseDateToISO(date),
										}))
									}
								/>
							) : (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={[styles.input, { backgroundColor: theme.colors.onPrimary}]}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 5 : 1}
								/>
							)
						)}

						{/* Record Section */}
						<Text style={styles.sectionTitle}>Record Details</Text>
						<Divider style={styles.divider} />
						{RecordFields.map((field) =>
							isDateField(field) ? (
								<CustomDatePicker
									key={field}
									label={formatLabel(field)}
									value={ocrData[field] ? new Date(ocrData[field]) : undefined}
									onChange={(date) =>
										setOcrData((prev) => ({
											...prev,
											[field]: parseDateToISO(date),
										}))
									}
								/>
							) : (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={[styles.input, { backgroundColor: theme.colors.onPrimary}]}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 10 : 1}
								/>
							)
						)}

						{/* {recordType === "lab_result" &&
							LabResultFields.map((field) => (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={styles.input}
								/>
							))}

						{recordType === "prescription" &&
							PrescriptionFields.map((field) => (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={styles.input}
								/>
							))}

						{recordType === "imaging_report" &&
							ImagingReportFields.map((field) => (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={styles.input}
								/>
							))}

						{recordType === "discharge_summary" &&
							DischargeSummaryFields.map((field) => (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={ocrData[field] ?? ""}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									style={styles.input}
								/>
							))} */}

						{/* {selectedFiles.length > 0 && (
							<ScrollView horizontal style={styles.filePreviewHorizontalScroll}>
								{selectedFiles.map((file, index) => (
									<FilePreview 
										key={index} 
										file={file} 
										onRemove={() =>
											setSelectedFiles((prev: SelectedFile[]) =>
												prev.filter((f) => f.uri !== file.uri)
											)
										} 
									/>
								))}
							</ScrollView>
						)} */}

						<View style={styles.actionButtonRow}>
							<Button
								mode="outlined"
								onPress={() => {
									setStep("upload");
								}}
								style={styles.actionButton}
							>
								Back
							</Button>
							<Button
								mode="contained"
								onPress={handleNext}
								style={styles.actionButton}
							>
								Next
							</Button>
						</View>
					</>
				)}
				{step === "confirm" && (
					<>
						<ProgressBar
							progress={0.67}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>
						<View style={{ padding: 16 }}>
							<Text style={[styles.confirmationText, { marginBottom: 12 }]}>
								The uploaded image(s), file(s) and form data will be saved into
								your record.
							</Text>

							<Text style={[styles.confirmationText, { marginBottom: 20 }]}>
								If you need to make changes, you can go back and edit it before
								continuing.
							</Text>

							<View style={styles.actionButtonRow}>
								<Button
									mode="outlined"
									onPress={() => {
										setStep("prefill");
									}}
									style={styles.actionButton}
								>
									Back
								</Button>
								<Button
									mode="contained"
									onPress={handleSave}
									style={styles.actionButton}
								>
									Save
								</Button>
							</View>
						</View>
					</>
				)}

				{saving && (
					<View
						style={{
							...StyleSheet.absoluteFillObject,
							backgroundColor: "rgba(255,255,255,0.8)",
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
							borderRadius: 8,
						}}
					>
						<ActivityIndicator
							loadingMsg={
								step === "upload"
									? "Extracting data..."
									: step === "confirm"
									? "Saving extracted data..."
									: "Loading..."
							}
						/>
					</View>
				)}
			</ScrollView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 20,
		marginHorizontal: 15,
	},
	modalTitle: {
		textAlign: "center",
		marginBottom: 5,
	},
	input: {
		marginBottom: 16,
	},
	filePreviewHorizontalScroll: {
		marginBottom: 10,
	},
	uploadButtonRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 10,
		marginTop: 5,
	},
	uploadButton: {
		flex: 1,
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
	confirmationText: {
		fontSize: 16,
		lineHeight: 22,
	},
	sectionTitle: {
		marginTop: 20,
		marginBottom: 6,
		fontSize: 16,
		fontWeight: "600",
	},
	divider: {
		marginBottom: 12,
	},
	progressBar: {
		height: 6,
		borderRadius: 3,
		marginTop: 8,
		marginBottom: 16,
	},
});
