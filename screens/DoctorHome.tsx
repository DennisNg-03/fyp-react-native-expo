import { View, Text, Button, StyleSheet } from "react-native";

export default function DoctorHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>
      <Button title="Upload Patient Records" onPress={() => {}} />
      <Button title="Search Patient Records" onPress={() => {}} />
      <Button title="Manage Appointment Schedule" onPress={() => {}} />
      <Button title="View Appointment Requests" onPress={() => {}} />
      <Button title="Attach Prescriptions" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
});