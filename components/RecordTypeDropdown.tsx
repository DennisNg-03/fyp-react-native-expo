import { recordTypes } from "@/types/medicalRecord";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface RecordTypeDropdownProps {
	selectedType: string | undefined;
	setSelectedType: (value?: string) => void;
}

export const RecordTypeDropdown = ({
	selectedType,
	setSelectedType,
}: RecordTypeDropdownProps) => {
	const theme = useTheme();

	const dropDownItems = recordTypes.map((type) => ({
		label: type, // Lab Result
		value: type.toLowerCase().replace(/ /g, "_"), // lab_result
	}));

	return (
		<View style={{ marginBottom: 10 }}>
			<Dropdown
				label="Record Type"
				placeholder="Select record type"
				options={dropDownItems}
				value={selectedType}
				onSelect={setSelectedType}
				mode="outlined"
				menuContentStyle={{
					backgroundColor: theme.colors.onPrimary,
					borderRadius: 10,
				}}
				hideMenuHeader
			/>
		</View>
	);
};
