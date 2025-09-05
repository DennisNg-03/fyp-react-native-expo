import { Button, Dialog, MD3Colors, Portal, Text } from "react-native-paper";

type Props = {
	visible: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export default function RescheduleConfirmationDialog({
	visible,
	onCancel,
	onConfirm,
}: Props) {
	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={onCancel}
				dismissable={false}
				style={{ borderRadius: 8 }}
			>
				<Dialog.Icon icon="alert" color={MD3Colors.error50} />
				<Dialog.Title
					style={{
						fontSize: 20,
						textAlign: "center",
						fontWeight: "500",
						lineHeight: 25,
					}}
				>
					Reschedule Appointment Confirmation
				</Dialog.Title>
				<Dialog.Content>
					<Text variant="bodyMedium" style={{ marginBottom: 6, textAlign: "center" }}>
						Are you sure you want to reschedule this appointment?
					</Text>
					<Text variant="bodyMedium" style={{ textAlign: "center" }}>
						You will not be able to submit another request before this request
						is responded.
					</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onCancel} labelStyle={{ fontSize: 16 }}>
						Cancel
					</Button>
					<Button
						onPress={() => {
							onConfirm();
							onCancel();
						}}
						labelStyle={{ fontSize: 16 }}
					>
						Confirm
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
}
