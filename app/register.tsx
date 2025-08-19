import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
		if (!name || !email || !password) {
			Alert.alert("Please fill all fields to register!");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Error", "Passwords do not match!");
			return;
		}

		try {
			setLoading(true);

			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: name }, // store name in user metadata
				},
			});

			if (error) console.log("Sign Up Error:", error.message);

			console.log("Signup Data:", data);

			const userId = data.user?.id;
			if (!userId) throw new Error("No user ID returned from Supabase.");

			const { data: { session }} = await supabase.auth.getSession();

			const response = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/registerUser",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify({
						userId,
						email,
						role: "patient",
						dateOfBirth: null,
						insuranceInfo: null,
					}),
				}
			);
			if (!response.ok) {
				const errorText = await response.text();
				console.log("Response error:", errorText);
				Alert.alert("Error:", errorText);
			}

			Alert.alert("Registration Successful", "Your account has been created!");
			router.replace("/login");
		} catch (err: any) {
			console.log("Error creating account", err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.form}>
					<Text variant="headlineMedium" style={styles.title}>
						Create Account
					</Text>

					<TextInput
						label="Name"
						value={name}
						onChangeText={setName}
						mode="outlined"
						style={styles.input}
					/>
					<TextInput
						label="Email"
						value={email}
						onChangeText={setEmail}
						mode="outlined"
						autoCapitalize="none"
						keyboardType="email-address"
						style={styles.input}
					/>
					<TextInput
						label="Password"
						value={password}
						onChangeText={setPassword}
						mode="outlined"
						secureTextEntry
						style={styles.input}
					/>
					<TextInput
						label="Confirm Password"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						mode="outlined"
						secureTextEntry
						style={styles.input}
					/>

					<Button
						mode="contained"
						onPress={handleRegister}
						loading={loading}
						style={styles.button}
					>
						Register
					</Button>

					<Button mode="text" onPress={() => router.push("/")}>
						Already have an account? Login
					</Button>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	form: {
		width: "100%",
	},
	title: {
		textAlign: "center",
		marginBottom: 24,
	},
	input: {
		marginBottom: 16,
	},
	button: {
		marginBottom: 12,
	},
});
