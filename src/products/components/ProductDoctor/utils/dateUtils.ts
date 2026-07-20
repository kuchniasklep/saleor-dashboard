/**
 * Check if a date string represents a future time.
 */
export const isFutureDate = (date: string | null | undefined): boolean => {
  if (!date) {
    return false;
  }

  return Date.parse(date) > Date.now() + CLOCK_SKEW_GRACE_PERIOD_MS;
};


export const CLOCK_SKEW_GRACE_PERIOD_MS = 5000;