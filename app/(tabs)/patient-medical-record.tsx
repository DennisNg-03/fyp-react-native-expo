import CustomDatePicker from "@/components/CustomDatePicker";
import { formatLabel } from "@/components/RecordTypeMenu";
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
	FAB,
	Portal,
	Searchbar,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientMedicalRecordScreen() {
	const theme = useTheme();
	const { session, role } = useAuth();
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
		d.setDate(d.getDate() - 7); // set 7 days earlier
		return d;
	});
	const [toDate, setToDate] = useState<Date | undefined>(new Date());

	const RECORDS_PER_PAGE = 4;

	useEffect(() => {
		if (!session?.user.id) return;

		fetchRecords(1);
		handleSearch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user.id]);

	useEffect(() => {
		records.map((record) => {
			console.log("Use Effect Record Title:", record.title);
			console.log("Use Effect Record SignedUrl:", record.signed_urls);
		});
	}, [records]);

	// This useEffect is crucial for preventing refresh to manipulate the search result in Flatlist due to modiying "records" directly
	useEffect(() => {
		if (!searchQuery) {
			setFilteredRecords(records);
		} else {
			setFilteredRecords(
				records.filter(
					(record) =>
						record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						record.record_type
							?.toLowerCase()
							.includes(searchQuery.toLowerCase())
				)
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [records]);

	const fetchRecords = async (pageNumber = 1, ignoreHasMore = false) => {
		if (!session?.user.id || (!hasMore && !ignoreHasMore)) return;
		try {
			setLoading(true);
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

			const formattedRecords = recordsWithUrls.map((record) => ({
				...record,
				record_type: formatLabel(record.record_type ?? ""),
			}));

			setHasMore(more);

			if (pageNumber === 1) {
				setRecords(formattedRecords); // Refresh and First page
				setPage(1); // reset page counter
			} else {
				setRecords((prev) => [...prev, ...formattedRecords]); // Append the records for infinite scroll
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = () => {
		setPage(1);
		setHasMore(true);
		fetchRecords(1);
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

			console.log("Filtering by date range...");
			console.log("From Date (raw):", fromDate);
			console.log("To Date (raw):", toDate);
			console.log(
				"From Date (stripped):",
				fromDate ? stripTime(fromDate) : undefined
			);
			console.log(
				"To Date (stripped):",
				toDate ? stripTime(toDate) : undefined
			);

			filtered = filtered.filter((record) => {
				if (!record.record_date) return false;

				const recordDate = stripTime(new Date(record.record_date));
				console.log("----");
				console.log("Record raw:", record.record_date);
				console.log("Record stripped:", recordDate);

				if (fromDate && recordDate < stripTime(fromDate)) return false;
				if (toDate && recordDate > stripTime(toDate)) return false;

				return true;
			});
		}
		setFilteredRecords(filtered);
	};

	const handleUploadRecord = async () => {
		setSelectedRecord(null);
		setModalMode("new");
		setUploadModalVisible(true);
	};

	const handleCardPress = (record: MedicalRecord) => {
		setSelectedRecord(record);
		setModalMode("edit");
		setUploadModalVisible(true);
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
					subtitle={
						item.record_date
							? `${item.record_date}${
									item.record_type ? " • " + item.record_type : ""
							  }`
							: item.record_type ?? "No date"
					}
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
					// initialNumToRender={4}
					maxToRenderPerBatch={4}
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
								onPress={handleUploadRecord}
								style={styles.uploadButton}
							>
								Upload
							</Button>
							<FAB
								// style={{ position: 'absolute', right: 16, bottom: 16 }}
								icon="plus"
								mode="elevated"
								label="Add Record"
								onPress={handleUploadRecord}
								style={styles.uploadButton}
							/>
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

				{/* Popup Modal for Uploading Medical Records */}
				<Portal>
					<UploadRecordModal
						visible={uploadModalVisible}
						onClose={() => setUploadModalVisible(false)}
						session={session}
						// onRecordSaved={(record) => setRecords((prev) => [record, ...prev])}
						onRecordSaved={(record) => {
							if (modalMode === "edit") {
								setRecords((prev) =>
									prev.map((r) => (r.id === record.id ? record : r))
								);
							} else {
								setRecords((prev) => [record, ...prev]);
							}
							setUploadModalVisible(false);
						}}
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
	},
	center: {
		alignItems: "center",
		marginTop: 40,
	},
	searchForm: {
		gap: 20,
		marginBottom: 20,
	},
	// searchRow: {
	// 	flexDirection: "row",
	// 	alignItems: "center",
	// 	gap: 10,
	// 	marginBottom: 10,
	// },
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
