import { ActivityIndicator } from "@/components/ActivityIndicator";
import { formatLabel } from "@/components/RecordTypeMenu";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord, SelectedFile } from "@/types/medicalRecord";
import { useEffect, useState } from "react";
import {
	FlatList,
	Image,
	Keyboard,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {
	Button,
	Card,
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
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [imageLoading, setImageLoading] = useState(true);
	const RECORDS_PER_PAGE = 4;

	useEffect(() => {
		if (!session?.user.id) return;

		fetchRecords(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user.id]);

	// useEffect(() => {
	// 	records.map((record) => {
	// 		console.log("Use Effect Record Title:", record.title);
	// 		console.log("Use Effect Record SignedUrl:", record.signed_urls);
	// 	});
	// }, [records]);

	// This useEffect is crucial for preventing excessive re-rendering issue in Flatlist due to modiying "records" directly
	useEffect(() => {
		if (!searchQuery) {
			setFilteredRecords(records);
		} else {
			setFilteredRecords(
				records.filter(
					(record) =>
						record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						record.record_type?.toLowerCase().includes(searchQuery.toLowerCase())
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
		// if (!searchQuery) {
		// 	fetchRecords(1, true); // // If query is empty, show all records, and ignore hasMore when refreshing
		// 	return;
		// }
		// const filtered = records.filter(
		// 	(record) =>
		// 		record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		// 		record.record_type?.toLowerCase().includes(searchQuery.toLowerCase())
		// );
		// console.log(
		// 	"Filtered record titles:",
		// 	filtered.map((r) => r.title)
		// );
		// setFilteredRecords(filtered);
		if (!searchQuery) {
			setFilteredRecords(records);
		} else {
			setFilteredRecords(
				records.filter(
					(record) =>
						record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						record.record_type?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			);
		}
	};

	const handleUploadRecord = async () => {
		setUploadModalVisible(true);
	};

	// if (loading) {
	// 	return <ActivityIndicator />;
	// }

	const renderRecord = ({ item }: { item: MedicalRecord }) => {
		const imageIndex = item.file_paths?.findIndex(
			(f): f is SelectedFile =>
				typeof f !== "string" && f.type.includes("image")
		);

		const imageUrl =
			imageIndex !== undefined && imageIndex >= 0
				? item.signed_urls?.[imageIndex] ?? ""
				: "";
		console.log("Image URL:", imageUrl);

		return (
			<Card
				key={item.id}
				style={styles.card}
				onPress={() => console.log("Open record:", item.id)}
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
					{imageUrl ? (
					<View style={{ width: "100%", height: 150, marginBottom: 10 }}>
						{imageLoading && (
							<ActivityIndicator
								size="small"
								loadingMsg=""
								overlay={false}
							/>
						)}
						<Image
							source={{ uri: imageUrl }}
							style={{
								width: "100%",
								height: "100%",
								borderRadius: 8,
								position: "absolute", // sits on top
							}}
							resizeMode="cover"
							onLoadStart={() => setImageLoading(true)}
							onLoadEnd={() => setImageLoading(false)}
							onError={() => setImageLoading(false)}
						/>
					</View>
				) : null}

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
					keyExtractor={(item) => item.id}
					refreshing={loading}
					onRefresh={handleRefresh}
					renderItem={renderRecord}
					ListHeaderComponent={
						<>
							<Card style={styles.searchForm} elevation={1}>
								<Card.Content>
									<Searchbar
										placeholder="Search records..."
										value={searchQuery}
										onChangeText={setSearchQuery}
										style={{
											marginBottom: 10,
											backgroundColor: theme.colors.onPrimary,
											color: theme.colors.primary,
											borderRadius: 8,
											borderColor: theme.colors.primary,
										}}
										elevation={2}
										autoComplete="off"
										autoCorrect={false}
										spellCheck={false}
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
								icon="upload"
								onPress={handleUploadRecord}
								style={styles.uploadButton}
							>
								Upload
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

				{/* Popup Modal for Uploading Medical Records */}
				<Portal>
					<UploadRecordModal
						visible={uploadModalVisible}
						onClose={() => setUploadModalVisible(false)}
						session={session}
						onRecordSaved={(record) => setRecords((prev) => [record, ...prev])}
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
	searchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	searchButton: {
		marginBottom: 10,
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
