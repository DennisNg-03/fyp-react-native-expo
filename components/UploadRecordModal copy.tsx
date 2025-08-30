// import {
// 	DischargeSummaryFields,
// 	ImagingReportFields,
// 	LabResultFields,
// 	MedicalRecord,
// 	PrescriptionFields,
// 	SelectedFile,
// } from "@/types/medicalRecord";
// import { blobToBase64 } from "@/utils/fileHelpers";
// import { Session } from "@supabase/supabase-js";
// import * as DocumentPicker from "expo-document-picker";
// import * as ImagePicker from "expo-image-picker";
// import { useState } from "react";
// import {
// 	Alert,
// 	ScrollView,
// 	StyleSheet,
// 	View
// } from "react-native";
// import { Button, IconButton, Modal, Text, TextInput } from "react-native-paper";
// import { ActivityIndicator } from "./ActivityIndicator";
// import CustomDatePicker from "./CustomDatePicker";
// import { FilePreview } from "./FilePreview";
// import { formatLabel, RecordTypeMenu } from "./RecordTypeMenu";

// interface UploadRecordModalProps {
// 	visible: boolean;
// 	onClose: () => void;
// 	session: Session | null;
// 	onRecordSaved: (record: MedicalRecord) => void;
// }

// export default function UploadRecordModal({
// 	visible,
// 	onClose,
// 	session,
// 	onRecordSaved,
// }: UploadRecordModalProps) {
// 	// const [files, setFiles] = useState<SelectedFile[]>([]);
// 	const [recordType, setRecordType] = useState<string>();
// 	const [ocrData, setOcrData] = useState<Record<string, string>>({});
// 	const [step, setStep] = useState<"upload" | "confirm" | "prefill">("upload");
// 	const [recordTitle, setRecordTitle] = useState("");
// 	const [recordDate, setRecordDate] = useState<Date>(new Date());
// 	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
// 	const [saving, setSaving] = useState(false);

// 	const handleTakePhoto = async () => {
// 		const { status } = await ImagePicker.requestCameraPermissionsAsync();
// 		if (status !== "granted") {
// 			alert("Permission to access camera is required!");
// 			return;
// 		}

// 		const result = await ImagePicker.launchCameraAsync({
// 			allowsEditing: true,
// 			quality: 1,
// 			aspect: [16, 9],
// 		});

// 		if (!result.canceled) {
// 			setSelectedFiles((prev) => [
// 				...prev,
// 				{
// 					uri: result.assets[0].uri,
// 					name: result.assets[0].uri.split("/").pop() ?? "photo.jpg",
// 					type: "image",
// 				},
// 			]);
// 		}
// 	};

// 	const handleUploadImage = async () => {
// 		// Ask for permission to access media library
// 		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// 		if (status !== "granted") {
// 			alert("Permission to access media library is required!");
// 			return;
// 		}

// 		// Open image picker
// 		const result = await ImagePicker.launchImageLibraryAsync({
// 			mediaTypes: ["images"],
// 			allowsEditing: true,
// 			aspect: [16, 9],
// 			quality: 1, // highest quality
// 		});

// 		if (!result.canceled) {
// 			setSelectedFiles((prev) => [
// 				...prev,
// 				{
// 					uri: result.assets[0].uri,
// 					name: result.assets[0].uri.split("/").pop() ?? "photo.jpg",
// 					type: "image",
// 				},
// 			]);
// 		}
// 	};

// 	const handleAttachFile = async () => {
// 		const result = await DocumentPicker.getDocumentAsync({
// 			type: [
// 				"application/pdf",
// 				"application/msword",
// 				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// 				"text/plain",
// 			], // Allowed document types
// 			copyToCacheDirectory: true,
// 		});

// 		if (!result.canceled && result.assets.length > 0) {
// 			setSelectedFiles((prev) => [
// 				...prev,
// 				...result.assets.map((asset) => ({
// 					uri: asset.uri,
// 					name: asset.name,
// 					type: "document" as const, // makes it a literal type
// 				})),
// 			]);
// 		}
// 	};

// 	const handleCancel = () => {
// 		setRecordTitle("");
// 		setRecordType("");
// 		setRecordDate(new Date());
// 		setSelectedFiles([]);
// 		onClose(); // Call parent to hide this modal
// 		setStep("upload");
// 	};

// 	const handleNext = () => {
// 		if (!session) {
// 			console.error("User not authenticated!");
// 			return;
// 		}
// 		if (!recordTitle || !recordDate || !recordType) {
// 			Alert.alert("Alert", "Please fill up all the fields!");
// 			return;
// 		}
// 		const files = selectedFiles ?? [];
// 		if (files.length === 0) {
// 			Alert.alert("Alert", "Please attach at least one image/document!");
// 			return;
// 		}

// 		setStep("confirm");
// 	};

// 	const handleOcr = async () => {
// 		if (!session) {
// 			console.error("User not authenticated!");
// 			return;
// 		}
// 		if (!recordTitle || !recordDate || !recordType) {
// 			Alert.alert("Alert", "Please fill up all the fields!");
// 			return;
// 		}

// 		const files = selectedFiles ?? [];
// 		if (files.length === 0) {
// 			Alert.alert("Alert", "Please attach at least one image/document!");
// 			return;
// 		}

// 		setSaving(true);

// 		const filesToUpload = await Promise.all(
// 			selectedFiles.map(async (file) => {
// 				const response = await fetch(file.uri);
// 				const blob = await response.blob();
// 				const base64 = await blobToBase64(blob);
// 				return {
// 					name: file.name,
// 					blobBase64: base64,
// 					type: blob.type, // optional: keep track if image/doc
// 				};
// 			})
// 		);

// 		const ocrRes = await fetch(
// 				"https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
// 				{
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${session?.access_token}`,
// 					},
// 					body: JSON.stringify({
// 						files: filesToUpload,
// 						title: recordTitle,
// 						date: recordDate,
// 						record_type: recordType,
// 					}),
// 				}
// 			);

// 		const data = await ocrRes.json();
// 		console.log("OCR Test backend response:", data);

// 		setSaving(false);
// 	}

// 	const handleSave = async () => {
// 		if (!session) {
// 			console.error("User not authenticated!");
// 			return;
// 		}
// 		if (!recordTitle || !recordDate || !recordType) {
// 			Alert.alert("Alert", "Please fill up all the fields!");
// 			return;
// 		}

// 		const files = selectedFiles ?? [];
// 		if (files.length === 0) {
// 			Alert.alert("Alert", "Please attach at least one image/document!");
// 			return;
// 		}

// 		try {
// 			setSaving(true);
// 			// Loop through all selected files
// 			const filesToUpload = await Promise.all(
// 				selectedFiles.map(async (file) => {
// 					const response = await fetch(file.uri);
// 					const blob = await response.blob();
// 					const base64 = await blobToBase64(blob);
// 					return {
// 						name: file.name,
// 						blobBase64: base64,
// 						type: file.type, // optional: keep track if image/doc
// 					};
// 				})
// 			);

// 			// console.log("Files to upload:", filesToUpload);

// 			// Call Edge Function to upload all images and get signed URLs
// 			const res = await fetch(
// 				"https://zxyyegizcgbhctjjoido.functions.supabase.co/uploadMedicalRecord",
// 				{
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${session?.access_token}`,
// 					},
// 					body: JSON.stringify({
// 						files: filesToUpload,
// 						title: recordTitle,
// 						date: recordDate.toISOString().split("T")[0],
// 						uid: session?.user.id,
// 						record_type: recordType,
// 					}),
// 				}
// 			);

// 			console.log("Uploaded medical records to Supabase:", res);

// 			if (!res.ok) {
// 				const errorBody = await res.text(); // or res.json()
// 				console.error("Upload failed:", res.status, res.statusText, errorBody);
// 				return;
// 			}

// 			const { uploadedUrls } = await res.json();
// 			console.log("Uploaded Urls:", uploadedUrls);
// 			console.log("Uploaded Signed URLs:", uploadedUrls);

// 			// Call OCR Edge Function for each uploaded file if needed
// 			const ocrRes = await fetch(
// 				"https://zxyyegizcgbhctjjoido.functions.supabase.co/ocr",
// 				{
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${session?.access_token}`,
// 					},
// 					body: JSON.stringify({
// 						signedUrls: uploadedUrls, // send the whole array of signed urls
// 						title: recordTitle,
// 						date: recordDate,
// 						record_type: recordType,
// 					}),
// 				}
// 			);

// 			if (!ocrRes.ok) {
// 				const errorBody = await ocrRes.text(); // or res.json()
// 				console.error(
// 					"OCR Edge function failed:",
// 					ocrRes.status,
// 					ocrRes.statusText,
// 					errorBody
// 				);
// 				return;
// 			}

// 			// console.log("OCR Response:", ocrRes);

// 			const json = await ocrRes.json();
// 			const ocrText = json?.ocrText ?? "";
// 			console.log("OCR Response Text:", ocrText);

// 			setOcrData(json?.fields ?? {});
// 			console.log("OCR Data:", ocrData);

// 			// const ocrText = await ocrRes.text();
// 			// let ocrJson: { ocrText?: string } = {};

// 			// try {
// 			// 	ocrJson = JSON.parse(geminiText);
// 			// } catch (err) {
// 			// 	console.error("Failed to parse OCR JSON:", ocrText);
// 			// }

// 			// const ocrText = ocrJson?.ocrText ?? "";
// 			// console.log("OCR Text:", ocrText);

// 			onRecordSaved({
// 				id: Date.now().toString(),
// 				title: recordTitle,
// 				date: recordDate.toISOString().split("T")[0],
// 				record_type: recordType,
// 				patient_id: session.user.id,
// 				file_paths: files,
// 				signed_urls: uploadedUrls, // Array of local previews
// 			});
// 		} catch (err) {
// 			console.error("Error saving record:", err);
// 		} finally {
// 			setSaving(false);
// 			setStep("prefill");
// 		}
// 	};

// 	const handleFinaliseRecord = async () => {
// 		// return;
// 		handleCancel();
// 		setSaving(false);
// 	};

// 	return (
// 		<Modal
// 			visible={visible}
// 			dismissable={false}
// 			onDismiss={onClose}
// 			contentContainerStyle={styles.modalContainer}
// 		>
// 			<ScrollView
// 				contentContainerStyle={{
// 					paddingVertical: 10,
// 					paddingHorizontal: 8,
// 				}}
// 				keyboardShouldPersistTaps="handled"
// 			>
// 				<Text variant="titleMedium" style={styles.modalTitle}>
// 					{step === "upload" && "New Medical Record"}
// 					{step === "confirm" && "Confirm Upload"}
// 					{step === "prefill" && "Review Record"}
// 				</Text>

// 				{step === "upload" && (
// 					<>
// 						<TextInput
// 							label="Title"
// 							mode="outlined"
// 							value={recordTitle}
// 							onChangeText={setRecordTitle}
// 							style={styles.input}
// 							autoComplete="off"
// 						/>
// 						<RecordTypeMenu
// 							selectedType={recordType}
// 							setSelectedType={setRecordType}
// 						/>

// 						<CustomDatePicker
// 							label="Record Date"
// 							value={recordDate}
// 							onChange={setRecordDate}
// 						/>

// 						{selectedFiles.length > 0 && (
// 							<ScrollView horizontal style={styles.filePreviewHorizontalScroll}>
// 								{selectedFiles.map((file, index) => (
// 									<FilePreview
// 										key={index}
// 										file={file}
// 										onRemove={() =>
// 											setSelectedFiles((prev: SelectedFile[]) =>
// 												prev.filter((f) => f.uri !== file.uri)
// 											)
// 										}
// 									/>
// 								))}
// 							</ScrollView>
// 						)}

// 						<View style={styles.uploadButtonRow}>
// 							<IconButton
// 								mode="outlined"
// 								icon="camera"
// 								onPress={handleTakePhoto}
// 								style={styles.uploadButton}
// 							/>
// 							<IconButton
// 								mode="outlined"
// 								icon="image-multiple"
// 								onPress={handleUploadImage}
// 								style={styles.uploadButton}
// 							/>
// 							<IconButton
// 								mode="outlined"
// 								icon="file-document-multiple"
// 								onPress={handleAttachFile}
// 								style={styles.uploadButton}
// 							/>
// 						</View>

// 						<View style={styles.actionButtonRow}>
// 							<Button
// 								mode="outlined"
// 								onPress={handleCancel}
// 								style={styles.actionButton}
// 							>
// 								Cancel
// 							</Button>
// 							<Button
// 								mode="contained"
// 								onPress={handleOcr}
// 								style={styles.actionButton}
// 							>
// 								Next
// 							</Button>
// 						</View>
// 					</>
// 				)}
// 				{step === "prefill" && (
// 					<>
// 						<TextInput
// 							label="Title"
// 							mode="outlined"
// 							value={recordTitle}
// 							onChangeText={setRecordTitle}
// 							style={styles.input}
// 							autoComplete="off"
// 						/>
// 						<RecordTypeMenu
// 							selectedType={recordType}
// 							setSelectedType={setRecordType}
// 						/>

// 						<CustomDatePicker
// 							label="Record Date"
// 							value={recordDate}
// 							onChange={setRecordDate}
// 						/>

// 						{recordType === "lab_result" &&
// 							LabResultFields.map((field) => (
// 								<TextInput
// 									key={field}
// 									label={formatLabel(field)}
// 									mode="outlined"
// 									value={ocrData[field] ?? ""}
// 									onChangeText={(text) =>
// 										setOcrData((prev) => ({ ...prev, [field]: text }))
// 									}
// 									style={styles.input}
// 								/>
// 							))}

// 						{recordType === "prescription" &&
// 							PrescriptionFields.map((field) => (
// 								<TextInput
// 									key={field}
// 									label={formatLabel(field)}
// 									mode="outlined"
// 									value={ocrData[field] ?? ""}
// 									onChangeText={(text) =>
// 										setOcrData((prev) => ({ ...prev, [field]: text }))
// 									}
// 									style={styles.input}
// 								/>
// 							))}

// 						{recordType === "imaging_report" &&
// 							ImagingReportFields.map((field) => (
// 								<TextInput
// 									key={field}
// 									label={formatLabel(field)}
// 									mode="outlined"
// 									value={ocrData[field] ?? ""}
// 									onChangeText={(text) =>
// 										setOcrData((prev) => ({ ...prev, [field]: text }))
// 									}
// 									style={styles.input}
// 								/>
// 							))}

// 						{recordType === "discharge_summary" &&
// 							DischargeSummaryFields.map((field) => (
// 								<TextInput
// 									key={field}
// 									label={formatLabel(field)}
// 									mode="outlined"
// 									value={ocrData[field] ?? ""}
// 									onChangeText={(text) =>
// 										setOcrData((prev) => ({ ...prev, [field]: text }))
// 									}
// 									style={styles.input}
// 								/>
// 							))}

// 						{/* {selectedFiles.length > 0 && (
// 							<ScrollView horizontal style={styles.filePreviewHorizontalScroll}>
// 								{selectedFiles.map((file, index) => (
// 									<FilePreview 
// 										key={index} 
// 										file={file} 
// 										onRemove={() =>
// 											setSelectedFiles((prev: SelectedFile[]) =>
// 												prev.filter((f) => f.uri !== file.uri)
// 											)
// 										} 
// 									/>
// 								))}
// 							</ScrollView>
// 						)} */}

// 						<View style={styles.actionButtonRow}>
// 							<Button
// 								mode="outlined"
// 								onPress={() => {
// 									setStep("upload");
// 								}}
// 								style={styles.actionButton}
// 							>
// 								Back
// 							</Button>
// 							<Button
// 								mode="contained"
// 								onPress={() => setStep("confirm")}
// 								style={styles.actionButton}
// 							>
// 								Next
// 							</Button>
// 						</View>
// 					</>
// 				)}
// 				{step === "confirm" && (
// 					<View style={{ padding: 16 }}>
// 						<Text style={[styles.confirmationText, { marginBottom: 12 }]}>
// 							The uploaded document(s) and form data will be saved into your record.
// 						</Text>

// 						<Text style={[styles.confirmationText, { marginBottom: 20 }]}>
// 							If you need to make changes, you can go back and
// 							edit it before continuing.
// 						</Text>

// 						<View style={styles.actionButtonRow}>
// 							<Button
// 								mode="outlined"
// 								onPress={() => {
// 									setStep("prefill");
// 								}}
// 								style={styles.actionButton}
// 							>
// 								Back
// 							</Button>
// 							<Button
// 								mode="contained"
// 								onPress={handleSave}
// 								style={styles.actionButton}
// 							>
// 								Save
// 							</Button>
// 						</View>
// 					</View>
// 				)}

// 				{saving && (
// 					<View
// 						style={{
// 							...StyleSheet.absoluteFillObject,
// 							backgroundColor: "rgba(255,255,255,0.8)",
// 							alignItems: "center",
// 							justifyContent: "center",
// 							flex: 1,
// 							borderRadius: 8,
// 						}}
// 					>
// 						<ActivityIndicator
// 							loadingMsg={
// 								step === "upload"
// 									? "Saving and extracting data with OCR..."
// 									: step === "confirm"
// 									? "Saving extracted data..."
// 									: "Loading..."
// 							}
// 						/>
// 					</View>
// 				)}
// 			</ScrollView>
// 		</Modal>
// 	);
// }

// const styles = StyleSheet.create({
// 	modalContainer: {
// 		backgroundColor: "white",
// 		borderRadius: 8,
// 		padding: 20,
// 		marginHorizontal: 15,
// 	},
// 	modalTitle: {
// 		textAlign: "center",
// 		marginBottom: 5,
// 	},
// 	input: {
// 		marginBottom: 16,
// 	},
// 	filePreviewHorizontalScroll: {
// 		marginBottom: 10,
// 	},
// 	uploadButtonRow: {
// 		flexDirection: "row",
// 		flexWrap: "wrap",
// 		justifyContent: "space-between",
// 		gap: 10,
// 		marginTop: 10,
// 	},
// 	uploadButton: {
// 		flex: 1,
// 		marginVertical: 5,
// 	},
// 	actionButtonRow: {
// 		flexDirection: "row",
// 		justifyContent: "space-between",
// 		marginTop: 16,
// 	},
// 	actionButton: {
// 		flex: 1,
// 		marginHorizontal: 4,
// 	},
// 	confirmationText: {
// 		fontSize: 16,
// 		lineHeight: 22,
// 	},
// });
