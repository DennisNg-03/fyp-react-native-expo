import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { List, TextInput, useTheme } from "react-native-paper";

interface Patient {
	id: string;
	full_name: string;
	date_of_birth?: string; // ISO string
	last_appointment?: string; // ISO string
}

interface PatientDropdownProps {
	doctorId: string;
	selectedPatient?: Patient | null;
	setSelectedPatient: (patient: Patient | null) => void;
	role?: string;
}

export const PatientDropdown = ({
	doctorId,
	selectedPatient,
	setSelectedPatient,
	role,
}: PatientDropdownProps) => {
	const theme = useTheme();
	const [search, setSearch] = useState("");
	const [patients, setPatients] = useState<Patient[]>([]);
	const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
		if (!doctorId) return;
		loadPatients();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [doctorId]);

	useEffect(() => {
		const filtered = patients.filter(
			(p) =>
				p.full_name.toLowerCase().includes(search.toLowerCase()) ||
				p.date_of_birth?.includes(search) ||
				p.id.includes(search)
		);
		setFilteredPatients(filtered);
	}, [search, patients]);

	const loadPatients = async () => {
		try {
			// Fetch only patients linked to this doctor (appointments / previous records)
			const { data: apptData, error } = await supabase
				.from("appointments")
				.select(
					`patient_id, patient:patient_id(date_of_birth, profiles(full_name)), created_at`
				)
				.eq("doctor_id", doctorId)
				.order("created_at", { ascending: false });

			if (error) throw error;

			// Map unique patients
			const map: Record<string, Patient> = {};
			apptData?.forEach((row: any) => {
				if (!map[row.patient_id]) {
					map[row.patient_id] = {
						id: row.patient_id,
						full_name: row.patient?.profiles?.full_name ?? "Unknown",
						date_of_birth: row.patient?.date_of_birth,
						last_appointment: row.created_at,
					};
				}
			});

			setPatients(Object.values(map));
		} catch (err) {
			console.error("Failed to load patients:", err);
		}
	};

	const handleSelect = (patient: Patient) => {
		setSelectedPatient(patient);
		setSearch(`${patient.full_name} - ${patient.date_of_birth ?? "N/A"}`);
		setShowDropdown(false);
	};

	return (
		<View style={{ marginVertical: 8 }}>
			<TextInput
				label="Select Patient"
				value={search}
				onChangeText={(text) => {
					setSearch(text);
					setShowDropdown(true);
				}}
				onFocus={() => setShowDropdown(true)}
				right={
					selectedPatient ? (
						<TextInput.Icon
							icon="close"
							onPress={() => {
								setSelectedPatient(null);
								setSearch("");
							}}
						/>
					) : null
				}
				mode="outlined"
			/>
			{showDropdown && (
				<ScrollView
					style={[styles.dropdown, { backgroundColor: theme.colors.onPrimary }]}
					nestedScrollEnabled={true}
					keyboardShouldPersistTaps="handled"
				>
					{filteredPatients.length > 0 ? (
						filteredPatients.map((p) => (
							<List.Item
								key={p.id}
								title={`${p.full_name}`}
								description={`DOB: ${p.date_of_birth ?? "N/A"} | Last Appt: ${
									p.last_appointment?.split("T")[0] ?? "N/A"
								}`}
								onPress={() => handleSelect(p)}
							/>
						))
					) : (
						<List.Item
							title="No patients found"
							description={`Try searching with a different name, ID, or DOB. You can only add records for patients who have an appointment history with ${
								role === "nurse" ? "your assigned doctor." : "you."
							}`}
							descriptionNumberOfLines={5} 
							disabled
						/>
					)}
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	dropdown: {
		position: "absolute",
		top: 60,
		left: 0,
		right: 0,
		// margin: 40,
		maxHeight: 250,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		elevation: 3,
		zIndex: 999,
		overflow: "hidden", // ensures children respect borderRadius
	},
});
