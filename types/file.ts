export type SelectedFile = {
	uri: string; // This attribute can be the local URI for Expo image picker preview or Database's file path
	name: string;
	type: "image" | "document";
};
