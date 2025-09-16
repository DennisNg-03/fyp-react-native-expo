import type { Appointment, AppointmentStatus, DoctorAppointment } from "@/types/appointment";
import { differenceInHours } from "date-fns";

// Allow reschedule only if the current time is at least 24 hours before the appointment start time
export function canReschedule(startsAtISO: string, now: Date = new Date()) {
  const hoursUntilStart = differenceInHours(new Date(startsAtISO), now);
	console.log("startAsISO:", startsAtISO);
	console.log("now:", now);
	console.log("hoursUntilStart:", hoursUntilStart);
  return hoursUntilStart >= 24;
}

export const isPast = (startTime: string | Date): boolean => {
	const start = typeof startTime === "string" ? new Date(startTime) : startTime;
	return start.getTime() < Date.now();
};

// For determining whether the pending and rescheduling has past the start time
export function getDisplayStatus(
  appointment: Appointment | DoctorAppointment
): AppointmentStatus | "overdue" {
  // const now = new Date();
  // const startDate = new Date(appointment.starts_at);
  const status = appointment.status ?? "pending";

	// console.log("Start date received:", appointment.starts_at);
	// console.log("Status received:", appointment.status);

  if ((status === "pending" || status === "rescheduling") && isPast(appointment.starts_at)) {
    return "overdue";
  }

  return status as AppointmentStatus;
}