import { format as formatDate } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const KL_TZ = "Asia/Kuala_Lumpur";

// To format date objects to ISO string in UTC+8
// export function formatLocalDateToISO(date: Date): string {
// 	const year = date.getFullYear();
// 	const month = String(date.getMonth() + 1).padStart(2, "0");
// 	const day = String(date.getDate()).padStart(2, "0");

// 	return `${year}-${month}-${day}`;
// }

// To format the Date is a valid ISO string for storing in DB
// export const parseDateToISO = (date: Date): string =>
// 	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
// 		2,
// 		"0"
// 	)}-${String(date.getDate()).padStart(2, "0")}`;

export const parseDateToISO = (date: Date): string => {
  return formatInTimeZone(date, KL_TZ, "yyyy-MM-dd");
}

	// To format date obtained from DatePicker and store in Date format for record searching
// export const parseLocalDateStringToDate = (dateStr: string) => {
// 	const [year, month, day] = dateStr.split("-").map(Number);
// 	return new Date(year, month - 1, day); // JS Date months are 0-based
// };

/**
 * Format a date in KL timezone
 * @param date Date | string
 * @param fmt date-fns format string
 */
export function formatKL(date: Date | string, fmt = "yyyy-MM-dd HH:mm:ss") {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, KL_TZ, fmt);
}

/**
 * Format in UTC
 */
export function formatUTC(date: Date | string, fmt = "yyyy-MM-dd HH:mm:ss") {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, "UTC", fmt);
}

/**
 * Just local format (device timezone)
 */
export function formatLocal(date: Date | string, fmt = "yyyy-MM-dd HH:mm:ss") {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDate(d, fmt);
}


