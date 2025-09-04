import { differenceInHours } from "date-fns";

export function canReschedule(startsAtISO: string, now: Date = new Date()) {
  const hoursUntilStart = differenceInHours(new Date(startsAtISO), now);
  return hoursUntilStart >= 48;
}