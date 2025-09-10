import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Notification } from "@/types/notification";
import { formatKL } from "@/utils/dateHelpers";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
	const theme = useTheme();
	const { session } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);

	useEffect(() => {
		const fetchNotifications = async () => {
			const { data, error } = await supabase
				.from("notifications")
				.select("*")
				.eq("user_id", session?.user.id)
				.order("created_at", { ascending: false });

			if (error) console.error("Failed to fetch notifications:", error);
			else setNotifications(data ?? []);
		};

		if (session?.user.id) fetchNotifications();
	}, [session?.user.id]);

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView contentContainerStyle={styles.content}>
				<Text variant="titleLarge" style={styles.header}>
					Notifications
				</Text>
				{notifications.length === 0 && (
					<Text variant="bodyMedium" style={styles.noNotifications}>
						No notifications found.
					</Text>
				)}
				{notifications.map((n) => (
					<Card key={n.id} style={styles.card}>
						<Card.Content>
							<Text
								variant="titleMedium"
								style={{
									fontWeight: n.read_at ? "normal" : "bold",
									marginBottom: 4,
								}}
							>
								{n.title}
							</Text>
							<Text variant="bodyMedium" style={{ marginBottom: 4 }}>
								{n.body}
							</Text>
							<Text variant="bodySmall" style={{ color: "gray" }}>
								{formatKL(n.created_at, "dd/MM/yyyy HH:mm")}
							</Text>
						</Card.Content>
					</Card>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		paddingBottom: 32,
	},
	header: {
		fontWeight: "600",
		fontSize: 24,
		marginBottom: 16,
		textAlign: "center",
		color: "rgba(0, 0, 0, 0.7)",
	},
	noNotifications: {
		textAlign: "center",
		color: "gray",
		marginTop: 50,
	},
	card: {
		marginBottom: 12,
		borderRadius: 10,
	},
});
