import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal as RNModal, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

type CustomDatePickerProps = {
	label?: string;
	value?: Date | undefined;
	onChange: (date: Date) => void;
	parent?: string;
	mode?: "past" | "future" | "dob";
};

export default function CustomDatePicker({
	label = "Date",
	value,
	onChange,
	parent = "formModal", // If any parent other than "formModal" is passed, the background color would be white colour (theme.colors.onPrimary)
	mode = "past",
}: CustomDatePickerProps) {
	const theme = useTheme();
	const [showPicker, setShowPicker] = useState(false);

	return (
		<View style={{ marginBottom: 10 }}>
			<TextInput
				label={label}
				mode="outlined"
				value={value ? value.toDateString() : ""} // To handle the case where sometimes the value is empty/null
				onPress={() => setShowPicker(true)}
				readOnly
				// contentStyle={{ backgroundColor: theme.colors.onSurfaceVariant}}
				style={{
					backgroundColor:
						(parent === "formModal") ? undefined : theme.colors.onPrimary,
					fontSize: parent === "formModal" ? 16 : 14,
				}}
				outlineStyle={{ borderRadius: 8 }}
			/>

			{showPicker && (
				<RNModal
					transparent
					animationType="slide"
					visible={showPicker}
					onRequestClose={() => setShowPicker(false)}
				>
					<View
						style={{
							flex: 1,
							justifyContent: "flex-end",
							backgroundColor: "rgba(0,0,0,0.3)",
						}}
					>
						<View
							style={{
								backgroundColor: "white",
								padding: 16,
								borderTopLeftRadius: 12,
								borderTopRightRadius: 12,
								shadowColor: "#000",
								shadowOpacity: 0.2,
								shadowOffset: { width: 0, height: -2 },
								shadowRadius: 5,
								elevation: 5,
								alignItems: "center",
								paddingBottom: 40,
							}}
						>
							<DateTimePicker
								value={
									mode === "dob"
										? value ?? new Date(2000, 0, 1)
										: value ?? new Date()
								}
								mode="date"
								display="spinner"
								maximumDate={mode === "past" ? new Date() : undefined}
								minimumDate={mode === "future" ? new Date() : undefined}
								onChange={(_e, selected) => {
									if (selected) onChange(selected);
								}}
							/>
							<Button
								onPress={() => setShowPicker(false)}
								labelStyle={{ fontSize: 18 }}
							>
								Done
							</Button>
						</View>
					</View>
				</RNModal>
			)}
		</View>
	);
}
