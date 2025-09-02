import CustomDatePicker from "@/components/CustomDatePicker";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { formatLabel } from "@/components/RecordTypeDropdown";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord, SelectedFile } from "@/types/medicalRecord";
import { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Keyboard,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {
	Button,
	Card,
	IconButton,
	Menu,
	Portal,
	Searchbar,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientMedicalRecordScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
	const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
		null
	);

	const [modalMode, setModalMode] = useState<"new" | "edit">("new");
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [imageLoading, setImageLoading] = useState(true);
	const [fromDate, setFromDate] = useState<Date | undefined>(() => {
		const d = new Date();
		d.setFullYear(d.getFullYear() - 1); // set 1 year earlier
		return d;
	});
	const [toDate, setToDate] = useState<Date | undefined>(new Date());

	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

	const RECORDS_PER_PAGE = 4; // Currently only set this to 4 can prevent duplicated children issue

	useEffect(() => {
		if (!userId) return;
		handleRefresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId]);

	// useEffect(() => {
	// 	records.map((record) => {
	// 		console.log("Use Effect Record ID:", record.id);
	// 		console.log("Use Effect Record Title:", record.title);
	// 		// console.log("Use Effect Record Type:", record.record_type);
	// 		// console.log("Use Effect Record SignedUrl:", record.signed_urls);
	// 	});
	// }, [records]);

	// useEffect(() => {
	// 	filteredRecords.map((record) => {
	// 		console.log("Use Effect Filtered Record ID:", record.id);
	// 		console.log("Use Effect Filtered Type:", record.record_type);
	// 		// console.log("Use Effect Filtered Date:", record.record_date);
	// 		// console.log("Use Effect Filtered SignedUrl:", record.signed_urls);
	// 	});
	// }, [filteredRecords]);

	// This useEffect is for triggering the search based on default fields for the first time when record is first fetched (Don't change)
	useEffect(() => {
		handleSearch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [records]);

	const fetchRecords = async (pageNumber = 1, ignoreHasMore = false) => {
		if (!userId || (!hasMore && !ignoreHasMore)) return;
		try {
			// setLoading(true);
			const res = await fetch(
				`https://zxyyegizcgbhctjjoido.functions.supabase.co/getMedicalRecord?uid=${session.user.id}&role=${role}&page=${pageNumber}&limit=${RECORDS_PER_PAGE}`,
				{
					headers: { Authorization: `Bearer ${session.access_token}` },
				}
			);

			if (!res.ok) {
				console.error("Failed to fetch records", await res.text());
				return;
			}

			const data = await res.json();

			const recordsWithUrls: MedicalRecord[] = data?.recordsWithUrls ?? [];
			const more: boolean = data?.hasMore ?? false;

			setHasMore(more);

			if (pageNumber === 1) {
				setRecords(recordsWithUrls); // Refresh and First page
				setPage(1); // reset page counter
			} else {
				// Resolve duplicated record issue
				setRecords((prev) => {
					const combined =
						pageNumber === 1 ? recordsWithUrls : [...prev, ...recordsWithUrls];
					// remove duplicates by id
					const uniqueRecords = Array.from(
						new Map(combined.map((r) => [r.id, r])).values()
					);
					return uniqueRecords;
				});
			}
		} catch (err) {
			console.error(err);
		} finally {
			// setLoading(false);
		}
	};

	const handleRefresh = async () => {
		setLoading(true);
		setHasMore(true);
		await fetchRecords(1, true); // force refresh, replace data
		handleSearch();
		setLoading(false);
	};

	const handleSearch = () => {
		let filtered = records;
		if (fromDate && toDate && fromDate > toDate) {
			Alert.alert(
				"Invalid date range",
				"The start date cannot be later than the end date."
			);
			return; // stop filtering
		}

		if (searchQuery) {
			filtered = filtered.filter(
				(record) =>
					record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					record.record_type
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					record.patient_name
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					record.doctor_name
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					record.healthcare_provider_name
						?.toLowerCase()
						.includes(searchQuery.toLowerCase())
			);
		}

		// Date range filter
		if (fromDate || toDate) {
			const stripTime = (date: Date) => {
				const d = new Date(date);
				d.setHours(0, 0, 0, 0);
				return d;
			};

			// console.log("Filtering by date range...");
			// console.log("From Date (raw):", fromDate);
			// console.log("To Date (raw):", toDate);
			// console.log(
			// 	"From Date (stripped):",
			// 	fromDate ? stripTime(fromDate) : undefined
			// );
			// console.log(
			// 	"To Date (stripped):",
			// 	toDate ? stripTime(toDate) : undefined
			// );

			filtered = filtered.filter((record) => {
				if (!record.record_date) return false;

				const recordDate = stripTime(new Date(record.record_date));
				// console.log("----");
				// console.log("Record raw:", record.record_date);
				// console.log("Record stripped:", recordDate);

				if (fromDate && recordDate < stripTime(fromDate)) return false;
				if (toDate && recordDate > stripTime(toDate)) return false;
				console.log("Search found Record ID:", record.id);

				return true;
			});
		}
		setFilteredRecords(filtered);
	};

	const handleAddRecord = async () => {
		setSelectedRecord(null);
		setModalMode("new");
		setUploadModalVisible(true);
	};

	const handleCardPress = (record: MedicalRecord) => {
		setSelectedRecord(record);
		setModalMode("edit");
		setUploadModalVisible(true);
	};

	const handleDelete = async (id: string) => {
		console.log("Deleting Record ID:", id);
		try {
			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/deleteMedicalRecord",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({ record_id: id }),
				}
			);

			// Parse the JSON response
			const data = await res.json();

			if (!res.ok || !data.success) {
				console.error("Delete failed:", data.message);
				Alert.alert("Error", data.message || "Failed to delete record!");
				return;
			}

			// Success case
			console.log("Delete successful:", data);
			Alert.alert("Success", data.message);
			handleRefresh();
		} catch (err: any) {
			console.error("Unexpected error:", err);
			Alert.alert("Error", err.message || "An unexpected error occurred!");
		}
	};

	const keyExtractor = (item: MedicalRecord) => item.id;
	const renderRecord = ({ item }: { item: MedicalRecord }) => {
		const imageIndex = item.file_paths?.findIndex(
			(f): f is SelectedFile =>
				typeof f !== "string" && f.type.includes("image")
		);
		const imageUrl =
			imageIndex !== undefined && imageIndex >= 0
				? item.signed_urls?.[imageIndex] ?? ""
				: "";

		return (
			<Card
				key={item.id}
				style={styles.card}
				onPress={() => handleCardPress(item)}
				elevation={1}
			>
				<Card.Title
					title={item.title}
					titleStyle={{ fontWeight: 600 }}
					subtitle={
						item.record_date
							? `${item.record_date}${
									formatLabel(item.record_type)
										? " • " + formatLabel(item.record_type)
										: ""
							  }`
							: formatLabel(item.record_type) ?? "No date"
					}
					right={() => (
						<Menu
							contentStyle={{ borderRadius: 10, width: 140 }}
							mode="elevated"
							visible={openMenuId === item.id}
							onDismiss={() => setOpenMenuId(null)}
							anchor={
								<IconButton
									icon="dots-vertical"
									iconColor={theme.colors.primary}
									onPress={() => setOpenMenuId(item.id)}
								/>
							}
							anchorPosition="top"
						>
							<Menu.Item
								onPress={() => {
									handleCardPress(item);
									setOpenMenuId(null); // To dismiss the menu after clicking
								}}
								leadingIcon="pencil"
								title="Edit"
								containerStyle={{ paddingHorizontal: 5 }}
							/>
							<Menu.Item
								onPress={() => {
									setSelectedRecordId(item.id);
									setDialogVisible(true);
									setOpenMenuId(null); // To dismiss the menu after clicking
								}}
								leadingIcon="delete"
								title="Delete"
								containerStyle={{ paddingHorizontal: 5 }}
							/>
						</Menu>
					)}
				/>
				<Card.Content>
					<View style={{ width: "100%", height: 150, marginBottom: 10 }}>
						{/* {imageLoading && (
							<ActivityIndicator size="small" loadingMsg="" overlay={false} />
						)}
						<Image
							source={{ uri: imageUrl }}
							style={{
								width: "100%",
								height: "100%",
								borderRadius: 8,
								position: "absolute",
							}}
							onLoadStart={() => setImageLoading(true)}
							onLoadEnd={() => setImageLoading(false)}
							onError={() => setImageLoading(false)}
							resizeMethod="resize" 
						/> */}

						{/* Expo-image */}
						{/* {imageLoading && (
							<ActivityIndicator size="small" loadingMsg="" overlay={false} />
						)}
						<Image
							source={{ uri: imageUrl }}
							style={{
								width: "100%",
								height: "100%",
								borderRadius: 8,
								position: "absolute",
							}}
							contentFit="cover"
							// placeholder={require('../assets/placeholder.png')} // optional
							cachePolicy="memory-disk"
							onLoadStart={() => setImageLoading(true)}
							onLoadEnd={() => setImageLoading(false)}
							onError={() => setImageLoading(false)}
						/> */}
					</View>

					{/* Always show all fields */}
					<View style={{ gap: 6 }}>
						<Text variant="bodyMedium">
							Patient:{" "}
							<Text variant="bodyMedium">{item.patient_name || "—"}</Text>
						</Text>

						<Text variant="bodyMedium">
							Doctor:{" "}
							<Text variant="bodyMedium">{item.doctor_name || "—"}</Text>
						</Text>

						<Text variant="bodyMedium">
							Provider:{" "}
							<Text variant="bodyMedium">
								{item.healthcare_provider_name || "—"}
							</Text>
						</Text>

						<Text variant="bodySmall" style={{ textAlign: "right" }}>
							Last updated:{" "}
							<Text variant="bodySmall">
								{item.updated_at
									? new Date(item.updated_at).toLocaleDateString()
									: "—"}
							</Text>
						</Text>
					</View>
				</Card.Content>
			</Card>
		);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: theme.colors.background }}
			>
				<FlatList
					contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 16 }}
					data={filteredRecords}
					keyExtractor={keyExtractor}
					refreshing={loading}
					onRefresh={handleRefresh}
					renderItem={renderRecord}
					// initialNumToRender={5} // This seems not affecting
					maxToRenderPerBatch={6}
					ListHeaderComponent={
						<>
							<Card style={styles.searchForm} elevation={1}>
								<Card.Content>
									<Searchbar
										placeholder="Search records..."
										value={searchQuery}
										onChangeText={setSearchQuery}
										style={{
											marginBottom: 15,
											backgroundColor: theme.colors.onPrimary,
											color: theme.colors.primary,
											borderRadius: 8,
											borderColor: theme.colors.primary,
										}}
										inputStyle={{ fontSize: 14, padding: 0, color: "black" }}
										elevation={2}
										autoComplete="off"
										autoCorrect={false}
										spellCheck={false}
									/>
									<CustomDatePicker
										label="From"
										value={fromDate}
										onChange={setFromDate}
										parent="searchForm"
									/>

									<CustomDatePicker
										label="To"
										value={toDate}
										onChange={setToDate}
										parent="searchForm"
									/>

									<Button
										mode="contained"
										onPress={handleSearch}
										style={styles.searchButton}
									>
										Search
									</Button>
								</Card.Content>
							</Card>
							<Button
								mode="elevated"
								icon="plus"
								// icon="upload"
								onPress={handleAddRecord}
								style={styles.uploadButton}
							>
								Add Record
							</Button>
						</>
					}
					onEndReached={() => {
						if (!loading && hasMore) {
							fetchRecords(page + 1);
							setPage((prev) => prev + 1);
						}
					}}
					onEndReachedThreshold={0}
					// ListFooterComponent={loading ? <ActivityIndicator /> : null}
					ListEmptyComponent={
						!loading ? (
							<View style={styles.center}>
								<Text
									variant="bodyLarge"
									style={{ color: theme.colors.onSurface }}
								>
									No medical records uploaded yet.
								</Text>
							</View>
						) : null
					}
				/>

				<DeleteConfirmationDialog
					visible={dialogVisible}
					deleteId={selectedRecordId}
					onCancel={() => setDialogVisible(false)}
					onConfirm={handleDelete}
				/>
				{/* Popup Modal for Uploading Medical Records */}
				<Portal>
					<UploadRecordModal
						visible={uploadModalVisible}
						onClose={() => setUploadModalVisible(false)}
						session={session}
						// onRecordSaved={(record) => setRecords((prev) => [record, ...prev])}
						onRecordSaved={() => {
							// if (modalMode === "edit") {
							// 	setRecords((prev) =>
							// 		prev.map((r) => (r.id === record.id ? record : r))
							// 	);
							// }
							handleRefresh();
							setUploadModalVisible(false);
						}}
						// onRecordSaved={(record) => {
						// 	if (modalMode === "edit") {
						// 		setRecords((prev) =>
						// 			prev.map((r) => (r.id === record.id ? record : r))
						// 		);
						// 	}
						// 	handleRefresh();
						// 	setUploadModalVisible(false);
						// }}
						record={selectedRecord}
						mode={modalMode}
					/>
				</Portal>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 15,
	},
	card: {
		marginBottom: 15,
		padding: 5,
	},
	center: {
		alignItems: "center",
		marginTop: 40,
	},
	searchForm: {
		gap: 20,
		marginBottom: 20,
	},
	searchButton: {
		marginVertical: 10,
	},
	uploadButton: {
		alignSelf: "flex-end",
		marginBottom: 20,
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
