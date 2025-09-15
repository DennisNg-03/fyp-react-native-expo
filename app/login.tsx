import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityIndicator } from "@/components/ActivityIndicator";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
	const theme = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		try {
			if (!email || !password) {
				Alert.alert("Alert", "Please enter email and password to login!");
				return;
			}

			setLoading(true);
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;
			console.log("Logged in:", data.user?.email);
			router.replace("/(tabs)/home");
		} catch (err: any) {
			Alert.alert("Login Failed", err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = () => {
		router.push("/register");
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: theme.colors.primaryContainer }}
			>
				<KeyboardAvoidingView
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					{loading && <ActivityIndicator loadingMsg="" />}

					<Card
						style={[
							styles.card, 
							{ backgroundColor: theme.colors.surface }
						]}
						elevation={2}
						onStartShouldSetResponder={() => true}
					>
						<Card.Content>
							<View style={styles.header}>
								<Image
									source={require("../assets/images/fyp-logo-1-removebg-preview.png")}
									style={styles.headerImage}
								/>
							</View>
							<Text variant="labelLarge" style={styles.subtitle}>
								Log in to continue your journey with us!
							</Text>

							<View style={styles.form}>
								<TextInput
									label="Email"
									mode="outlined"
									value={email}
									onChangeText={setEmail}
									keyboardType="email-address"
									autoCapitalize="none"
									autoComplete="off"
									autoCorrect={false}
									spellCheck={false}
									maxLength={50}
									style={styles.input}
									contentStyle={{
										textAlign: undefined, // To prevent ellipsis from not working
									}}
								/>
								<TextInput
									label="Password"
									mode="outlined"
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									maxLength={30}
									style={styles.input}
									contentStyle={{
										textAlign: undefined, // To prevent ellipsis from not working
									}}
								/>
								<Button
									mode="contained"
									onPress={handleLogin}
									style={styles.loginButton}
								>
									Login
								</Button>

								<Button
									mode="text"
									onPress={handleRegister}
									style={styles.secondaryBtn}
								>
									{"Don't have an account? Register"}
								</Button>
							</View>
						</Card.Content>
					</Card>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		// paddingHorizontal: 20,
		marginBottom: 20,
	},
	card: {
		marginHorizontal: 16,
		marginVertical: 12,
		borderRadius: 12,
		backgroundColor: "white",
	},
	form: {
		width: "100%",
	},
	// header: {
	// 	marginBottom: 24,
	// 	alignItems: "center",
	// },
	header: {
		marginBottom: 12,
		width: "100%", // take full width
		borderRadius: 12,
		overflow: "hidden", // makes rounded corners apply to the image
	},
	headerImage: {
		width: "100%", // full width of screen
		height: 160, // adjust for banner look
		resizeMode: "cover", // covers the whole width, cropping if needed
	},
	title: {
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		textAlign: "center",
		color: "#4d4c4cff",
		// marginTop: 50,
		marginBottom: 20,
		fontSize: 18,
	},
	input: {
		marginBottom: 16,
		// borderRadius: 20,
	},
	loginButton: {
		marginTop: 16,
		marginBottom: 12,
	},
	secondaryBtn: {
		marginBottom: 3,
		width: "100%",
	},
});
