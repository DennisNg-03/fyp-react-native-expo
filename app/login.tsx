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
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{loading && <ActivityIndicator loadingMsg="" />}

				<View style={styles.header}>
					<Text variant="headlineMedium" style={styles.title}>
						MediNexis
					</Text>
					<Text variant="labelLarge" style={styles.subtitle}>
						Log in to continue your journey with us!
					</Text>
				</View>

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
	header: {
		marginBottom: 24,
		alignItems: "center",
	},
	title: {
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		textAlign: "center",
		color: "#4d4c4cff",
	},
	input: {
		marginBottom: 16,
		borderRadius: 20,
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
