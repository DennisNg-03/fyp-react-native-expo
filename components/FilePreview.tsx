import { SelectedFile } from "@/types/medicalRecord";
import { Image } from "expo-image";
import { FC, useState } from "react";
import { Linking, Modal, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { ActivityIndicator } from "./ActivityIndicator";

type FilePreviewProps = {
	file: SelectedFile;
	signedUrl?: string; // If signedUrl is provided, it means the file is from database, so disallow the user to remove.
	onRemove?: () => void;
	// onPreview?: () => void;
};

export const FilePreview: FC<FilePreviewProps> = ({
	file,
	onRemove,
	signedUrl,
	// onPreview,
}) => {
	const { colors } = useTheme();
	const [imageLoading, setImageLoading] = useState(false);
	const [showPreviewModal, setShowPreviewModal] = useState(false);

	const isImage = file.type.includes("image");
	const displayUri = signedUrl ?? file.uri;

	console.log("FilePreview received:", file);
	console.log("displayUri:", displayUri);

	const handlePreview = () => {
		if (isImage) {
			setShowPreviewModal(true);
		} else {
			Linking.openURL(displayUri);
		}
	}

	return (
		<View style={{ position: "relative", marginVertical: 15, marginRight: 10 }}>
			{imageLoading && (
				<View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<ActivityIndicator size="small" loadingMsg="" overlay={false} />
				</View>
			)}
			<Pressable onPress={handlePreview}>
				{isImage ? (
					<Image
						source={{ uri: displayUri }}
						style={{
							width: 150,
							height: 150,
							borderRadius: 8,
						}}
						contentFit="cover"
						// placeholder={require('../assets/placeholder.png')} // optional
						cachePolicy="memory-disk"
						onLoadStart={() => setImageLoading(true)}
						onLoadEnd={() => setImageLoading(false)}
						onError={() => setImageLoading(false)}
						// resizeMode="cover"
					/>
				) : (
					<View
						style={{
							width: 150,
							height: 150,
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
						<Text
							numberOfLines={2}
							style={{ textAlign: "center", fontSize: 12 }}
						>
							{file.name}
						</Text>
					</View>
				)}
			</Pressable>

			{!signedUrl && (
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

			{/* Image Preview Modal */}
      {isImage && (
        <Modal visible={showPreviewModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowPreviewModal(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.9)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: displayUri }}
                style={{
                  width: "90%",
                  height: "70%",
                  resizeMode: "contain",
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
		</View>
	);
};
