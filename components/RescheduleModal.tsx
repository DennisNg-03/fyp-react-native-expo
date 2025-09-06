import { supabase } from "@/lib/supabase";
import type {
	Appointment,
	Slot,
	SupportingDocument,
	SupportingDocumentToUpload,
	SupportingDocumentType,
} from "@/types/appointment";
import { formatKL } from "@/utils/dateHelpers";
import { blobToBase64, MAX_FILE_SIZE } from "@/utils/fileHelpers";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Modal, Text, TextInput, useTheme } from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";
import ConfirmationDialog from "./ConfirmationDialog";
import CustomDatePicker from "./CustomDatePicker";
import { SlotPicker } from "./SlotPicker";
import { SupportingDocumentPreview } from "./SupportingDocumentPreview";

type RescheduleModalProps = {
	visible: boolean;
	onClose: () => void;
	session: any;
	onRecordSaved: () => void;
	appointment: Appointment;
};

export default function RescheduleModal({
	visible,
	onClose,
	session,
	onRecordSaved,
	appointment,
}: RescheduleModalProps) {
	const theme = useTheme();
	const [saving, setSaving] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(() => {
		const today = new Date();
		const appointmentDate = new Date(appointment.starts_at);
		return appointmentDate > today ? appointmentDate : today;
	});
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

	const loadSlots = useCallback(async () => {
		setLoadingSlots(true);
		try {
			const doctorId = appointment.doctor_id;

			if (!doctorId || !selectedDate) {
				console.log("No doctor or date selected, skipping slots load");
				setSlots([]);
				return;
			}

			const dateISO = formatKL(selectedDate, "yyyy-MM-dd");
			console.log("DateISO:", dateISO);

			const { data, error } = await supabase.rpc("get_available_slots", {
				p_doctor_id: doctorId,
				p_date: dateISO,
				p_slot_mins: appointment.doctor?.slot_minutes ?? 15,
			});

			if (error) {
				console.error("Error loading slots:", error);
				setSlots([]);
			} else {
				setSlots(data || []);
			}
		} catch (error) {
			console.error("Unexpected error loading slots:", error);
			setSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [appointment, selectedDate]);

	// useEffect(() => {
	// 	loadSlots();
	// }, [loadSlots]);

	useEffect(() => {
		console.log("Selected date:", formatKL(selectedDate, "yyyy-MM-dd"));
		loadSlots();
	}, [selectedDate, loadSlots]);

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

	const handleReschedule = async () => {
		console.log("Selected slot:", selectedSlot);
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		if (!selectedSlot) {
			console.log("Doctor or slot is not selected!");
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
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/rescheduleAppointment",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						id: appointment.id,
						patient_id: appointment.patient_id,
						starts_at: selectedSlot.slot_start,
						ends_at: selectedSlot.slot_end,
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
					"Reschedule Appointment Edge function failed:",
					res.status,
					res.statusText,
					errorBody
				);
				return;
			}

			const { data } = await res.json();
			console.log("Updated appointment:", data);

			// Mark slot as blocked
			setSlots((prev) =>
				prev.map((slot) =>
					slot.slot_start === selectedSlot.slot_start
						? { ...slot, is_blocked: true }
						: slot
				)
			);

			setSelectedSlot(null);
			setSelectedDate(new Date());
			setReason("");
			setNotes("");
			setSupportingDocuments([]);
			loadSlots();

			Alert.alert(
				"Request Sent",
				"Your reschedule request has been submitted and is pending approval."
			);
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
				// 	{
				// 	backgroundColor: "white",
				// 	margin: 20,
				// 	borderRadius: 12,
				// 	padding: 16,
				// }
				styles.modalContainer
			}
		>
			<ScrollView
				contentContainerStyle={{
					padding: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Text variant="titleMedium" style={{ marginBottom: 12 }}>
					Reschedule Appointment
				</Text>
				<CustomDatePicker
					label="Choose your reschedule date"
					value={selectedDate}
					onChange={setSelectedDate}
					parent="appointments"
					mode="future"
				/>
				{loadingSlots ? (
					<ActivityIndicator loadingMsg="" size="small" overlay={false} />
				) : slots.length > 0 ? (
					<SlotPicker
						slots={slots}
						selectedSlot={selectedSlot}
						onSelect={setSelectedSlot}
					/>
				) : (
					<View style={{ marginVertical: 10, alignItems: "center" }}>
						<Text>No available slots.</Text>
					</View>
				)}

				<TextInput
					label="Reason for appointment"
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
					disabled={!selectedSlot || !reason}
					style={{ marginTop: 16 }}
				>
					Confirm
				</Button>
			</ScrollView>

			<ConfirmationDialog
				visible={dialogVisible}
				onCancel={() => setDialogVisible(false)}
				onConfirm={handleReschedule}
				title="Reschedule Appointment Confirmation"
				messagePrimary="Are you sure you want to reschedule this appointment?"
				messageSecondary="You will not be able to submit another request before this request is responded."
			/>

			{saving && (
				<ActivityIndicator
					loadingMsg={"Saving rescheduling request..."}
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
		// margin: 20,
		// borderRadius: 12,
		// padding: 16,
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
