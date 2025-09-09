import { Button, Dialog, MD3Colors, Portal, Text, useTheme } from "react-native-paper";

type Props = {
	visible: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	title?: string;
	messagePrimary?: string;
	messageSecondary?: string;
};

export default function ConfirmationDialog({
	visible,
	onCancel,
	onConfirm,
	title = "Confirmation",
	messagePrimary = "Are you sure?",
	messageSecondary = "",
}: Props) {
	const theme = useTheme();
	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={onCancel}
				dismissable={false}
				style={{ borderRadius: 8, backgroundColor: theme.colors.onPrimary }}
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
					{title}
				</Dialog.Title>
				<Dialog.Content>
					<Text variant="bodyMedium" style={{ marginBottom: 6, textAlign: "center" }}>
						{messagePrimary}
					</Text>
					{messageSecondary ? (
						<Text variant="bodyMedium" style={{ textAlign: "center" }}>
							{messageSecondary}
						</Text>
					) : null}
				</Dialog.Content>
				<Dialog.Actions style={{ justifyContent: "space-between" }}>
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
