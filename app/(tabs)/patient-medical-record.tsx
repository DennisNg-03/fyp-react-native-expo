import CustomDatePicker from "@/components/CustomDatePicker";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord } from "@/types/medicalRecord";
import { formatLabel } from "@/utils/labelHelpers";
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

	const [sortMenuVisible, setSortMenuVisible] = useState(false);
	const [sortField, setSortField] = useState<"date" | "title" | "provider">(
		"date"
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [filterModalVisible, setFilterModalVisible] = useState(false);

	const RECORDS_PER_PAGE = 4; // Currently only set this to 4 can prevent duplicated children issue

	useEffect(() => {
		if (!userId) return;
		handleRefresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId]);

	// This useEffect is for triggering the search based on default fields for the first time when record is first fetched (Don't change)
	useEffect(() => {
		applyFiltersAndSorting();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [records]);

	useEffect(() => {
		applyFiltersAndSorting();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery, fromDate, toDate, sortField, sortOrder]);

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
		applyFiltersAndSorting();
		setLoading(false);
	};

	const applyFiltersAndSorting = () => {
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

			filtered = filtered.filter((record) => {
				if (!record.record_date) return false;

				const recordDate = stripTime(new Date(record.record_date));

				if (fromDate && recordDate < stripTime(fromDate)) return false;
				if (toDate && recordDate > stripTime(toDate)) return false;

				return true;
			});
		}

		// Sorting
		filtered = filtered.slice(); // create a copy before sorting
		filtered.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sortField) {
				case "date":
					aValue = a.record_date ? new Date(a.record_date).getTime() : 0;
					bValue = b.record_date ? new Date(b.record_date).getTime() : 0;
					break;
				case "title":
					aValue = a.title.toLowerCase();
					bValue = b.title.toLowerCase();
					break;
				case "provider":
					aValue = (a.healthcare_provider_name || "").toLowerCase();
					bValue = (b.healthcare_provider_name || "").toLowerCase();
					break;
				default:
					aValue = 0;
					bValue = 0;
			}

			if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
			if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

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
		return (
			<Card
				key={item.id}
				style={styles.card}
				onPress={() => handleCardPress(item)}
				elevation={1}
			>
				<Card.Title
					title={item.title}
					titleStyle={{ fontWeight: "600" }}
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
							contentStyle={{ borderRadius: 8, width: 140 }}
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
									setOpenMenuId(null);
								}}
								leadingIcon="pencil"
								title="Edit"
							/>
							<Menu.Item
								onPress={() => {
									setSelectedRecordId(item.id);
									setDialogVisible(true);
									setOpenMenuId(null);
								}}
								leadingIcon="delete"
								title="Delete"
							/>
						</Menu>
					)}
				/>

				<Card.Content style={styles.cardContent}>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Patient:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.patient_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Doctor:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.doctor_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Provider:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.healthcare_provider_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Diagnosis:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.diagnosis || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Procedures:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.procedures || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodyMedium" style={styles.cardContentRow}>
						Medications:{" "}
						<Text style={{ fontWeight: "500" }}>
							{item.medications || "Not provided"}
						</Text>
					</Text>
					<Text variant="bodySmall" style={styles.cardContentRowSecondary}>
						Date of Admission:{" "}
						<Text>
							{item.date_of_admission
								? new Date(item.date_of_admission).toLocaleDateString()
								: "Not provided"}
						</Text>
					</Text>
					<Text variant="bodySmall" style={styles.cardContentRowSecondary}>
						Date of Discharge:{" "}
						<Text>
							{item.date_of_discharge
								? new Date(item.date_of_discharge).toLocaleDateString()
								: "Not provided"}
						</Text>
					</Text>
					<Text variant="bodySmall" style={styles.cardContentRowSecondary}>
						Notes: <Text>{item.notes || "Not provided"}</Text>
					</Text>
					<Text variant="bodySmall" style={styles.cardContentRowSecondary}>
						Created by:{" "}
						<Text>{item.created_by_full_name || "Not provided"}</Text>
					</Text>
					<Text variant="bodySmall" style={styles.cardContentRowSecondary}>
						Last updated:{" "}
						{item.updated_at
							? new Date(item.updated_at).toLocaleDateString()
							: "Not provided"}
					</Text>
				</Card.Content>
			</Card>
		);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
				<FlatList
					contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 16 }}
					data={filteredRecords}
					keyExtractor={keyExtractor}
					refreshing={loading}
					onRefresh={handleRefresh}
					renderItem={renderRecord}
					maxToRenderPerBatch={6}
					ListHeaderComponent={
						<>
							<View style={styles.searchActionsContainer}>
								<View style={styles.searchBarWrapper}>
									<Searchbar
										placeholder="Search records..."
										value={searchQuery}
										mode="bar"
										onChangeText={setSearchQuery}
										style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
										inputStyle={styles.searchBarInputStyle}
										autoComplete="off"
										autoCorrect={false}
										spellCheck={false}
									/>
								</View>
								<View style={styles.actionButtons}>
									<IconButton
										icon="filter-variant"
										mode="contained-tonal"
										onPress={() => setFilterModalVisible(true)}
										style={styles.iconButton}
										size={24}
										accessibilityLabel="Filter"
									/>
									<Menu
										visible={sortMenuVisible}
										onDismiss={() => setSortMenuVisible(false)}
										anchor={
											<IconButton
												icon="sort"
												mode="contained-tonal"
												onPress={() => setSortMenuVisible(true)}
												style={styles.iconButton}
												size={24}
												accessibilityLabel="Sort"
											/>
										}
									>
										<Menu.Item
											onPress={() => {
												setSortField("date");
												setSortMenuVisible(false);
											}}
											title="Date"
										/>
										<Menu.Item
											onPress={() => {
												setSortField("title");
												setSortMenuVisible(false);
											}}
											title="Title"
										/>
										<Menu.Item
											onPress={() => {
												setSortField("provider");
												setSortMenuVisible(false);
											}}
											title="Provider"
										/>
										<Menu.Item
											onPress={() => {
												setSortOrder((prev) =>
													prev === "asc" ? "desc" : "asc"
												);
												setSortMenuVisible(false);
											}}
											title={`Order: ${
												sortOrder === "asc" ? "Ascending" : "Descending"
											}`}
										/>
									</Menu>
									<IconButton
										icon="plus"
										mode="contained"
										onPress={handleAddRecord}
										style={styles.iconButtonAdd}
										size={24}
										accessibilityLabel="Add Record"
									/>
								</View>
							</View>
						</>
					}
					onEndReached={() => {
						if (!loading && hasMore) {
							fetchRecords(page + 1);
							setPage((prev) => prev + 1);
						}
					}}
					onEndReachedThreshold={0}
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
						role={role}
						onRecordSaved={() => {
							handleRefresh();
							setUploadModalVisible(false);
						}}
						record={selectedRecord}
						mode={modalMode}
					/>
				</Portal>

				{/* Inline Filter Modal */}
				<Portal>
					{filterModalVisible && (
						<View style={styles.modalBackdrop}>
							<Card style={styles.filterModalCard}>
								<Card.Title title="Filter by Date Range" />
								<Card.Content>
									<CustomDatePicker
										label="From"
										value={fromDate}
										onChange={setFromDate}
										parent="filterModal"
									/>
									<CustomDatePicker
										label="To"
										value={toDate}
										onChange={setToDate}
										parent="filterModal"
									/>
								</Card.Content>
								<Card.Actions style={{ justifyContent: "flex-end" }}>
									<Button
										onPress={() => {
											setFilterModalVisible(false);
										}}
									>
										Cancel
									</Button>
									<Button
										mode="contained"
										onPress={() => {
											applyFiltersAndSorting();
											setFilterModalVisible(false);
										}}
									>
										Apply
									</Button>
								</Card.Actions>
							</Card>
						</View>
					)}
				</Portal>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 15,
		padding: 5,
		borderRadius: 10,
	},
	cardContent: {
		gap: 6,
		marginTop: 4,
		paddingBottom: 2,
	},
	cardContentRow: {
		marginBottom: 1,
	},
	cardContentRowSecondary: {
		marginBottom: 0,
		color: "#666",
	},
	center: {
		alignItems: "center",
		marginTop: 40,
	},
	searchActionsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 16,
		paddingTop: 8,
	},
	searchBarWrapper: {
		flex: 1,
	},
	searchBar: {
		// backgroundColor: "white",
		height: 40,
		borderRadius: 8,
	},
	searchBarInputStyle: {
		fontSize: 14,
		paddingVertical: 0,
		marginVertical: 0,
		textAlignVertical: "center",
		minHeight: 0,
	},
	actionButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		marginLeft: 6,
	},
	iconButton: {
		marginHorizontal: 0,
		marginVertical: 0,
	},
	iconButtonAdd: {
		marginHorizontal: 0,
		marginVertical: 0,
		backgroundColor: "#2e7d32",
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	filterModalCard: {
		width: "100%",
		maxWidth: 360,
		borderRadius: 10,
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
