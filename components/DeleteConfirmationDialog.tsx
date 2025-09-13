import { Button, Dialog, MD3Colors, Portal, Text, useTheme } from "react-native-paper";

type Props = {
	visible: boolean;
	deleteId: string | null;
	onCancel: () => void;
	onConfirm: (id: string) => void;
};

export default function DeleteConfirmationDialog({
	visible,
	deleteId,
	onCancel,
	onConfirm,
}: Props) {
	const theme = useTheme();
	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onCancel} dismissable={false} style={{ borderRadius: 8, backgroundColor: theme.colors.onPrimary }}>
				<Dialog.Icon icon="alert" color={MD3Colors.error50} />
				<Dialog.Title style={{ fontSize: 20, textAlign: "center", fontWeight: "500" }}>Delete Record Confirmation</Dialog.Title>
				<Dialog.Content>
					<Text variant="bodyMedium" style={{ marginBottom: 2, textAlign: "center" }}>Are you sure you want to delete this record?</Text>
					<Text variant="bodyMedium" style={{textAlign: "center" }}>This action cannot be undone.</Text>
				</Dialog.Content>
				<Dialog.Actions style={{ justifyContent: "space-between" }}>
					<Button onPress={onCancel} labelStyle={{ fontSize: 16 }}>Cancel</Button>
					<Button
						onPress={() => {
							if (deleteId) {
								console.log("Received ID to delete:", deleteId);
								onConfirm(deleteId);	
							}
							onCancel();
						}}
						labelStyle={{ fontSize: 16 }}
					>
						Delete
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
}