import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import {
	Avatar,
	Button,
	Card,
	Text,
	TextInput,
	useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityIndicator } from "@/components/ActivityIndicator";
import { GenderDropdown } from "@/components/GenderDropdown";
import { HealthcareProviderDropdown } from "@/components/HealthcareProviderDropdown";
import { SpecialityDropdown } from "@/components/SpecialityDropdown";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/user";

export default function RegisterScreen() {
	const theme = useTheme();

	const [role, setRole] = useState<UserRole | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [gender, setGender] = useState<string | undefined>(undefined);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [speciality, setSpeciality] = useState<string | undefined>(undefined);
	const [healthcareProvider, setHealthcareProvider] = useState<
		string | undefined
	>(undefined);
	const [loading, setLoading] = useState(false);

	const roles: {
		key: UserRole;
		label: string;
		description: string;
		icon: string;
	}[] = [
		{
			key: "patient",
			label: "Patient",
			description: "Manage appointments & records",
			icon: "account",
		},
		{
			key: "doctor",
			label: "Doctor",
			description: "Access patient data & schedules",
			icon: "stethoscope",
		},
		{
			key: "nurse",
			label: "Nurse",
			description: "Support patient care & documentation",
			icon: "account-heart",
		},
	];

	const handleChooseDifferentRole = () => {
		setRole(null);
		setName("");
		setEmail("");
		setPhoneNumber("");
		setGender(undefined);
		setPassword("");
		setConfirmPassword("");
		setHealthcareProvider(undefined);
		setSpeciality(undefined);
	};

	const handleRegister = async () => {
		if (
			!name ||
			!email ||
			!phoneNumber ||
			!gender ||
			!password ||
			!confirmPassword ||
			!role ||
			((role === "doctor" || role === "nurse") && !healthcareProvider) ||
			(role === "doctor" && !speciality)
		) {
			Alert.alert("Alert", "Please fill up all the fields!");
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert("Error", "Passwords do not match!");
			return;
		}

		try {
			setLoading(true);

			// Create Supabase Auth user
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: name,
					},
				},
			});

			if (error) {
				console.log("Failed to register user:", error.message);
				Alert.alert("Failed to register user", error.message);
				return;
			}

			console.log("Signup Data:", data);

			const userId = data.user?.id;
			if (!userId) throw new Error("No user ID returned from Supabase.");

			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!error) {
				await supabase.auth.signOut(); // Immediately log out so they are not auto-logged in upon app refresh
			}

			const bodyData: Record<string, any> = {
				user_id: userId,
				email,
				phone_number: phoneNumber,
				gender,
				role,
			};

			if (role === "doctor" || role === "nurse") {
				bodyData.provider_id = healthcareProvider;
			}

			if (role === "doctor") {
				bodyData.speciality = speciality;
			}

			// Store user role and user-specific data
			const response = await fetch(
				"https://zxyyegizcgbhctjjoido.functions.supabase.co/registerUser",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session?.access_token}`,
					},
					body: JSON.stringify(bodyData),
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.log("Registration Response Error:", errorText);
				Alert.alert("Registration Failed", errorText);
				return;
			}

			Alert.alert("Registration Successful", "Your account has been created!");
			router.replace("/login");
		} catch (err: any) {
			console.log("Error creating account", err.message);
			Alert.alert("Error", err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: theme.colors.tertiary }}
			>
				<KeyboardAvoidingView
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					{loading && <ActivityIndicator loadingMsg="" />}
					{!role ? (
						<View style={styles.roleSelection}>
							<Text variant="headlineMedium" style={styles.title}>
								Sign Up for an Account
							</Text>
							<Text variant="labelLarge" style={styles.subtitle}>
								Choose your role to begin your journey with MediNexis!
							</Text>

							<View style={styles.roleCardsContainer}>
								{roles.map((r) => (
									<TouchableOpacity
										key={r.key}
										onPress={() => setRole(r.key)}
										activeOpacity={0.8}
										style={{ width: 300 }}
									>
										<Card style={styles.roleCard} elevation={2}>
											<Card.Content style={styles.roleCardContent}>
												<Avatar.Icon
													size={48}
													icon={r.icon}
													style={{ backgroundColor: theme.colors.tertiary }}
												/>
												<Text variant="titleMedium" style={{ marginTop: 8 }}>
													{r.label}
												</Text>
												<Text
													variant="bodySmall"
													style={{
														marginTop: 4,
														color: theme.colors.onSurfaceVariant,
													}}
												>
													{r.description}
												</Text>
											</Card.Content>
										</Card>
									</TouchableOpacity>
								))}
							</View>
							<Button mode="text" onPress={() => router.replace("/login")}>
								Back to Login
							</Button>
						</View>
					) : (
						<ScrollView
							style={styles.form}
							contentContainerStyle={{
								flexGrow: 1,
								justifyContent: "center",
							}}
						>
							<Text variant="headlineMedium" style={styles.title}>
								Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
							</Text>
							<Text variant="labelLarge" style={styles.subtitle}>
								Fill in your details to get started with MediNexis
							</Text>

							<TextInput
								label="Full Name"
								value={name}
								onChangeText={setName}
								mode="outlined"
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
								label="Email"
								value={email}
								onChangeText={setEmail}
								mode="outlined"
								autoCapitalize="none"
								keyboardType="email-address"
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
								label="Phone Number"
								value={phoneNumber}
								onChangeText={setPhoneNumber}
								mode="outlined"
								keyboardType="phone-pad"
								autoComplete="tel"
								autoCorrect={false}
								spellCheck={false}
								maxLength={20}
								style={styles.input}
								contentStyle={{
									textAlign: undefined, // To prevent ellipsis from not working
								}}
							/>
							<GenderDropdown
								selectedGender={gender}
								setSelectedGender={setGender}
							/>
							<TextInput
								label="Password"
								value={password}
								onChangeText={setPassword}
								mode="outlined"
								secureTextEntry
								textContentType="oneTimeCode"
								maxLength={30}
								style={styles.input}
								contentStyle={{
									textAlign: undefined, // To prevent ellipsis from not working
								}}
							/>
							<TextInput
								label="Confirm Password"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								mode="outlined"
								secureTextEntry
								textContentType="oneTimeCode"
								maxLength={30}
								style={styles.input}
								contentStyle={{
									textAlign: undefined, // To prevent ellipsis from not working
								}}
							/>

							{(role === "doctor" || role === "nurse") && (
								<HealthcareProviderDropdown
									selectedProvider={healthcareProvider}
									setSelectedProvider={setHealthcareProvider}
								/>
							)}
							{role === "doctor" && (
								<SpecialityDropdown
									selectedSpeciality={speciality}
									setSelectedSpeciality={setSpeciality}
								/>
							)}

							<Button
								mode="contained"
								onPress={handleRegister}
								style={styles.registerButton}
							>
								Register
							</Button>

							<Button
								mode="text"
								onPress={handleChooseDifferentRole}
								style={{ marginBottom: 3 }}
							>
								Choose a different role
							</Button>
							<Button mode="text" onPress={() => router.replace("/login")}>
								Already have an account? Login
							</Button>
						</ScrollView>
					)}
				</KeyboardAvoidingView>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	roleSelection: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	roleCardsContainer: {
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 10,
	},
	roleCard: {
		width: "100%",
		marginBottom: 16,
		elevation: 4,
		borderRadius: 12,
		alignItems: "center",
		// paddingHorizontal: 16,
	},
	roleCardContent: {
		alignItems: "center",
		justifyContent: "center",
	},
	form: {
		width: "100%",
	},
	// title: {
	// 	textAlign: "center",
	// 	marginBottom: 24,
	// },
	title: {
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		textAlign: "center",
		marginBottom: 16,
		color: "#4d4c4cff",
	},
	input: {
		marginBottom: 16,
	},
	button: {
		marginBottom: 12,
		width: "100%",
	},
	registerButton: {
		marginVertical: 16,
		width: "100%",
	},
});
