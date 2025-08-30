// To format date objects to ISO string in UTC+8
export function formatLocalDateToISO(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

// To format the Date is a valid ISO string for storing in DB
export const parseDateToISO = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		"0"
	)}-${String(date.getDate()).padStart(2, "0")}`;

	// To format date obtained from DatePicker and store in Date format for record searching
export const parseLocalDateStringToDate = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day); // JS Date months are 0-based
};
