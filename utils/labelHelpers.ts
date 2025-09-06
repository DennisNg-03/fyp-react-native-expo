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

const STATUS_COLORS: Record<string, string> = {
	pending: "orange",
	scheduled: "green",
	rescheduling: "orange",
	rescheduled: "green",
	cancelled: "red",
	completed: "blue",
	no_show: "purple",
	overdue: "darkred",

	// reschedule specific
	accepted: "green",
	rejected: "red",
};

// font + badge will use the same mapping
export const getStatusColor = (status?: string) => {
	if (!status) return "#B0BEC5";
	return STATUS_COLORS[status] ?? "#B0BEC5";
};

// export const getStatusFontColor = getStatusColor;

export const getStatusBarStyle = (
	status?: string,
	cardHeight: number = 300
) => ({
	width: 6,
	height: cardHeight * (2 / 3),
	borderRadius: 3,
	marginRight: 12,
	backgroundColor: getStatusColor(status ?? ""),
});

export const getRescheduleStatusBarStyle = (
	status?: string,
	cardHeight: number = 150
) => ({
	width: 6,
	height: cardHeight * 0.66,
	borderRadius: 3,
	marginRight: 12,
	backgroundColor: getStatusColor(status ?? ""),
});

// export const getStatusFontColor = (status: string) => {
// 	if (!status) return "#9E9E9E";
// 	switch (status) {
// 		case "pending":
// 			return "#FFA000";
// 		// case "pending_past":
// 		// 	return "#FF6F00"; // darker orange for overdue pending
// 		case "scheduled":
// 			return "#388E3C";
// 		case "rescheduling":
// 			return "#F57C00";
// 		// case "rescheduling_past":
// 		// 	return "#E65100"; // darker orange for overdue rescheduling
// 		case "rescheduled":
// 			return "#1976D2";
// 		case "cancelled":
// 			return "#D32F2F";
// 		case "completed":
// 			return "#455A64";
// 		case "no_show":
// 			return "#6A1B9A";
// 		case "overdue":
// 			return "#8B0000";
// 		default:
// 			return "#9E9E9E";
// 	}
// };

// // badge colour stay the same
// export const getStatusColor = (status: string) => {
// 	if (!status) return "#B0BEC5";
// 	switch (status) {
// 		case "pending":
// 			return "orange";
// 		// case "pending_past":
// 		// 	return "#FFCC80";
// 		case "scheduled":
// 			return "green";
// 		case "rescheduling":
// 			return "orange";
// 		// case "rescheduling_past":
// 		// 	return "#FF8A65"; // distinct pastel orange for overdue rescheduling
// 		case "rescheduled":
// 			return "green";
// 		case "cancelled":
// 			return "red";
// 		case "completed":
// 			return "grey";
// 		case "no_show":
// 			return "purple";
// 		case "overdue":
// 			return "#8B0000";
// 		default:
// 			return "#B0BEC5";
// 	}
// };

// export const getStatusBarStyle = (
// 	status?: string,
// 	cardHeight: number = 300
// ) => ({
// 	width: 6,
// 	height: cardHeight * (2 / 3),
// 	borderRadius: 3,
// 	marginRight: 12,
// 	backgroundColor: getStatusColor(status ?? ""),
// });

// export const getRescheduleStatusColor = (status: string) => {
// 	if (!status) return "#807f7f";

// 	switch (status) {
// 		case "pending":
// 			return "orange";
// 		case "accepted":
// 			return "green";
// 		case "rejected":
// 			return "red";
// 		case "overdue":
// 			return "#8B0000"; // keep as dark red for urgency
// 		default:
// 			return "#807f7f";
// 	}
// };

// // for reschedule request statuses
// export const getRescheduleStatusBarStyle = (
// 	status?: string,
// 	cardHeight: number = 150
// ) => {
// 	return {
// 		width: 6,
// 		height: cardHeight * 0.66,
// 		borderRadius: 3,
// 		marginRight: 12,
// 		backgroundColor: getRescheduleStatusColor(status ?? ""),
// 	};
// };
