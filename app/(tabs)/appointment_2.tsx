// import { Session } from "@supabase/supabase-js";
// import dayjs from "dayjs";
// import tz from "dayjs/plugin/timezone";
// import utc from "dayjs/plugin/utc";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { FlatList, TouchableOpacity } from "react-native";
// import { ActivityIndicator, Button, Card, Divider, Searchbar, Text, useTheme } from "react-native-paper";
// import CustomDatePicker from "../components/CustomDatePicker";
// import { supabase } from "../lib/supabase"; // <-- your client

// dayjs.extend(utc);
// dayjs.extend(tz);

// type Doctor = {
//   id: string;
//   profiles?: { full_name: string | null } | null;
//   speciality?: string | null;
//   slot_minutes: number;
//   timezone: string;
// };

// type Slot = { slot_start: string; slot_end: string; is_blocked: boolean };

// type Props = { session: Session | null };

// export default function Appointment2Screen({ session }: Props) {
//   const theme = useTheme();
//   const userId = session?.user?.id!;
//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [query, setQuery] = useState("");
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
//   const [date, setDate] = useState<Date>(new Date());
//   const [loading, setLoading] = useState(false);
//   const [slots, setSlots] = useState<Slot[]>([]);
//   const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
//   const [reason, setReason] = useState("");
//   const [booking, setBooking] = useState(false);
//   const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });
//   const [upcoming, setUpcoming] = useState<any[]>([]);
//   const tzName = "Asia/Kuala_Lumpur";

//   const filteredDoctors = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return doctors;
//     return doctors.filter(d =>
//       (d.profiles?.full_name ?? "").toLowerCase().includes(q) ||
//       (d.speciality ?? "").toLowerCase().includes(q)
//     );
//   }, [doctors, query]);

//   const loadDoctors = useCallback(async () => {
//     const { data, error } = await supabase
//       .from("doctor_profiles")
//       .select("id, speciality, slot_minutes, timezone, profiles:profiles(full_name)")
//       .order("id");
//     if (error) throw error;
//     setDoctors(data as any);
//     if (!selectedDoctor && data?.length) setSelectedDoctor(data[0] as any);
//   }, [selectedDoctor]);

//   const loadSlots = useCallback(async () => {
//     if (!selectedDoctor || !date) return;
//     setLoading(true);
//     try {
//       const dateISO = dayjs(date).tz(tzName).format("YYYY-MM-DD");
//       const { data, error } = await supabase.rpc("get_available_slots", {
//         p_doctor_id: selectedDoctor.id,
//         p_date: dateISO,
//         p_slot_mins: selectedDoctor.slot_minutes,
//       });
//       if (error) throw error;
//       setSlots((data as Slot[]) ?? []);
//       setSelectedSlot(null);
//     } catch (e: any) {
//       setSnack({ visible: true, msg: e.message ?? "Failed to load slots" });
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDoctor, date]);

//   const loadUpcoming = useCallback(async () => {
//     const { data, error } = await supabase
//       .from("appointments")
//       .select("id, starts_at, ends_at, status, doctor_id, reason, doctor:doctor_id(profiles(full_name))")
//       .eq("patient_id", userId)
//       .gte("starts_at", dayjs().utc().toISOString())
//       .order("starts_at", { ascending: true })
//       .limit(20);
//     if (!error) setUpcoming(data ?? []);
//   }, [userId]);

//   useEffect(() => {
//     loadDoctors();
//   }, [loadDoctors]);

//   useEffect(() => {
//     loadSlots();
//   }, [loadSlots]);

//   useEffect(() => {
//     loadUpcoming();
//   }, [loadUpcoming]);

//   const book = async () => {
//     if (!selectedDoctor || !selectedSlot) return;
//     setBooking(true);
//     try {
//       // selectedSlot times are UTC from the RPC; just pass through
//       const starts_at = selectedSlot.slot_start;
//       const ends_at = selectedSlot.slot_end;
//       const { data, error } = await supabase.rpc("book_appointment", {
//         p_doctor_id: selectedDoctor.id,
//         p_patient_id: userId,
//         p_starts_at: starts_at,
//         p_ends_at: ends_at,
//         p_reason: reason || null,
//       });
//       if (error) throw error;
//       setSnack({ visible: true, msg: "Appointment requested." });
//       setReason("");
//       setSelectedSlot(null);
//       loadSlots();
//       loadUpcoming();
//     } catch (e: any) {
//       setSnack({ visible: true, msg: e.message ?? "Booking failed" });
//     } finally {
//       setBooking(false);
//     }
//   };

//   const renderSlot = ({ item }: { item: Slot }) => {
//     const startLocal = dayjs(item.slot_start).tz(tzName).format("HH:mm");
//     const endLocal = dayjs(item.slot_end).tz(tzName).format("HH:mm");
//     const disabled = item.is_blocked;
//     const selected = selectedSlot?.slot_start === item.slot_start;
//     return (
//       <TouchableOpacity
//         disabled={disabled}
//         onPress={() => setSelectedSlot(item)}
//         style={{
//           margin: 6,
//           opacity: disabled ? 0.4 : 1,
//           borderRadius: 12,
//           borderWidth: selected ? 2 : 1,
//           borderColor: selected ? theme.colors.primary : theme.colors.outline,
//           paddingVertical: 8,
//           paddingHorizontal: 12,
//           backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
//         }}
//       >
//         <Text>{`${startLocal} – ${endLocal}`}</Text>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <FlatList
//       style={{ flex: 1, backgroundColor: theme.colors.background }}
//       ListHeaderComponent={
//         <>
//           <Card style={{ margin: 16, borderRadius: 12 }}>
//             <Card.Content>
//               <Text variant="titleMedium" style={{ marginBottom: 8 }}>Book a consultation</Text>

//               <Searchbar
//                 placeholder="Search doctor or speciality…"
//                 value={query}
//                 onChangeText={setQuery}
//                 style={{ marginBottom: 12 }}
//                 inputStyle={{ fontSize: 14 }}
//                 autoComplete="off"
//                 autoCorrect={false}
//                 spellCheck={false}
//               />

//               {/* Doctor quick picker */}
//               <FlatList
//                 horizontal
//                 data={filteredDoctors}
//                 keyExtractor={(d) => d.id}
//                 showsHorizontalScrollIndicator={false}
//                 renderItem={({ item }) => {
//                   const active = selectedDoctor?.id === item.id;
//                   return (
//                     <TouchableOpacity
//                       onPress={() => setSelectedDoctor(item)}
//                       style={{
//                         marginRight: 10,
//                         borderRadius: 16,
//                         borderWidth: active ? 2 : 1,
//                         borderColor: active ? theme.colors.primary : theme.colors.outline,
//                         paddingVertical: 10,
//                         paddingHorizontal: 14,
//                         backgroundColor: active ? theme.colors.primaryContainer : theme.colors.elevation.level1,
//                       }}
//                     >
//                       <Text style={{ fontWeight: "600" }}>
//                         {item.profiles?.full_name ?? "Doctor"}
//                       </Text>
//                       {item.speciality ? <Text>{item.speciality}</Text> : null}
//                     </TouchableOpacity>
//                   );
//                 }}
//                 style={{ marginBottom: 12 }}
//               />

//               {/* Date picker */}
//               <CustomDatePicker
//                 label="Choose date"
//                 value={date}
//                 onChange={setDate}
//                 parent="searchForm"
//               />

//               <Divider style={{ marginVertical: 12 }} />

//               <Text variant="titleSmall" style={{ marginBottom: 8 }}>
//                 Available time slots (GMT+8 shown)
//               </Text>

//               {loading ? (
//                 <ActivityIndicator />
//               ) : (
//                 <FlatList
//                   data={slots}
//                   keyExtractor={(s) => s.slot_start}
//                   numColumns={3}
//                   renderItem={renderSlot}
//                   ListEmptyComponent={
//                     <Text>No slots for this day. Try another date.</Text>
//                   }
//                 />
//               )}

//               <Text style={{ marginTop: 12, marginBottom: 6 }}>Reason (optional)</Text>
//               <Searchbar
//                 placeholder="E.g., follow-up, new symptoms…"
//                 value={reason}
//                 onChangeText={setReason}
//                 style={{ marginBottom: 12 }}
//                 inputStyle={{ fontSize: 14 }}
//               />

//               <Button
//                 mode="contained"
//                 onPress={book}
//                 disabled={!selectedSlot || booking}
//                 loading={booking}
//               >
//                 Book appointment
//               </Button>
//             </Card.Content>
//           </Card>

//           <Text style={{ marginLeft: 16, marginBottom: 8 }} variant="titleMedium">
//             Upcoming appointments
//           </Text>
//         </>
//       }
//       data={upcoming}
//       keyExtractor={(a) => a.id}
//       renderItem={({ item }) => {
//         const start = dayjs(item.starts_at).tz(tzName).format("DD MMM YYYY, HH:mm");
//         const docName = item.doctor?.profiles?.full_name ?? "Doctor";
//         return (
//           <Card style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12 }}>
//             <Card.Content>
//               <Text variant="titleSmall">{docName}</Text>
//               <Text>{start}</Text>
//               <Text>Status: {item.status}</Text>
//               {item.reason ? <Text>Reason: {item.reason}</Text> : null}
//               {/* TODO: add Reschedule/Cancel buttons that create appointment_change_requests */}
//             </Card.Content>
//           </Card>
//         );
//       }}
//       contentContainerStyle={{ paddingBottom: 24 }}
//     >
//     </FlatList>
//   );
// }
