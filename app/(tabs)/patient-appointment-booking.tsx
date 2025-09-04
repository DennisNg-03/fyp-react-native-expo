import { ActivityIndicator } from "@/components/ActivityIndicator";
import CustomDatePicker from "@/components/CustomDatePicker";
import { SlotPicker } from "@/components/SlotPicker";
import { SupportingDocumentPreview } from "@/components/SupportingDocumentPreview";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
	OtherPerson,
	Slot,
	SupportingDocument,
	SupportingDocumentToUpload,
	SupportingDocumentType,
} from "@/types/appointment";
import { Doctor, Provider } from "@/types/user";
import { formatKL } from "@/utils/dateHelpers";
import { blobToBase64 } from "@/utils/fileHelpers";
import * as DocumentPicker from "expo-document-picker";
import { router, useFocusEffect } from "expo-router";
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
	RadioButton,
	Searchbar,
	Text,
	TextInput,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppointmentBookingScreen() {
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
	const [forWhom, setForWhom] = useState<"me" | "someone_else">("me");
	const [otherPerson, setOtherPerson] = useState<OtherPerson>({
		name: "",
		date_of_birth: new Date(2000, 0, 1),
		gender: "",
		relationship: "",
	});
	const [notes, setNotes] = useState("");

	const [supportingDocuments, setSupportingDocuments] = useState<
		SupportingDocument[]
	>([]);
	const [booking, setBooking] = useState(false);
	// const isFirstRender = useRef(true);

	const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

				// if (mappedDoctors.length) {
				// 	setSelectedDoctor(mappedDoctors[0]);
				// } else {
				// 	setSelectedDoctor(null);
				// }
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
		console.log("loadSlots called", { selectedDoctor, selectedDate });

		if (!selectedDoctor || !selectedDate) {
			console.log("No doctor or date selected, skipping slots load");
			setSlots([]);
			return;
		}

		try {
			setLoadingSlots(true);
			setShowSlotsLoading(true);
			console.log(
				"Fetching slots for doctor:",
				selectedDoctor.id,
				"date:",
				selectedDate
			);

			setTimeout(() => {
				setShowSlotsLoading(false);
			}, 200);

			const dateISO = formatKL(selectedDate, "yyyy-MM-dd");
			console.log("Passing dateISO to backend:", dateISO);
			const { data, error } = await supabase.rpc("get_available_slots", {
				p_doctor_id: selectedDoctor.id,
				p_date: dateISO,
				p_slot_mins: selectedDoctor.slot_minutes ?? 15,
			});

			console.log("RPC Get available slots data:", data);
			if (error) console.error("Error retrieving available slots!");

			const now = new Date();

			const validSlots = ((data as Slot[]) ?? []).filter((slot) => {
				const slotStart = new Date(slot.slot_start);
				return slotStart > now;
			});

			console.log("Valid slots:", validSlots);

			setSlots(validSlots ?? []);
			setSelectedSlot(null);
		} catch (e: any) {
			console.warn(e);
			setSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [selectedDoctor, selectedDate]);

	useEffect(() => {
		loadProviders();
	}, [loadProviders]);
	useEffect(() => {
		if (selectedProvider) {
			setDoctors([]); // clear old doctors
			setSelectedDoctor(null); // clear old selection
			setSlots([]); // clear slots too
			loadDoctors(selectedProvider.id);
		} else {
			setDoctors([]);
			setSelectedDoctor(null);
			setSlots([]);
			loadDoctors();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProvider]);
	useEffect(() => {
		console.log("useEffect triggered because dependencies changed:", {
			doctor: selectedDoctor?.id,
			date: selectedDate.toISOString(),
		});

		if (!selectedDoctor || !selectedDate) {
			console.log("Skipping loadSlots — missing doctor/date");
			return;
		}
		loadSlots();
	}, [selectedDoctor, selectedDate, loadSlots]);

	useEffect(() => {
		console.log("Selected Slot:", selectedSlot);
	}, [selectedSlot]);

	// Ensure the form resets every time the screen gains focus:
	useFocusEffect(
		useCallback(() => {
			refreshFormFields();
		}, [])
	);

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
					type: "document" as string,
					document_type: "others" as SupportingDocumentType,
				})),
			]);
		}
	};

	const refreshFormFields = () => {
		setReason("");
		setNotes("");
		setForWhom("me");
		setOtherPerson({
			name: "",
			date_of_birth: new Date(2000, 0, 1),
			gender: "",
			relationship: "",
		});
		setSupportingDocuments([]);
	};

	const handleTypeChange = (index: number, type: SupportingDocumentType) => {
		setSupportingDocuments((prev) =>
			prev.map((doc, i) =>
				i === index ? { ...doc, document_type: type } : doc
			)
		);
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
							document_type: file.document_type,
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
						notes: notes ?? null,
						for_whom: forWhom,
						other_person: otherPerson ?? null,
						supporting_documents: supportingDocumentsToUpload, // Contains base64
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
			refreshFormFields();
			loadSlots();
			// isFirstRender.current = true;
			setSelectedDoctor(null);

			Alert.alert("Success", "Appointment made successfully!", [
				{
					text: "OK",
					onPress: () => router.push("/(tabs)/patient-appointment"),
				},
			]);
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setBooking(false);
		}
	};

	// const renderSlot = ({ item }: { item: Slot }) => {
	// 	if (!selectedDoctor) {
	// 		return (
	// 			<View
	// 				style={{
	// 					flex: 1,
	// 					alignItems: "center",
	// 					justifyContent: "center",
	// 					marginVertical: 10,
	// 				}}
	// 			>
	// 				{/* <Text style={{ textAlign: "center" }}>
	// 					No doctors found from this healthcare provider.
	// 				</Text> */}
	// 			</View>
	// 		);
	// 	}

	// 	const startLocal = formatKL(item.slot_start, "HH:mm");
	// 	const endLocal = formatKL(item.slot_end, "HH:mm");
	// 	const disabled = item.is_blocked;
	// 	const selected = selectedSlot?.slot_start === item.slot_start;
	// 	return (
	// 		<TouchableOpacity
	// 			disabled={disabled}
	// 			onPress={() => setSelectedSlot(item)}
	// 			style={{
	// 				// flexBasis: "32%",
	// 				// flexGrow: 0,
	// 				// flexShrink: 0,
	// 				// width: "100%", // fill the parent container width (slotWidth)
	// 				marginVertical: 4,
	// 				opacity: disabled ? 0.4 : 1,
	// 				borderRadius: 12,
	// 				borderWidth: selected ? 2 : 1,
	// 				borderColor: selected ? theme.colors.primary : "#ccc",
	// 				paddingVertical: 8,
	// 				// paddingHorizontal: 12,
	// 				alignItems: "center",
	// 				backgroundColor: selected ? "#eee" : "white",
	// 			}}
	// 		>
	// 			<Text style={{ fontSize: 12 }}>{`${startLocal} – ${endLocal}`}</Text>
	// 		</TouchableOpacity>
	// 	);
	// };

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: theme.colors.background,
					marginBottom: 10,
				}}
			>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
					keyboardShouldPersistTaps="handled"
				>
					<Card
						style={{ margin: 12, borderRadius: 12 }}
						onStartShouldSetResponder={() => true} // Enable this child respond to scroll, otherwise the Touchable component will affect scrolling
					>
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
									style={{ marginVertical: 10, paddingBottom: 12 }}
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
												<Text style={{ fontWeight: "600" }}>{item.name}</Text>
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
										style={{ marginVertical: 10, paddingBottom: 12 }}
										contentContainerStyle={{ width: "100%" }}
										// scrollEnabled={!selectedProvider}
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
								mode="future"
							/>

							{/* <Text
								variant="titleSmall"
								style={{ marginTop: 12, marginBottom: 8 }}
							>
								Appointment Slots
							</Text>
							{showSlotsLoading ? (
								<ActivityIndicator loadingMsg="" size="small" overlay={false} />
							) : slots.length > 0 ? (
								<View
									style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}
								>
									{slots.map((slot) => (
										<View key={slot.slot_start} style={{ flexBasis: "32.5%" }}>
											{renderSlot({ item: slot })}
										</View>
									))}
								</View>
							) : (
								<View style={{ marginVertical: 10, alignItems: "center" }}>
									<Text>No available slots.</Text>
								</View>
							)} */}

							<Text
								variant="titleSmall"
								style={{ marginTop: 12, marginBottom: 8 }}
							>
								Appointment Slots
							</Text>

							{showSlotsLoading ? (
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

							{selectedSlot && (
								<>
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

									<Text
										variant="titleSmall"
										style={{ marginTop: 16, marginBottom: 8 }}
									>
										Who will be seeing the doctor?
									</Text>

									<RadioButton.Group
										onValueChange={(value) =>
											setForWhom(value as "me" | "someone_else")
										}
										value={forWhom}
									>
										<View style={{ flexDirection: "row", gap: 12 }}>
											{[
												{ label: "Me", value: "me" },
												{ label: "Someone else", value: "someone_else" },
											].map((opt) => {
												const selected = forWhom === opt.value;
												return (
													<TouchableOpacity
														key={opt.value}
														onPress={() =>
															setForWhom(opt.value as "me" | "someone_else")
														}
														style={{
															flexDirection: "row",
															alignItems: "center",
															borderRadius: 8,
															paddingHorizontal: 14,
															paddingBottom: 8,
														}}
													>
														<Text style={{ fontSize: 14, marginRight: 6 }}>
															{opt.label}
														</Text>
														<RadioButton.Android
															value={opt.value}
															status={selected ? "checked" : "unchecked"}
															color={theme.colors.primary}
															rippleColor="transparent"
														/>
													</TouchableOpacity>
												);
											})}
										</View>
									</RadioButton.Group>

									{forWhom === "someone_else" && (
										<View>
											<TextInput
												label="Full Name"
												value={otherPerson.name}
												onChangeText={(t) =>
													setOtherPerson({ ...otherPerson, name: t })
												}
												mode="outlined"
												style={[
													styles.input,
													{
														backgroundColor: theme.colors.onPrimary,
														marginTop: 8,
													},
												]}
												placeholder="E.g. John Doe"
												autoComplete="off"
												maxLength={100}
												contentStyle={{
													textAlign: undefined, // To prevent ellipsis from not working
												}}
											/>

											<CustomDatePicker
												label="Date of Birth"
												value={otherPerson.date_of_birth as Date}
												onChange={(d) =>
													setOtherPerson({ ...otherPerson, date_of_birth: d })
												}
												parent="form"
												mode="dob"
											/>

											<TextInput
												label="Gender"
												placeholder="E.g. Male, Female"
												value={otherPerson.gender}
												onChangeText={(t) =>
													setOtherPerson({ ...otherPerson, gender: t })
												}
												mode="outlined"
												style={[
													styles.input,
													{
														backgroundColor: theme.colors.onPrimary,
													},
												]}
												autoComplete="off"
												maxLength={100}
												contentStyle={{
													textAlign: undefined, // To prevent ellipsis from not working
												}}
											/>

											<TextInput
												label="Relationship"
												placeholder="E.g. Spouse, Child, Parent"
												value={otherPerson.relationship}
												onChangeText={(t) =>
													setOtherPerson({ ...otherPerson, relationship: t })
												}
												mode="outlined"
												style={[
													styles.input,
													{
														backgroundColor: theme.colors.onPrimary,
													},
												]}
												autoComplete="off"
												maxLength={100}
												contentStyle={{
													textAlign: undefined, // To prevent ellipsis from not working
												}}
											/>
										</View>
									)}

									<Text
										variant="titleSmall"
										style={{ marginTop: 10, marginBottom: 8 }}
									>
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
										E.g. Insurance Claim, Company Letter of Guarantee, Referral
										Letter, Lab Result, etc.
									</Text>

									{supportingDocuments.length > 0 && (
										<ScrollView
											horizontal
											style={styles.filePreviewHorizontalScroll}
										>
											{supportingDocuments.map((file, index) => (
												<View key={index}>
													<SupportingDocumentPreview
														key={index}
														file={file}
														onRemove={() => {
															setSupportingDocuments((prev) =>
																prev.filter((_, i) => i !== index)
															);
														}}
														onTypeChange={(type) =>
															handleTypeChange(index, type)
														}
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
								</>
							)}

							<Button
								mode="contained"
								onPress={handleBooking}
								disabled={
									!selectedSlot ||
									booking ||
									!reason ||
									(forWhom === "someone_else" &&
										(!otherPerson.name ||
											!otherPerson.date_of_birth ||
											!otherPerson.gender ||
											!otherPerson.relationship))
								}
								loading={booking}
								style={{ marginTop: 12 }}
							>
								Request appointment
							</Button>
						</Card.Content>
					</Card>
				</ScrollView>
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
		marginBottom: 10,
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
