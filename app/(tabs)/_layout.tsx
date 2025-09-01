import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from "@/providers/AuthProvider";

export default function TabLayout() {
  const colorScheme = useColorScheme();
	const { session, role } = useAuth();
	console.log("Logged in role:", role);

	// Redirect user to login page whenever session is null
	if (!session) {
		return <Redirect href={"/login"} />;
	}
		
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointment"
        options={{
          title: 'My Appointments',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
					href: role === "patient" ? "/appointment" : null,
        }}
      />
			<Tabs.Screen
        name="patient-medical-record"
        options={{
          title: 'My Records',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
					href: (role === "patient") ? "/patient-medical-record" : null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedules',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
					href: (role === "doctor" || role === "nurse") ? "/schedule" : null,
        }}
      />
      <Tabs.Screen
        name="doctor-medical-record"
        options={{
          title: 'Patient Records',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.text.rectangle" color={color} />,
					href: (role === "doctor" || role === "nurse") ? "/doctor-medical-record" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: 'Test',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
