export const formatLabel = (field: string | undefined) => {
	if (!field) return "";
	return field
		.replace(/_/g, " ") // replace underscores with spaces
		.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalise first letter of each word
}

export const getStatusBarStyle = (status?: string) => ({
		width: 6,
		height: 60,
		borderRadius: 3,
		marginRight: 12,
		backgroundColor:
			status === "pending"
				? "#FFC107"
				: status === "confirmed"
				? "#4CAF50"
				: status === "cancelled"
				? "#F44336"
				: "#9E9E9E",
	});
