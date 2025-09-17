import { ActivityIndicator } from "@/components/ActivityIndicator";
import AppointmentDetailsCard from "@/components/AppointmentDetailsCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { getDisplayStatus } from "@/utils/appointmentRules";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Keyboard,
	ScrollView,
	TouchableWithoutFeedback
} from "react-native";
import {
	useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientAppointmentDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { session, role } = useAuth();
	const theme = useTheme();
	const [appointment, setAppointment] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const loadData = async () => {
		if (!id || !session) return;

		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("appointments")
				.select(
					`
						id,
						doctor_id,
						patient_id,
						starts_at,
						ends_at,
						status,
						reason,
						notes,
						for_whom,
						other_person,
						grant_doctor_access,
						supporting_documents,
						doctor:doctor_id (
							speciality,
							slot_minutes,
							profiles(full_name, email, phone_number),
							provider:provider_id (
								name,
								provider_type,
								address,
								phone_number
								)
							),
						patient:patient_id (
							date_of_birth,
							profiles(full_name, email, phone_number, gender)
						)
					`
				)
				.eq("id", id)
				.single();

			console.log("Supabase returned data:", data);
			console.log("Supabase returned error:", error);

			if (!data) return;

			let result = data;

			if (data.supporting_documents?.length > 0) {
				const res = await fetch(
					`https://zxyyegizcgbhctjjoido.functions.supabase.co/getAppointmentDocSignedUrl`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${session?.access_token}`,
						},
						body: JSON.stringify({
							supporting_documents: data.supporting_documents,
						}),
					}
				);

				if (!res.ok) {
					console.error(
						"Failed to fetch signed URLs for documents",
						await res.text()
					);
					return;
				}

				const signedUrlData = await res.json();
				const supportingDocsWithUrls =
					signedUrlData?.supporting_documents ?? [];

				result = {
					...data,
					supporting_documents: supportingDocsWithUrls,
				};
			}

			// const acceptedRescheduleRequest = data.reschedule_requests?.find(
			// 	(r: any) => r.status === "accepted"
			// );

			// if (acceptedRescheduleRequest) {
			// 	result = {
			// 		...data,
			// 		starts_at: acceptedRescheduleRequest.new_starts_at,
			// 		ends_at: acceptedRescheduleRequest.new_ends_at,
			// 	};
			// }

			setAppointment(result);
		} catch (e) {
			console.warn("Error fetching appointment:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session, id]);

	useEffect(() => {
		console.log("appointment:", appointment);
	}, [appointment]);

	if (loading || !appointment) {
		return <ActivityIndicator loadingMsg="Fetching appointment record..." />;
	}

	const displayStatus = getDisplayStatus(appointment);
	console.log("[id] displayStatus:", displayStatus);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: theme.colors.tertiary,
					// paddingBottom: 10,
					// paddingTop: 20,
				}}
				edges={["left", "right", "bottom"]} // Remove extra spacing due to showm header + SafeAreaView
			>
				<ScrollView
					contentContainerStyle={{ paddingTop: 20, paddingBottom: 55 }}
				>
					<AppointmentDetailsCard
            appointment={appointment}
            session={session}
						role={role}
            reload={loadData}
            showActions={false}
          />
				</ScrollView>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}