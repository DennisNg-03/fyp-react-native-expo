// import {
//   subHours, subDays, isAfter, max as maxDate, addMinutes
// } from "date-fns";

// export function buildNotificationSchedule(startsAt: string, now = new Date()) {
//   const start = new Date(startsAt);
//   const lockAt = subHours(start, 48);

//   const schedule = [
//     // Optional long-lead
//     { when: subDays(start, 7),   type: "reminder_7d", actionable: true },
//     { when: subHours(start, 72), type: "reminder_72h", actionable: true },
//     { when: subHours(start, 49), type: "lock_warning_49h", actionable: true },
//     { when: subHours(start, 24), type: "reminder_24h", actionable: false },
//     { when: subHours(start, 3),  type: "reminder_3h",  actionable: false },
//     // { when: subHours(start, 1),  type: "reminder_1h",  actionable: false },
//   ];

//   // Only schedule items in the future.
//   // If appointment was booked late, we may have missed some checkpoints—skip them.
//   return schedule
//     .filter(n => isAfter(n.when, now))
//     // If you want to guarantee at least one actionable reminder when possible:
//     .map(n =>
//       n.actionable
//         ? { ...n, when: maxDate(n.when, addMinutes(now, 5)) } // don’t schedule in the past
//         : n
//     );
// }