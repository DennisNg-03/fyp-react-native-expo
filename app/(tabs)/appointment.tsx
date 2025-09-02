import { ActivityIndicator } from "@/components/ActivityIndicator";
import CustomDatePicker from "@/components/CustomDatePicker";
import { FilePreview } from "@/components/FilePreview";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
	Slot,
	SupportingDocument,
	SupportingDocumentToUpload,
	SupportingDocumentType,
} from "@/types/appointment";
import { Doctor, Provider } from "@/types/user";
import { formatKL, formatUTC } from "@/utils/dateHelpers";
import { blobToBase64 } from "@/utils/fileHelpers";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	FlatList,
	Keyboard,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {
	Button,
	Card,
	IconButton,
	Searchbar,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppointmentScreen() {
	// const userId = session?.user.id!;
	const tzDisplay = "Asia/Kuala_Lumpur";
	const theme = useTheme();
	const { session, role } = useAuth();
	const userId = session?.user.id;
	// Providers -> Doctors -> Date -> Slots
	const [providers, setProviders] = useState<Provider[]>([]);
	const [providerQuery, setProviderQuery] = useState("");
	const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
		null
	);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [doctorQuery, setDoctorQuery] = useState("");
	const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

	const [upcoming, setUpcoming] = useState<any[]>([]);
	const [loadingProviders, setLoadingProviders] = useState(false);
	const [showProvidersLoading, setShowProvidersLoading] = useState(false);
	const [loadingDoctors, setLoadingDoctors] = useState(false);
	const [showDoctorsLoading, setShowDoctorsLoading] = useState(false);

	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [showSlotsLoading, setShowSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

	const [reason, setReason] = useState("");
	const [supportingDocuments, setSupportingDocuments] = useState<
		SupportingDocument[]
	>([]);
	const [booking, setBooking] = useState(false);

	const MAX_FILE_SIZE = 5 * 1024 * 1024;

	// Providers load
	const loadProviders = useCallback(async () => {
		setLoadingProviders(true);
		setShowProvidersLoading(true);

		// Always hide spinner after certain amount of time for lazy loading
		setTimeout(() => {
			setShowProvidersLoading(false);
		}, 200);

		try {
			const { data, error } = await supabase
				.from("healthcare_providers")
				.select("id, name, provider_type")
				.order("name");
			if (error) throw error;
			setProviders(data ?? []);
			if (!selectedProvider && data?.length)
				setSelectedProvider(data[0] as Provider);
		} catch (e) {
			console.warn(e);
		} finally {
			setLoadingProviders(false);
		}
	}, [selectedProvider]);

	// Doctors at selected provider
	const loadDoctors = useCallback(
		async (providerId?: string) => {
			setLoadingDoctors(true);
			setShowDoctorsLoading(true);

			// Always hide spinner after certain amount of time for lazy loading
			setTimeout(() => {
				setShowDoctorsLoading(false);
			}, 200);

			try {
				const { data, error } = await (providerId
					? supabase
							.from("doctors")
							.select(
								`id, speciality, slot_minutes, timezone, profiles(full_name, email, phone_number), provider_id`
							)
							.eq("provider_id", providerId)
							.order("profiles (full_name)")
					: supabase
							.from("doctors")
							.select(
								`id, speciality, slot_minutes, timezone, profiles(full_name, email, phone_number), provider_id`
							)
							.order("profiles (full_name)"));

				console.log("Data:", data);
				if (error) {
					console.error("Error fetching doctors:", error);
					return;
				}

				const mappedDoctors = (data ?? []).map((d: any) => ({
					...d,
					profiles: d.profiles ?? {},
				}));

				console.log("Mapped doctors:", mappedDoctors);

				setDoctors(mappedDoctors);
				if (!selectedDoctor && mappedDoctors.length)
					setSelectedDoctor(mappedDoctors[0]);
			} catch (e) {
				console.warn(e);
			} finally {
				setLoadingDoctors(false);
			}
		},
		[selectedDoctor]
	);

	// Load slots via RPC
	const loadSlots = useCallback(async () => {
		if (!selectedDoctor || !selectedDate) {
			setSlots([]);
			return;
		}

		try {
			setLoadingSlots(true);
			setShowSlotsLoading(true);

			setTimeout(() => {
				setShowSlotsLoading(false);
			}, 200);

			const dateISO = formatKL(selectedDate, "yyyy-MM-dd");
			const { data, error } = await supabase.rpc("get_available_slots", {
				p_doctor_id: selectedDoctor.id,
				p_date: dateISO,
				p_slot_mins: selectedDoctor.slot_minutes ?? 15,
			});
			console.log("RPC Get available slots data:", data);
			if (error) throw error;
			setSlots((data as Slot[]) ?? []);
			setSelectedSlot(null);
		} catch (e: any) {
			console.warn(e);
			setSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [selectedDoctor, selectedDate]);

	// Upcoming appointments for patient
	const loadUpcoming = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("appointments")
				.select(
					"id, starts_at, ends_at, status, reason, doctors:doctor_id(profiles(full_name))"
				)
				.eq("patient_id", userId)
				.gte("starts_at", formatUTC(new Date()))
				.order("starts_at", { ascending: true })
				.limit(20);
			if (!error) setUpcoming(data ?? []);
		} catch (e) {
			console.warn(e);
		}
	}, [userId]);

	useEffect(() => {
		loadProviders();
	}, [loadProviders]);
	useEffect(() => {
		if (selectedProvider) loadDoctors(selectedProvider.id);
		else loadDoctors();
	}, [selectedProvider, loadDoctors]);
	useEffect(() => {
		loadSlots();
	}, [selectedDoctor, selectedDate, loadSlots]);
	useEffect(() => {
		loadUpcoming();
	}, [loadUpcoming]);

	useEffect(() => {
		console.log("Selected Slot:", selectedSlot);
	}, [selectedSlot]);

	const filteredProviders = useMemo(() => {
		const q = providerQuery.trim().toLowerCase();
		if (!q) return providers;
		return providers.filter(
			(p) =>
				(p.name ?? "").toLowerCase().includes(q) ||
				(p.provider_type ?? "").toLowerCase().includes(q)
		);
	}, [providers, providerQuery]);

	const filteredDoctors = useMemo(() => {
		const q = doctorQuery.trim().toLowerCase();
		if (!q) return doctors;
		return doctors.filter((d) => {
			const name = `Dr ${d.profiles?.full_name ?? ""}`.toLowerCase();
			const speciality = (d.speciality ?? "").toLowerCase();
			return name.includes(q) || speciality.includes(q);
		});
	}, [doctors, doctorQuery]);

	const handleAttachFile = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: ["application/pdf", "text/plain"], // Allowed document types
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
				alert(
					`File too large. Maximum allowed size per file is {MAX_FILE_SIZE / (1024 *1024)} MB.`
				);
				return;
			}
			setSupportingDocuments((prev) => [
				...prev,
				...result.assets.map((asset) => ({
					uri: asset.uri,
					name: asset.name,
					type: "others" as SupportingDocumentType,
				})),
			]);
		}
	};

	const handleBooking = async () => {
		console.log("Selected doctor:", selectedDoctor);
		console.log("Selected slot:", selectedSlot);
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		if (!selectedDoctor || !selectedSlot) {
			console.log("Doctor or slot is not selected!");
			return;
		}

		try {
			setBooking(true);
			// const formData = new FormData();
			// formData.append("doctor_id", selectedDoctor.id);
			// formData.append("patient_id", userId);
			// formData.append("starts_at", selectedSlot.slot_start);
			// formData.append("ends_at", selectedSlot.slot_end);
			// formData.append("reason", reason);

			// supportingDocuments.forEach((file, idx) => {
			// 	formData.append(
			// 		`supporting_documents[${idx}]`,
			// 		new Blob([file.arrayBuffer], { type: file.type }),
			// 		file.name
			// 	);
			// );

			// const res = await fetch("https://.../bookAppointment", {
			// 	method: "POST",
			// 	headers: {
			// 		Authorization: `Bearer ${session?.access_token}`,
			// 	},
			// 	body: formData,
			// });

			const supportingDocumentsToUpload: SupportingDocumentToUpload[] =
				await Promise.all(
					supportingDocuments.map(async (file) => {
						const response = await fetch(file.uri);
						const blob = await response.blob();
						const base64 = await blobToBase64(blob);
						return {
							name: file.name,
							blobBase64: base64,
							type: blob.type,
							document_type: file.type,
						};
					})
				);

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/bookAppointment",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						doctor_id: selectedDoctor.id,
						patient_id: userId,
						starts_at: selectedSlot.slot_start,
						ends_at: selectedSlot.slot_end,
						reason: reason,
						supporting_documents: supportingDocumentsToUpload, // Contains array buffer
					}),
				}
			);

			if (!res.ok) {
				const errorBody = await res.text();
				console.error(
					"Book Appointment Edge function failed:",
					res.status,
					res.statusText,
					errorBody
				);
				return;
			}

			const { appointment_id } = await res.json();
			console.log("Returned Appointment ID:", appointment_id);

			Alert.alert("Success", "Appointment made successfully!");

			setReason("");
			setSelectedSlot(null);
			loadSlots();
			loadUpcoming();
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setBooking(false);
		}
		if (!selectedDoctor || !selectedSlot) {
			console.log("Doctor or slot is not selected!");
			return;
		}
	};

	const renderSlot = ({ item }: { item: Slot }) => {
		const startLocal = formatKL(item.slot_start, "HH:mm");
		const endLocal = formatKL(item.slot_end, "HH:mm");
		const disabled = item.is_blocked;
		const selected = selectedSlot?.slot_start === item.slot_start;
		return (
			<TouchableOpacity
				disabled={disabled}
				onPress={() => setSelectedSlot(item)}
				style={{
					flexBasis: "32%",
					flexGrow: 0,
					flexShrink: 0,
					marginVertical: 4,
					opacity: disabled ? 0.4 : 1,
					borderRadius: 12,
					borderWidth: selected ? 2 : 1,
					borderColor: selected ? theme.colors.primary : "#ccc",
					paddingVertical: 8,
					paddingHorizontal: 12,
					alignItems: "center",
					backgroundColor: selected ? "#eee" : "white",
				}}
			>
				<Text style={{ fontSize: 12 }}>{`${startLocal} – ${endLocal}`}</Text>
			</TouchableOpacity>
		);
	};

	return (
			<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<SafeAreaView
					style={{ flex: 1, backgroundColor: theme.colors.background }}
				>
					<FlatList
						style={{ flex: 1 }}
						ListHeaderComponent={
							<>
								<Card style={{ margin: 12, borderRadius: 12 }}>
									<Card.Content>
										<Text variant="titleMedium" style={{ marginBottom: 8 }}>
											Book an appointment
										</Text>

										<Searchbar
											placeholder="Search provider..."
											value={providerQuery}
											onChangeText={setProviderQuery}
											style={{ marginBottom: 8 }}
										/>
										{showProvidersLoading ? (
											// <ActivityIndicator />
											<View style={{ height: 94 }}></View>
										) : (
											<FlatList
												horizontal
												data={filteredProviders}
												keyExtractor={(p) => p.id}
												style={{ marginBottom: 12, paddingVertical: 10 }}
												extraData={{ selectedProvider, selectedDate }}
												renderItem={({ item }) => {
													const active = selectedProvider?.id === item.id;
													return (
														<TouchableOpacity
															onPress={() => setSelectedProvider(item)}
															style={{
																marginRight: 8,
																paddingHorizontal: 12,
																paddingVertical: 10,
																borderRadius: 10,
																borderWidth: active ? 2 : 1,
																borderColor: active ? "#6200ee" : "#ddd",
																backgroundColor: active ? "#f2e7ff" : "#fff",
															}}
														>
															<Text style={{ fontWeight: "600" }}>
																{item.name}
															</Text>
															<Text>{item.provider_type}</Text>
														</TouchableOpacity>
													);
												}}
											/>
										)}

										{/* Doctor searchbar */}
										<View style={{ marginVertical: 16 }}>
											<Searchbar
												placeholder="Search doctor..."
												value={doctorQuery}
												onChangeText={setDoctorQuery}
												style={{ marginBottom: 8 }}
											/>
											{showDoctorsLoading ? (
												// <ActivityIndicator />
												<View style={{ height: 94 }}></View>
											) : (
												<FlatList
													horizontal
													data={filteredDoctors}
													keyExtractor={(d) => d.id}
													style={{ marginBottom: 12, paddingVertical: 10 }}
													contentContainerStyle={{ width: "100%" }}
													renderItem={({ item }) => {
														const active = selectedDoctor?.id === item.id;
														return (
															<TouchableOpacity
																onPress={() => setSelectedDoctor(item)}
																style={{
																	marginRight: 8,
																	paddingHorizontal: 12,
																	paddingVertical: 10,
																	borderRadius: 10,
																	borderWidth: active ? 2 : 1,
																	borderColor: active ? "#6200ee" : "#ddd",
																	backgroundColor: active ? "#f2e7ff" : "#fff",
																}}
															>
																<Text style={{ fontWeight: "600" }}>
																	Dr {item.profiles?.full_name}
																</Text>
																{item.speciality ? (
																	<Text>{item.speciality}</Text>
																) : null}
															</TouchableOpacity>
														);
													}}
													ListEmptyComponent={
														<View
															style={{
																flex: 1,
																alignItems: "center",
																justifyContent: "center",
																marginVertical: 10,
															}}
														>
															<Text style={{ textAlign: "center" }}>
																No doctors found from this healthcare provider.
															</Text>
														</View>
													}
												/>
											)}
										</View>

										<CustomDatePicker
											label="Choose date"
											value={selectedDate}
											onChange={setSelectedDate}
											parent="appointments"
										/>

										<Text
											variant="titleSmall"
											style={{ marginTop: 12, marginBottom: 8 }}
										>
											Appointment Slots
										</Text>
										{showSlotsLoading ? (
											<ActivityIndicator
												loadingMsg=""
												size="small"
												overlay={false}
											/>
										) : (
											<FlatList
												data={slots}
												keyExtractor={(s) => s.slot_start}
												numColumns={3}
												renderItem={renderSlot}
												columnWrapperStyle={{ justifyContent: "space-between" }}
												ListEmptyComponent={
													<View
														style={{
															flex: 1,
															alignItems: "center",
															justifyContent: "center",
															marginVertical: 10,
														}}
													>
														<Text style={{ textAlign: "center" }}>
															No slots available. Try a different date or
															doctor.
														</Text>
													</View>
												}
											/>
										)}

										<Searchbar
											placeholder="Reason (optional)"
											value={reason}
											onChangeText={setReason}
											style={{ marginTop: 30 }}
										/>

										{supportingDocuments.length > 0 && (
											<ScrollView
												horizontal
												style={styles.filePreviewHorizontalScroll}
											>
												{supportingDocuments.map((file, index) => (
													<FilePreview
														key={index}
														file={file}
														onRemove={() =>
															setSupportingDocuments(
																(prev: SupportingDocument[]) =>
																	prev.filter((f) => f.uri !== file.uri)
															)
														}
													/>
												))}
											</ScrollView>
										)}

										<IconButton
											mode="outlined"
											icon="file-document-multiple"
											onPress={handleAttachFile}
											style={styles.uploadButton}
										/>

										<Button
											mode="contained"
											onPress={handleBooking}
											disabled={!selectedSlot || booking}
											loading={booking}
											style={{ marginTop: 12 }}
										>
											Request appointment
										</Button>
									</Card.Content>
								</Card>

								<Text
									style={{ marginLeft: 16, marginBottom: 8 }}
									variant="titleMedium"
								>
									Upcoming appointments
								</Text>
							</>
						}
						data={upcoming}
						keyExtractor={(a) => a.id}
						contentContainerStyle={{ paddingBottom: 40 }}
						renderItem={({ item }) => {
							const start = formatKL(item.starts_at, "dd MMM yyyy, HH:mm");
							const docName = item.doctor?.profiles?.full_name ?? "Doctor";
							return (
								<Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
									<Card.Content>
										<Text variant="titleSmall">{docName}</Text>
										<Text>{start}</Text>
										<Text>Status: {item.status}</Text>
									</Card.Content>
								</Card>
							);
						}}
					/>
				</SafeAreaView>
			</TouchableWithoutFeedback>
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
	filePreviewHorizontalScroll: {
		marginBottom: 10,
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
	actionButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 16,
	},
	actionButton: {
		flex: 1,
		marginHorizontal: 4,
	},
	confirmationText: {
		fontSize: 16,
		lineHeight: 22,
	},
	editConfirmationText: {
		fontSize: 16,
		lineHeight: 22,
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
	progressBar: {
		height: 6,
		borderRadius: 3,
		marginTop: 8,
		marginBottom: 16,
	},
});
