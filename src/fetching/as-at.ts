const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const TRAILING_DATE = /(\d{1,2}) ([A-Za-z]+) (\d{4})\s*$/;

/**
 * Reads the as_at date from the end of a GOV.UK attachment title,
 * e.g. "List of registered providers – 17 September 2026" → "2026-09-17".
 *
 * Built by hand rather than via `new Date(...)`, which parses as local
 * midnight and shifts the ISO date back a day during BST.
 */
export const parseAsAtFromTitle = (title: string): string => {
  const [, day, monthName, year] = TRAILING_DATE.exec(title) ?? [];
  if (!day || !monthName || !year) {
    throw new Error(`No trailing date in attachment title: "${title}"`);
  }

  const monthIndex = MONTHS.indexOf(monthName.toLowerCase());
  if (monthIndex === -1) {
    throw new Error(`Unknown month "${monthName}" in title: "${title}"`);
  }

  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-${day.padStart(2, "0")}`;
};
