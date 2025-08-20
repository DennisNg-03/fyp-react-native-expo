import { recordTypes } from "@/types/medicalRecord";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface RecordTypeMenuProps {
	selectedType: string | undefined;
	setSelectedType: (value?: string) => void;
}

export const RecordTypeMenu = ({
	selectedType,
	setSelectedType,
}: RecordTypeMenuProps) => {
	const theme = useTheme();

	const dropDownItems = recordTypes.map((type) => ({
		label: type.replace(/_/g, " "),
		value: type,
	}));

	return (
		<View style={{ marginBottom: 16 }}>
			<Dropdown
				label="Record Type"
				placeholder="Select record type"
				options={dropDownItems}
				value={selectedType}
				onSelect={setSelectedType}
				mode="outlined"
				menuContentStyle={{
					backgroundColor: theme.colors.background,
					borderRadius: 8,
				}}
				hideMenuHeader
			/>
		</View>
	);
};
