import { recordTypes } from "@/utils/recordTypes";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-paper-dropdown";

export const RecordTypeMenu = () => {
	const [selectedType, setSelectedType] = useState<string>();

	// convert your string list into the dropdown's format
	const dropDownItems = recordTypes.map((type) => ({
		label: type.replace(/_/g, " "), // prettier label
		value: type,
	}));

	return (
		<View style={styles.dropdownContainer}>
			<Dropdown
				label="Record Type"
				placeholder="Select record type"
				options={dropDownItems}
				value={selectedType}
				onSelect={setSelectedType}
				mode="outlined"
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	dropdownContainer: {
		marginVertical: 8,
	},
});
