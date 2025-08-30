import { StyleSheet, View } from "react-native";
import { ActivityIndicator as Indicator, Portal, Text, useTheme } from "react-native-paper";

type ActivityIndicatorProps = {
  loadingMsg?: string;
};

export function ActivityIndicator({ loadingMsg = "Loading..." }: ActivityIndicatorProps) {
	const theme = useTheme();

	return (
		<Portal>
			<View style={styles.container}>
				<Indicator animating={true} color={theme.colors.primary} size="large" />
				<Text style={{ marginTop: 15, textAlign: "center" }}>{loadingMsg}</Text>
			</View>
		</Portal>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});