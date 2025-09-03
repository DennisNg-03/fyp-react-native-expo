// app/(tabs)/patient-appointment/layout.tsx
import { Stack } from "expo-router";

export default function AppointmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false}}>
      <Stack.Screen 
        name="index" 
        options={{ title: "My Appointments" }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ title: "Appointment Details" }} 
      />
    </Stack>
  );
}