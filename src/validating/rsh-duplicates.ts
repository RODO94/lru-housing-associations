type HasRegistrationNumber = { registrationNumber: string };

/** Returns each registration number that appears more than once, listed once. */
export const findDuplicateRegistrationNumbers = (
  providers: HasRegistrationNumber[],
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const { registrationNumber } of providers) {
    if (seen.has(registrationNumber)) {
      duplicates.add(registrationNumber);
    }
    seen.add(registrationNumber);
  }
  return [...duplicates];
};

/**
 * Fails the run on duplicate registration numbers (plan 01, step 4).
 * The RSH number is the join key for every later phase, so a duplicate
 * would silently double-count whatever is joined to it.
 */
export const assertUniqueRegistrationNumbers = (
  providers: HasRegistrationNumber[],
): void => {
  const duplicates = findDuplicateRegistrationNumbers(providers);
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate RSH registration numbers: ${duplicates.join(", ")}`,
    );
  }
};
