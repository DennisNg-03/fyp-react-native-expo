import {
	SupportingDocument,
	SupportingDocumentType,
	supportingDocumentTypes,
} from "@/types/appointment";
import { formatLabel } from "@/utils/labelHelpers";
import { FC, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { IconButton, useTheme } from "react-native-paper";

type SupportingDocumentPreviewProps = {
	file: SupportingDocument;
	signedUrl?: string;
	onRemove?: () => void;
	onTypeChange?: (type: SupportingDocumentType) => void;
	disableDropdown?: boolean; // Disable when it's on Details page and for existing images (Cannot change because the file path depends on it)
};

export const SupportingDocumentPreview: FC<SupportingDocumentPreviewProps> = ({
	file,
	signedUrl,
	onRemove,
	onTypeChange,
	disableDropdown = false,
}) => {
	const { colors } = useTheme();
	const [selectedDocumentType, setSelectedDocumentType] =
		useState<SupportingDocumentType>(file.document_type ?? "lab_result"); // initialise with "lab_result" if it is undefined

	const displayUri = signedUrl ?? file.uri;
	const dropDownItems = supportingDocumentTypes.map((type) => {
		return {
			label: formatLabel(type),
			value: type,
		};
	});

	useEffect(() => {
		if (selectedDocumentType && onTypeChange) {
			onTypeChange(selectedDocumentType);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDocumentType]);

	// console.log("FilePreview received:", file);
	// console.log("displayUri:", displayUri);

	const handlePreview = () => {
		console.log("handlePreview with URL:", displayUri);
		Linking.openURL(displayUri);
	};

	return (
		<View style={{ position: "relative", marginVertical: 15, marginRight: 10 }}>
			<Pressable onPress={handlePreview}>
				<View
					style={{
						width: 120,
						height: 120,
						borderRadius: 8,
						backgroundColor: colors.primaryContainer,
						alignItems: "center",
						justifyContent: "center",
						padding: 10,
						borderWidth: 1,
						borderColor: colors.outlineVariant,
					}}
				>
					<IconButton icon="file-document-outline" size={36} />
					<Text numberOfLines={2} style={{ textAlign: "center", fontSize: 11 }}>
						{file.name}
					</Text>
				</View>
				<Dropdown
					data={dropDownItems}
					labelField="label"
					valueField="value"
					disable={disableDropdown || !onRemove}
					value={selectedDocumentType}
					onChange={(item) => setSelectedDocumentType(item.value)}
					placeholder="Select type"
					style={{
						marginTop: 4,
						width: 120,
						height: 32,
						borderRadius: 10,
						backgroundColor: colors.surfaceVariant,
						paddingHorizontal: 8,
						opacity: !onRemove ? 0.6 : 1,
					}}
					itemContainerStyle={{
						backgroundColor: colors.surfaceVariant,
					}}
					activeColor={colors.primaryContainer}
					itemTextStyle={{ fontSize: 11, color: colors.onSurface }}
					selectedTextStyle={{
						textAlign: "center",
						fontSize: 11,
						color: colors.onSurface,
					}}
					iconStyle={{
						marginRight: 0,
						paddingRight: 0,
					}}
					dropdownPosition="bottom"
					containerStyle={{
						backgroundColor: colors.surfaceVariant,
						borderRadius: 10,
						paddingVertical: 4,
					}}
					renderItem={(item, selected) => (
						<Pressable
							key={item.value}
							onPress={() => {
								setSelectedDocumentType(item.value);
								onTypeChange?.(item.value);
							}}
							style={{
								paddingVertical: 6,
								paddingHorizontal: 8,
								backgroundColor: selected
									? colors.primaryContainer
									: colors.surfaceVariant,
								borderRadius: 10, // rounded item
								marginVertical: 1,
							}}
						>
							<Text style={{ fontSize: 11, color: colors.onSurface }}>
								{item.label}
							</Text>
						</Pressable>
					)}
				/>
			</Pressable>
			{/* {!signedUrl && ( */}
			{onRemove && (
				<IconButton
					icon="close"
					size={20}
					mode="contained-tonal"
					containerColor="rgba(0,0,0,0.6)"
					iconColor="white"
					style={{ position: "absolute", top: 4, right: 4 }}
					onPress={onRemove}
				/>
			)}
			{/* )} */}
		</View>
	);
};
