import CustomDatePicker from "@/components/CustomDatePicker";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Doctor, Provider, Slot } from "@/types/user";
import { formatKL, formatUTC } from "@/utils/dateHelpers";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	FlatList,
	Keyboard,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native";
import {
	ActivityIndicator,
	Button,
	Card,
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

	const [date, setDate] = useState<Date>(new Date());
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

	const [reason, setReason] = useState("");
	const [booking, setBooking] = useState(false);
	const [upcoming, setUpcoming] = useState<any[]>([]);
	const [loadingProviders, setLoadingProviders] = useState(false);
	const [loadingDoctors, setLoadingDoctors] = useState(false);

	// Providers load
	const loadProviders = useCallback(async () => {
		setLoadingProviders(true);
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
			try {
				let q = supabase
					.from("doctors")
					.select(
						"id, speciality, slot_minutes, timezone, profiles:profiles(full_name), provider_id"
					)
					.order("id");
				if (providerId) q = q.eq("provider_id", providerId);

				const { data, error } = await q;
				if (error) console.error("Error fetching doctors:", error);

				const mappedDoctors = (data ?? []).map((d: any) => ({
					...d,
					profiles: d.profiles?.[0] ?? {},
				}));

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
		if (!selectedDoctor || !date) {
			setSlots([]);
			return;
		}
		setLoadingSlots(true);
		try {
			const dateISO = formatKL(date, "yyyy-MM-dd");
			const { data, error } = await supabase.rpc("get_available_slots", {
				p_doctor_id: selectedDoctor.id,
				p_date: dateISO,
				p_slot_mins: selectedDoctor.slot_minutes ?? 15,
			});
			if (error) throw error;
			setSlots((data as Slot[]) ?? []);
			setSelectedSlot(null);
		} catch (e: any) {
			console.warn(e);
			setSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [selectedDoctor, date]);

	// Upcoming appointments for patient
	const loadUpcoming = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("appointments")
				.select(
					"id, starts_at, ends_at, status, reason, doctor:doctor_id(profiles(full_name))"
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
	}, [selectedDoctor, date, loadSlots]);
	useEffect(() => {
		loadUpcoming();
	}, [loadUpcoming]);

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
		return doctors.filter(
			(d) =>
				(d.profiles?.full_name ?? "").toLowerCase().includes(q) ||
				(d.speciality ?? "").toLowerCase().includes(q)
		);
	}, [doctors, doctorQuery]);

	const book = async () => {
		if (!selectedDoctor || !selectedSlot) return;
		setBooking(true);
		try {
			const { data, error } = await supabase.rpc("book_appointment", {
				p_doctor_id: selectedDoctor.id,
				p_patient_id: userId,
				p_starts_at: selectedSlot.slot_start,
				p_ends_at: selectedSlot.slot_end,
				p_reason: reason || null,
			});
			if (error) throw error;
			// refresh
			setReason("");
			setSelectedSlot(null);
			loadSlots();
			loadUpcoming();
		} catch (e: any) {
			console.warn(e);
			// report to user
		} finally {
			setBooking(false);
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
					margin: 6,
					opacity: disabled ? 0.4 : 1,
					borderRadius: 12,
					borderWidth: selected ? 2 : 1,
					borderColor: selected ? "#6200ee" : "#ccc",
					paddingVertical: 8,
					paddingHorizontal: 12,
					backgroundColor: selected ? "#eee" : "white",
				}}
			>
				<Text>{`${startLocal} – ${endLocal}`}</Text>
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
									{loadingProviders ? (
										<ActivityIndicator />
									) : (
										<FlatList
											horizontal
											data={filteredProviders}
											keyExtractor={(p) => p.id}
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
											style={{ marginBottom: 12 }}
										/>
									)}

									<Searchbar
										placeholder="Search doctor..."
										value={doctorQuery}
										onChangeText={setDoctorQuery}
										style={{ marginBottom: 8 }}
									/>
									{loadingDoctors ? (
										<ActivityIndicator />
									) : (
										<FlatList
											horizontal
											data={filteredDoctors}
											keyExtractor={(d) => d.id}
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
															{item.profiles?.full_name ?? "Doctor"}
														</Text>
														{item.speciality ? (
															<Text>{item.speciality}</Text>
														) : null}
													</TouchableOpacity>
												);
											}}
										/>
									)}

									<CustomDatePicker
										label="Choose date"
										value={date}
										onChange={setDate}
										parent="appointments"
									/>

									<Text style={{ marginTop: 12, marginBottom: 8 }}>
										Available slots ({tzDisplay})
									</Text>
									{loadingSlots ? (
										<ActivityIndicator />
									) : (
										<FlatList
											data={slots}
											keyExtractor={(s) => s.slot_start}
											numColumns={3}
											renderItem={renderSlot}
											ListEmptyComponent={
												<Text>No slots. Try a different date or doctor.</Text>
											}
										/>
									)}

									<Searchbar
										placeholder="Reason (optional)"
										value={reason}
										onChangeText={setReason}
										style={{ marginTop: 12 }}
									/>

									<Button
										mode="contained"
										onPress={book}
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
					contentContainerStyle={{ paddingBottom: 40 }}
				/>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}
