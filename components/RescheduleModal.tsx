import { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Modal, Text, useTheme } from "react-native-paper";
import { SlotPicker } from "./SlotPicker";

import { supabase } from "@/lib/supabase";
import type { Appointment, Slot } from "@/types/appointment";
import { formatKL } from "@/utils/dateHelpers";

type RescheduleModalProps = {
	visible: boolean;
	onClose: () => void;
	session: any;
	onRecordSaved?: () => void;
	appointment: Appointment;
};

export default function RescheduleModal({
	visible,
	onClose,
	session,
	onRecordSaved,
	appointment,
}: RescheduleModalProps) {
	const theme = useTheme();
	const [saving, setSaving] = useState(false);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
	const [selectedDate, setSelectedDate] = useState(
		new Date(appointment.starts_at)
	);

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

	useEffect(() => {
		loadSlots();
	}, [loadSlots]);

	const handleReschedule = () => {
		setSaving(true);
		// Perform reschedule logic here, e.g., API call
		// After successful reschedule:
		if (onRecordSaved) {
			onRecordSaved();
		}
		setSaving(false);
		onClose();
	};

	return (
		<Modal
			visible={visible}
			onDismiss={onClose}
			contentContainerStyle={{
				backgroundColor: "white",
				margin: 20,
				borderRadius: 12,
				padding: 16,
			}}
		>
			<Text variant="titleMedium" style={{ marginBottom: 12 }}>
				Reschedule Appointment
			</Text>
			{/* TODO: Date picker here if needed */}
			<SlotPicker
				slots={slots}
				selectedSlot={selectedSlot}
				onSelect={setSelectedSlot}
			/>
			<Button
				mode="contained"
				onPress={handleReschedule}
				disabled={!selectedSlot || saving}
				style={{ marginTop: 16 }}
				loading={saving}
			>
				Confirm
			</Button>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 2,
		marginHorizontal: 15,
		marginVertical: 5,
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
	progressBar: {
		height: 6,
		borderRadius: 3,
		marginTop: 8,
		marginBottom: 16,
	},
});
