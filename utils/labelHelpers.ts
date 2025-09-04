export const formatLabel = (field: string | undefined) => {
	if (!field) return "";
	return field
		.replace(/_/g, " ") // replace underscores with spaces
		.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalise first letter of each word
};

export const getStatusColor = (status: string) => {
	if (!status) return "#9E9E9E"; // fallback for undefined
	return status === "pending"
		? "#FFC107"
		: status === "confirmed"
		? "#4CAF50"
		: status === "cancelled"
		? "#F44336"
		: "#9E9E9E";
};

export const getStatusBarStyle = (status?: string) => ({
	width: 6,
	height: 100,
	borderRadius: 3,
	marginRight: 12,
	backgroundColor: getStatusColor(status ?? ""), // provide fallback
});
