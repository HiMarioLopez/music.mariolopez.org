export const MINIMUM_SCHEDULE_INTERVAL_MINUTES = 5;

/**
 * Validates if a schedule rate string is in valid AWS EventBridge format
 * Supports both rate expressions (e.g., rate(5 minutes)) and cron expressions.
 *
 * Rate expressions are additionally rejected if they poll more frequently than
 * MINIMUM_SCHEDULE_INTERVAL_MINUTES, to prevent runaway invocation costs.
 * 
 * @param rate - The schedule rate string to validate
 * @returns boolean indicating if the rate is valid
 */
export const validateScheduleRate = (rate: string): boolean => {
    const rateRegex = /^rate\((\d+)\s+(minute|minutes|hour|hours|day|days)\)$/;

    // AWS EventBridge cron: minutes hours day-of-month month day-of-week year
    const cronRegex = /^cron\([0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[?*,\-/\s]+\s[0-9*,\-/\s]+\)$/;

    const rateMatch = rate.match(rateRegex);
    if (rateMatch) {
        const value = Number(rateMatch[1]);
        const unit = rateMatch[2];

        if (value <= 0) {
            return false;
        }

        const intervalMinutes =
            unit.startsWith('minute') ? value
                : unit.startsWith('hour') ? value * 60
                    : value * 60 * 24;

        return intervalMinutes >= MINIMUM_SCHEDULE_INTERVAL_MINUTES;
    }

    return cronRegex.test(rate);
};
