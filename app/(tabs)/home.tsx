import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Divider, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
	const theme = useTheme();
	const { role } = useAuth();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* QUICK ACCESS CARDS */}
      <Text variant="titleLarge" style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickAccessRow}>
        <Card style={styles.card} onPress={() => {}}>
          <Card.Content>
            <Avatar.Icon size={40} icon="file-document-outline" />
            <Text variant="titleMedium" style={styles.cardTitle}>My Records</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => {}}>
          <Card.Content>
            <Avatar.Icon size={40} icon="calendar-plus" />
            <Text variant="titleMedium" style={styles.cardTitle}>Book Appointment</Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.fullCard}>
        <Card.Content>
          <Text variant="titleMedium">Upcoming Appointment</Text>
          <Text variant="bodyMedium" style={styles.subText}>
            Dr. Lim | 20 Aug 2025, 10:00 AM
          </Text>
          <View style={styles.buttonRow}>
            <Button mode="outlined" compact onPress={() => {}}>Reschedule</Button>
            <Button mode="outlined" compact onPress={() => {}}>Cancel</Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.fullCard}>
        <Card.Content>
          <Text variant="titleMedium">Notifications</Text>
          <Text variant="bodyMedium" style={styles.subText}>
            You have 3 new updates
          </Text>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* MINI SUMMARIES */}
      <Text variant="titleLarge" style={styles.sectionTitle}>Recent Uploads</Text>
      <Card style={styles.fullCard}>
        <Card.Content>
          <Text>- Blood Test Report.pdf</Text>
          <Text>- X-Ray Scan.png</Text>
        </Card.Content>
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>Pending Actions</Text>
      <Card style={styles.fullCard}>
        <Card.Content>
          <Text>2 documents awaiting review</Text>
          <Text>Insurance form needs completion</Text>
        </Card.Content>
      </Card>
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
    </ScrollView>
		// <View>
    //   <Card style={styles.card}>
    //     <Card.Title title="My Medical Records" />
    //     <Card.Content>
    //       <Text>Access your records for continuity of care.</Text>
    //     </Card.Content>
    //     <Card.Actions>
    //       <Button mode="contained">View Records</Button>
    //     </Card.Actions>
    //   </Card>

    //   <Card style={styles.card}>
    //     <Card.Title title="Book Appointment" />
    //     <Card.Content>
    //       <Text>Check doctor availability and book instantly.</Text>
    //     </Card.Content>
    //     <Card.Actions>
    //       <Button mode="outlined">Book Now</Button>
    //     </Card.Actions>
    //   </Card>
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  // card: {
  //   flex: 1,
  //   marginRight: 8,
  //   alignItems: "center",
  // },
  cardTitle: {
    marginTop: 8,
    textAlign: "center",
  },
  fullCard: {
    marginBottom: 16,
  },
  subText: {
    marginTop: 4,
    marginBottom: 8,
    color: "gray",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  divider: {
    marginVertical: 16,
  },
});
