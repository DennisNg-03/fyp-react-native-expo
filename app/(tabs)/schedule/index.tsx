import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { DoctorRescheduleRequest, DoctorSchedule } from "@/types/appointment";
import { getDisplayStatus } from "@/utils/appointmentRules";
import { formatKL } from "@/utils/dateHelpers";
import { formatStatusLabel, getStatusBarStyle, getStatusFontColor } from "@/utils/labelHelpers";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, List, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DoctorScheduleScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [appointments, setAppointments] = useState<DoctorSchedule[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<DoctorRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDoctorSchedule = useCallback(async () => {
    if (!userId || !session) return;
    // setRefreshing(true);

    try {
      // Load upcoming appointments
      const { data: apptData } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patient:patient_id (
            full_name, email, phone_number
          )
        `
        )
        .eq("doctor_id", userId)
        .order("starts_at", { ascending: true });

      setAppointments(apptData ?? []);

      // Load pending reschedule requests
      const { data: rescheduleData } = await supabase
        .from("appointment_reschedule_requests")
        .select(
          `
          *,
          appointment:appointment_id (
            starts_at, ends_at, patient_id
          ),
          requested_by:requested_by (
            full_name, email, phone_number
          )
        `
        )
        .eq("appointment.doctor_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      setRescheduleRequests(rescheduleData ?? []);
    } catch (err) {
      console.error("Error loading doctor schedule:", err);
    } finally {
      // setRefreshing(false);
    }
  }, [userId, session]);

  useFocusEffect(
    useCallback(() => {
      loadDoctorSchedule();
    }, [loadDoctorSchedule])
  );

  const renderAppointmentCard = (item: DoctorSchedule) => {
    const displayStatus = getDisplayStatus(item);
    const date = formatKL(item.starts_at, "dd MMM yyyy");
    const startTime = formatKL(item.starts_at, "HH:mm");
    const endTime = formatKL(item.ends_at, "HH:mm");

    return (
      <Card key={item.id} style={styles.card} elevation={2}>
        <View style={styles.cardHeader}>
          <View style={getStatusBarStyle(displayStatus)} />
          <View style={styles.cardContent}>
            <Text variant="titleMedium">{item.patient?.full_name ?? "Patient"}</Text>
            <Text>{date} {startTime} - {endTime}</Text>
            <Text>Status: <Text style={{ color: getStatusFontColor(displayStatus) }}>{formatStatusLabel(displayStatus)}</Text></Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderRescheduleRequestCard = (req: DoctorRescheduleRequest) => {
    const newDate = formatKL(req.new_starts_at, "dd MMM yyyy");
    const startTime = formatKL(req.new_starts_at, "HH:mm");
    const endTime = formatKL(req.new_ends_at, "HH:mm");
    return (
      <Card key={req.id} style={styles.card} elevation={2}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text variant="titleMedium">{req.requested_by?.full_name ?? "Requester"}</Text>
            <Text>New Schedule: {newDate} {startTime} - {endTime}</Text>
            <Text>Status: {req.status}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
      {loading && !refreshing ? (
        <ActivityIndicator loadingMsg="Loading schedule..." size="large" />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDoctorSchedule} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Upcoming Appointments */}
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>Upcoming Appointments</List.Subheader>
            {appointments.length > 0 ? appointments.map(renderAppointmentCard) : (
              <View style={styles.emptyContainer}>
                <Text>No appointments scheduled.</Text>
              </View>
            )}
          </List.Section>

          <Divider bold style={{ marginHorizontal: 16 }} />

          {/* Pending Reschedule Requests */}
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>Pending Reschedule Requests</List.Subheader>
            {rescheduleRequests.length > 0 ? rescheduleRequests.map(renderRescheduleRequestCard) : (
              <View style={styles.emptyContainer}>
                <Text>No reschedule requests.</Text>
              </View>
            )}
          </List.Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: {
    flexDirection: "row",
    padding: 12,
  },
  cardContent: {
    flex: 1,
  },
  sectionHeader: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  emptyContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
});