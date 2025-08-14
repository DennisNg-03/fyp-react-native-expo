import { useState } from "react";
import {
	StyleSheet,
	View,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { auth } from "@/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createUser } from "@/services/user";
import { createPatient } from "@/services/patient";

export default function RegisterScreen() {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 2. Update Auth displayName
      await updateProfile(userCredential.user, { displayName: name });

      // 3. Create Firestore records
      await createUser(uid, name, email);
      await createPatient(uid);

      Alert.alert("Success", "Account created!");
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error creating account", err.message);
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
	container: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
	form: { width: "100%" },
	title: { textAlign: "center", marginBottom: 24 },
	input: { marginBottom: 16 },
	button: { marginBottom: 12 },
});
