import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DoctorMedicalRecordScreen() {
	const theme = useTheme();
  const [role, setRole] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true);

  // Fetch user role from Firestore
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //     if (user) {
  //       try {
  //         const userDoc = await getDoc(doc(collection(db, "users"), user.uid));
  //         if (userDoc.exists()) {
  //           setRole(userDoc.data().role);
  //         } else {
  //           setRole("patient");
  //         }
  //       } catch (err) {
  //         console.error("Error fetching role:", err);
  //       }
  //     } else {
  //       setRole(null);
  //     }
  //     // setLoading(false);
  //   });

  //   return unsubscribe;
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView style={styles.container}>
				{role === "doctor" && <DoctorHome />}
				{role === "nurse" && <NurseHome />}
				{role === "patient" && <PatientHome />}
			</ScrollView>
		</SafeAreaView>
  );
}

/* ---------------- DOCTOR HOME ---------------- */
function DoctorHome() {
  return (
    <View>
      <Card style={styles.card}>
        <Card.Title title="Upload & Digitise Records" />
        <Card.Content>
          <Text>Upload and manage patient records from your dashboard.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => {}}>Upload</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Manage Appointment Schedules" />
        <Card.Content>
          <Text>Update consultation availability in real-time.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined">View Schedule</Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

/* ---------------- NURSE HOME ---------------- */
function NurseHome() {
  return (
    <View>
      <Card style={styles.card}>
        <Card.Title title="Retrieve Digitised Records" />
        <Card.Content>
          <Text>Quickly search patient records by name or date.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained">Search</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Monitor Appointments" />
        <Card.Content>
          <Text>Track daily schedules and alert doctors of urgent changes.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined">View Appointments</Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

/* ---------------- PATIENT HOME ---------------- */
function PatientHome() {
  return (
    <View>
      <Card style={styles.card}>
        <Card.Title title="My Medical Records" />
        <Card.Content>
          <Text>Access your records for continuity of care.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained">View Records</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Book Appointment" />
        <Card.Content>
          <Text>Check doctor availability and book instantly.</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined">Book Now</Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 15,
  },
});
