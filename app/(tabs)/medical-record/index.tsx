import CustomDatePicker from "@/components/CustomDatePicker";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord } from "@/types/medicalRecord";
import { formatKL } from "@/utils/dateHelpers";
import { formatLabel } from "@/utils/labelHelpers";
import { router } from "expo-router";
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

export default function MedicalRecordScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
	const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
		null
	);

	const [modalMode, setModalMode] = useState<"new" | "edit">("new");
	const [initialLoading, setInitialLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [fetching, setFetching] = useState(false);
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
	const [sortField, setSortField] = useState<
		"record_date" | "title" | "healthcare_provider_name"
	>("record_date");
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
		console.log("fromDate:", fromDate);
		console.log("toDate:", toDate);
		console.log("searchQuery:", searchQuery);
		console.log("sortField:", sortField);
		console.log("sortOrder:", sortOrder);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery, fromDate, toDate, sortField, sortOrder]);

	const fetchRecords = async (pageNumber = 1, ignoreHasMore = false) => {
		if (!userId || (!hasMore && !ignoreHasMore)) return;
		try {
			setFetching(true);
			// setRefreshing(true);
			const res = await fetch(
				`https://zxyyegizcgbhctjjoido.functions.supabase.co/getMedicalRecord?uid=${session.user.id}&role=${role}&page=${pageNumber}&limit=${RECORDS_PER_PAGE}&sortField=${sortField}&sortOrder=${sortOrder}`,
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
			// setRefreshing(false);
			if (ignoreHasMore) {
				setFetching(false);
			}
		}
	};

	const applyFiltersAndSorting = () => {
		try {
			// setFetching(true);
			let filtered = records;

			if (fromDate && toDate && fromDate > toDate) {
				Alert.alert(
					"Invalid date range",
					"The start date cannot be later than the end date."
				);
				return;
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
			const filteredCopy = [...filtered];

			filteredCopy.sort((a, b) => {
				let aValue: any;
				let bValue: any;

				switch (sortField) {
					case "record_date":
						aValue = a.record_date ? new Date(a.record_date).getTime() : 0;
						bValue = b.record_date ? new Date(b.record_date).getTime() : 0;
						break;
					case "title":
						aValue = a.title.toLowerCase();
						bValue = b.title.toLowerCase();
						break;
					case "healthcare_provider_name":
						aValue = (a.healthcare_provider_name || "").toLowerCase();
						bValue = (b.healthcare_provider_name || "").toLowerCase();
						break;
				}

				if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
				if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
				return 0;
			});

			setFilteredRecords(filteredCopy);
		} finally {
			// setFetching(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		setHasMore(true);
		await fetchRecords(1, true); // force refresh, replace data
		applyFiltersAndSorting();
		setFetching(false);
		setRefreshing(false);
	};

	const handleAddRecord = async () => {
		setSelectedRecord(null);
		setModalMode("new");
		setUploadModalVisible(true);
	};

	const handleCardPress = (record: MedicalRecord) => {
		router.push({
			pathname: "/(tabs)/medical-record/record-details",
			params: { record: JSON.stringify(record) },
		});
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
		const diagnosisStr = Array.isArray(item.diagnosis)
			? item.diagnosis.length
				? item.diagnosis.join("\n")
				: "Not provided"
			: item.diagnosis || "Not provided";
		const proceduresStr = Array.isArray(item.procedures)
			? item.procedures.length
				? item.procedures.join("\n")
				: "Not provided"
			: item.procedures || "Not provided";
		const medicationsStr = Array.isArray(item.medications)
			? item.medications.length
				? item.medications.join("\n")
				: "Not provided"
			: item.medications || "Not provided";
		const notesStr = Array.isArray(item.notes)
			? item.notes.length
				? item.notes.join("\n")
				: "Not provided"
			: item.notes || "Not provided";

		return (
			<Card
				key={item.id}
				style={styles.card}
				onPress={() => handleCardPress(item)}
				elevation={1}
			>
				<Card.Title
					title={item.title}
					titleStyle={styles.cardTitle}
					subtitle={
						item.record_date
							? `${item.record_date}${
									formatLabel(item.record_type)
										? " • " + formatLabel(item.record_type)
										: ""
							  }`
							: formatLabel(item.record_type) ?? "No date"
					}
					subtitleStyle={styles.cardSubtitle}
					right={() =>
						session?.user.id === item.created_by && (
							<Menu
								contentStyle={{
									borderRadius: 8,
									width: 120,
									backgroundColor: "white",
								}}
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
						)
					}
				/>

				<Card.Content style={styles.cardContent}>
					<Text variant="labelLarge" style={styles.cardInfoRow}>
						Patient:{" "}
						<Text variant="bodyMedium" style={styles.cardInfoValue}>
							{item.patient_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="labelLarge" style={styles.cardInfoRow}>
						Doctor:{" "}
						<Text variant="bodyMedium" style={styles.cardInfoValue}>
							{item.doctor_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="labelLarge" style={styles.cardInfoRow}>
						Provider:{" "}
						<Text variant="bodyMedium" style={styles.cardInfoValue}>
							{item.healthcare_provider_name || "Not provided"}
						</Text>
					</Text>
					<Text variant="labelLarge" style={styles.cardSectionLabel}>
						Diagnosis
					</Text>
					<Text variant="bodyMedium" style={styles.cardSectionBlock}>
						{diagnosisStr}
					</Text>
					<Text variant="labelLarge" style={styles.cardSectionLabel}>
						Procedures
					</Text>
					<Text variant="bodyMedium" style={styles.cardSectionBlock}>
						{proceduresStr}
					</Text>
					<Text variant="labelLarge" style={styles.cardSectionLabel}>
						Medications
					</Text>
					<Text variant="bodyMedium" style={styles.cardSectionBlock}>
						{medicationsStr}
					</Text>
					<Text variant="labelLarge" style={styles.cardContentRowSecondary}>
						Date of Admission:{" "}
						<Text variant="bodyMedium">
							{item.date_of_admission
								? formatKL(item.date_of_admission, "yyyy-MM-dd")
								: "Not provided"}
						</Text>
					</Text>
					<Text variant="labelLarge" style={styles.cardContentRowSecondary}>
						Date of Discharge:{" "}
						<Text variant="bodyMedium">
							{item.date_of_discharge
								? formatKL(item.date_of_discharge, "yyyy-MM-dd")
								: "Not provided"}
						</Text>
					</Text>
					<Text variant="labelLarge" style={styles.cardSectionLabel}>
						Clinical Notes
					</Text>
					<Text variant="bodyMedium" style={styles.cardSectionBlock}>
						{notesStr}
					</Text>
					<View style={styles.cardFooterColumn}>
						<Text variant="bodySmall" style={styles.cardFooterRight}>
							Uploaded by:{" "}
							{session?.user.id === item.created_by
								? "You"
								: item.created_by_full_name || "Not provided"}
						</Text>
						<Text variant="bodySmall" style={styles.cardFooterRight}>
							Last updated:{" "}
							{item.updated_at
								? new Date(item.updated_at).toLocaleDateString()
								: "Not provided"}
						</Text>
					</View>
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
					refreshing={refreshing}
					onRefresh={handleRefresh}
					renderItem={renderRecord}
					maxToRenderPerBatch={6}
					ListHeaderComponent={
						<>
							<Text
								style={[
									styles.pageHeader,
									{
										marginTop: 8,
									},
								]}
							>
								Patient Records
							</Text>
							<View style={styles.searchActionsContainer}>
								<Searchbar
									placeholder="Search records..."
									value={searchQuery}
									mode="bar"
									onChangeText={setSearchQuery}
									style={[
										styles.searchBar,
										{
											flex: 1,
											height: 40,
											borderRadius: 8,
											backgroundColor: theme.colors.surfaceVariant,
										},
									]}
									inputStyle={{
										...styles.searchBarInputStyle,
										textAlignVertical: "center",
									}}
									maxLength={50}
									autoComplete="off"
									autoCorrect={false}
									spellCheck={false}
								/>
								<View style={styles.actionButtons}>
									<IconButton
										icon="filter-menu-outline"
										mode="contained-tonal"
										onPress={() => setFilterModalVisible(true)}
										style={styles.iconButton}
										size={24}
										accessibilityLabel="Filter"
									/>
									<Menu
										visible={sortMenuVisible}
										contentStyle={{
											borderRadius: 8,
											width: 200,
											backgroundColor: "white",
										}}
										onDismiss={() => setSortMenuVisible(false)}
										anchor={
											<IconButton
												icon={
													sortOrder === "asc"
														? "sort-alphabetical-ascending"
														: "sort-alphabetical-descending"
												}
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
												setSortField("record_date");
												setSortMenuVisible(false);
											}}
											title="Date"
											titleStyle={{
												color:
													sortField === "record_date"
														? theme.colors.primary
														: undefined,
												fontWeight: sortField === "record_date" ? "600" : "500",
											}}
										/>
										<Menu.Item
											onPress={() => {
												setSortField("title");
												setSortMenuVisible(false);
											}}
											title="Record Title"
											titleStyle={{
												color:
													sortField === "title"
														? theme.colors.primary
														: undefined,
												fontWeight: sortField === "title" ? "600" : "500",
											}}
										/>
										<Menu.Item
											onPress={() => {
												setSortField("healthcare_provider_name");
												setSortMenuVisible(false);
											}}
											title="Healthcare Provider"
											titleStyle={{
												color:
													sortField === "healthcare_provider_name"
														? theme.colors.primary
														: undefined,
												fontWeight:
													sortField === "healthcare_provider_name"
														? "600"
														: "500",
											}}
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
											titleStyle={{ fontWeight: "500" }}
										/>
									</Menu>
									<IconButton
										icon="plus"
										mode="contained"
										onPress={handleAddRecord}
										style={[
											styles.iconButtonAdd,
											{ backgroundColor: theme.colors.primary },
										]}
										iconColor={theme.colors.surfaceVariant}
										size={24}
										accessibilityLabel="Add Record"
									/>
								</View>
							</View>
						</>
					}
					onEndReached={() => {
						if (!refreshing && hasMore) {
							fetchRecords(page + 1);
							setPage((prev) => prev + 1);
						}
					}}
					onEndReachedThreshold={0}
					ListEmptyComponent={
						!refreshing && !fetching ? (
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

				{/* Popup Modal for Uprefreshing Medical Records */}
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

				{/* Date Filter Modal */}
				<Portal>
					{filterModalVisible && (
						<View style={styles.modalBackdrop}>
							<Card mode="elevated" style={styles.filterModalCard}>
								<Card.Title
									title="Filter by Date Range"
									titleStyle={styles.modalHeader}
								/>
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
	pageHeader: {
		fontWeight: "700",
		fontSize: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
	card: {
		marginBottom: 15,
		padding: 5,
		borderRadius: 10,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
	},
	cardTitle: {
		fontWeight: "700",
		fontSize: 17,
		color: "#1a1a1a",
	},
	cardSubtitle: {
		fontSize: 14,
		color: "#444",
		fontWeight: "500",
	},
	cardContent: {
		gap: 8,
		marginVertical: 10,
		paddingBottom: 6,
	},
	cardInfoRow: {
		marginBottom: 0,
		// fontSize: 14,
		// color: "#222",
	},
	cardInfoValue: {
		// fontWeight: "600",
		// color: "#000",
		// fontSize: 14,
	},
	cardSectionLabel: {
		marginTop: 8,
		fontWeight: "600",
		// fontSize: 15,
		color: "#263238",
		letterSpacing: 0.1,
	},
	cardSectionBlock: {
		fontSize: 14,
		color: "#111",
		fontWeight: "400",
		marginBottom: 2,
		lineHeight: 20,
		backgroundColor: "#f7f7f7",
		borderRadius: 6,
		paddingVertical: 6,
		paddingHorizontal: 10,
	},
	cardContentRowSecondary: {
		marginBottom: 0,
		color: "#888",
		fontSize: 13,
	},
	cardFooterColumn: {
		flexDirection: "column",
		alignItems: "flex-end", // right-align all text
		marginTop: 10,
	},
	cardFooterRight: {
		color: "#999",
		fontSize: 12,
		fontWeight: "400",
		textAlign: "right",
		marginBottom: 2, // optional spacing between lines
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
	iconButtonAdd: {},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	modalHeader: {
		fontWeight: "500",
		fontSize: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0)",
		marginTop: 10,
	},
	filterModalCard: {
		width: "100%",
		borderRadius: 10,
		backgroundColor: "white",
	},
	refreshingOverlay: {
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
