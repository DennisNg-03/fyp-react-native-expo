import { StyleSheet, View } from "react-native";
import { ActivityIndicator as Indicator, Text, useTheme } from "react-native-paper";

type ActivityIndicatorProps = {
  loadingMsg?: string;
};

export function ActivityIndicator({ loadingMsg = "Loading..." }: ActivityIndicatorProps) {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<Indicator animating={true} color={theme.colors.primary} size="large" />
			<Text style={{ marginTop: 15 }}>{loadingMsg}</Text>
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