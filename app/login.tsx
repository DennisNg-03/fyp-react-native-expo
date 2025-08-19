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

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
			if (!email || !password) {
				Alert.alert("Please enter email and password to login!");
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
        <View style={styles.form}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
          >
            Login
          </Button>
          <Button mode="text" onPress={handleRegister}>
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
		paddingHorizontal: 20 
	},
  form: { 
		width: "100%" 
	},
  title: { 
		textAlign: "center",
		marginBottom: 24 
	},
  input: { 
		marginBottom: 16 
	},
  button: { 
		marginBottom: 12 
	},
});
