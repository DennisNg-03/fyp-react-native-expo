import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

interface GenderDropdownProps {
	selectedGender?: string;
	setSelectedGender: (value?: string) => void;
}

const genders = [
	{ label: "Male", value: "male" },
	{ label: "Female", value: "female" },
];

export const GenderDropdown = ({
	selectedGender,
	setSelectedGender,
}: GenderDropdownProps) => {
	const theme = useTheme();

	return (
		<View style={{ marginBottom: 16 }}>
			<Dropdown
				label="Gender"
				placeholder="Select gender"
				options={genders}
				value={selectedGender}
				onSelect={setSelectedGender}
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
