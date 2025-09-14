import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Notification } from "@/types/notification";
import { formatKL } from "@/utils/dateHelpers";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
	const theme = useTheme();
	const { session } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchNotifications = async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from("notifications")
				.select("*")
				.eq("user_id", session?.user.id)
				.order("created_at", { ascending: false });

			if (error) console.error("Failed to fetch notifications:", error);
			else setNotifications(data ?? []);

			setLoading(false);
		};

		if (session?.user.id) fetchNotifications();
	}, [session?.user.id]);

	const handleMarkAllAsRead = async () => {
		if (!notifications.length) return;

		const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
		if (!unreadIds.length) return;

		try {
			const { error } = await supabase
				.from("notifications")
				.update({ read_at: new Date().toISOString() })
				.in("id", unreadIds);

			if (error) {
				console.error("Failed to mark all as read:", error);
				return;
			}

			// Update local state
			setNotifications((prev) =>
				prev.map((n) => ({
					...n,
					read_at: n.read_at ?? new Date().toISOString(),
				}))
			);
		} catch (err) {
			console.error("Error marking all notifications as read:", err);
		}
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			edges={["left", "right", "bottom"]}
		>
			<ScrollView contentContainerStyle={styles.content}>
				{/* <Text variant="titleLarge" style={styles.header}>
					Notifications
				</Text> */}
				<Button
					mode="contained"
					onPress={handleMarkAllAsRead}
					style={{ marginBottom: 20 }}
				>
					Mark All as Read
				</Button>
				{notifications.length === 0 && !loading && (
					<Text variant="bodyMedium" style={styles.noNotifications}>
						No notifications found.
					</Text>
				)}
				{notifications.map((n) => (
					<Card
						key={n.id}
						style={styles.card}
						onPress={async () => {
							if (!n.read_at) {
								const { error } = await supabase
									.from("notifications")
									.update({ read_at: new Date().toISOString() })
									.eq("id", n.id);

								if (error) {
									console.error("Failed to mark notification as read:", error);
								} else {
									setNotifications((prev) =>
										prev.map((notif) =>
											notif.id === n.id
												? { ...notif, read_at: new Date().toISOString() }
												: notif
										)
									);
								}
							}
						}}
					>
						<Card.Content
							style={{ flexDirection: "row", alignItems: "center" }}
						>
							<View style={{ flex: 1 }}>
								<Text
									variant="titleMedium"
									style={{
										fontWeight: "bold",
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
							</View>
							{!n.read_at && <View style={styles.unreadDot} />}
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
	unreadDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginLeft: 4,
		backgroundColor: "#D32F2F",
		alignSelf: "flex-start",
	},
});
