export const formatLabel = (field: string | undefined) => {
	if (!field) return "";
	return field
		.replace(/_/g, " ") // replace underscores with spaces
		.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalise first letter of each word
}