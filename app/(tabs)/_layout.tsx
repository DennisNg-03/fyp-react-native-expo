import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from "@/hooks/useUser";

export default function TabLayout() {
  const colorScheme = useColorScheme();
	const { role } = useUser();
	
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="homeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointmentScreen"
        options={{
          title: 'My Appointments',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
					href: role === "patient" ? "/appointmentScreen" : null,
        }}
      />
			<Tabs.Screen
        name="patientMedicalRecordScreen"
        options={{
          title: 'My Records',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
					href: (role === "patient") ? "/patientMedicalRecordScreen" : null,
        }}
      />
      <Tabs.Screen
        name="scheduleScreen"
        options={{
          title: 'Schedules',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
					href: (role === "doctor" || role === "nurse") ? "/scheduleScreen" : null,
        }}
      />
      <Tabs.Screen
        name="doctorMedicalRecordScreen"
        options={{
          title: 'Patient Records',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
					href: (role === "doctor" || role === "nurse") ? "/doctorMedicalRecordScreen" : null,
        }}
      />
      <Tabs.Screen
        name="profileScreen"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
