import { StyleSheet, View } from "react-native";
import { ActivityIndicator as Indicator, Portal, Text, useTheme } from "react-native-paper";

type ActivityIndicatorProps = {
  loadingMsg?: string;
  size?: "small" | "large" | undefined;
  overlay?: boolean; // Determine whether to wrap in Portal + overlay background
};

export function ActivityIndicator({
  loadingMsg = "Loading...",
  size = "large",
  overlay = true,
}: ActivityIndicatorProps) {
  const theme = useTheme();

  const content = (
    <View style={[overlay ? styles.container : styles.inline]}>
      <Indicator animating={true} color={theme.colors.primary} size={size} />
      {loadingMsg ? (
        <Text style={{ marginTop: 15, textAlign: "center" }}>{loadingMsg}</Text>
      ) : null}
    </View>
  );

  return overlay ? <Portal>{content}</Portal> : content;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inline: {
		flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});