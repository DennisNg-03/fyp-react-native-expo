import { View, StyleSheet } from "react-native";
import { ActivityIndicator as Indicator, useTheme } from "react-native-paper";

export function ActivityIndicator() {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<Indicator animating={true} color={theme.colors.primary} size="large" />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});