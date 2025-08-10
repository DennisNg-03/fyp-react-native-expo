import * as React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Avatar, Card, Text, Button, List, Divider, useTheme } from 'react-native-paper';

import { SafeAreaView } from 'react-native-safe-area-context';


type UserRole = 'doctor' | 'nurse' | 'patient' | 'guardian';

interface UserProfile {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  // Doctor/Nurse
  medicalId?: string;
  specialisation?: string;
  availability?: string;
  // Patient/Guardian
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContact?: string;
}

export default function ProfileScreen() {
	const theme = useTheme();

	const user: UserProfile = {
    role: 'doctor',
    name: 'Dr. Sarah Connor',
    email: 'sarah.connor@example.com',
    phone: '+1 555 123 456',
    avatar: '',
    medicalId: 'MED-987654',
    specialisation: 'Cardiology',
    availability: 'Mon–Fri, 9am–5pm',
  };

	const renderRoleSpecificFields = () => {
    switch (user.role) {
      case 'doctor':
      case 'nurse':
        return (
          <>
            <List.Item title="Medical ID" description={user.medicalId} left={props => <List.Icon {...props} icon="badge-account" />} />
            <List.Item title="Specialisation" description={user.specialisation} left={props => <List.Icon {...props} icon="stethoscope" />} />
            <List.Item title="Availability" description={user.availability} left={props => <List.Icon {...props} icon="calendar-clock" />} />
          </>
        );
      case 'patient':
      case 'guardian':
        return (
          <>
            <List.Item title="Date of Birth" description={user.dateOfBirth} left={props => <List.Icon {...props} icon="calendar" />} />
            <List.Item title="Gender" description={user.gender} left={props => <List.Icon {...props} icon="gender-male-female" />} />
            <List.Item title="Blood Type" description={user.bloodType} left={props => <List.Icon {...props} icon="water" />} />
            <List.Item title="Allergies" description={user.allergies} left={props => <List.Icon {...props} icon="alert-circle" />} />
            <List.Item title="Emergency Contact" description={user.emergencyContact} left={props => <List.Icon {...props} icon="phone" />} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView>
			{/* <ScrollView contentContainerStyle={styles.container}>
				<Card style={styles.card}>
					<Card.Content style={styles.profileHeader}>
						<Avatar.Image
							size={80}
							source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
						/>
						<View style={styles.profileText}>
							<Text variant="titleMedium">John Doe</Text>
							<Text variant="bodyMedium">john.doe@example.com</Text>
						</View>
					</Card.Content>
					<Card.Actions>
						<Button mode="contained" onPress={() => console.log('Edit Profile pressed')}>
							Edit Profile
						</Button>
					</Card.Actions>
				</Card>

				<List.Section title="Account">
					<List.Item
						title="Change Password"
						left={(props) => <List.Icon {...props} icon="lock" />}
						onPress={() => console.log('Change Password pressed')}
					/>
					<List.Item
						title="Notifications"
						left={(props) => <List.Icon {...props} icon="bell" />}
						onPress={() => console.log('Notifications pressed')}
					/>
				</List.Section>

				<List.Section title="App">
					<List.Item
						title="About"
						left={(props) => <List.Icon {...props} icon="information" />}
						onPress={() => console.log('About pressed')}
					/>
					<List.Item
						title="Logout"
						left={(props) => <List.Icon {...props} icon="logout" />}
						onPress={() => console.log('Logout pressed')}
					/>
				</List.Section>
			</ScrollView> */}
			<ScrollView style={{ backgroundColor: theme.colors.background }}>
				<View style={styles.header}>
					<Avatar.Image size={100} source={user.avatar ? { uri: user.avatar } : require('@/assets/images/react-logo.png')} />
					<Text variant="headlineSmall" style={{ marginTop: 10 }}>{user.name}</Text>
					<Text variant="bodyMedium">{user.role.toUpperCase()}</Text>
				</View>

				<Divider style={{ marginVertical: 10 }} />

				{/* Common Info */}
				<List.Item title="Email" description={user.email} left={props => <List.Icon {...props} icon="email" />} />
				<List.Item title="Phone" description={user.phone} left={props => <List.Icon {...props} icon="phone" />} />

				{renderRoleSpecificFields()}

				<Divider style={{ marginVertical: 10 }} />

				{/* Settings */}
				<List.Item title="Change Password" left={props => <List.Icon {...props} icon="lock-reset" />} />
				<List.Item title="Notification Preferences" left={props => <List.Icon {...props} icon="bell" />} />
				<List.Item title="Privacy Settings" left={props => <List.Icon {...props} icon="shield-lock" />} />

				<Divider style={{ marginVertical: 10 }} />

				<View style={{ padding: 16 }}>
					<Button mode="contained" onPress={() => console.log('Logout pressed')} style={{ backgroundColor: theme.colors.error }}>
						Logout
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
  },
	header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});
