/**
 * Validates if a schedule rate string is in valid AWS EventBridge format
 * Supports both rate expressions (e.g., rate(5 minutes)) and cron expressions
 * 
 * @param rate - The schedule rate string to validate
 * @returns boolean indicating if the rate is valid
 */
export const validateScheduleRate = (rate: string): boolean => {
    // Validate rate(n units) format
    const rateRegex = /^rate\((\d+)\s+(minute|minutes|hour|hours|day|days)\)$/;
    
    // Validate cron format
    // AWS EventBridge cron: minutes hours day-of-month month day-of-week year
    const cronRegex = /^cron\([0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[?*,\-/\s]+\s[0-9*,\-/\s]+\)$/;

    return rateRegex.test(rate) || cronRegex.test(rate);
};
