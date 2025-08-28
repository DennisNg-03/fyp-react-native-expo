import { ActivityIndicator } from "@/components/ActivityIndicator";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord, SelectedFile } from "@/types/medicalRecord";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import {
	Button,
	Card,
	Text,
	TextInput,
	useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientMedicalRecordScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

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

	const handleSearch = async () => {
		return;
	}

	const handleUploadRecord = async () => {
		// if (!recordType) {
		// 	Alert.alert(
		// 		"Alert",
		// 		"Please select a record type before proceeding to upload medical record!"
		// 	);
		// 	return;
		// }
		setUploadModalVisible(true);
	};

	if (loading) {
		return <ActivityIndicator />;
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView style={styles.container}>
				
				<View style={styles.searchForm}>
					<TextInput
						placeholder="Search records..."
						mode="outlined"
						value={searchQuery}
						onChangeText={setSearchQuery}
						style={styles.searchInput}
					/>
					<Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
						Search
					</Button>
					
				</View>
				<Button mode="elevated" icon="upload" onPress={handleUploadRecord} style={styles.uploadButton}>
					Upload
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
			<UploadRecordModal
				visible={uploadModalVisible}
				onClose={() => setUploadModalVisible(false)}
				session={session}
				onRecordSaved={(record) => setRecords((prev) => [record, ...prev])}
				// selectedFiles={selectedFiles}
				// setSelectedFiles={setSelectedFiles}
				// recordTitle={recordTitle}
				// setRecordTitle={setRecordTitle}
				// recordDate={recordDate}
				// setRecordDate={setRecordDate}
				// recordType={recordType}
				// handleTakePhoto={handleTakePhoto}
				// handleUploadImage={handleUploadImage}
				// handleAttachFile={handleAttachFile}
				// handleSaveRecord={handleSaveRecord}
				// handleCancel={handleCancel}
				// saving={saving}
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
	searchForm: {
		padding: 16,
		backgroundColor: "#fff",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		gap: 10, 
		elevation: 3,
		marginBottom: 20,
	},
	searchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	searchInput: { 
		marginBottom: 10,
	},
	searchButton: { 
		marginBottom: 10,
	},
	uploadButton: { 
		alignSelf: "flex-end",
		// padding: 0,
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
});
