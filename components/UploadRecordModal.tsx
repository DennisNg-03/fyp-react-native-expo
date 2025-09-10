import {
	AdditionalMedicalRecordField,
	AdditionalMedicalRecordFields,
	CompulsoryFields,
	MedicalRecord,
	PatientFields,
	ProviderFields,
	RecordFields,
	SelectedFile,
	SelectedFileToUpload,
} from "@/types/medicalRecord";
import { Patient } from "@/types/user";
import { parseDateToISO } from "@/utils/dateHelpers";
import {
	ALLOWED_IMAGE_TYPES,
	blobToBase64,
	MAX_FILE_SIZE,
} from "@/utils/fileHelpers";
import { formatLabel } from "@/utils/labelHelpers";
import { Session } from "@supabase/supabase-js";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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
import { PatientDropdown } from "./PatientDropdown";
import { RecordTypeDropdown } from "./RecordTypeDropdown";

interface UploadRecordModalProps {
	visible: boolean;
	onClose: () => void;
	session: Session | null;
	role: string | null;
	onRecordSaved: () => void;
	record?: MedicalRecord | null; // optional
	mode: "new" | "edit";
}

export default function UploadRecordModal({
	visible,
	onClose,
	session,
	role,
	onRecordSaved,
	record,
	mode,
}: UploadRecordModalProps) {
	// const [files, setFiles] = useState<SelectedFile[]>([]);
	const theme = useTheme();
	const [step, setStep] = useState<"upload" | "confirm" | "prefill">("upload");
	const [recordId, setRecordId] = useState<string>("");
	const [recordTitle, setRecordTitle] = useState("");
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
	// const [recordDate, setRecordDate] = useState<Date>(new Date());
	const [recordType, setRecordType] = useState<string>();
	const [signedUrls, setSignedUrls] = useState<string[]>([]);
	const [ocrData, setOcrData] = useState<
		Partial<Record<AdditionalMedicalRecordField, string>>
	>({});
	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
	const [saving, setSaving] = useState(false);

	const multilineFields = new Set([
		"address",
		"healthcare_provider_address",
		"diagnosis",
		"procedures",
		"medications",
		"notes",
	]);

	const placeholders: Record<string, string> = {
		diagnosis: "E.g. Hypertension, Type 2 Diabetes",
		procedures: "E.g. Appendectomy, MRI Scan",
		medications: "E.g. Metformin 500mg, Lisinopril 10mg",
		record_prepared_by: "E.g. Nurse Jane Doe",
		notes: "E.g. Patient advised to follow up in 2 weeks",
		address: "E.g. 123 Jalan Bukit Bintang, Kuala Lumpur",
		healthcare_provider_address:
			"E.g. KPJ Damansara Specialist Hospital, Selangor",
	};
	console.log("Received role:", role);

	const isDateField = (field: string) => field.toLowerCase().includes("date");

	// useEffect(() => {
	// 	console.log("ocrData updated:", ocrData);
	// }, [ocrData]);

	useEffect(() => {
		console.log("selectedPatient:", selectedPatient);
	}, [selectedPatient]);

	// useEffect(() => {
	// 	console.log("recordId:", recordId);
	// 	console.log("record.id:", record?.id);
	// }, [recordId]);

	useEffect(() => {
		console.log("record:", record);
	}, [record]);

	useEffect(() => {
		if (visible) {
			if (mode === "edit" && record) {
				setStep("prefill");
				setRecordId(record.id ?? "");
				setRecordTitle(record.title ?? "");
				setRecordType(record.record_type ?? "");
				setSignedUrls(record.signed_urls ?? []);
				console.log("Record.title:", record.title);
				console.log("Record.type:", record.record_type);

				// pick only AdditionalMedicalRecord fields from record
				const ocrFields: Partial<Record<AdditionalMedicalRecordField, any>> =
					{};
				AdditionalMedicalRecordFields.forEach((field) => {
					if (record[field] !== undefined) {
						ocrFields[field] = record[field];
					}
				});

				setOcrData(ocrFields);
			} else if (mode === "new") {
				setStep("upload");
				setRecordTitle("");
				setRecordType("");
				setOcrData({});
				// reset other fields for upload mode
			}
		}
	}, [visible, mode, record]);

	useEffect(() => {
		console.log("Record Type:", recordType);
	}, [recordType]);

	const handleTakePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission to access camera is required!");
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
					Alert.alert(
						"Unsupported file type. Only JPG, PNG, WEBP, HEIC, HEIF are allowed."
					);
					return;
				}

				if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
					Alert.alert(
						`File too large. Maximum allowed size per file is {MAX_FILE_SIZE / (1024 * 1024)} MB.`
					);
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
				Alert.alert("File too large. Maximum allowed size per file is 10 MB.");
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
		onClose(); // Call parent to hide this modal
		setRecordTitle("");
		setRecordType("");
		setSelectedFiles([]);
		setOcrData({});
	};

	const handleNext = () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		const missingField = CompulsoryFields.find((field) => !ocrData[field]); // It's only record_date now
		if (!recordTitle || !recordType || missingField) {
			Alert.alert(
				"Alert",
				"Record Title, Record Type, and Record Date cannot be empty!"
			);
			return;
		}

		if (mode === "new") {
			const files = selectedFiles ?? [];
			if (files.length === 0) {
				Alert.alert("Alert", "Please attach at least one image / document!");
				return;
			}
		}

		setStep("confirm");
	};

	const handleOcr = async () => {
		console.log("OCR selectedPatient:", selectedPatient);

		if (!session) {
			console.error("User not authenticated!");
			return;
		}
		if ((role === "doctor" || role === "nurse") && !selectedPatient) {
			Alert.alert("Alert", "Please select a valid patient!");
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

		try {
			setSaving(true);
			const filesToUpload = await Promise.all(
				selectedFiles.map(async (file) => {
					const response = await fetch(file.uri);
					const blob = await response.blob();
					const base64 = await blobToBase64(blob);
					return {
						name: file.name,
						blobBase64: base64, // To be passed to Gemini API
						type: blob.type, // To be passed to Gemini API & Supabase Storage
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
			Alert.alert(
				"Alert",
				"Record Title, Record Type, and Record Date cannot be empty!"
			);
			return;
		}

		const files = selectedFiles ?? [];
		if (mode === "new") {
			if (files.length === 0) {
				Alert.alert("Alert", "Please attach at least one image / document!");
				return;
			}
		}

		try {
			setSaving(true);

			const processedOcrData = Object.fromEntries(
				Object.entries(ocrData).map(([key, value]) => {
					if (!value) return [key, value]; // keep null/undefined data as-is

					// To format multine fields to be arrays split by newline
					if (typeof value === "string" && multilineFields.has(key)) {
						const arr = value
							.split("\n")
							.map((s) => s.trim())
							.filter(Boolean);
						return [key, arr];
					}

					return [key, value]; // straight return other fields
				})
			);

			if (mode === "new") {
				// Call Edge function to add new record
				// Loop through all selected files
				const filesToUpload: SelectedFileToUpload[] = await Promise.all(
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
							uid: role === "patient" ? session?.user.id : selectedPatient?.id,
							record_type: recordType,
							created_by: session?.user.id,
							role: role,
							...processedOcrData,
						}),
					}
				);

				console.log("Uploaded medical records to Supabase:", res);

				if (!res.ok) {
					const errorBody = await res.text(); // or res.json()
					console.error(
						"Upload failed:",
						res.status,
						res.statusText,
						errorBody
					);
					return;
				}

				const { record_id } = await res.json();
				console.log("Uploaded Record ID:", record_id);

				Alert.alert("Success", "Record added successfully!");
				onRecordSaved();
			} else if (mode === "edit") {
				// Call Edge function to update record
				const res = await fetch(
					"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateMedicalRecord",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session?.access_token}`,
						},
						body: JSON.stringify({
							record_id: recordId,
							title: recordTitle,
							record_type: recordType,
							...processedOcrData,
						}),
					}
				);

				console.log("Updated medical records on Supabase:", res);

				if (!res.ok) {
					const errorBody = await res.text(); // or res.json()
					console.error(
						"Update failed:",
						res.status,
						res.statusText,
						errorBody
					);
					return;
				}

				const { data } = await res.json();
				console.log("Updated Record Data:", data);

				Alert.alert("Success", "Record updated successfully!");
				onRecordSaved();
			}
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			handleCancel();
			setSaving(false);
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
					padding: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Text variant="titleMedium" style={styles.modalTitle}>
					{step === "upload" && "New Medical Record"}
					{step === "prefill" &&
						(mode === "edit" ? "Edit Record" : "Review Record")}
					{step === "confirm" &&
						(mode === "edit" ? "Confirm Upload" : "Confirm Changes")}
				</Text>

				{/* Step 1 of Upload */}
				{step === "upload" && mode === "new" && (
					<>
						<ProgressBar
							progress={0}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>

						{(role === "doctor" || role === "nurse") && (
							<PatientDropdown
								doctorId={session?.user.id ?? ""}
								selectedPatient={selectedPatient}
								setSelectedPatient={setSelectedPatient}
							/>
						)}
						<TextInput
							label="Title"
							placeholder="E.g. Laboratory Test Results"
							mode="outlined"
							value={recordTitle}
							onChangeText={setRecordTitle}
							autoComplete="off"
							maxLength={80}
							style={[
								styles.input,
								{ marginTop: 10 },
								// { backgroundColor: theme.colors.onPrimary },
							]}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
							outlineStyle={{
								borderRadius: 10,
							}}
						/>
						<RecordTypeDropdown
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
							For supported file types (PDF, TXT), PDFs usually give higher text
							extraction accuracy.
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
								Scan
							</Button>
						</View>
					</>
				)}
				{step === "prefill" && (
					<>
						<ProgressBar
							progress={mode === "edit" ? 0 : 0.5}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>
						<TextInput
							label="Title"
							placeholder="E.g. Laboratory Test Results"
							mode="outlined"
							value={recordTitle}
							onChangeText={setRecordTitle}
							autoComplete="off"
							maxLength={80}
							style={[
								styles.input,
								// { backgroundColor: theme.colors.onPrimary },
							]}
							contentStyle={{
								textAlign: undefined, // To prevent ellipsis from not working
							}}
						/>
						<RecordTypeDropdown
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
									mode="dob"
									value={ocrData[field] ? new Date(ocrData[field]) : undefined}
									onChange={(date) =>
										setOcrData((prev) => ({
											...prev,
											[field]: date,
										}))
									}
								/>
							) : (
								<TextInput
									key={field}
									label={formatLabel(field)}
									mode="outlined"
									value={
										multilineFields.has(field)
											? Array.isArray(ocrData[field])
												? (ocrData[field] as string[]).join("\n")
												: (ocrData[field] as string) ?? "" // fallback if it's string
											: (ocrData[field] as string) ?? ""
									}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									autoComplete="off"
									style={[
										styles.input,
										// { backgroundColor: theme.colors.onPrimary },
									]}
									contentStyle={{
										textAlign: undefined, // To prevent ellipsis from not working
									}}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 5 : 1}
									placeholder={placeholders[field] ?? "Enter details"}
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
									value={
										multilineFields.has(field)
											? Array.isArray(ocrData[field])
												? (ocrData[field] as string[]).join("\n")
												: (ocrData[field] as string) ?? "" // fallback if it's string
											: (ocrData[field] as string) ?? ""
									}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									autoComplete="off"
									style={[
										styles.input,
										// { backgroundColor: theme.colors.onPrimary },
									]}
									contentStyle={{
										textAlign: undefined, // To prevent ellipsis from not working
									}}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 5 : 1}
									placeholder={placeholders[field] ?? "Enter details"}
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
									value={
										multilineFields.has(field)
											? Array.isArray(ocrData[field])
												? (ocrData[field] as string[]).join("\n")
												: (ocrData[field] as string) ?? "" // fallback if it's string
											: (ocrData[field] as string) ?? ""
									}
									onChangeText={(text) =>
										setOcrData((prev) => ({ ...prev, [field]: text }))
									}
									autoComplete="off"
									style={[
										styles.input,
										// { backgroundColor: theme.colors.onPrimary },
									]}
									contentStyle={{
										textAlign: undefined, // To prevent ellipsis from not working
									}}
									multiline={multilineFields.has(field)}
									numberOfLines={multilineFields.has(field) ? 10 : 1}
									placeholder={placeholders[field] ?? "Enter details"}
								/>
							)
						)}

						<View style={styles.actionButtonRow}>
							<Button
								mode="outlined"
								onPress={() => {
									if (mode === "edit") {
										handleCancel();
									} else {
										setStep("upload");
									}
								}}
								style={styles.actionButton}
							>
								{mode === "edit" ? "Cancel" : "Back"}
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
							progress={1}
							color={theme.colors.primary}
							style={styles.progressBar}
						/>
						<View style={{ padding: 8 }}>
							{mode === "new" ? (
								<>
									<Text style={[styles.confirmationText, { marginBottom: 12 }]}>
										The uploaded image(s), file(s) and form data will be saved
										into your record.
									</Text>
									<Text style={[styles.confirmationText, { marginBottom: 12 }]}>
										You can still review and edit the extracted form details
										before continuing.
									</Text>
									<Text style={[styles.confirmationText, { marginBottom: 20 }]}>
										However, uploaded image(s) and file(s) cannot be changed
										once submitted, as doing so would affect the extracted
										content.
									</Text>
								</>
							) : (
								<>
									<Text
										style={[styles.editConfirmationText, { marginBottom: 12 }]}
									>
										The attached file(s) shown below are those uploaded when
										this record was first created.
									</Text>

									<Text
										style={[styles.editConfirmationText, { marginBottom: 12 }]}
									>
										They cannot be modified and are provided here for your
										reference only.
									</Text>
									<Text
										style={[styles.editConfirmationText, { marginBottom: 12 }]}
									>
										If you need to adjust the form details further, you may go
										back before saving.
									</Text>
									<ScrollView
										horizontal
										style={styles.filePreviewHorizontalScroll}
									>
										{record?.file_paths?.map((file, index) => (
											<FilePreview
												key={index}
												file={file}
												signedUrl={record.signed_urls?.[index]}
											/>
										))}
									</ScrollView>
								</>
							)}

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
									: mode === "new" && step === "confirm"
									? "Saving extracted data..."
									: mode === "edit" && step === "confirm"
									? "Saving data..."
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
		padding: 2,
		marginHorizontal: 15,
		marginVertical: 5,
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
	editConfirmationText: {
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
