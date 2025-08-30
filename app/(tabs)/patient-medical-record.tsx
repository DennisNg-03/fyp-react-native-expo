import { formatLabel } from "@/components/RecordTypeMenu";
import UploadRecordModal from "@/components/UploadRecordModal";
import { useAuth } from "@/providers/AuthProvider";
import { MedicalRecord, SelectedFile } from "@/types/medicalRecord";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, View } from "react-native";
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
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [uploadModalVisible, setUploadModalVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const RECORDS_PER_PAGE = 10;

	useEffect(() => {
		if (!session?.user.id) return;

		// const fetchRecords = async () => {
		// 	try {
		// 		setLoading(true);
		// 		const res = await fetch(
		// 			`https://zxyyegizcgbhctjjoido.functions.supabase.co/getMedicalRecord?uid=${session.user.id}&role=${role}`,
		// 			{
		// 				headers: {
		// 					Authorization: `Bearer ${session.access_token}`,
		// 				},
		// 			}
		// 		);

		// 		if (!res.ok) {
		// 			const text = await res.text();
		// 			console.error("Failed to fetch records", text);
		// 			return;
		// 		}

		// 		const { recordsWithUrls } = (await res.json()) as {
		// 			recordsWithUrls: MedicalRecord[];
		// 		};
		// 		// console.log("Records with Urls:", recordsWithUrls);

		// 		const formattedRecords = (recordsWithUrls ?? []).map((record) => ({
		// 			...record,
		// 			record_type: formatLabel(record.record_type ?? ""),
		// 		}));

		// 		setRecords(formattedRecords);
		// 	} catch (err) {
		// 		console.error(err);
		// 	} finally {
		// 		setLoading(false);
		// 	}
		// };

		fetchRecords(1);
	}, [session?.user.id]);

	useEffect(() => {
		console.log("Use effect Records:", records);
	}, [records]);

	const fetchRecords = async (pageNumber = 1) => {
		if (!session?.user.id || !hasMore) return;
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
				setHasMore(true); // reset infinite scroll
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

	const handleSearch = async () => {
		return;
	};

	const handleUploadRecord = async () => {
		setUploadModalVisible(true);
	};

	// if (loading) {
	// 	return <ActivityIndicator />;
	// }

	const renderRecord = ({ item }: { item: MedicalRecord }) => (
		<Card
			key={item.id}
			style={styles.card}
			onPress={() => console.log("Open record:", item.id)}
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
				{item.file_paths?.some(
					(f) => typeof f !== "string" && f.type.includes("image")
				) && (
					<Image
						source={{
							uri:
								item.signed_urls?.[
									item.file_paths.findIndex(
										(f): f is SelectedFile =>
											typeof f !== "string" && f.type.includes("image")
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
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<FlatList
				contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 16 }}
				data={records}
				keyExtractor={(item) => item.id}
				refreshing={loading}
				onRefresh={handleRefresh}
				renderItem={renderRecord}
				ListHeaderComponent={
					<>
						<View style={styles.searchForm}>
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
							/>
							<Button
								mode="contained"
								onPress={handleSearch}
								style={styles.searchButton}
							>
								Search
							</Button>
						</View>
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
								variant="bodyMedium"
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
