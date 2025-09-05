export const formatLabel = (field: string | undefined) => {
	if (!field) return "";
	return field
		.replace(/_/g, " ") // replace underscores with spaces
		.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalise first letter of each word
};

export const formatStatusLabel = (status: string | undefined) => {
  if (!status) return "";

  // Use your existing formatLabel first
  let label = formatLabel(status);

  // Add "(Past)" if it's a _past variant
  if (status.endsWith("_past")) {
    label = label.replace(/ Past$/i, " (Past)");
  }

  return label;
};

// Handles AppointmentStatus enum values and ensures font colors are slightly stronger than status pastel colors.
export const getStatusFontColor = (status: string) => {
	if (!status) return "#9E9E9E";
	switch (status) {
		case "pending":
			return "#FFA000"; 
		case "pending_past":
			return "#FF6F00"; // darker orange for overdue pending
		case "scheduled":
			return "#388E3C"; 
		case "rescheduling":
			return "#F57C00"; 
		case "rescheduling_past":
			return "#E65100"; // darker orange for overdue rescheduling
		case "rescheduled":
			return "#1976D2"; 
		case "cancelled":
			return "#D32F2F"; 
		case "completed":
			return "#455A64"; 
		case "no_show":
			return "#6A1B9A"; 
		default:
			return "#9E9E9E";
	}
};

export const getStatusColor = (status: string) => {
	if (!status) return "#B0BEC5";
	switch (status) {
		case "pending":
			return "#FFD54F"; 
		case "pending_past":
			return "#FFCC80"; 
		case "scheduled":
			return "#81C784"; 
		case "rescheduling":
			return "#FFB74D"; 
		case "rescheduling_past":
			return "#FF8A65"; // distinct pastel orange for overdue rescheduling
		case "rescheduled":
			return "#64B5F6"; 
		case "cancelled":
			return "#E57373"; 
		case "completed":
			return "#CFD8DC"; 
		case "no_show":
			return "#BA68C8"; 
		default:
			return "#B0BEC5";
	}
};

export const getStatusBarStyle = (status?: string) => ({
	width: 6,
	height: 100,
	borderRadius: 3,
	marginRight: 12,
	backgroundColor: getStatusColor(status ?? ""), // provide fallback
});
