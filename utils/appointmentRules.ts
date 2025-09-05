import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { differenceInHours } from "date-fns";

export function canReschedule(startsAtISO: string, now: Date = new Date()) {
  const hoursUntilStart = differenceInHours(new Date(startsAtISO), now);
  return hoursUntilStart >= 48;
}

// For determining whether the pending and rescheduling has past the start time
export function getDisplayStatus(
  appointment: Appointment
): AppointmentStatus | "pending_past" | "rescheduling_past" {
  const now = new Date();
  const startDate = new Date(appointment.starts_at);
  const status = appointment.status ?? "pending";

	console.log("Start date received:", appointment.starts_at);
	console.log("Status received:", appointment.status);

  if ((status === "pending" || status === "rescheduling") && startDate < now) {
    return `${status}_past` as "pending_past" | "rescheduling_past";
  }

  return status as AppointmentStatus;
}