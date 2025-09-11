import type {
	Appointment,
	SupportingDocument,
	SupportingDocumentToUpload,
	SupportingDocumentType,
} from "@/types/appointment";
import { blobToBase64, MAX_FILE_SIZE } from "@/utils/fileHelpers";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Modal, Text, TextInput, useTheme } from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";
import ConfirmationDialog from "./ConfirmationDialog";
import { SupportingDocumentPreview } from "./SupportingDocumentPreview";

type UpdateAppointmentDetailsModalProps = {
	visible: boolean;
	onClose: () => void;
	session: any;
	onRecordSaved: () => void;
	appointment: Appointment;
};

export default function UpdateAppointmentDetailsModal({
	visible,
	onClose,
	session,
	onRecordSaved,
	appointment,
}: UpdateAppointmentDetailsModalProps) {
	const theme = useTheme();
	const [saving, setSaving] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [reason, setReason] = useState<string>(appointment.reason ?? "");
	const [notes, setNotes] = useState<string>(appointment.notes ?? "");
	// const [supportingDocuments, setSupportingDocuments] = useState<
	// 	SupportingDocument[]
	// >([]);
	const [supportingDocuments, setSupportingDocuments] = useState<
		SupportingDocument[]
	>(
		appointment.supporting_documents?.map((doc) => {
			if ("uri" in doc) {
				return doc;
			} else {
				// It's an IncomingFile, convert it to SupportingDocument for frontend display
				return {
					name: doc.name,
					type: doc.type ?? "document",
					uri: "", // no URI available, could be replaced after uploading
					document_type: (doc.document_type ??
						"others") as SupportingDocumentType,
				};
			}
		}) ?? []
	);
	const [removedDocuments, setRemovedDocuments] = useState<
		SupportingDocument[]
	>([]);

	// useEffect(() => {
	// 	console.log("Supporting documents:", supportingDocuments);
	// }, [supportingDocuments]);

	// useEffect(() => {
	// 	console.log("appointment:", appointment);
	// }, [appointment]);

	const handleAttachFile = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: [
				"application/pdf",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"application/msword",
			], // Allowed document types
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
				Alert.alert(
					`File too large. Maximum allowed size per file is {MAX_FILE_SIZE / (1024 * 1024)} MB.`
				);
				return;
			}
			setSupportingDocuments((prev) => [
				...prev,
				...result.assets.map((asset) => ({
					uri: asset.uri,
					name: asset.name,
					type: "document" as string,
					document_type: "others" as SupportingDocumentType,
					is_new: true,
				})),
			]);
		}
	};

	const handleRemoveDocument = (index: number) => {
		const removed = supportingDocuments[index];
		console.log("Found removed:", supportingDocuments[index]);
		if (!removed) return;

		console.log("Passed removed guard check!");
		setRemovedDocuments((prev) => [...prev, removed]);
		setSupportingDocuments((prev) => prev.filter((_, i) => i !== index));
	};

	const handleTypeChange = (index: number, type: SupportingDocumentType) => {
		setSupportingDocuments((prev) =>
			prev.map((doc, i) =>
				i === index ? { ...doc, document_type: type } : doc
			)
		);
	};

	const handleSave = async () => {
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		if (!reason) {
			console.log("Reason for appointment cannot be empty!");
			Alert.alert("Alert", "Reason for appointment cannot be empty!");
			return;
		}

		try {
			setSaving(true);

			const supportingDocumentsToUpload: SupportingDocumentToUpload[] =
				await Promise.all(
					supportingDocuments
						.filter((file) => file.is_new) // only new files
						.map(async (file) => {
							const response = await fetch(file.uri);
							const blob = await response.blob();
							const base64 = await blobToBase64(blob);
							return {
								name: file.name,
								blobBase64: base64,
								type: blob.type, // MUST send the MIME type for new files
								document_type: file.document_type,
							};
						})
				);

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateAppointmentDetails",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						id: appointment.id,
						patient_id: appointment.patient_id,
						reason: reason,
						notes: notes ?? null,
						supporting_documents: supportingDocuments,
						new_documents: supportingDocumentsToUpload, // Contains base64
						removed_documents: removedDocuments,
					}),
				}
			);

			if (!res.ok) {
				const errorBody = await res.text();
				console.error(
					"UpdateAppointmentDetails Appointment Edge function failed:",
					res.status,
					errorBody
				);
				return;
			}

			const { data } = await res.json();
			console.log("Updated appointment:", data);

			Alert.alert(
				"Appointment Details Updated",
				"Your appointment details have been saved successfully!"
			);

			setReason("");
			setNotes("");
			setSupportingDocuments([]);
			onRecordSaved();

		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			visible={visible}
			onDismiss={onClose}
			contentContainerStyle={
				styles.modalContainer
			}
		>
			<ScrollView
				contentContainerStyle={{
					padding: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Text variant="titleMedium" style={styles.modalTitle}>
					Update Appointment Details
				</Text>

				<TextInput
					label="Reason for Appointment"
					mode="outlined"
					placeholder="E.g. Consultation, Follow-up appointment"
					value={reason}
					onChangeText={setReason}
					autoComplete="off"
					maxLength={100}
					style={[
						styles.input,
						{
							backgroundColor: theme.colors.onPrimary,
							marginTop: 20,
						},
					]}
					contentStyle={{
						textAlign: undefined, // To prevent ellipsis from not working
					}}
				/>

				<TextInput
					label="Notes (Optional)"
					mode="outlined"
					placeholder="Anything you'd like your doctor to know"
					value={notes}
					onChangeText={setNotes}
					autoComplete="off"
					maxLength={100}
					style={[
						styles.input,
						{
							backgroundColor: theme.colors.onPrimary,
						},
					]}
					contentStyle={{
						textAlign: undefined, // To prevent ellipsis from not working
					}}
				/>
				<Text variant="titleSmall" style={{ marginTop: 10, marginBottom: 8 }}>
					Supporting Documents (optional)
				</Text>
				<Text
					variant="labelSmall"
					style={{
						marginBottom: 3,
						// marginHorizontal: 5,
						color: theme.colors.onSurfaceVariant, // muted color
					}}
				>
					E.g. Insurance Claim, Company Letter of Guarantee, Referral Letter,
					Lab Result, etc.
				</Text>

				{supportingDocuments.length > 0 && (
					<ScrollView horizontal style={styles.filePreviewHorizontalScroll}>
						{supportingDocuments.map((file, index) => (
							<View key={index}>
								<SupportingDocumentPreview
									key={index}
									file={file}
									onRemove={() => handleRemoveDocument(index)}
									onTypeChange={(type) => handleTypeChange(index, type)}
									disableDropdown={!file.is_new} // disable dropdown for old files
								/>
							</View>
						))}
					</ScrollView>
				)}
				<Text
					variant="labelSmall"
					style={{
						marginTop: 2,
						marginBottom: 10,
						// marginHorizontal: 5,
						color: theme.colors.onSurfaceVariant, // muted color
					}}
				>
					Supported file types: PDF, DOC, DOCX
				</Text>

				<Button
					mode="elevated"
					icon="file-document-multiple"
					onPress={handleAttachFile}
					style={styles.uploadButton}
					contentStyle={{ flexDirection: "row-reverse" }} // optional: icon on right
				>
					Attach File
				</Button>
				<Button
					mode="contained"
					onPress={() => setDialogVisible(true)}
					disabled={!reason}
					style={{ marginVertical: 12 }}
				>
					Save
				</Button>
			</ScrollView>

			<ConfirmationDialog
				visible={dialogVisible}
				onCancel={() => setDialogVisible(false)}
				onConfirm={handleSave}
				title="Update Appointment Details Confirmation"
				messagePrimary="Are you sure you want to save your changes?"
				messageSecondary=""
			/>

			{saving && (
				<ActivityIndicator
					loadingMsg={""}
					overlay={true}
					size="large"
				/>
			)}
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 2,
		marginHorizontal: 15,
		marginVertical: 50,
	},
	modalTitle: {
		textAlign: "center",
		marginBottom: 5,
	},
	input: {
		marginBottom: 16,
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
	filePreviewHorizontalScroll: {
		// marginBottom: 0,
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
});
