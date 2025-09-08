import { FilePreview } from "@/components/FilePreview";
import { CompulsoryFields, MedicalRecord, PatientFields, ProviderFields, RecordFields } from "@/types/medicalRecord";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, Text, useTheme } from "react-native-paper";

// const CompulsoryFields = ["title", "record_type"];
// const PatientFields = ["patient_name", "date_of_birth"];
// const ProviderFields = ["healthcare_provider_name", "healthcare_provider_address"];
// const RecordFields = [
// 	"diagnosis",
// 	"procedures",
// 	"medications",
// 	"notes",
// 	"date_of_admission",
// 	"date_of_discharge",
// 	"created_by_full_name",
// 	"updated_at",
// ];

export default function RecordDetailsScreen() {
	const { record: recordParam } = useLocalSearchParams<{ record: string }>();
	const record: MedicalRecord = recordParam ? JSON.parse(recordParam) : null;
	const theme = useTheme();

	if (!record) return null;

	const hasValue = (value: any) => {
		if (value === null || value === undefined) return false;
		if (typeof value === "string" && value.trim() === "") return false;
		if (Array.isArray(value) && value.length === 0) return false;
		return true;
	};

	const renderSection = (title: string, fields: string[]) => {
		const filteredFields = fields.filter((field) => hasValue(record[field as keyof MedicalRecord]));
		if (filteredFields.length === 0) return null;

		return (
			<Card style={styles.sectionContainer}>
				<Text variant="titleMedium" style={styles.sectionTitle}>
					{title}
				</Text>
				<Divider style={{ marginVertical: 4 }} />
				{filteredFields.map((field) => {
					let value = record[field as keyof MedicalRecord];
					if (Array.isArray(value)) {
						value = value.join("\n");
					} else if (field === "updated_at" && value) {
						value = new Date(value as string).toLocaleDateString();
					}
					return (
						<View key={field} style={styles.detailRow}>
							<Text variant="labelLarge" style={styles.detailLabel}>
								{field
									.replace(/_/g, " ")
									.replace(/\b\w/g, (c) => c.toUpperCase())}
								:
							</Text>
							<Text variant="bodyMedium" style={styles.detailValue}>
								{value}
							</Text>
						</View>
					);
				})}
			</Card>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.tertiary }}>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
				{/* Compulsory Fields Section */}
				{renderSection("Record Info", [...CompulsoryFields])}

				{/* Patient Details */}
				{renderSection("Patient Details", [...PatientFields])}

				{/* Healthcare Provider */}
				{renderSection("Healthcare Provider", [...ProviderFields])}

				{/* Medical Record Details */}
				{renderSection("Record Details", [...RecordFields])}

				{/* Attachments */}
				{record.file_paths && record.file_paths.length > 0 && (
					<Card style={styles.sectionContainer}>
						<Text variant="titleMedium" style={styles.sectionTitle}>
							Attachments
						</Text>
						<Divider style={{ marginVertical: 4 }} />
						<ScrollView horizontal style={{ marginTop: 4 }}>
							{record.file_paths.map((file, index) => (
								<FilePreview
									key={index}
									file={file}
									signedUrl={record.signed_urls?.[index]}
								/>
							))}
						</ScrollView>
					</Card>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	sectionContainer: {
		marginBottom: 16,
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	sectionTitle: {
		fontWeight: "600",
		fontSize: 15,
		color: "#263238",
		marginBottom: 4,
	},
	detailRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 6,
	},
	detailLabel: {
		// fontWeight: "500",
		// color: "#444",
		marginRight: 6,
	},
	detailValue: {
		flexShrink: 1,
		// color: "#111",
		// fontWeight: "400",
	},
});
