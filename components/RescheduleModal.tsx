import { supabase } from "@/lib/supabase";
import type {
	Appointment,
	Slot
} from "@/types/appointment";
import { formatKL } from "@/utils/dateHelpers";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Modal, Text } from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";
import ConfirmationDialog from "./ConfirmationDialog";
import CustomDatePicker from "./CustomDatePicker";
import { SlotPicker } from "./SlotPicker";

type RescheduleModalProps = {
	visible: boolean;
	onClose: () => void;
	session: any;
	onRecordSaved: () => void;
	appointment: Appointment;
};

export default function RescheduleModal({
	visible,
	onClose,
	session,
	onRecordSaved,
	appointment,
}: RescheduleModalProps) {
	const [saving, setSaving] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(() => {
		const today = new Date();
		const appointmentDate = new Date(appointment.starts_at);
		return appointmentDate > today ? appointmentDate : today;
	});

	const loadSlots = useCallback(async () => {
		setLoadingSlots(true);
		try {
			const doctorId = appointment.doctor_id;

			if (!doctorId || !selectedDate) {
				console.log("No doctor or date selected, skipping slots load");
				setSlots([]);
				return;
			}

			const dateISO = formatKL(selectedDate, "yyyy-MM-dd");
			console.log("DateISO:", dateISO);

			const { data, error } = await supabase.rpc("get_available_slots", {
				p_doctor_id: doctorId,
				p_date: dateISO,
				p_slot_mins: appointment.doctor?.slot_minutes ?? 15,
			});

			if (error) {
				console.error("Error loading slots:", error);
				setSlots([]);
			} else {
				setSlots(data || []);
			}
		} catch (error) {
			console.error("Unexpected error loading slots:", error);
			setSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [appointment, selectedDate]);

	// useEffect(() => {
	// 	loadSlots();
	// }, [loadSlots]);

	useEffect(() => {
		console.log("Selected date:", formatKL(selectedDate, "yyyy-MM-dd"));
		loadSlots();
	}, [selectedDate, loadSlots]);

	// useEffect(() => {
	// 	console.log("appointment:", appointment);
	// }, [appointment]);

	const handleReschedule = async () => {
		console.log("Selected slot:", selectedSlot);
		if (!session) {
			console.error("User not authenticated!");
			return;
		}

		if (!selectedSlot) {
			console.log("Doctor or slot is not selected!");
			return;
		}

		try {
			setSaving(true);

			const res = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/createRescheduleRequest",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						appointment_id: appointment.id,
						requested_by: appointment.patient_id,
						new_starts_at: selectedSlot.slot_start,
						new_ends_at: selectedSlot.slot_end,
					}),
				}
			);

			if (!res.ok) {
				const errorBody = await res.text();
				console.error(
					"Reschedule Appointment Edge function failed:",
					res.status,
					errorBody
				);
				return;
			}

			const { data } = await res.json();
			console.log("Updated appointment:", data);

			// Update appointment status in "appointments" table
			const statusUpdate = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/updateAppointmentStatus",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						id: appointment.id,
						status: "rescheduling",
					}),
				}
			);

			if (!statusUpdate.ok) {
				const errorBody = await statusUpdate.text();
				console.error("Failed to update appointment status:", errorBody);
				return;
			}

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
			loadSlots();

			Alert.alert(
				"Appointment Rescheduling Request Sent",
				"Your request has been submitted and you will be notified once it has been reviewed."
			);
			onRecordSaved();
		} catch (err) {
			console.error("Error saving record:", err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			visible={visible}
			onDismiss={onClose}
			contentContainerStyle={
				styles.modalContainer
			}
		>
			<ScrollView
				contentContainerStyle={{
					padding: 20,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Text variant="titleMedium" style={styles.modalTitle}>
					Reschedule Appointment
				</Text>
				<CustomDatePicker
					label="Choose your reschedule date"
					value={selectedDate}
					onChange={setSelectedDate}
					parent="appointments"
					mode="future"
				/>
				{loadingSlots ? (
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
				
				<Button
					mode="contained"
					onPress={() => setDialogVisible(true)}
					disabled={!selectedSlot}
					style={{ marginVertical: 12 }}
				>
					Save
				</Button>
			</ScrollView>

			<ConfirmationDialog
				visible={dialogVisible}
				onCancel={() => setDialogVisible(false)}
				onConfirm={handleReschedule}
				title="Reschedule Appointment Confirmation"
				messagePrimary="Are you sure you want to reschedule this appointment?"
				messageSecondary="Kindly double-check your selected slot before confirming, as you will not be able to submit another reschedule request for this appointment."
			/>

			{saving && (
				<ActivityIndicator
					loadingMsg=""
					overlay={true}
					size="large"
				/>
			)}
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 2,
		marginHorizontal: 15,
		marginVertical: 50,
		// margin: 20,
		// borderRadius: 12,
		// padding: 16,
	},
	modalTitle: {
		textAlign: "center",
		marginBottom: 5,
	},
	input: {
		marginBottom: 16,
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
});
