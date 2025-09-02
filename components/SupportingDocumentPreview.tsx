import {
	SupportingDocument,
	SupportingDocumentType,
	supportingDocumentTypes,
} from "@/types/appointment";
import { FC, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { IconButton, useTheme } from "react-native-paper";
import { formatLabel } from "./RecordTypeDropdown";

type SupportingDocumentPreviewProps = {
	file: SupportingDocument;
	signedUrl?: string; // If signedUrl is provided, it means the file is from database, so disallow the user to remove.
	onRemove?: () => void;
	onTypeChange?: (type: SupportingDocumentType) => void;
};

export const SupportingDocumentPreview: FC<SupportingDocumentPreviewProps> = ({
	file,
	signedUrl,
	onRemove,
	onTypeChange,
}) => {
	const { colors } = useTheme();
	const [selectedDocumentType, setSelectedDocumentType] =
		useState<SupportingDocumentType>(file.document_type ?? "lab_result"); // initialise with "lab_result" if it is undefined
	const [menuVisible, setMenuVisible] = useState(false);

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
		Linking.openURL(displayUri);
	};

	// const CustomDropdownItem = ({
	// 	option,
	// 	isLast,
	// }: {
	// 	option: { label: string; value: SupportingDocumentType };
	// 	isLast: boolean;
	// }) => {
	// 	console.log("CustomDropDown option:", option);
	// 	const style: ViewStyle = {
	// 		height: 36,
	// 		justifyContent: "center",
	// 		paddingHorizontal: 12,
	// 		backgroundColor:
	// 			selectedDocumentType === option.value
	// 				? colors.onPrimary
	// 				: colors.surface,
	// 	};

	// 	const textColor =
	// 		selectedDocumentType === option.value
	// 			? colors.onPrimary
	// 			: colors.onSurface;

	// 	return (
	// 		<>
	// 			<TouchableRipple
	// 				onPress={() => {
	// 					setSelectedDocumentType(option.value);
	// 					setMenuVisible(false);
	// 				}}
	// 				style={style}
	// 			>
	// 				<Text style={{ color: textColor, fontSize: 11 }}>{option.label}</Text>
	// 			</TouchableRipple>
	// 			{!isLast && <Divider />}
	// 		</>
	// 	);
	// };

	// const CustomDropdownInput = () => (
	// 	<TextInput
	// 		mode="outlined"
	// 		label="Document Type"
	// 		value={formatLabel(selectedDocumentType)}
	// 		style={{ backgroundColor: colors.surface, fontSize: 11 }}
	// 		showSoftInputOnFocus={false} // prevent keyboard from showing
	// 		onPressIn={() => setMenuVisible(true)}
	// 		editable={false}
	// 	/>
	// );

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

					{/* <Dropdown
						label="Document Type"
						placeholder="Select type"
						options={dropDownItems}
						value={selectedDocumentType}
						onSelect={(value) =>
							setSelectedDocumentType(value as SupportingDocumentType)
						}
						mode="outlined"
						menuContentStyle={{
							backgroundColor: colors.onPrimary,
							borderRadius: 6,
						}}
						hideMenuHeader
					/>
					 */}
					{/* <Dropdown
						data={dropDownItems}
						labelField="label"
						valueField="value"
						value={selectedDocumentType}
						onChange={(item) => setSelectedDocumentType(item.value)}
						placeholder="Select type"
						style={{
							marginTop: 4,
							width: 120,
							height: 32,
							borderRadius: 10,
							backgroundColor: colors.onPrimary,
							paddingHorizontal: 8,
						}}
						itemTextStyle={{ fontSize: 11, color: colors.onSurface }}
						selectedTextStyle={{ fontSize: 11, color: colors.onSurface }}
						dropdownPosition="bottom"
						containerStyle={{
							backgroundColor: colors.onPrimary,
							borderRadius: 10,
							paddingVertical: 4,
						}}
						renderLeftIcon={() => null} // remove default icon
						renderRightIcon={() => (
							<IconButton
								icon="menu-down"
								size={18}
								style={{ margin: 0, padding: 0 }}
							/>
						)}
					/> */}
				</View>
				<Dropdown
					data={dropDownItems}
					labelField="label"
					valueField="value"
					value={selectedDocumentType}
					onChange={(item) => setSelectedDocumentType(item.value)}
					placeholder="Select type"
					style={{
						marginTop: 4,
						width: 120,
						height: 32,
						borderRadius: 10,
						backgroundColor: colors.onPrimary,
						paddingHorizontal: 8,
					}}
					itemTextStyle={{ fontSize: 11, color: colors.onSurface }}
					selectedTextStyle={{ fontSize: 11, color: colors.onSurface }}
					dropdownPosition="bottom"
					containerStyle={{
						backgroundColor: colors.onPrimary,
						borderRadius: 10,
						paddingVertical: 4,
					}}
					renderLeftIcon={() => null} // remove default icon
					renderRightIcon={() => (
						<IconButton
							icon="menu-down"
							size={18}
							style={{ margin: 0, padding: 0 }}
						/>
					)}
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
									: colors.onPrimary,
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
				{/* <View style={{ marginTop: 4, width: 120 }}>
					<Menu
						visible={menuVisible}
						onDismiss={() => setMenuVisible(false)}
						mode="elevated"
						anchor={
							<TextInput
								label="Document Type"
								value={formatLabel(selectedDocumentType)}
								onPressIn={() => setMenuVisible(true)}
								editable={false}
								showSoftInputOnFocus={false}
								style={{ fontSize: 12, backgroundColor: colors.onPrimary }}
								right={
									<TextInput.Icon
										icon={menuVisible ? "menu-up" : "menu-down"}
										onPress={() => setMenuVisible(!menuVisible)}
										forceTextInputFocus={false}
										style={{ margin: 0, padding: 0 }}
									/>
								}
							/>
						}
						anchorPosition="top"
						style={{
							borderRadius: 50,
							backgroundColor: colors.onPrimary, // menu bg
							paddingVertical: 0, // reduce top/bottom spacing inside menu
						}}
					>
						{dropDownItems.map((option) => (
							<Menu.Item
								key={option.value}
								onPress={() => {
									setSelectedDocumentType(option.value);
									onTypeChange?.(option.value);
									setMenuVisible(false);
								}}
								title={option.label}
								titleStyle={{ fontSize: 11 }}
								containerStyle={{ paddingHorizontal: 0 }}
								contentStyle={{ paddingHorizontal: 0 }}
								style={{ paddingHorizontal: 8 }}
							/>
						))}
					</Menu> */}
				{/* <CustomDropdownInput />
					<Portal>
						<ScrollView
							style={{
								position: "absolute",
								top: 40,
								width: "100%",
								backgroundColor: colors.surface,
								borderRadius: 6,
								elevation: 3,
								zIndex: 999,
								maxHeight: 150, // scroll if too many items
							}}
							showsVerticalScrollIndicator
							keyboardShouldPersistTaps="handled"
						>
							{dropDownItems.map((option, idx) => (
								<CustomDropdownItem
									key={option.value}
									option={option}
									isLast={idx === dropDownItems.length - 1}
								/>
							))}
						</ScrollView>
					</Portal> */}
				{/* <Dropdown
						label="Document Type"
						placeholder="Select type"
						options={dropDownItems}
						value={selectedDocumentType}
						onSelect={(value) =>
							setSelectedDocumentType(value as SupportingDocumentType)
						}
						mode="outlined"
						menuContentStyle={{
							backgroundColor: colors.onPrimary,
							borderRadius: 6,
						}}
						hideMenuHeader
						CustomDropdownItem={CustomDropdownItem}
            CustomDropdownInput={CustomDropdownInput}
					/> */}
				{/* </View> */}
			</Pressable>
			{/* {!signedUrl && ( */}
			<IconButton
				icon="close"
				size={20}
				mode="contained-tonal"
				containerColor="rgba(0,0,0,0.6)"
				iconColor="white"
				style={{ position: "absolute", top: 4, right: 4 }}
				onPress={onRemove}
			/>
			{/* )} */}
		</View>
	);
};
