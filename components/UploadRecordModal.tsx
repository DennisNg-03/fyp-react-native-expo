import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
	Platform,
	ScrollView,
	StyleSheet,
	View
} from "react-native";
import { Button, IconButton, Modal, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { SelectedFile } from "../types/file";
import { ActivityIndicator } from "./ActivityIndicator";
import FilePreview from "./FilePreview";
import { RecordTypeMenu } from "./RecordTypeMenu";

interface UploadRecordModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFiles: SelectedFile[];
  setSelectedFiles: (files: SelectedFile[]) => void;
  recordTitle: string;
  setRecordTitle: (title: string) => void;
  recordDate: Date;
  setRecordDate: (date: Date) => void;
  recordType?: string;
  handleTakePhoto: () => void;
  handleUploadImage: () => void;
  handleAttachFile: () => void;
  handleSaveRecord: () => void;
  saving: boolean;
}

export default function UploadRecordModal({
  visible,
  onClose,
  selectedFiles,
  setSelectedFiles,
  recordTitle,
  setRecordTitle,
  recordDate,
  setRecordDate,
  // recordType,
  handleTakePhoto,
  handleUploadImage,
  handleAttachFile,
  handleSaveRecord,
  saving,
}: UploadRecordModalProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
	const [files, setFiles] = useState<SelectedFile[]>([]);
	const [recordType, setRecordType] = useState<string>();
	const containerStyle = {backgroundColor: 'white', padding: 20};

  return (
		<Portal>
			<Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
				{/* <View style={styles.modalOverlay}>
					<View style={styles.modalContainer}> */}
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

						<RecordTypeMenu
							selectedType={recordType}
							setSelectedType={setRecordType}
						/>

						<View style={styles.dateTimePicker}>
							<TextInput
								label="Date"
								mode="outlined"
								value={recordDate.toDateString()}
								onFocus={() => setShowPicker(true)}
								readOnly
							/>
							<DateTimePicker
								value={recordDate}
								mode="date"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								maximumDate={new Date()}
								onChange={(_e, selected) => {
									setShowPicker(false);
									if (selected) setRecordDate(selected);
								}}
							/>
						</View>

						{selectedFiles.length > 0 && (
							<ScrollView horizontal style={{ marginBottom: 10 }}>
								{selectedFiles.map((file, index) => (
									<FilePreview
										key={index}
										file={file}
										onRemove={() =>
											setFiles((prev: SelectedFile[]) => prev.filter((f) => f.uri !== file.uri))
										}
									/>
								))}
							</ScrollView>
						)}

						<View style={styles.uploadButtonRow}>
							<IconButton mode="outlined" icon="camera" onPress={handleTakePhoto} style={styles.uploadButton}/>
							<IconButton mode="outlined" icon="image-multiple" onPress={handleUploadImage} style={styles.uploadButton}/>
							<IconButton mode="outlined" icon="file-document-multiple" onPress={handleAttachFile} style={styles.uploadButton}/>
						</View>

						<View style={styles.actionButtonRow}>
							<Button mode="outlined" onPress={onClose} style={styles.actionButton}>
								Cancel
							</Button>
							<Button mode="contained" onPress={handleSaveRecord} style={styles.actionButton}>
								Save
							</Button>
						</View>

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
								<ActivityIndicator />
								<Text style={{ marginTop: 2 }}>Saving...</Text>
							</View>
						)}
					{/* </View>
				</View> */}
			</Modal>
		</Portal>
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
	dateTimePicker: {
		marginBottom: 10,
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
	}
})