import { supabase } from "@/lib/supabase";
import { formatKL } from "@/utils/dateHelpers";
import { formatLabel } from "@/utils/labelHelpers";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Keyboard,
	ScrollView,
	StyleSheet,
	TouchableWithoutFeedback,
} from "react-native";
import {
	ActivityIndicator,
	Card,
	Divider,
	Text,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppointmentDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const theme = useTheme();
	const [appointment, setAppointment] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from("appointments")
					.select(
						`
          id,
          starts_at,
          ends_at,
          status,
          reason,
          notes,
          doctors:doctor_id (
            speciality,
            bio,
            profiles(full_name, email, phone_number),
            provider:provider_id (
              name,
              provider_type,
              address
            )
          )
        `
					)
					.eq("id", id)
					.single();

				console.log("Supabase returned data:", data);
				console.log("Supabase returned error:", error);

				setAppointment(data);
			} catch (e) {
				console.warn("Error fetching appointment:", e);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [id]);

	if (loading || !appointment || !appointment.doctors) {
		return <ActivityIndicator style={{ marginTop: 50 }} />;
	}

	const doc = appointment.doctors;
	const provider = doc?.provider;

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
					style={{ flex: 1, backgroundColor: theme.colors.background }}
				>
					<Card style={styles.card}>
						<Card.Title
							title={`Dr ${doc?.profiles?.full_name}`}
							subtitle={doc?.speciality}
						/>
						<Card.Content>
							<Text>
								Date: {formatKL(appointment.starts_at, "dd MMM yyyy, HH:mm")}
							</Text>
							<Text>Status: {formatLabel(appointment.status)}</Text>
							<Divider style={{ marginVertical: 12 }} />
							<Text>
								Provider: {provider?.name} ({provider?.provider_type})
							</Text>
							<Text>Address: {provider?.address}</Text>
							<Divider style={{ marginVertical: 12 }} />
							<Text>Reason: {appointment.reason || "—"}</Text>
							<Text>Notes: {appointment.notes || "—"}</Text>
						</Card.Content>
					</Card>
				</ScrollView>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	card: {
		margin: 16,
		borderRadius: 8,
	},
});
