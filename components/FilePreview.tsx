import { FC } from "react";
import { Image, Text, View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

export type SelectedFile = {
  uri: string;
  type: "image" | "document";
  name: string;
};

type FilePreviewProps = {
  file: SelectedFile;
  onRemove: () => void;
};

const FilePreview: FC<FilePreviewProps> = ({ file, onRemove }) => {
	const { colors } = useTheme();
  const isImage = file.type === "image";

  return (
    <View style={{ position: "relative", marginRight: 10 }}>
      {isImage ? (
        <Image
          source={{ uri: file.uri }}
          style={{
            width: 150,
            height: 150,
            borderRadius: 8,
          }}
          resizeMode="cover"
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
          <Text numberOfLines={2} style={{ textAlign: "center", fontSize: 12 }}>
            {file.name}
          </Text>
        </View>
      )}

      <IconButton
        icon="close"
        size={20}
        mode="contained-tonal"
        containerColor="rgba(0,0,0,0.6)"
        iconColor="white"
        style={{ position: "absolute", top: 4, right: 4 }}
        onPress={onRemove}
      />
    </View>
  );
};

export default FilePreview;