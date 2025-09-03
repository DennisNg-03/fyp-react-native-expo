import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { formatKL } from "@/utils/dateHelpers";
import { formatLabel } from "@/utils/labelHelpers";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
	ActivityIndicator,
	Card,
	Divider,
	List,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyAppointmentsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();

  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);

      const { data: upcomingData } = await supabase
        .from("appointments")
        .select(`
          id,
          starts_at,
          ends_at,
          status,
          reason,
          notes,
          doctors:doctor_id (
            speciality,
            profiles(full_name),
            provider:provider_id (
              name,
              provider_type,
              address
            )
          )
        `)
        .eq("patient_id", userId)
        .gte("ends_at", new Date().toISOString()) // upcoming + ongoing
        .order("starts_at", { ascending: true });

      setUpcoming(upcomingData ?? []);

      const { data: pastData } = await supabase
        .from("appointments")
        .select(`
          id,
          starts_at,
          ends_at,
          status,
          reason,
          notes,
          doctors:doctor_id (
            speciality,
            profiles(full_name),
            provider:provider_id (
              name,
              provider_type,
              address
            )
          )
        `)
        .eq("patient_id", userId)
        .lt("ends_at", new Date().toISOString()) // finished
        .order("starts_at", { ascending: false });

      setPast(pastData ?? []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const renderAppointmentSummary = (item: any) => {
    const start = formatKL(item.starts_at, "dd MMM yyyy, HH:mm");
    const docName = item.doctor?.profiles?.full_name ?? "Doctor";
    const providerName = item.doctor?.provider?.name ?? "Provider";

    return (
      <Card
        style={styles.card}
        key={item.id}
        onPress={() => router.push(`/(tabs)/patient-appointment/${item.id}`)} // navigate to details page
      >
        <Card.Content>
          <Text variant="titleSmall">{docName}</Text>
          <Text>{providerName}</Text>
          <Text>{start}</Text>
          <Text>Status: {formatLabel(item.status)}</Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} animating />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Upcoming Appointments */}
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>
              Upcoming Appointments
            </List.Subheader>
            {upcoming.length > 0 ? (
              upcoming.map(renderAppointmentSummary)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.onSurface }}>
                  No upcoming appointments.
                </Text>
              </View>
            )}
          </List.Section>

          <Divider style={{ marginHorizontal: 16 }} />

          {/* Past Appointments */}
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>
              Past Appointments
            </List.Subheader>
            {past.length > 0 ? (
              past.map(renderAppointmentSummary)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.onSurface }}>
                  No past appointments.
                </Text>
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
    borderRadius: 8,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  sectionHeader: {
    fontWeight: "700",
    fontSize: 16,
    backgroundColor: "transparent",
  },
});